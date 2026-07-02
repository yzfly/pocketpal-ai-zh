import {createPcmLiveStream} from 'react-native-sherpa-onnx/audio';
import type {PcmLiveStreamHandle} from 'react-native-sherpa-onnx/audio';

import {STT_SAMPLE_RATE} from './constants';

/** 一次录音的产物：16kHz 单声道 float PCM（取值 [-1, 1]）。 */
export interface SttRecording {
  samples: number[];
  sampleRate: number;
  durationMs: number;
}

/**
 * 语音输入录音器。
 *
 * 封装 sherpa-onnx 的原生麦克风采集（createPcmLiveStream）：原生层负责
 * 采集与重采样，JS 侧仅按块累积 Float32Array，stop() 时拼接为 number[]
 * 交给离线识别（transcribeSamples）。
 *
 * 权限（iOS NSMicrophoneUsageDescription / Android RECORD_AUDIO）需在
 * start() 之前由调用方申请。
 */
export class SttRecorder {
  private stream: PcmLiveStreamHandle | null = null;
  private chunks: Float32Array[] = [];
  private unsubData: (() => void) | null = null;
  private unsubError: (() => void) | null = null;
  private recording = false;

  get isRecording(): boolean {
    return this.recording;
  }

  /**
   * 开始录音。onError 在原生采集出错时回调（此时录音已被内部停止）。
   */
  async start(onError?: (message: string) => void): Promise<void> {
    if (this.recording) {
      return;
    }
    this.chunks = [];
    this.stream = createPcmLiveStream({
      sampleRate: STT_SAMPLE_RATE,
      channelCount: 1,
    });
    this.unsubData = this.stream.onData(samples => {
      // 拷贝一份：原生侧可能复用底层 buffer。
      this.chunks.push(new Float32Array(samples));
    });
    this.unsubError = this.stream.onError(message => {
      console.warn('[SttRecorder] native capture error:', message);
      this.cleanup().catch(() => {});
      onError?.(message);
    });

    try {
      await this.stream.start();
      this.recording = true;
    } catch (err) {
      await this.cleanup();
      throw err;
    }
  }

  /** 停止录音并返回累积的 PCM 采样。未在录音时返回空采样。 */
  async stop(): Promise<SttRecording> {
    const chunks = this.chunks;
    await this.cleanup();

    const total = chunks.reduce((sum, c) => sum + c.length, 0);
    const samples = new Array<number>(total);
    let offset = 0;
    for (const chunk of chunks) {
      for (let i = 0; i < chunk.length; i++) {
        samples[offset + i] = chunk[i]!;
      }
      offset += chunk.length;
    }

    return {
      samples,
      sampleRate: STT_SAMPLE_RATE,
      durationMs: Math.round((total / STT_SAMPLE_RATE) * 1000),
    };
  }

  private async cleanup(): Promise<void> {
    this.unsubData?.();
    this.unsubError?.();
    this.unsubData = null;
    this.unsubError = null;
    this.chunks = [];
    const stream = this.stream;
    this.stream = null;
    const wasRecording = this.recording;
    this.recording = false;
    if (stream && wasRecording) {
      try {
        await stream.stop();
      } catch (err) {
        console.warn('[SttRecorder] stop failed:', err);
      }
    }
  }
}
