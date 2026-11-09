// 口袋AI：设备性能自检——按内存/CPU 自动给出不卡、不崩的推理参数。
//
// 1. recommendPerfParams：按总内存分档给出上下文长度、批大小、看图 token 上限，
//    线程数沿用 getRecommendedThreadCount（只用性能核）。
// 2. 首次启动（或老用户第一次升级到此版本且参数仍是出厂默认）自动应用一次；
//    用户手动改过的参数不覆盖。
// 3. 加载守护：每次加载模型前写“加载中”标记，结束时清掉。若进程在加载中被杀
//    （多为内存不足被系统杀掉或原生崩溃），下次启动把上下文/批大小降一档，
//    设置页给出提示。NPU 加载的崩溃由 npuAutoSelect 单独处理（改回 CPU）。

import AsyncStorage from '@react-native-async-storage/async-storage';

const GUARD_KEY = '@pocketwisdom/load-guard';
const STATE_KEY = '@pocketwisdom/perf-profile';

const GB = 1024 * 1024 * 1024;

export interface PerfParams {
  n_ctx: number;
  n_batch: number;
  n_ubatch: number;
  n_threads: number;
  image_max_tokens: number;
}

export interface PerfInput {
  totalMemoryBytes: number;
  recommendedThreads: number;
}

export type MemoryBand = '≤4GB' | '≤6GB' | '≤8GB' | '>8GB';

export function memoryBand(totalMemoryBytes: number): MemoryBand {
  // 系统报出的内存总比标称小（标称 4GB 约报 3.6 GiB、8GB 约报 7.4 GiB），
  // 所以按标称值 +0.5 GiB 作分界
  const gib = totalMemoryBytes / GB;
  if (gib <= 4.5) {
    return '≤4GB';
  }
  if (gib <= 6.5) {
    return '≤6GB';
  }
  if (gib <= 8.5) {
    return '≤8GB';
  }
  return '>8GB';
}

const BAND_PARAMS: Record<MemoryBand, Omit<PerfParams, 'n_threads'>> = {
  // 小内存：上下文和计算缓冲都压小，优先不被系统杀
  '≤4GB': {n_ctx: 2048, n_batch: 256, n_ubatch: 128, image_max_tokens: 256},
  '≤6GB': {n_ctx: 2048, n_batch: 512, n_ubatch: 256, image_max_tokens: 384},
  '≤8GB': {n_ctx: 4096, n_batch: 512, n_ubatch: 512, image_max_tokens: 512},
  '>8GB': {n_ctx: 8192, n_batch: 512, n_ubatch: 512, image_max_tokens: 512},
};

export function recommendPerfParams(input: PerfInput): PerfParams {
  const band = memoryBand(input.totalMemoryBytes);
  return {
    ...BAND_PARAMS[band],
    n_threads: Math.max(1, Math.round(input.recommendedThreads)),
  };
}

/** 出厂默认（createDefaultContextInitParams）——只有仍是默认值时才自动改 */
export function isFactoryPerfParams(p: {
  n_ctx: number;
  n_batch: number;
  n_ubatch: number;
}): boolean {
  return p.n_ctx === 2048 && p.n_batch === 512 && p.n_ubatch === 512;
}

const MIN_CTX = 1024;
const MIN_UBATCH = 64;

/** 加载崩溃后降一档：上下文、批大小减半（有下限）。已到下限返回 null。 */
export function stepDown(p: {
  n_ctx: number;
  n_batch: number;
  n_ubatch: number;
}): {n_ctx: number; n_batch: number; n_ubatch: number} | null {
  const n_ctx = Math.max(MIN_CTX, Math.floor(p.n_ctx / 2));
  const n_ubatch = Math.max(MIN_UBATCH, Math.floor(p.n_ubatch / 2));
  const n_batch = Math.max(n_ubatch, Math.floor(p.n_batch / 2));
  if (n_ctx === p.n_ctx && n_ubatch === p.n_ubatch && n_batch === p.n_batch) {
    return null;
  }
  return {n_ctx, n_batch, n_ubatch};
}

export interface PerfProfileState {
  /** 已自动应用过一次推荐参数 */
  autoApplied: boolean;
  /** 最近一次因加载中崩溃而自动降档的时间（ms），用于设置页提示 */
  steppedDownAt?: number;
}

export async function readPerfState(): Promise<PerfProfileState> {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return {
      autoApplied: parsed?.autoApplied === true,
      steppedDownAt:
        typeof parsed?.steppedDownAt === 'number'
          ? parsed.steppedDownAt
          : undefined,
    };
  } catch {
    return {autoApplied: false};
  }
}

export async function writePerfState(
  patch: Partial<PerfProfileState>,
): Promise<PerfProfileState> {
  const next = {...(await readPerfState()), ...patch};
  try {
    await AsyncStorage.setItem(STATE_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn('[perfProfile] failed to persist state:', e);
  }
  return next;
}

export async function markLoadStart(): Promise<void> {
  try {
    await AsyncStorage.setItem(GUARD_KEY, String(Date.now()));
  } catch {
    // 写不进去就少一层保护，不影响加载
  }
}

export async function markLoadEnd(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GUARD_KEY);
  } catch {
    // ignore
  }
}

/** 启动时调用：上次加载没有正常结束则清掉标记并返回 true */
export async function consumeInterruptedLoad(): Promise<boolean> {
  try {
    const pending = await AsyncStorage.getItem(GUARD_KEY);
    if (pending === null) {
      return false;
    }
    await AsyncStorage.removeItem(GUARD_KEY);
    return true;
  } catch {
    return false;
  }
}
