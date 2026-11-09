import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  consumeInterruptedNpuLoad,
  isDefaultCpuSelection,
  isHtpSelection,
  markNpuLoadEnd,
  markNpuLoadStart,
  readNpuAutoState,
  writeNpuAutoState,
} from '../npuAutoSelect';

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

describe('npuAutoSelect', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('recognises HTP and default CPU selections', () => {
    expect(isHtpSelection(['HTP0'])).toBe(true);
    expect(isHtpSelection(['CPU'])).toBe(false);
    expect(isHtpSelection(undefined)).toBe(false);
    expect(isDefaultCpuSelection(undefined)).toBe(true);
    expect(isDefaultCpuSelection([])).toBe(true);
    expect(isDefaultCpuSelection(['CPU'])).toBe(true);
    expect(isDefaultCpuSelection(['GPUOpenCL'])).toBe(false);
    expect(isDefaultCpuSelection(['HTP0'])).toBe(false);
  });

  it('starts with nothing applied or blocked and merges patches', async () => {
    expect(await readNpuAutoState()).toEqual({
      autoApplied: false,
      blocked: false,
    });
    await writeNpuAutoState({autoApplied: true});
    await writeNpuAutoState({blocked: true});
    expect(await readNpuAutoState()).toEqual({
      autoApplied: true,
      blocked: true,
    });
  });

  it('treats a corrupt state as the default', async () => {
    await AsyncStorage.setItem('@pocketwisdom/npu-auto', '{not json');
    expect(await readNpuAutoState()).toEqual({
      autoApplied: false,
      blocked: false,
    });
  });

  it('does nothing after a load that finished', async () => {
    await markNpuLoadStart();
    await markNpuLoadEnd();
    expect(await consumeInterruptedNpuLoad()).toBe(false);
    expect((await readNpuAutoState()).blocked).toBe(false);
  });

  it('blocks the NPU once after a load the process did not survive', async () => {
    await markNpuLoadStart();
    // 进程在加载中被杀：没有 markNpuLoadEnd
    expect(await consumeInterruptedNpuLoad()).toBe(true);
    expect((await readNpuAutoState()).blocked).toBe(true);
    // 标记已清掉，不会重复触发
    expect(await consumeInterruptedNpuLoad()).toBe(false);
  });
});
