import * as React from 'react';
import {Alert, PermissionsAndroid, Platform} from 'react-native';

import {t} from '../locales';
import {L10nContext} from '../utils';
import {
  senseVoiceEngine,
  SttRecorder,
  SENSEVOICE_MODEL_SIZE_MB,
  STT_MAX_RECORDING_MS,
} from '../services/stt';

/** 语音输入按钮的状态机。 */
export type VoiceInputStatus =
  | 'idle'
  | 'downloading'
  | 'recording'
  | 'transcribing';

export interface UseVoiceInputResult {
  status: VoiceInputStatus;
  /** 模型下载进度 0..1（仅 downloading 状态有意义）。 */
  downloadProgress: number;
  /** 主入口：idle 时开始（必要时先引导下载模型），recording 时停止并转写。 */
  toggle: () => void;
}

/**
 * 端侧语音输入（SenseVoice via sherpa-onnx）状态机：
 *
 * idle --点击--> [模型未装则弹确认框下载 downloading] --> recording
 * recording --点击/超时--> transcribing --> onTranscribed(text) --> idle
 *
 * 错误统一走 Alert（与 ChatInput 现有相机错误处理一致）。
 */
export const useVoiceInput = (
  onTranscribed: (text: string) => void,
): UseVoiceInputResult => {
  const l10n = React.useContext(L10nContext);
  const [status, setStatus] = React.useState<VoiceInputStatus>('idle');
  const [downloadProgress, setDownloadProgress] = React.useState(0);

  const recorderRef = React.useRef<SttRecorder | null>(null);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  // 始终指向最新的回调，避免闭包捕获过期的输入框文本。
  const onTranscribedRef = React.useRef(onTranscribed);
  onTranscribedRef.current = onTranscribed;

  const voiceL10n = l10n.components.chatInput.voiceInput;

  const clearAutoStop = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // 卸载时兜底停止录音，避免麦克风悬挂。
  React.useEffect(() => {
    return () => {
      clearAutoStop();
      recorderRef.current?.stop().catch(() => {});
    };
  }, [clearAutoStop]);

  const showError = React.useCallback(
    (message: string) => {
      Alert.alert(voiceL10n.errorTitle, message);
    },
    [voiceL10n],
  );

  /** 停止录音并转写，把结果交给输入框。 */
  const stopAndTranscribe = React.useCallback(async () => {
    clearAutoStop();
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (!recorder) {
      setStatus('idle');
      return;
    }
    setStatus('transcribing');
    try {
      const recording = await recorder.stop();
      if (recording.samples.length === 0) {
        showError(voiceL10n.emptyResult);
        return;
      }
      const result = await senseVoiceEngine.transcribeSamples(
        recording.samples,
        recording.sampleRate,
      );
      if (result.text) {
        onTranscribedRef.current(result.text);
      } else {
        showError(voiceL10n.emptyResult);
      }
    } catch (err) {
      console.error('Voice input transcription failed:', err);
      showError(voiceL10n.transcribeFailed);
    } finally {
      setStatus('idle');
    }
  }, [clearAutoStop, showError, voiceL10n]);

  /** 申请麦克风权限（iOS 由系统在原生采集启动时弹窗）。 */
  const ensurePermission = React.useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  const startRecording = React.useCallback(async () => {
    if (!(await ensurePermission())) {
      showError(voiceL10n.permissionDenied);
      setStatus('idle');
      return;
    }
    const recorder = new SttRecorder();
    recorderRef.current = recorder;
    try {
      await recorder.start(() => {
        // 原生采集出错：录音器内部已停止，直接复位。
        recorderRef.current = null;
        clearAutoStop();
        setStatus('idle');
        showError(voiceL10n.recordFailed);
      });
      setStatus('recording');
      // 到时自动停止，防止超长录音撑爆内存/桥。
      timeoutRef.current = setTimeout(() => {
        stopAndTranscribe();
      }, STT_MAX_RECORDING_MS);
    } catch (err) {
      console.error('Voice input recording failed:', err);
      recorderRef.current = null;
      setStatus('idle');
      showError(voiceL10n.recordFailed);
    }
  }, [
    clearAutoStop,
    ensurePermission,
    showError,
    stopAndTranscribe,
    voiceL10n,
  ]);

  const downloadModel = React.useCallback(async () => {
    setStatus('downloading');
    setDownloadProgress(0);
    try {
      await senseVoiceEngine.downloadModel(setDownloadProgress);
      await startRecording();
    } catch (err) {
      console.error('Voice model download failed:', err);
      setStatus('idle');
      showError(voiceL10n.downloadFailed);
    }
  }, [showError, startRecording, voiceL10n]);

  /** 模型未安装时弹确认框引导下载（展示大小）。 */
  const confirmDownload = React.useCallback(() => {
    Alert.alert(
      voiceL10n.downloadTitle,
      t(voiceL10n.downloadMessage, {size: SENSEVOICE_MODEL_SIZE_MB}),
      [
        {text: l10n.common.cancel, style: 'cancel'},
        {text: voiceL10n.download, onPress: () => downloadModel()},
      ],
    );
  }, [downloadModel, l10n, voiceL10n]);

  const toggle = React.useCallback(() => {
    if (status === 'recording') {
      stopAndTranscribe();
      return;
    }
    if (status !== 'idle') {
      // 下载/转写中忽略点击。
      return;
    }
    (async () => {
      try {
        if (await senseVoiceEngine.isInstalled()) {
          await startRecording();
        } else {
          confirmDownload();
        }
      } catch (err) {
        console.error('Voice input failed:', err);
        setStatus('idle');
        showError(voiceL10n.recordFailed);
      }
    })();
  }, [
    status,
    stopAndTranscribe,
    startRecording,
    confirmDownload,
    showError,
    voiceL10n,
  ]);

  return {status, downloadProgress, toggle};
};
