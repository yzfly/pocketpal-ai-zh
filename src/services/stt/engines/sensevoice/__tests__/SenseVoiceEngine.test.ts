/**
 * SenseVoiceEngine 测试（单阶段全有或全无安装 + 懒加载识别器）。
 */

import * as RNFS from '@dr.pogodin/react-native-fs';

import {applyHfMirror} from '../../../../../config';

import {SenseVoiceEngine} from '..';
import {
  SENSEVOICE_MODEL_BASE_URL,
  SENSEVOICE_MODEL_FILES,
} from '../../../constants';

// moduleNameMapper 把 react-native-sherpa-onnx(/stt) 指向统一的 mock 文件；
// 直接从该文件导入以拿到同一实例上的测试助手（与 SystemEngine 测试同款写法）。
import {
  createSTT,
  __mockSttEngine,
} from '../../../../../../__mocks__/external/react-native-sherpa-onnx';

describe('SenseVoiceEngine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (RNFS.exists as jest.Mock).mockResolvedValue(false);
    (RNFS.mkdir as jest.Mock).mockResolvedValue(undefined);
    (RNFS.unlink as jest.Mock).mockResolvedValue(undefined);
  });

  describe('getModelPath()', () => {
    it('returns documents-relative stt/sensevoice path', () => {
      expect(new SenseVoiceEngine().getModelPath()).toBe(
        '/path/to/documents/stt/sensevoice',
      );
    });
  });

  describe('isInstalled()', () => {
    it('returns true when all required files exist', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true);
      await expect(new SenseVoiceEngine().isInstalled()).resolves.toBe(true);
    });

    it('returns false when the ONNX model file is missing', async () => {
      (RNFS.exists as jest.Mock).mockImplementation((path: string) =>
        Promise.resolve(!path.endsWith('model.int8.onnx')),
      );
      await expect(new SenseVoiceEngine().isInstalled()).resolves.toBe(false);
    });

    it('returns false when tokens.txt is missing', async () => {
      (RNFS.exists as jest.Mock).mockImplementation((path: string) =>
        Promise.resolve(!path.endsWith('tokens.txt')),
      );
      await expect(new SenseVoiceEngine().isInstalled()).resolves.toBe(false);
    });
  });

  describe('downloadModel()', () => {
    const okDownload = () => ({
      promise: Promise.resolve({statusCode: 200, bytesWritten: 100}),
      jobId: 1,
    });

    it('downloads model.int8.onnx and tokens.txt via the HF mirror', async () => {
      (RNFS.downloadFile as jest.Mock).mockImplementation(okDownload);

      await new SenseVoiceEngine().downloadModel();

      expect(RNFS.downloadFile).toHaveBeenCalledTimes(
        SENSEVOICE_MODEL_FILES.length,
      );
      for (const file of SENSEVOICE_MODEL_FILES) {
        expect(RNFS.downloadFile).toHaveBeenCalledWith(
          expect.objectContaining({
            fromUrl: applyHfMirror(
              `${SENSEVOICE_MODEL_BASE_URL}/${file.urlPath}`,
            ),
            toFile: expect.stringContaining(`/stt/sensevoice/${file.name}`),
          }),
        );
      }
    });

    it('cleans up and rethrows on any download failure (all-or-nothing)', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true);
      (RNFS.downloadFile as jest.Mock)
        .mockImplementationOnce(okDownload)
        .mockImplementationOnce(() => ({
          promise: Promise.resolve({statusCode: 500, bytesWritten: 0}),
          jobId: 2,
        }));

      await expect(new SenseVoiceEngine().downloadModel()).rejects.toThrow(
        /HTTP 500/,
      );
      expect(RNFS.unlink).toHaveBeenCalledWith(
        expect.stringContaining('/stt/sensevoice'),
      );
    });

    it('reports progress in [0, 1] ending at 1.0', async () => {
      (RNFS.downloadFile as jest.Mock).mockImplementation(okDownload);
      const progresses: number[] = [];
      await new SenseVoiceEngine().downloadModel(p => progresses.push(p));

      expect(progresses.length).toBeGreaterThan(0);
      expect(progresses[progresses.length - 1]).toBe(1);
      expect(Math.min(...progresses)).toBeGreaterThanOrEqual(0);
      expect(Math.max(...progresses)).toBeLessThanOrEqual(1);
    });
  });

  describe('deleteModel()', () => {
    it('unlinks the model directory when present', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true);
      await new SenseVoiceEngine().deleteModel();
      expect(RNFS.unlink).toHaveBeenCalledWith(
        expect.stringContaining('/stt/sensevoice'),
      );
    });

    it('no-ops when the directory does not exist', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(false);
      await expect(
        new SenseVoiceEngine().deleteModel(),
      ).resolves.toBeUndefined();
      expect(RNFS.unlink).not.toHaveBeenCalled();
    });
  });

  describe('transcribeSamples()', () => {
    it('throws when the model is not installed', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(false);
      await expect(
        new SenseVoiceEngine().transcribeSamples([0.1, 0.2], 16000),
      ).rejects.toThrow(/not installed/i);
      expect(createSTT).not.toHaveBeenCalled();
    });

    it('lazily initializes sherpa-onnx with sense_voice config and reuses it', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true);

      const engine = new SenseVoiceEngine();
      const result = await engine.transcribeSamples([0.1, 0.2], 16000);

      expect(createSTT).toHaveBeenCalledTimes(1);
      expect(createSTT).toHaveBeenCalledWith(
        expect.objectContaining({
          modelPath: {
            type: 'file',
            path: '/path/to/documents/stt/sensevoice',
          },
          modelType: 'sense_voice',
          preferInt8: true,
          modelOptions: {senseVoice: {language: 'auto', useItn: true}},
        }),
      );
      expect(__mockSttEngine.transcribeSamples).toHaveBeenCalledWith(
        [0.1, 0.2],
        16000,
      );
      // "<|zh|>" 包裹符号应被剥掉
      expect(result).toEqual({text: 'mock transcription', lang: 'zh'});

      await engine.transcribeSamples([0.3], 16000);
      expect(createSTT).toHaveBeenCalledTimes(1);
    });

    it('trims whitespace from the transcribed text', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true);
      (__mockSttEngine.transcribeSamples as jest.Mock).mockResolvedValueOnce({
        text: '  你好世界  ',
        lang: '<|zh|>',
      });

      const result = await new SenseVoiceEngine().transcribeSamples(
        [0.1],
        16000,
      );
      expect(result.text).toBe('你好世界');
    });

    it('retries initialization after a failed createSTT', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true);
      (createSTT as jest.Mock).mockRejectedValueOnce(new Error('init failed'));

      const engine = new SenseVoiceEngine();
      await expect(engine.transcribeSamples([0.1], 16000)).rejects.toThrow(
        /init failed/,
      );

      await expect(
        engine.transcribeSamples([0.1], 16000),
      ).resolves.toMatchObject({text: 'mock transcription'});
      expect(createSTT).toHaveBeenCalledTimes(2);
    });
  });

  describe('transcribeFile()', () => {
    it('delegates to the native transcribeFile', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true);
      const result = await new SenseVoiceEngine().transcribeFile(
        '/tmp/audio.wav',
      );
      expect(__mockSttEngine.transcribeFile).toHaveBeenCalledWith(
        '/tmp/audio.wav',
      );
      expect(result.text).toBe('mock transcription');
    });
  });

  describe('release()', () => {
    it('destroys the native engine and re-initializes on next use', async () => {
      (RNFS.exists as jest.Mock).mockResolvedValue(true);

      const engine = new SenseVoiceEngine();
      await engine.transcribeSamples([0.1], 16000);
      await engine.release();
      expect(__mockSttEngine.destroy).toHaveBeenCalledTimes(1);

      await engine.transcribeSamples([0.2], 16000);
      expect(createSTT).toHaveBeenCalledTimes(2);
    });

    it('no-ops when never initialized', async () => {
      await expect(new SenseVoiceEngine().release()).resolves.toBeUndefined();
      expect(__mockSttEngine.destroy).not.toHaveBeenCalled();
    });
  });
});
