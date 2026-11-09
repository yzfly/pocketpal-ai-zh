import React, {useCallback, useState, useEffect, useMemo} from 'react';
import {applyHfMirror} from '../../../config';
import {
  Alert,
  Linking,
  View,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';

import {observer} from 'mobx-react-lite';
import {useNavigation} from '@react-navigation/native';
import {DrawerNavigationProp} from '@react-navigation/drawer';
import {
  Card,
  Icon,
  ProgressBar,
  Button,
  IconButton,
  Text,
  TouchableRipple,
  Snackbar,
  Switch,
  HelperText,
} from 'react-native-paper';

import {
  Menu,
  ProjectionModelSelector,
  MemoryRequirement,
} from '../../../components';

import {useTheme, useMemoryCheck, useStorageCheck} from '../../../hooks';

import {createStyles} from './styles';

import {uiStore, modelStore, serverStore} from '../../../store';
import {t} from '../../../locales';

import {
  Model,
  ModelOrigin,
  ModelType,
  RootDrawerParamList,
} from '../../../utils/types';
import {
  getModelSizeString,
  L10nContext,
  checkModelFileIntegrity,
  getModelSkills,
  formatNumber,
  isMTPCapable,
  isDraftOnlyModel,
  formatBytes,
} from '../../../utils';
import {getVisionModelSizeBreakdown} from '../../../utils/multimodalHelpers';

import {
  LinkExternalIcon,
  DotsVerticalIcon,
  EyeIcon,
  ChatIcon,
  ChevronDownIcon,
  DownloadIcon,
  EyeOffIcon,
} from '../../../assets/icons';
import {getChineseModelTagline} from '../../../store/chineseModelPresets';
import {
  formatParamsShort,
  formatParamsYi,
  getOriginKey,
  getQuantization,
  getSourceRepo,
} from '../../../utils/modelTechInfo';

type ChatScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList>;

interface ModelCardProps {
  model: Model;
  activeModelId?: string;
  onFocus?: () => void;
  onOpenSettings?: () => void;
  onOpenServerDetails?: (serverId: string) => void;
}

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const ModelCard: React.FC<ModelCardProps> = observer(
  ({model, activeModelId, onOpenSettings, onOpenServerDetails}) => {
    const l10n = React.useContext(L10nContext);
    const theme = useTheme();
    const styles = createStyles(theme);

    const navigation = useNavigation<ChatScreenNavigationProp>();

    const [snackbarVisible, setSnackbarVisible] = useState(false); // Snackbar visibility
    const [integrityError, setIntegrityError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    // Mirrors ModelStore.checkMemoryAndConfirm's projection-model resolution.
    const projectionModelForCheck = useMemo(
      () => {
        if (
          model.supportsMultimodal &&
          modelStore.getModelVisionPreference(model) &&
          model.defaultProjectionModel
        ) {
          return modelStore.models.find(
            m => m.id === model.defaultProjectionModel,
          );
        }
        return undefined;
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps -- MobX observable tracked by observer()
      [model, modelStore.models],
    );

    const {memoryWarning, shortMemoryWarning, multimodalWarning} =
      useMemoryCheck(model, projectionModelForCheck);
    const {isOk: storageOk, message: storageNOkMessage} = useStorageCheck(
      model,
      {
        enablePeriodicCheck: true,
        checkInterval: 10000,
      },
    );

    const isActiveModel = activeModelId === model.id;
    const isDraftOnly = isDraftOnlyModel(model);
    const isDownloaded = model.isDownloaded;
    const isDownloading = modelStore.isDownloading(model.id);
    const isHfModel = model.origin === ModelOrigin.HF;
    const isRemoteModel = model.origin === ModelOrigin.REMOTE;
    const cardId = model.filename || model.id;

    const modelCaps = modelStore.capsFor(model);
    const visionLabel =
      modelCaps.vision === 'yes'
        ? l10n.models.modelCard.labels.visionSupported
        : modelCaps.vision === 'no'
          ? l10n.models.modelCard.labels.visionNotSupported
          : l10n.models.modelCard.labels.visionUnknown;

    // Check projection model status for downloaded vision models
    const projectionModelStatus = modelStore.getProjectionModelStatus(model);
    const usesProjector =
      isDownloaded &&
      model.supportsMultimodal &&
      modelStore.getModelVisionPreference(model);
    const hasProjectionModelWarning =
      usesProjector && projectionModelStatus.state === 'missing';
    const isProjectorDownloading =
      usesProjector && projectionModelStatus.state === 'downloading';

    // Check integrity when model is downloaded (skip remote models — no local file)
    useEffect(() => {
      if (isDownloaded && !isRemoteModel) {
        checkModelFileIntegrity(model).then(({errorMessage}) => {
          setIntegrityError(errorMessage);
        });
      } else {
        setIntegrityError(null);
      }
    }, [isDownloaded, isRemoteModel, model]);

    const handleDelete = useCallback(() => {
      if (model.isDownloaded) {
        // Special handling for projection models
        if (model.modelType === ModelType.PROJECTION) {
          const canDeleteResult = modelStore.canDeleteProjectionModel(model.id);

          if (!canDeleteResult.canDelete) {
            // Show error dialog with specific reason
            let message =
              canDeleteResult.reason ||
              l10n.models.multimodal.cannotDeleteTitle;

            if (
              canDeleteResult.reason === 'Projection model is currently active'
            ) {
              message = l10n.models.multimodal.cannotDeleteActive;
            } else if (
              canDeleteResult.dependentModels &&
              canDeleteResult.dependentModels.length > 0
            ) {
              const modelNames = canDeleteResult.dependentModels
                .map(m => m.name)
                .join(', ');
              message = `${l10n.models.multimodal.cannotDeleteInUse}\n\n${l10n.models.multimodal.dependentModels} ${modelNames}`;
            }

            Alert.alert(l10n.models.multimodal.cannotDeleteTitle, message, [
              {text: l10n.common.ok, style: 'default'},
            ]);
            return;
          }

          // Show projection-specific confirmation dialog
          Alert.alert(
            l10n.models.multimodal.deleteProjectionTitle,
            l10n.models.multimodal.deleteProjectionMessage,
            [
              {text: l10n.common.cancel, style: 'cancel'},
              {
                text: l10n.common.delete,
                style: 'destructive',
                onPress: async () => {
                  try {
                    await modelStore.deleteModel(model);
                  } catch (error) {
                    console.error('Failed to delete projection model:', error);
                    Alert.alert(
                      l10n.models.multimodal.cannotDeleteTitle,
                      error instanceof Error
                        ? error.message
                        : 'Unknown error occurred',
                      [{text: l10n.common.ok, style: 'default'}],
                    );
                  }
                },
              },
            ],
          );
        } else {
          // Standard model deletion
          Alert.alert(
            l10n.models.modelCard.alerts.deleteTitle,
            l10n.models.modelCard.alerts.deleteMessage,
            [
              {text: l10n.common.cancel, style: 'cancel'},
              {
                text: l10n.common.delete,
                onPress: async () => {
                  await modelStore.deleteModel(model);
                },
              },
            ],
          );
        }
      }
    }, [model, l10n]);

    const openHuggingFaceUrl = useCallback(() => {
      if (model.hfUrl) {
        // 镜像开启时打开镜像站页面（官方站在目标网络不可达）
        Linking.openURL(applyHfMirror(model.hfUrl)).catch(err => {
          console.error('Failed to open URL:', err);
          setSnackbarVisible(true);
        });
      }
    }, [model.hfUrl]);

    const handleRemove = useCallback(() => {
      Alert.alert(
        l10n.models.modelCard.alerts.removeTitle,
        l10n.models.modelCard.alerts.removeMessage,
        [
          {text: l10n.common.cancel, style: 'cancel'},
          {
            text: l10n.models.modelCard.buttons.remove,
            style: 'destructive',
            onPress: () => modelStore.removeModelFromList(model),
          },
        ],
      );
    }, [model, l10n]);

    const handleWarningPress = () => {
      setSnackbarVisible(true);
    };

    const handleProjectionWarningPress = useCallback(() => {
      if (model.defaultProjectionModel) {
        // Try to download the missing projection model
        modelStore.checkSpaceAndDownload(model.defaultProjectionModel);
      }
      // Note: If no default projection model, user can manually select one in the vision controls
    }, [model.defaultProjectionModel]);

    const handleVisionToggle = useCallback(
      async (enabled: boolean) => {
        try {
          await modelStore.setModelVisionEnabled(model.id, enabled);
        } catch (error) {
          console.error('Failed to toggle vision setting:', error);
          // The error is already handled in setModelVisionEnabled (vision state is reverted)
        }
      },
      [model.id],
    );

    const handleProjectionModelSelect = useCallback(
      (projectionModelId: string) => {
        modelStore.setDefaultProjectionModel(model.id, projectionModelId);
      },
      [model.id],
    );

    // Helper function to get model type icon - updated sizes
    const getModelTypeIcon = () => {
      if (modelCaps.vision === 'yes') {
        return (
          <EyeIcon
            width={14}
            height={14}
            stroke={theme.colors.iconModelTypeVision}
          />
        );
      }
      // Default to chat icon for text models
      return (
        <ChatIcon
          width={14}
          height={14}
          stroke={theme.colors.iconModelTypeText}
        />
      );
    };

    // Helper function to get status dot
    const getStatusDot = () => {
      // 只给正在使用的模型加“使用中”标签；未加载的不再显示无含义的圆点
      if (!isDownloaded || !isActiveModel) {
        return null;
      }
      return (
        <View testID="active-model-badge" style={styles.activeBadge}>
          <View
            style={[
              styles.statusDot,
              {backgroundColor: theme.colors.bgStatusActive},
            ]}
          />
          <Text style={styles.activeBadgeText}>
            {l10n.models.modelCard.labels.inUse}
          </Text>
        </View>
      );
    };

    // Helper function to toggle expanded state with smooth LayoutAnimation
    const toggleExpanded = useCallback(() => {
      LayoutAnimation.configureNext({
        duration: 300,
        create: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.opacity,
        },
        update: {
          type: LayoutAnimation.Types.easeInEaseOut,
          property: LayoutAnimation.Properties.scaleXY,
        },
      });
      setIsExpanded(!isExpanded);
    }, [isExpanded]);

    const handleRemoteDelete = useCallback(() => {
      if (!model.serverId || !model.remoteModelId) {
        return;
      }
      const sName = model.serverName || 'Remote';
      Alert.alert(
        l10n.common.delete,
        t(l10n.settings.removeRemoteModel, {
          modelName: model.name,
          serverName: sName,
        }),
        [
          {text: l10n.common.cancel, style: 'cancel'},
          {
            text: l10n.common.delete,
            style: 'destructive',
            onPress: () => {
              if (isActiveModel) {
                modelStore.manualReleaseContext();
              }
              serverStore.removeUserSelectedModel(
                model.serverId!,
                model.remoteModelId!,
              );
              serverStore.removeServerIfOrphaned(model.serverId!);
            },
          },
        ],
      );
    }, [model, l10n, isActiveModel]);

    const renderDetailsToggle = () => (
      <TouchableOpacity
        testID="expand-details-button"
        onPress={toggleExpanded}
        style={styles.detailsToggle}
        accessibilityRole="button"
        accessibilityState={{expanded: isExpanded}}
        accessibilityLabel={
          isExpanded
            ? l10n.models.modelCard.accessibility.collapseDetails
            : l10n.models.modelCard.accessibility.expandDetails
        }>
        <Text style={styles.detailsToggleText}>
          {isExpanded
            ? l10n.models.modelCard.tech.hideDetails
            : l10n.models.modelCard.tech.details}
        </Text>
        <ChevronDownIcon
          width={14}
          height={14}
          stroke={theme.colors.onSurfaceVariant}
          style={isExpanded ? styles.chevronUp : undefined}
        />
      </TouchableOpacity>
    );

    // “更多”菜单：参数设置 + 删除/移除，替代原来并排的齿轮和 X/垃圾桶
    type MoreEntry = {
      testID: string;
      label: string;
      onPress: () => void;
      danger?: boolean;
    };
    const settingsEntry: MoreEntry = {
      testID: 'settings-button',
      label: l10n.models.modelCard.buttons.settingsMenu,
      onPress: () => onOpenSettings?.(),
    };
    const renderMoreMenu = (entries: MoreEntry[]) => (
      <Menu
        visible={isMoreOpen}
        onDismiss={() => setIsMoreOpen(false)}
        anchor={
          <TouchableOpacity
            testID="more-button"
            onPress={() => setIsMoreOpen(true)}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel={l10n.models.modelCard.buttons.more}>
            <DotsVerticalIcon
              width={20}
              height={20}
              stroke={theme.colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        }>
        {entries.map(entry => (
          <Menu.Item
            key={entry.testID}
            testID={entry.testID}
            label={entry.label}
            danger={entry.danger}
            onPress={() => {
              setIsMoreOpen(false);
              entry.onPress();
            }}
          />
        ))}
      </Menu>
    );

    const renderActionButtons = () => {
      // Remote models: load/offload + settings (reasoning override) + delete
      if (isRemoteModel) {
        return (
          <View style={styles.actionButtonsRow}>
            {renderModelLoadButton()}
            {renderMoreMenu([
              settingsEntry,
              {
                testID: 'delete-button',
                label: l10n.common.delete,
                onPress: handleRemoteDelete,
                danger: true,
              },
            ])}
            {renderDetailsToggle()}
          </View>
        );
      }

      if (isDownloading) {
        // Downloading state - show cancel button
        return (
          <View style={styles.actionButtonsRow}>
            <Button
              testID="cancel-button"
              icon="close"
              mode="outlined"
              onPress={() => modelStore.cancelDownload(model.id)}
              style={[
                styles.primaryActionButton,
                {
                  backgroundColor: theme.colors.errorContainer,
                  borderColor: theme.colors.error,
                },
              ]}
              textColor={theme.colors.error}>
              {l10n.common.cancel}
            </Button>
          </View>
        );
      }

      if (!isDownloaded) {
        // Not downloaded state
        return (
          <View style={styles.actionButtonsRow}>
            <Button
              testID="download-button"
              icon="download"
              mode="contained"
              onPress={() => modelStore.checkSpaceAndDownload(model.id)}
              disabled={!storageOk}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              style={styles.primaryActionButton}
              contentStyle={styles.primaryActionContent}
              labelStyle={styles.primaryActionLabel}>
              {l10n.models.modelCard.buttons.download}
            </Button>

            {renderMoreMenu([
              settingsEntry,
              ...(isHfModel
                ? [
                    {
                      testID: 'remove-model-button',
                      label: tech.removeFromList,
                      onPress: handleRemove,
                      danger: true,
                    },
                  ]
                : []),
            ])}

            {renderDetailsToggle()}
          </View>
        );
      }

      // Downloaded state - soft blue styling
      return (
        <>
          <View style={styles.actionButtonsRow}>
            {renderModelLoadButton()}

            {renderMoreMenu([
              settingsEntry,
              {
                testID: 'delete-button',
                label: l10n.common.delete,
                onPress: () => handleDelete(),
                danger: true,
              },
            ])}

            {renderDetailsToggle()}
          </View>
          {isDraftOnly && (
            <Text style={styles.draftOnlyHint}>
              {l10n.models.modelCard.labels.draftOnlyReason}
            </Text>
          )}
        </>
      );
    };

    const renderModelLoadButton = () => {
      if (
        modelStore.isContextLoading &&
        modelStore.loadingModel?.id === model.id
      ) {
        return (
          <Button
            testID="loading-indicator"
            disabled={true}
            loading={true}
            style={[
              styles.primaryActionButton,
              {
                backgroundColor: theme.colors.btnPrimaryBg,
                borderColor: theme.colors.btnPrimaryBorder,
              },
            ]}
            textColor={theme.colors.btnPrimaryText}>
            {''}
          </Button>
        );
      }

      const handlePress = async () => {
        if (isActiveModel) {
          modelStore.manualReleaseContext();
        } else {
          try {
            await modelStore.selectModel(model);
            if (uiStore.autoNavigatetoChat) {
              navigation.navigate('Chat');
            }
          } catch (e) {
            console.log(`Error: ${e}`);
          }
        }
      };

      const getButtonText = () => {
        if (isActiveModel) {
          return l10n.models.modelCard.buttons.offload;
        }
        return l10n.models.modelCard.buttons.load;
      };

      const getButtonStyle = () => {
        if (isActiveModel) {
          return {
            backgroundColor: theme.colors.btnReadyBg,
            borderColor: theme.colors.btnReadyBorder,
          };
        }
        return {
          backgroundColor: theme.colors.btnPrimaryBg,
          borderColor: theme.colors.btnPrimaryBorder,
        };
      };

      // llama.rn cannot open a draft as a context; loading one only ever fails.
      if (isDraftOnly) {
        return (
          <Button
            testID="draft-only-load-disabled"
            accessibilityLabel={l10n.models.modelCard.labels.draftOnlyReason}
            icon="play-circle-outline"
            disabled
            style={[styles.primaryActionButton, getButtonStyle()]}>
            {getButtonText()}
          </Button>
        );
      }

      return (
        <Button
          testID={isActiveModel ? 'offload-button' : 'load-button'}
          accessibilityLabel={
            isActiveModel
              ? l10n.models.modelCard.buttons.offloadA11y
              : l10n.models.modelCard.buttons.loadA11y
          }
          icon={isActiveModel ? 'eject' : 'play-circle-outline'}
          mode={isActiveModel ? 'outlined' : 'contained'}
          onPress={handlePress}
          buttonColor={isActiveModel ? undefined : theme.colors.primary}
          textColor={
            isActiveModel ? theme.colors.onSurface : theme.colors.onPrimary
          }
          style={styles.primaryActionButton}
          contentStyle={styles.primaryActionContent}
          labelStyle={styles.primaryActionLabel}>
          {getButtonText()}
        </Button>
      );
    };

    const renderProjectorOffer = () => {
      const projectorOffer = l10n.models.modelCard.projectorOffer;
      if (isProjectorDownloading) {
        const progress = projectionModelStatus.projectionModel?.progress ?? 0;
        return (
          <View
            testID="projector-download-progress"
            style={styles.projectorProgress}>
            <Text style={styles.projectorProgressText}>
              {t(projectorOffer.downloading, {progress: Math.round(progress)})}
            </Text>
            <ProgressBar
              progress={progress / 100}
              color={theme.colors.tertiary}
              style={styles.projectorProgressBar}
            />
          </View>
        );
      }
      if (!hasProjectionModelWarning) {
        return null;
      }
      const projectorSize = projectionModelStatus.projectionModel?.size
        ? formatBytes(
            projectionModelStatus.projectionModel.size,
            0,
            false,
            true,
          )
        : undefined;
      return (
        <TouchableOpacity
          testID="projection-warning-badge"
          onPress={handleProjectionWarningPress}
          style={styles.projectorOffer}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            projectorSize
              ? t(projectorOffer.a11yWithSize, {size: projectorSize})
              : l10n.models.modelCard.labels.downloadProjectionModel
          }>
          <EyeOffIcon
            width={16}
            height={16}
            stroke={theme.colors.iconModelTypeVision}
          />
          <Text style={styles.projectorOfferTitle}>
            {projectorOffer.rowTitle}
          </Text>
          <View style={styles.projectorOfferAction}>
            <DownloadIcon
              width={16}
              height={16}
              stroke={theme.colors.primary}
            />
            <Text style={styles.projectorOfferActionText}>
              {projectorSize ?? projectorOffer.download}
            </Text>
          </View>
        </TouchableOpacity>
      );
    };

    const tagline = getChineseModelTagline(model.id);
    const tech = l10n.models.modelCard.tech;
    const paramsShort =
      tech.paramsScale === 'yi'
        ? formatParamsYi(model.params)
        : formatParamsShort(model.params);
    const quant = getQuantization(model.filename);
    // 收起状态只放普通用户看得懂的信息；量化等编码放进“技术参数”
    const metaParts = [
      paramsShort ? t(tech.paramsShort, {value: paramsShort}) : undefined,
      modelCaps.vision === 'yes' ? tech.supportsVision : undefined,
    ].filter(Boolean) as string[];
    const sizeBreakdown =
      model.supportsMultimodal && model.hfModelFile && model.hfModel
        ? getVisionModelSizeBreakdown(model.hfModelFile, model.hfModel)
        : undefined;
    const hasProjectorSize =
      !!sizeBreakdown?.hasProjection && sizeBreakdown.projectionSize > 0;

    const architecture =
      model.hfModel?.specs?.gguf?.architecture ||
      model.ggufMetadata?.architecture;
    const abilities = [
      ...getModelSkills(model).map(
        skill =>
          l10n.models.modelCapabilities[
            skill.labelKey as keyof typeof l10n.models.modelCapabilities
          ] || skill.labelKey,
      ),
      ...(isMTPCapable(model)
        ? [
            isDraftOnly
              ? l10n.models.modelCapabilities.mtpDraft
              : l10n.models.modelCapabilities.mtp,
          ]
        : []),
    ];
    const originLabel = {
      preset: tech.originPreset,
      hf: tech.originHf,
      local: tech.originLocal,
      remote: tech.originRemote,
    }[getOriginKey(model)];
    const projectorFile = model.defaultProjectionModel
      ? model.defaultProjectionModel.split('/').pop()
      : undefined;
    const specRows: Array<{key: string; label: string; value?: string}> = [
      {
        key: 'repo',
        label: tech.sourceRepo,
        value: isRemoteModel ? undefined : getSourceRepo(model),
      },
      {
        key: 'file',
        label: tech.file,
        value: isRemoteModel ? undefined : model.filename,
      },
      {key: 'quant', label: tech.quantization, value: quant},
      {
        key: 'size',
        label: hasProjectorSize ? tech.modelFile : tech.fileSize,
        value: model.size > 0 ? formatBytes(model.size) : undefined,
      },
      {
        key: 'params',
        label: tech.parameters,
        value:
          model.params > 0
            ? formatNumber(model.params, 2, true, false)
            : undefined,
      },
      {
        key: 'arch',
        label: l10n.models.modelCard.labels.architecture,
        value: architecture,
      },
      {
        key: 'ctx',
        label: l10n.models.modelCard.labels.contextLength,
        value: modelCaps.contextLength
          ? modelCaps.contextLength.toLocaleString()
          : undefined,
      },
      {
        key: 'author',
        label: tech.publisher,
        value: !isRemoteModel ? model.author : undefined,
      },
      {
        key: 'abilities',
        label: tech.abilities,
        value: abilities.length ? abilities.join('、') : undefined,
      },
      {
        key: 'vision',
        label: l10n.models.modelCard.labels.vision,
        value: isRemoteModel ? visionLabel : undefined,
      },
      {
        key: 'projector',
        label: tech.projector,
        value: model.supportsMultimodal
          ? [
              projectorFile,
              hasProjectorSize
                ? formatBytes(sizeBreakdown!.projectionSize)
                : undefined,
            ]
              .filter(Boolean)
              .join(' · ') || undefined
          : undefined,
      },
      {key: 'origin', label: tech.origin, value: originLabel},
    ].filter(r => !!r.value);

    return (
      <>
        <Card elevation={0} style={styles.card} testID={`model-card-${cardId}`}>
          {/* Header：名称与大小同一行，说明和摘要与名称左对齐 */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Text
                variant="titleSmall"
                style={styles.modelName}
                numberOfLines={1}
                ellipsizeMode="middle">
                {model.name}
              </Text>
              {getStatusDot()}
              {isRemoteModel ? (
                <TouchableOpacity
                  testID="server-link"
                  onPress={() => {
                    if (model.serverId && onOpenServerDetails) {
                      onOpenServerDetails(model.serverId);
                    }
                  }}
                  style={styles.serverLink}>
                  <Icon
                    source="cloud-outline"
                    size={12}
                    color={theme.colors.onSurfaceVariant}
                  />
                  <Text style={styles.serverLinkText}>
                    {model.serverName || 'Remote'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.sizeText}>
                  {hasProjectorSize
                    ? t(tech.total, {
                        size: getModelSizeString(model, isActiveModel, l10n),
                      })
                    : getModelSizeString(model, isActiveModel, l10n)}
                </Text>
              )}
            </View>
            {tagline ? (
              <Text style={styles.tagline} testID="model-card-tagline">
                {tagline}
              </Text>
            ) : null}
            <View style={styles.metaRow}>
              {isRemoteModel && (
                <View
                  style={styles.modelTypeIcon}
                  accessible={true}
                  accessibilityLabel={`${l10n.models.modelCard.labels.vision}: ${visionLabel}`}
                  testID={`model-card-vision-${cardId}`}>
                  {getModelTypeIcon()}
                </View>
              )}
              {metaParts.length > 0 && (
                <Text
                  style={styles.metaText}
                  numberOfLines={1}
                  testID="model-card-meta">
                  {metaParts.join(' · ')}
                </Text>
              )}
            </View>
          </View>

          {/* Content */}
          <View style={styles.cardContent}>
            {/* Storage Error Display */}
            {!isRemoteModel && !storageOk && !isDownloaded && (
              <HelperText
                testID="storage-error-text"
                type="error"
                visible={!storageOk}
                padding="none"
                style={styles.storageErrorText}>
                {storageNOkMessage}
              </HelperText>
            )}

            {/* Display warnings */}
            {!isRemoteModel &&
              (shortMemoryWarning || multimodalWarning) &&
              isDownloaded && (
                <TouchableRipple
                  testID="memory-warning-button"
                  onPress={handleWarningPress}
                  style={styles.warningContainer}>
                  <View style={styles.warningContent}>
                    <IconButton
                      icon="alert-circle-outline"
                      iconColor={theme.colors.error}
                      size={20}
                      style={styles.warningIcon}
                    />
                    <Text style={styles.warningText}>
                      {shortMemoryWarning || multimodalWarning}
                    </Text>
                  </View>
                </TouchableRipple>
              )}

            {!isRemoteModel && integrityError && (
              <TouchableRipple
                testID="integrity-warning-button"
                style={styles.warningContainer}>
                <View style={styles.warningContent}>
                  <IconButton
                    icon="alert-circle-outline"
                    iconColor={theme.colors.error}
                    size={20}
                    style={styles.warningIcon}
                  />
                  <Text style={styles.warningText}>{integrityError}</Text>
                </View>
              </TouchableRipple>
            )}

            {/* Download Progress */}
            {isDownloading && (
              <View style={styles.downloadProgressContainer}>
                <ProgressBar
                  testID="download-progress-bar"
                  progress={model.progress / 100}
                  color={theme.colors.tertiary}
                  style={styles.progressBar}
                />
                {model.downloadSpeed && (
                  <Text style={styles.downloadSpeed}>
                    {model.downloadSpeed}
                  </Text>
                )}
              </View>
            )}

            {/* Action Buttons Section */}
            <View style={styles.actionButtonsContainer}>
              {renderActionButtons()}
              {renderProjectorOffer()}
            </View>

            {isExpanded && (
              <View style={styles.detailsContent}>
                {/* Memory Requirement */}
                {model.isDownloaded && !isRemoteModel && (
                  <MemoryRequirement
                    model={model}
                    projectionModel={projectionModelForCheck}
                  />
                )}

                {/* Vision Toggle for multimodal models */}
                {model.supportsMultimodal && (
                  <View style={styles.visionToggleContainer}>
                    <View
                      testID="vision-skill-touchable"
                      style={styles.visionToggleHeader}>
                      <View style={styles.visionToggleLeft}>
                        <EyeIcon
                          width={16}
                          height={16}
                          stroke={
                            modelStore.getModelVisionPreference(model)
                              ? theme.colors.tertiary
                              : theme.colors.onSurfaceVariant
                          }
                        />
                        <Text style={styles.visionToggleLabel}>
                          {l10n.models.modelCard.labels.vision}
                        </Text>
                      </View>
                      <Switch
                        testID="vision-toggle-switch"
                        accessibilityLabel={l10n.models.modelCard.labels.vision}
                        value={modelStore.getModelVisionPreference(model)}
                        onValueChange={handleVisionToggle}
                        disabled={
                          !projectionModelStatus.isAvailable &&
                          !modelStore.getModelVisionPreference(model) &&
                          model.isDownloaded
                        }
                      />
                    </View>
                    {!projectionModelStatus.isAvailable &&
                      !modelStore.getModelVisionPreference(model) &&
                      model.isDownloaded && (
                        <Text style={styles.visionHelpText}>
                          {l10n.models.modelCard.labels.requiresProjectionModel}
                        </Text>
                      )}
                  </View>
                )}

                {/* Projection Models Management for multimodal models */}
                {model.supportsMultimodal &&
                  modelStore.getModelVisionPreference(model) && (
                    <View style={styles.projectionModelsContainer}>
                      <ProjectionModelSelector
                        model={model}
                        onProjectionModelSelect={handleProjectionModelSelect}
                        showDownloadActions={model.isDownloaded}
                        initialExpanded={true}
                      />
                    </View>
                  )}

                {/* 技术参数：标签左对齐、数值右侧一栏左对齐 */}
                <View style={styles.specList} testID="model-card-specs">
                  <Text style={styles.specTitle}>{tech.techSpecs}</Text>
                  {specRows.map((row, index) => (
                    <View
                      key={row.key}
                      style={[
                        styles.specRow,
                        index === specRows.length - 1 && styles.specRowLast,
                      ]}
                      testID={
                        row.key === 'ctx'
                          ? `model-card-context-length-${cardId}`
                          : row.key === 'vision'
                            ? `model-card-vision-capability-${cardId}`
                            : `model-card-spec-${row.key}`
                      }
                      accessible={true}
                      accessibilityLabel={`${row.label}: ${row.value}`}>
                      <Text style={styles.specLabel}>{row.label}</Text>
                      <Text style={styles.specValue} selectable={true}>
                        {row.value}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* HuggingFace Link */}
                {model.hfUrl && (
                  <TouchableOpacity
                    testID="open-huggingface-url"
                    onPress={openHuggingFaceUrl}
                    style={styles.hfLinkButton}
                    activeOpacity={0.7}>
                    <View style={styles.hfLinkContent}>
                      <LinkExternalIcon
                        width={16}
                        height={16}
                        stroke={theme.colors.primary}
                      />
                      <Text style={styles.hfLinkText}>
                        {
                          l10n.models.modelCard.labels
                            .viewModelCardOnHuggingFace
                        }
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </Card>
        {/* Snackbar to show full memory warning */}
        <Snackbar
          testID="memory-warning-snackbar"
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={Snackbar.DURATION_MEDIUM}
          action={{
            label: l10n.common.dismiss,
            onPress: () => {
              setSnackbarVisible(false);
            },
          }}>
          {memoryWarning ||
            multimodalWarning ||
            (hasProjectionModelWarning &&
              l10n.models.multimodal.projectionMissingWarning)}
        </Snackbar>
      </>
    );
  },
);
