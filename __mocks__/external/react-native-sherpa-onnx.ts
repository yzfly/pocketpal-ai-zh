/**
 * Jest mock for `react-native-sherpa-onnx`（及其 /stt、/audio 子路径）。
 *
 * 真实包为未转译的 ESM 源码 + TurboModule 绑定，Jest 无法直接加载。
 * 这里暴露 PocketPal 用到的子集：
 * - createSTT / SttEngine（离线识别，SenseVoice）
 * - createPcmLiveStream（原生麦克风采集）
 * 并提供 __ 前缀的测试助手用于驱动回调和重置状态。
 */

type PcmDataCallback = (samples: Float32Array, sampleRate: number) => void;
type PcmErrorCallback = (message: string) => void;

// ─── 离线 STT ────────────────────────────────────────────────────────

/** 每个 createSTT 返回的 mock 引擎（jest 追踪所有方法调用）。 */
export const __mockSttEngine = {
  instanceId: 'stt_mock_1',
  transcribeFile: jest.fn(async (_filePath: string) => ({
    text: 'mock transcription',
    tokens: [],
    timestamps: [],
    lang: '<|zh|>',
    emotion: '',
    event: '',
    durations: [],
  })),
  transcribeSamples: jest.fn(
    async (_samples: number[], _sampleRate: number) => ({
      text: 'mock transcription',
      tokens: [],
      timestamps: [],
      lang: '<|zh|>',
      emotion: '',
      event: '',
      durations: [],
    }),
  ),
  setConfig: jest.fn(async () => {}),
  destroy: jest.fn(async () => {}),
};

export const createSTT = jest.fn(async (_options: unknown) => __mockSttEngine);

export const detectSttModel = jest.fn(async (_path: unknown) => ({
  success: true,
  detectedModels: [{type: 'sense_voice', modelDir: '/mock/model/dir'}],
  modelType: 'sense_voice',
}));

// ─── 麦克风采集（PCM live stream）──────────────────────────────────

const pcmDataCallbacks = new Set<PcmDataCallback>();
const pcmErrorCallbacks = new Set<PcmErrorCallback>();

export const __mockPcmStream = {
  start: jest.fn(async () => {}),
  stop: jest.fn(async () => {}),
  onData: jest.fn((cb: PcmDataCallback) => {
    pcmDataCallbacks.add(cb);
    return () => pcmDataCallbacks.delete(cb);
  }),
  onError: jest.fn((cb: PcmErrorCallback) => {
    pcmErrorCallbacks.add(cb);
    return () => pcmErrorCallbacks.delete(cb);
  }),
};

export const createPcmLiveStream = jest.fn((_options?: unknown) => {
  return __mockPcmStream;
});

/** 测试助手：向所有已注册的 onData 回调推送一块 PCM 数据。 */
export const __emitPcmData = (samples: Float32Array, sampleRate = 16000) => {
  for (const cb of Array.from(pcmDataCallbacks)) {
    cb(samples, sampleRate);
  }
};

/** 测试助手：向所有已注册的 onError 回调推送错误。 */
export const __emitPcmError = (message: string) => {
  for (const cb of Array.from(pcmErrorCallbacks)) {
    cb(message);
  }
};

/** 测试助手：清空回调注册（在 beforeEach 中调用）。 */
export const __resetPcmCallbacks = () => {
  pcmDataCallbacks.clear();
  pcmErrorCallbacks.clear();
};

// ─── 音频工具 ────────────────────────────────────────────────────────

export const convertAudioToWav16k = jest.fn(async () => {});
export const decodeAudioFileToFloatSamples = jest.fn(async () => ({
  samples: [],
  sampleRate: 16000,
}));
