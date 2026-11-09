import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  consumeInterruptedLoad,
  isFactoryPerfParams,
  markLoadEnd,
  markLoadStart,
  memoryBand,
  readPerfState,
  recommendPerfParams,
  stepDown,
  writePerfState,
} from '../perfProfile';

jest.mock('@react-native-async-storage/async-storage', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: jest.fn(async (key: string) => values.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      values.delete(key);
    }),
    clear: jest.fn(async () => {
      values.clear();
    }),
  };
  return {__esModule: true, default: storage, ...storage};
});

const GiB = 1024 * 1024 * 1024;

describe('perfProfile', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it.each([
    [3.6, '≤4GB'],
    [5.5, '≤6GB'],
    // 标称 8GB 手机常报 7.4 GiB
    [7.4, '≤8GB'],
    [11.2, '>8GB'],
    [15.3, '>8GB'],
  ])('puts %f GiB in band %s', (gib, band) => {
    expect(memoryBand(gib * GiB)).toBe(band);
  });

  it('keeps small phones on a small context and compute buffer', () => {
    expect(
      recommendPerfParams({totalMemoryBytes: 3.6 * GiB, recommendedThreads: 4}),
    ).toEqual({
      n_ctx: 2048,
      n_batch: 256,
      n_ubatch: 128,
      n_threads: 4,
      image_max_tokens: 256,
    });
  });

  it('gives large-memory phones a longer context', () => {
    const rec = recommendPerfParams({
      totalMemoryBytes: 11.2 * GiB,
      recommendedThreads: 4,
    });
    expect(rec.n_ctx).toBe(8192);
    expect(rec.n_ubatch).toBeLessThanOrEqual(rec.n_batch);
  });

  it('only treats untouched defaults as factory values', () => {
    expect(
      isFactoryPerfParams({n_ctx: 2048, n_batch: 512, n_ubatch: 512}),
    ).toBe(true);
    expect(
      isFactoryPerfParams({n_ctx: 4096, n_batch: 512, n_ubatch: 512}),
    ).toBe(false);
  });

  it('halves context and batches down to a floor', () => {
    expect(stepDown({n_ctx: 8192, n_batch: 512, n_ubatch: 512})).toEqual({
      n_ctx: 4096,
      n_batch: 256,
      n_ubatch: 256,
    });
    expect(stepDown({n_ctx: 1024, n_batch: 64, n_ubatch: 64})).toBeNull();
    const low = stepDown({n_ctx: 1500, n_batch: 100, n_ubatch: 100});
    expect(low).toEqual({n_ctx: 1024, n_batch: 64, n_ubatch: 64});
  });

  it('reports a load the process did not survive exactly once', async () => {
    await markLoadStart();
    await markLoadEnd();
    expect(await consumeInterruptedLoad()).toBe(false);
    await markLoadStart();
    expect(await consumeInterruptedLoad()).toBe(true);
    expect(await consumeInterruptedLoad()).toBe(false);
  });

  it('persists and merges state', async () => {
    expect(await readPerfState()).toEqual({autoApplied: false});
    await writePerfState({autoApplied: true});
    await writePerfState({steppedDownAt: 123});
    expect(await readPerfState()).toEqual({
      autoApplied: true,
      steppedDownAt: 123,
    });
  });
});
