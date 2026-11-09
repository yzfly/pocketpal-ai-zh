// 口袋AI：有 NPU（高通 Hexagon v73+）的手机默认用 NPU 跑模型，并带崩溃保护。
//
// - 首次检测到可用的 HTP 设备、且用户还停留在默认 CPU 时，自动切到 NPU（只切一次，
//   之后用户手动改回 CPU 不会再被改）。
// - 每次用 NPU 加载前写一个“加载中”标记，加载结束（成功或抛错）清掉。若 App 在
//   加载途中被原生崩溃杀掉，下次启动会看到残留标记：判定本机 NPU 不可用，改回 CPU，
//   不再自动启用。
// - NPU 加载抛错（可捕获）时同样判定不可用，由调用方改用 CPU 重试。
//
// 原生层（llama.rn fork）只在 v73 及以上 SoC 上加载 Hexagon 库；这里是第二道保险。

import AsyncStorage from '@react-native-async-storage/async-storage';

const GUARD_KEY = '@pocketwisdom/npu-load-guard';
const STATE_KEY = '@pocketwisdom/npu-auto';

export interface NpuAutoState {
  /** 已经自动切过一次 NPU（用户之后的选择不再被覆盖） */
  autoApplied: boolean;
  /** 本机 NPU 加载失败或崩溃过，不再自动启用 */
  blocked: boolean;
}

const DEFAULT_STATE: NpuAutoState = {autoApplied: false, blocked: false};

export function isHtpSelection(devices?: string[]): boolean {
  return Boolean(devices?.some(name => name.startsWith('HTP')));
}

/** devices 仍是 Android 默认的 CPU（未设置 / 空 / 仅 CPU） */
export function isDefaultCpuSelection(devices?: string[]): boolean {
  return !devices?.length || (devices.length === 1 && devices[0] === 'CPU');
}

export async function readNpuAutoState(): Promise<NpuAutoState> {
  try {
    const raw = await AsyncStorage.getItem(STATE_KEY);
    if (!raw) {
      return {...DEFAULT_STATE};
    }
    const parsed = JSON.parse(raw);
    return {
      autoApplied: parsed?.autoApplied === true,
      blocked: parsed?.blocked === true,
    };
  } catch {
    return {...DEFAULT_STATE};
  }
}

export async function writeNpuAutoState(
  patch: Partial<NpuAutoState>,
): Promise<NpuAutoState> {
  const next = {...(await readNpuAutoState()), ...patch};
  try {
    await AsyncStorage.setItem(STATE_KEY, JSON.stringify(next));
  } catch (e) {
    console.warn('[npuAutoSelect] failed to persist state:', e);
  }
  return next;
}

export async function markNpuLoadStart(): Promise<void> {
  try {
    await AsyncStorage.setItem(GUARD_KEY, String(Date.now()));
  } catch (e) {
    console.warn('[npuAutoSelect] failed to set load guard:', e);
  }
}

export async function markNpuLoadEnd(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GUARD_KEY);
  } catch {
    // 清不掉最多是下次误判一次，忽略
  }
}

/**
 * 启动时调用：若上次 NPU 加载没有正常结束（进程被杀），清掉标记、记为不可用并返回 true。
 */
export async function consumeInterruptedNpuLoad(): Promise<boolean> {
  try {
    const pending = await AsyncStorage.getItem(GUARD_KEY);
    if (pending === null) {
      return false;
    }
    await AsyncStorage.removeItem(GUARD_KEY);
    await writeNpuAutoState({blocked: true});
    return true;
  } catch {
    return false;
  }
}
