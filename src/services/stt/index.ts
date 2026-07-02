/**
 * STT（端侧语音输入）服务入口。
 *
 * 组织方式与 src/services/tts 对齐：engines 目录 + constants + types。
 * 当前唯一引擎为 SenseVoice-small（sherpa-onnx 离线推理）。
 */

import {SenseVoiceEngine} from './engines/sensevoice';

export * from './constants';
export * from './types';
export {SenseVoiceEngine} from './engines/sensevoice';
export {SttRecorder} from './recorder';
export type {SttRecording} from './recorder';

/** 全局单例：模型下载/加载状态在整个 App 内共享。 */
export const senseVoiceEngine = new SenseVoiceEngine();
