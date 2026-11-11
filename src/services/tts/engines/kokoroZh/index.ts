import {Platform} from 'react-native';

import * as RNFS from '@dr.pogodin/react-native-fs';
import Speech, {TTSEngine} from '@pocketpalai/react-native-speech';

import {applyHfMirror} from '../../../../config';
import {
  KOKORO_VOICES_MANIFEST_FILENAME,
  KOKORO_ZH_MODEL_BASE_URL,
  KOKORO_ZH_MODEL_FILES,
  KOKORO_ZH_MODEL_SUBDIR,
  KOKORO_ZH_VOICES_BASE_URL,
  TTS_DICT_FILENAME,
  TTS_DICT_URL,
  TTS_PARENT_SUBDIR,
} from '../../constants';
import {ttsRuntime} from '../../runtime';
import {createEngineStreamingHandle} from '../../streamingHandle';
import {ensureVoiceFileAt} from '../../voiceFileDownload';
import type {
  NeuralEngine,
  StreamOptions,
  StreamingHandle,
  Voice,
  VoiceFileSource,
} from '../../types';
import type {EnPhonemize, ZhG2P} from '../../zh/zhG2P';
import {KOKORO_ZH_VOICES} from './voices';

export type KokoroZhProgressCallback = (progress: number) => void;

let g2p: ZhG2P | null = null;

/** 首次朗读时才加载分词词典（约 1.6 MB），不拖慢启动。 */
const getZhG2P = (): ZhG2P => {
  if (!g2p) {
    const {ZhG2P: G2P} = require('../../zh/zhG2P');
    const {JiebaSegmenter} = require('../../zh/jiebaSegmenter');
    const dict: string = require('../../zh/jiebaDict').default;
    g2p = new G2P(new JiebaSegmenter(dict)) as ZhG2P;
  }
  return g2p;
};

const phonemizeZh = (text: string, en: EnPhonemize): Promise<string> => {
  const {zhPhonemize} = require('../../zh/zhG2P');
  return zhPhonemize(getZhG2P(), text, en);
};

/** 预热：解析词典、初始化拼音表（手机上约 2 秒），失败不影响朗读。 */
const warmUpZhG2P = () => {
  try {
    getZhG2P().frontend('你好。');
  } catch (err) {
    console.warn('[KokoroZhEngine] warm-up failed:', err);
  }
};

/**
 * 口袋AI：Kokoro 中文引擎（Kokoro-82M v1.1-zh，FP32 ONNX）。
 *
 * 推理沿用库里的 Kokoro 引擎；中文音素化由本应用的 misaki 移植
 * （src/services/tts/zh）通过补丁里的 `zhPhonemize` 配置注入，夹杂的
 * 英文仍走库自带的英文音素化，所以也要下载英文 IPA 词典。
 * 安装流程与英文 Kokoro 相同：核心文件全有或全无，声音尽量下载。
 */
export class KokoroZhEngine implements NeuralEngine {
  readonly id = 'kokoroZh' as const;

  private getRoot(): string {
    return Platform.OS === 'ios'
      ? `${RNFS.LibraryDirectoryPath}/Application Support`
      : RNFS.DocumentDirectoryPath;
  }

  getModelPath(): string {
    return `${this.getRoot()}/${KOKORO_ZH_MODEL_SUBDIR}`;
  }

  private getFilePath(filename: string): string {
    return `${this.getModelPath()}/${filename}`;
  }

  voiceFile(voiceId: string): VoiceFileSource {
    return {
      path: this.getFilePath(`voices/${voiceId}.bin`),
      url: `${KOKORO_ZH_VOICES_BASE_URL}/${voiceId}.bin`,
    };
  }

  async isInstalled(): Promise<boolean> {
    try {
      for (const file of KOKORO_ZH_MODEL_FILES) {
        if (!(await RNFS.exists(this.getFilePath(file.name)))) {
          return false;
        }
      }
      if (!(await RNFS.exists(this.getFilePath(TTS_DICT_FILENAME)))) {
        return false;
      }
      return RNFS.exists(this.getFilePath(KOKORO_VOICES_MANIFEST_FILENAME));
    } catch (err) {
      console.warn('[KokoroZhEngine] isInstalled check failed:', err);
      return false;
    }
  }

  async getVoices(): Promise<Voice[]> {
    return KOKORO_ZH_VOICES;
  }

