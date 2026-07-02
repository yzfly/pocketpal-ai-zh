/** STT 服务层类型定义。 */

/** 下载进度回调，progress 取值 0..1。 */
export type SttProgressCallback = (progress: number) => void;

/** 一次转写的结果。 */
export interface SttTranscribeResult {
  /** 转写文本（已去除首尾空白）。 */
  text: string;
  /** 检测到的语言（SenseVoice 输出，如 "zh"），可能为空。 */
  lang?: string;
}

/** STT 引擎统一接口（当前只有 SenseVoice 一个实现）。 */
export interface SttEngine {
  readonly id: string;
  /** 模型文件是否已全部就位。 */
  isInstalled(): Promise<boolean>;
  /** 下载模型（全有或全无：任一文件失败则清空目录后抛错）。 */
  downloadModel(onProgress?: SttProgressCallback): Promise<void>;
  /** 删除模型目录并释放已加载的原生实例。 */
  deleteModel(): Promise<void>;
  /** 转写 16kHz 单声道 WAV 文件。 */
  transcribeFile(wavPath: string): Promise<SttTranscribeResult>;
  /** 转写 float PCM 采样（取值 [-1, 1]）。 */
  transcribeSamples(
    samples: number[],
    sampleRate: number,
  ): Promise<SttTranscribeResult>;
  /** 释放原生识别器资源（模型文件保留）。 */
  release(): Promise<void>;
}
