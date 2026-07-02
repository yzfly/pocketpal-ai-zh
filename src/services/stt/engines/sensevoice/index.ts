import * as RNFS from '@dr.pogodin/react-native-fs';
import {createSTT} from 'react-native-sherpa-onnx/stt';
import type {SttEngine as SherpaSttEngine} from 'react-native-sherpa-onnx/stt';

import {applyHfMirror} from '../../../../config';

import {
  SENSEVOICE_MODEL_BASE_URL,
  SENSEVOICE_MODEL_FILES,
  SENSEVOICE_MODEL_SUBDIR,
  STT_PARENT_SUBDIR,
} from '../../constants';
import type {
  SttEngine,
  SttProgressCallback,
  SttTranscribeResult,
} from '../../types';

/**
 * SenseVoice-small 端侧语音识别引擎（sherpa-onnx 离线推理）。
 *
 * 安装为单阶段、全有或全无的下载：int8 量化 ONNX 模型 + tokens.txt。
 * 任一文件失败即删除整个 `stt/sensevoice/` 目录，重试时从头开始。
 *
 * 原生识别器懒加载：首次转写时 createSTT 初始化，之后复用同一实例；
 * release() / deleteModel() 会销毁实例。
 */
export class SenseVoiceEngine implements SttEngine {
  readonly id = 'sensevoice' as const;

  /** 懒加载中的原生引擎（Promise 缓存避免并发重复初始化）。 */
  private enginePromise: Promise<SherpaSttEngine> | null = null;

  private getParentDir(): string {
    return `${RNFS.DocumentDirectoryPath}/${STT_PARENT_SUBDIR}`;
  }

  getModelPath(): string {
    return `${RNFS.DocumentDirectoryPath}/${SENSEVOICE_MODEL_SUBDIR}`;
  }

  private getFilePath(filename: string): string {
    return `${this.getModelPath()}/${filename}`;
  }

  async isInstalled(): Promise<boolean> {
    try {
      for (const file of SENSEVOICE_MODEL_FILES) {
        if (!(await RNFS.exists(this.getFilePath(file.name)))) {
          return false;
        }
      }
      return true;
    } catch (err) {
      console.warn('[SenseVoiceEngine] isInstalled check failed:', err);
      return false;
    }
  }

  async downloadModel(onProgress?: SttProgressCallback): Promise<void> {
    const parentDir = this.getParentDir();
    const modelDir = this.getModelPath();

    await RNFS.mkdir(parentDir, {NSURLIsExcludedFromBackupKey: true});
    await RNFS.mkdir(modelDir, {NSURLIsExcludedFromBackupKey: true});

    // 按真实字节数加权的整体进度（模型文件远大于 tokens.txt）。
    const totalBytes = SENSEVOICE_MODEL_FILES.reduce(
      (sum, f) => sum + f.bytes,
      0,
    );
    const perFileBytes = new Array(SENSEVOICE_MODEL_FILES.length).fill(0);
    const reportOverall = () => {
      if (!onProgress) {
        return;
      }
      const written = perFileBytes.reduce((a, b) => a + b, 0);
      onProgress(Math.min(1, written / totalBytes));
    };

    try {
      for (let i = 0; i < SENSEVOICE_MODEL_FILES.length; i++) {
        const file = SENSEVOICE_MODEL_FILES[i]!;
        const result = await RNFS.downloadFile({
          fromUrl: applyHfMirror(
            `${SENSEVOICE_MODEL_BASE_URL}/${file.urlPath}`,
          ),
          toFile: this.getFilePath(file.name),
          background: false,
          discretionary: false,
          cacheable: false,
          progressInterval: 500,
          progress: res => {
            perFileBytes[i] = Math.min(file.bytes, res.bytesWritten);
            reportOverall();
          },
        }).promise;

        if (result.statusCode !== 200) {
          throw new Error(
            `Failed to download ${file.name}: HTTP ${result.statusCode}`,
          );
        }
        perFileBytes[i] = file.bytes;
        reportOverall();
      }

      if (onProgress) {
        onProgress(1);
      }
    } catch (err) {
      try {
        if (await RNFS.exists(modelDir)) {
          await RNFS.unlink(modelDir);
        }
      } catch (cleanupErr) {
        console.warn(
          '[SenseVoiceEngine] partial-download cleanup failed:',
          cleanupErr,
        );
      }
      throw err;
    }
  }

  async deleteModel(): Promise<void> {
    await this.release();
    try {
      if (await RNFS.exists(this.getModelPath())) {
        await RNFS.unlink(this.getModelPath());
      }
    } catch (err) {
      console.warn('[SenseVoiceEngine] deleteModel failed:', err);
    }
  }

  /** 懒加载原生识别器；初始化失败时清空缓存以便重试。 */
  private getEngine(): Promise<SherpaSttEngine> {
    if (!this.enginePromise) {
      this.enginePromise = createSTT({
        modelPath: {type: 'file', path: this.getModelPath()},
        modelType: 'sense_voice',
        preferInt8: true,
        modelOptions: {
          // language: 'auto' —— SenseVoice 自动检测中/英/日/韩/粤语；
          // useItn: true —— 逆文本正则化（数字、标点等）。
          senseVoice: {language: 'auto', useItn: true},
        },
      }).catch(err => {
        this.enginePromise = null;
        throw err;
      });
    }
    return this.enginePromise;
  }

  private normalizeResult(raw: {
    text: string;
    lang?: string;
  }): SttTranscribeResult {
    return {
      text: (raw.text ?? '').trim(),
      // sherpa-onnx 输出形如 "<|zh|>"，剥掉包裹符号。
      lang: raw.lang?.replace(/[<|>]/g, '') || undefined,
    };
  }

  async transcribeFile(wavPath: string): Promise<SttTranscribeResult> {
    if (!(await this.isInstalled())) {
      throw new Error('SenseVoice model is not installed');
    }
    const engine = await this.getEngine();
    return this.normalizeResult(await engine.transcribeFile(wavPath));
  }

  async transcribeSamples(
    samples: number[],
    sampleRate: number,
  ): Promise<SttTranscribeResult> {
    if (!(await this.isInstalled())) {
      throw new Error('SenseVoice model is not installed');
    }
    const engine = await this.getEngine();
    return this.normalizeResult(
      await engine.transcribeSamples(samples, sampleRate),
    );
  }

  async release(): Promise<void> {
    const pending = this.enginePromise;
    this.enginePromise = null;
    if (pending) {
      try {
        const engine = await pending;
        await engine.destroy();
      } catch (err) {
        console.warn('[SenseVoiceEngine] release failed:', err);
      }
    }
  }
}
