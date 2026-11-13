import React, {useState, useCallback, useContext, useEffect} from 'react';
import {View, StyleSheet} from 'react-native';
import {observer} from 'mobx-react';
import {ChatView, EmbeddedVideoView} from '../../components';
import {PalSheet} from '../../components/PalsSheets';
import {L10nContext, UserContext, safeAlert} from '../../utils';
import {modelStore, palStore} from '../../store';
import {Pal} from '../../types/pal';
import 'react-native-get-random-values';
import {user as defaultUser} from '../../utils/chat';

import {hasVideoCapability} from '../../utils/pal-capabilities';

interface VideoPalScreenProps {
  activePal: Pal;
}

/**
 * 摄像头实时描述时每张图最多占的 token 数。设置里的上限（几百）适合聊天里
 * 认真看一张照片，但在手机 CPU 上编码一帧要一两分钟；实时描述只需要看个大概。
 */
const VIDEO_PAL_IMAGE_TOKENS = 96;

/** 摄像头实时描述每一帧最多生成的 token 数（约两三句中文） */
const VIDEO_PAL_MAX_TOKENS = 96;

export const VideoPalScreen = observer(({activePal}: VideoPalScreenProps) => {
  const l10n = useContext(L10nContext);

  const contextUser = useContext(UserContext);
  const user = contextUser || defaultUser;

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [promptText, setPromptText] = useState<string>(
    l10n.chat.videoPalDefaultPrompt,
  );
  const [captureInterval, setCaptureInterval] = useState(1000); // Default to 1 second
  const [lastAnalysisTime, setLastAnalysisTime] = useState(0);
  const [isStoppingCamera, setIsStoppingCamera] = useState(false);

  // State for pal sheet
  const [isPalSheetVisible, setIsPalSheetVisible] = useState(false);

  // Use active pal if it has video capability, otherwise fallback to first video pal
  // TODO: need to figure out why the fallback is needed, if the active pal is not video why wer are here in the first place.
  const activeVideoPal =
    activePal && hasVideoCapability(activePal)
      ? activePal
      : palStore.pals.find(p => hasVideoCapability(p));

  // Initialize captureInterval from the active VideoPal
  useEffect(() => {
    if (activeVideoPal?.parameters?.captureInterval) {
      setCaptureInterval(activeVideoPal.parameters.captureInterval);
    }
  }, [activeVideoPal]);

  // Initialize the model with the projection model if needed
  useEffect(() => {
    if (
      activeVideoPal &&
      !modelStore.activeModel &&
      activeVideoPal.defaultModel
    ) {
      const palDefaultModel = modelStore.availableModels.find(
        m => m.id === activeVideoPal.defaultModel?.id,
      );

      if (palDefaultModel) {
        console.log('Initializing Video Pal model with projection model');

        // Check if this model supports multimodal and has a default projection model
        if (
          palDefaultModel.supportsMultimodal &&
          palDefaultModel.defaultProjectionModel
        ) {
          // Find the default projection model
          const projectionModel = modelStore.availableModels.find(
            m => m.id === palDefaultModel.defaultProjectionModel,
          );

          if (projectionModel) {
            console.log(
              'Found default projection model:',
              projectionModel.name,
            );
            // Get the projection model path
            modelStore
              .getModelFullPath(projectionModel)
              .then(projectionModelPath => {
                console.log(
                  'Initializing with projection model path:',
                  projectionModelPath,
                );
                // Initialize with both the main model and projection model
                modelStore.initContext(palDefaultModel, projectionModelPath);
              })
              .catch(error => {
                console.error('Failed to get projection model path:', error);
                // Fall back to initializing without projection model
                modelStore.initContext(palDefaultModel);
              });
          } else {
            console.warn(
              'Default projection model not found, initializing without it',
            );
            modelStore.initContext(palDefaultModel);
          }
        } else {
          console.log(
            'Model does not support multimodal or has no default projection model',
          );
          modelStore.initContext(palDefaultModel);
        }
      }
    }
  }, [activeVideoPal]);

  // Handle starting the camera
  const handleStartCamera = useCallback(async () => {
    try {
      // 看图助手指定的模型（已下载时）优先；否则用当前已加载的模型
      const palModel = activeVideoPal?.defaultModel
        ? modelStore.availableModels.find(
            m => m.id === activeVideoPal.defaultModel?.id,
          )
        : undefined;
      const target = palModel ?? modelStore.activeModel;

      // 默认模型（和聊天助手是同一个）还没下载，手头也没有别的能看图的模型：
      // 直接引导去下载默认模型，而不是让用户自己去找该用哪个。
      const palModelEntry = activeVideoPal?.defaultModel
        ? modelStore.models.find(m => m.id === activeVideoPal.defaultModel?.id)
        : undefined;
      if (
        !palModel &&
        palModelEntry?.downloadUrl &&
        !modelStore.activeModel?.supportsMultimodal
      ) {
        const name = palModelEntry.name;
        if (modelStore.isDownloading(palModelEntry.id)) {
          safeAlert(
            l10n.chat.visionDefaultModelTitle,
            l10n.chat.visionDefaultModelDownloading
              .replace('{{model}}', name)
              .replace(
                '{{percent}}',
                String(Math.round(palModelEntry.progress ?? 0)),
              ),
            [{text: l10n.common.ok}],
          );
          return;
        }
        safeAlert(
          l10n.chat.visionDefaultModelTitle,
          l10n.chat.visionDefaultModelMessage.replace('{{model}}', name),
          [
            {text: l10n.common.cancel, style: 'cancel'},
            {
              text: l10n.chat.visionDefaultModelDownload,
              onPress: () => {
                modelStore
                  .checkSpaceAndDownload(palModelEntry.id)
                  .catch(() => {});
              },
            },
          ],
        );
        return;
      }

      if (!target && !modelStore.context) {
        safeAlert(l10n.chat.modelNotLoaded, l10n.chat.pleaseLoadModel, [
          {text: l10n.common.ok},
        ]);
        return;
      }

      // 当前加载的不是它，或加载时没带上看图组件：带看图组件重新加载。
      // initContext 会自动找到已下载的看图组件。
      // 实时描述用小的图片预算；预算和当前加载的不一样时也要重新加载
      modelStore.setVisionTokenBudget(VIDEO_PAL_IMAGE_TOKENS);
      const needsLoad =
        !!target &&
        (!modelStore.context ||
          modelStore.activeModelId !== target.id ||
          !modelStore.activeModelCaps.visionActive ||
          modelStore.activeImageMaxTokens !== VIDEO_PAL_IMAGE_TOKENS);
      if (target && needsLoad) {
        const projection = modelStore.getProjectionModelStatus(target);
        if (target.supportsMultimodal && projection.state === 'downloaded') {
          await modelStore.initContext(target);
        }
      }

      if (!modelStore.context || !modelStore.activeModelCaps.visionActive) {
        const projection = target
          ? modelStore.getProjectionModelStatus(target)
          : undefined;
        const missing =
          target?.supportsMultimodal && projection?.state === 'missing'
            ? projection.projectionModel
            : undefined;
        safeAlert(
          l10n.chat.visionNotReadyTitle,
          l10n.chat.visionNotReadyMessage,
          missing
            ? [
                {text: l10n.common.cancel, style: 'cancel'},
                {
                  text: l10n.chat.visionDownloadButton,
                  onPress: () => {
                    modelStore
                      .checkSpaceAndDownload(missing.id)
                      .catch(() => {});
                  },
                },
              ]
            : [{text: l10n.common.ok}],
        );
        return;
      }

      setIsCameraActive(true);
    } catch (error) {
      console.error('Error checking multimodal capability:', error);
      safeAlert(l10n.common.error ?? 'Error', l10n.chat.visionCheckFailed, [
        {text: l10n.common.ok},
      ]);
    }
  }, [l10n, activeVideoPal]);

  // 离开看图助手时：清掉小预算；如果当前模型是按小预算加载的，
  // 在后台按正常设置重新加载，免得之后在聊天里发图片看不清细节。
  useEffect(() => {
    return () => {
      modelStore.setVisionTokenBudget(undefined);
      const active = modelStore.activeModel;
      if (
        active &&
        modelStore.activeImageMaxTokens === VIDEO_PAL_IMAGE_TOKENS &&
        !modelStore.isGenerationBusy
      ) {
        modelStore.initContext(active).catch(() => {});
      }
    };
  }, []);

  // Handle stopping the camera
  const handleStopCamera = useCallback(() => {
    setIsStoppingCamera(true);

    modelStore.abortActiveGeneration();

    // Clear response text and stop camera
    setResponseText('');
    setIsCameraActive(false);
    setIsStoppingCamera(false);
  }, []);

  // Callback handler for opening pal sheet
  const handleOpenPalSheet = useCallback((_pal: Pal) => {
    // We expect this to be called with the activePal, but we use activePal directly
    setIsPalSheetVisible(true);
  }, []);

  const handleClosePalSheet = useCallback(() => {
    setIsPalSheetVisible(false);
  }, []);

  // Handle capture interval change
  const handleCaptureIntervalChange = useCallback(
    (interval: number) => {
      setCaptureInterval(interval);

      // Update the VideoPal's captureInterval setting
      if (activeVideoPal) {
        palStore.updatePal(activeVideoPal.id, {
          parameters: {
            ...activeVideoPal.parameters,
            captureInterval: interval,
          },
        });
      }
    },
    [activeVideoPal],
  );

  // Handle image capture from the video stream
  const handleImageCapture = useCallback(
    async (imageBase64: string) => {
      // Don't process if we're stopping the camera
      if (isStoppingCamera) {
        return;
      }

      // Throttle analysis to avoid overwhelming the model
      const now = Date.now();
      if (now - lastAnalysisTime < captureInterval) {
        return;
      }

      if (modelStore.isGenerationBusy) {
        return;
      }

      setLastAnalysisTime(now);

      // 新一帧开始：先显示“正在看…”，第一个字出来后换成回答，
      // 这样等待时画面上不是一片空白
      setResponseText(l10n.chat.visionLooking);
      let gotFirstToken = false;

      // Get the system prompt from the active VideoPal
      const systemPrompt = activeVideoPal?.systemPrompt || '';

      try {
        // Start the completion with the base64 image using the user-editable prompt
        await modelStore.startImageCompletion({
          prompt: promptText,
          image_path: imageBase64, // Now passing base64 data URL instead of file path
          systemMessage: systemPrompt,
          // 实时画面要的是一两句话：限制长度、不思考，下一帧才能尽快开始
          maxTokens: VIDEO_PAL_MAX_TOKENS,
          onToken: token => {
            // Only update response text if we're not stopping the camera
            if (!isStoppingCamera) {
              if (!gotFirstToken) {
                gotFirstToken = true;
                setResponseText(token);
              } else {
                setResponseText(prev => prev + token);
              }
            }
          },
          onComplete: () => {
            // This is called when the entire completion is done
            // We don't need to set the text again as we've been building it token by token
          },
          onError: error => {
            console.error('Error processing image:', error);
            // 出错时把原因显示在画面上，不让用户对着空白画面干等
            if (!isStoppingCamera) {
              setResponseText(
                `${l10n.chat.visionFrameFailed}${error?.message ?? ''}`,
              );
            }
          },
        });
      } catch (error) {
        console.error('Error processing image:', error);
        if (!isStoppingCamera) {
          setResponseText(
            `${l10n.chat.visionFrameFailed}${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    },
    [
      promptText,
      captureInterval,
      lastAnalysisTime,
      activeVideoPal,
      isStoppingCamera,
      l10n,
    ],
  );

  // Render the chat view with embedded camera when active
  return (
    <UserContext.Provider value={user}>
      <View style={styles.container}>
        {isCameraActive ? (
          // Full-screen camera view with response overlay
          <View style={styles.fullScreenContainer}>
            <EmbeddedVideoView
              onCapture={handleImageCapture}
              onClose={handleStopCamera}
              captureInterval={captureInterval}
              onCaptureIntervalChange={handleCaptureIntervalChange}
              responseText={responseText}
            />
          </View>
        ) : (
          // Regular chat view when camera is not active
          <ChatView
            messages={[]}
            onSendPress={() => {}}
            onStopPress={() => modelStore.abortActiveGeneration()}
            onPalSettingsSelect={handleOpenPalSheet}
            user={user}
            isStopVisible={modelStore.inferencing}
            isStreaming={modelStore.isStreaming}
            sendButtonVisibilityMode="editing"
            textInputProps={{
              editable: !modelStore.isStreaming && !isCameraActive,
              value: promptText,
              onChangeText: setPromptText,
            }}
            inputProps={{
              isCameraActive: isCameraActive,
              onStartCamera: handleStartCamera,
              promptText: promptText,
              onPromptTextChange: setPromptText,
            }}
          />
        )}
      </View>
      {activePal && (
        <PalSheet
          isVisible={isPalSheetVisible}
          onClose={handleClosePalSheet}
          pal={activePal}
        />
      )}
    </UserContext.Provider>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fullScreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
});
