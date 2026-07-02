/**
 * STT（端侧语音识别）常量。
 *
 * 模型：SenseVoice-small（FunASR 系，中/英/日/韩/粤语），通过
 * sherpa-onnx（react-native-sherpa-onnx）在端侧离线推理。
 */

/** stt/ 父目录（相对应用文档目录；iOS 备份排除在 mkdir 时应用）。 */
export const STT_PARENT_SUBDIR = 'stt';

/**
 * SenseVoice 模型子目录。目录名必须包含 "sense"/"sensevoice"——
 * sherpa-onnx 原生层按目录名提示检测 sense_voice 模型类型。
 */
export const SENSEVOICE_MODEL_SUBDIR = 'stt/sensevoice';

/**
 * HuggingFace 模型仓库地址（csukuangfj 官方导出的 sherpa-onnx 格式）。
 * 实际请求时经 applyHfMirror() 改写为镜像域名（中国大陆加速）。
 */
export const SENSEVOICE_MODEL_BASE_URL =
  'https://huggingface.co/csukuangfj/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-2024-07-17/resolve/main';

/**
 * 需下载的模型文件。文件名保持 HF 仓库原名：
 * - model.int8.onnx 含 "int8" 记号，配合 preferInt8: true 被原生层选中；
 * - tokens.txt 为 sense_voice 类型的必需文件。
 * bytes 为 HF API（tree/main）返回的真实字节数。
 */
export const SENSEVOICE_MODEL_FILES = [
  {name: 'model.int8.onnx', urlPath: 'model.int8.onnx', bytes: 239_233_841},
  {name: 'tokens.txt', urlPath: 'tokens.txt', bytes: 315_894},
] as const;

/**
 * 模型总大小（上表 bytes 之和）。用于磁盘预检与下载确认框的大小展示，
 * 必须 >= 真实总量。
 */
export const SENSEVOICE_MODEL_ESTIMATED_BYTES = 239_549_735;

/** 下载确认框中展示的近似大小（MB，向上取整）。 */
export const SENSEVOICE_MODEL_SIZE_MB = 229;

/** SenseVoice 要求 16kHz 单声道输入。 */
export const STT_SAMPLE_RATE = 16000;

/** 单次录音时长上限（毫秒），到时自动停止并转写。 */
export const STT_MAX_RECORDING_MS = 60_000;
