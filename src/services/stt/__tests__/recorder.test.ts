/**
 * SttRecorder 测试：基于 sherpa-onnx 原生麦克风采集 mock 驱动回调。
 */

import {SttRecorder} from '../recorder';
import {STT_SAMPLE_RATE} from '../constants';

// moduleNameMapper 把 react-native-sherpa-onnx(/audio) 指向统一的 mock 文件；
// 直接从该文件导入以拿到同一实例上的测试助手。
import {
  createPcmLiveStream,
  __mockPcmStream,
  __emitPcmData,
  __emitPcmError,
  __resetPcmCallbacks,
} from '../../../../__mocks__/external/react-native-sherpa-onnx';

describe('SttRecorder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetPcmCallbacks();
  });

  it('starts native capture at 16kHz mono', async () => {
    const recorder = new SttRecorder();
    await recorder.start();

    expect(createPcmLiveStream).toHaveBeenCalledWith({
      sampleRate: STT_SAMPLE_RATE,
      channelCount: 1,
    });
    expect(__mockPcmStream.start).toHaveBeenCalledTimes(1);
    expect(recorder.isRecording).toBe(true);

    await recorder.stop();
  });

  it('accumulates PCM chunks and merges them on stop', async () => {
    const recorder = new SttRecorder();
    await recorder.start();

    __emitPcmData(new Float32Array([0.1, 0.2]));
    __emitPcmData(new Float32Array([0.3]));

    const recording = await recorder.stop();

    expect(recording.samples).toHaveLength(3);
    expect(recording.samples[0]).toBeCloseTo(0.1);
    expect(recording.samples[1]).toBeCloseTo(0.2);
    expect(recording.samples[2]).toBeCloseTo(0.3);
    expect(recording.sampleRate).toBe(STT_SAMPLE_RATE);
    expect(recording.durationMs).toBe(Math.round((3 / STT_SAMPLE_RATE) * 1000));
    expect(__mockPcmStream.stop).toHaveBeenCalledTimes(1);
    expect(recorder.isRecording).toBe(false);
  });

  it('returns empty samples when stopped without recording', async () => {
    const recording = await new SttRecorder().stop();
    expect(recording.samples).toHaveLength(0);
    expect(__mockPcmStream.stop).not.toHaveBeenCalled();
  });

  it('ignores start() while already recording', async () => {
    const recorder = new SttRecorder();
    await recorder.start();
    await recorder.start();
    expect(__mockPcmStream.start).toHaveBeenCalledTimes(1);
    await recorder.stop();
  });

  it('stops and reports native capture errors via onError', async () => {
    const onError = jest.fn();
    const recorder = new SttRecorder();
    await recorder.start(onError);

    __emitPcmError('mic busy');

    // cleanup 为异步，等微任务清空
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(onError).toHaveBeenCalledWith('mic busy');
    expect(recorder.isRecording).toBe(false);
    expect(__mockPcmStream.stop).toHaveBeenCalledTimes(1);
  });

  it('cleans up when native start() rejects', async () => {
    (__mockPcmStream.start as jest.Mock).mockRejectedValueOnce(
      new Error('permission denied'),
    );

    const recorder = new SttRecorder();
    await expect(recorder.start()).rejects.toThrow(/permission denied/);
    expect(recorder.isRecording).toBe(false);
  });
});