  async downloadModel(onProgress?: KokoroZhProgressCallback): Promise<void> {
    const modelDir = this.getModelPath();
    await RNFS.mkdir(`${this.getRoot()}/${TTS_PARENT_SUBDIR}`, {
      NSURLIsExcludedFromBackupKey: true,
    });
    await RNFS.mkdir(modelDir, {NSURLIsExcludedFromBackupKey: true});
    await RNFS.mkdir(`${modelDir}/voices`, {
      NSURLIsExcludedFromBackupKey: true,
    });

    // 第一阶段：模型、分词表、英文词典，全有或全无
    const corePhaseWeight = 0.9;
    const coreFiles: {name: string; url: string}[] = [
      ...KOKORO_ZH_MODEL_FILES.map(f => ({
        name: f.name,
        url: `${KOKORO_ZH_MODEL_BASE_URL}/${f.urlPath}`,
      })),
      {name: TTS_DICT_FILENAME, url: applyHfMirror(TTS_DICT_URL)},
    ];
    // 模型占绝大部分体积，进度按它算才不会卡在中途
    const weights = [0.9, 0.02, 0.08];
    const done = new Array(coreFiles.length).fill(0);
    const reportCore = () => {
      const sum = done.reduce((a, b, i) => a + b * weights[i], 0);
      onProgress?.(Math.min(1, sum * corePhaseWeight));
    };

    try {
      for (let i = 0; i < coreFiles.length; i++) {
        const file = coreFiles[i]!;
        const result = await RNFS.downloadFile({
          fromUrl: file.url,
          toFile: this.getFilePath(file.name),
          background: false,
          discretionary: false,
          cacheable: false,
          progressInterval: 500,
          progress: res => {
            done[i] = Math.min(1, res.bytesWritten / (res.contentLength || 1));
            reportCore();
          },
        }).promise;
        if (result.statusCode !== 200) {
          throw new Error(
            `Failed to download ${file.name}: HTTP ${result.statusCode}`,
          );
        }
        done[i] = 1;
        reportCore();
      }
    } catch (err) {
      await RNFS.unlink(modelDir).catch(() => {});
      throw err;
    }

    // 第二阶段：声音文件，允许部分失败
    let voicesDone = 0;
    for (const voice of KOKORO_ZH_VOICES) {
      await ensureVoiceFileAt(voice, this.voiceFile(voice.id));
      voicesDone++;
      onProgress?.(
        Math.min(
          1,
          corePhaseWeight +
            (voicesDone / KOKORO_ZH_VOICES.length) * (1 - corePhaseWeight),
        ),
      );
    }

    await RNFS.writeFile(
      this.getFilePath(KOKORO_VOICES_MANIFEST_FILENAME),
      JSON.stringify(
        {
          baseUrl: KOKORO_ZH_VOICES_BASE_URL,
          voices: KOKORO_ZH_VOICES.map(v => v.id),
        },
        null,
        2,
      ),
    );
    onProgress?.(1);
  }

  async deleteModel(): Promise<void> {
    try {
      if (await RNFS.exists(this.getModelPath())) {
        await RNFS.unlink(this.getModelPath());
      }
    } catch (err) {
      console.warn('[KokoroZhEngine] deleteModel failed:', err);
    }
  }

  async loadInto(): Promise<void> {
    const modelDir = this.getModelPath();
    const init = Speech.initialize({
      engine: TTSEngine.KOKORO,
      modelPath: `file://${modelDir}/model_fp32.onnx`,
      tokenizerPath: `file://${modelDir}/tokenizer.json`,
      voicesPath: `file://${modelDir}/${KOKORO_VOICES_MANIFEST_FILENAME}`,
      dictPath: `file://${modelDir}/${TTS_DICT_FILENAME}`,
      executionProviders: ['cpu'],
      // 中文一个字约 2~3 个音素，块要比英文小，才不超出模型 510 的上限
      maxChunkSize: 100,
      zhPhonemize: phonemizeZh,
      silentMode: 'obey',
      ducking: true,
    });
    // 原生加载模型（约 3 秒）时，JS 线程顺便把中文词典准备好，首句不再多等
    warmUpZhG2P();
    await init;
  }

  async play(text: string, voice: Voice): Promise<void> {
    if (!(await this.isInstalled())) {
      throw new Error('Kokoro Chinese model is not installed');
    }
    await ttsRuntime.acquire(this, () => Speech.speak(text, voice.id));
  }

  playStreaming(
    voice: Voice,
    waitFor?: Promise<void>,
    streamOpts?: StreamOptions,
  ): StreamingHandle {
    return createEngineStreamingHandle(this, voice.id, streamOpts, waitFor);
  }

  async stop(): Promise<void> {
    await Speech.stop();
  }
}
