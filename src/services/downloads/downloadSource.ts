// 国内下载源选择：镜像开启（默认）时，先试魔搭 ModelScope 同名文件，
// 可用就走魔搭，否则回落到 hf-mirror。详见 config/urls.ts 的说明。

import {isHfMirrorEnabled, toModelScopeUrl} from '../../config';

const PROBE_TIMEOUT_MS = 8000;

/** 用 1 字节的 Range 请求探测文件是否可下载 */
export async function probeUrl(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {Range: 'bytes=0-0'},
      signal: controller.signal,
    });
    return res.status === 206 || res.status === 200;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** 是否值得探测魔搭（同步判断，不适用时调用方保持原有时序） */
export function hasModelScopeCandidate(
  requestUrl: string,
  authToken?: string | null,
): boolean {
  return (
    !authToken && isHfMirrorEnabled() && toModelScopeUrl(requestUrl) !== null
  );
}

/**
 * @param requestUrl resolveHfRequest 给出的地址（镜像开启时已是 hf-mirror）
 * @param authToken 带 token 的请求（镜像关闭、直连 HF）不改写
 */
export async function pickDownloadSource(
  requestUrl: string,
  authToken?: string | null,
): Promise<string> {
  if (authToken || !isHfMirrorEnabled()) {
    return requestUrl;
  }
  const ms = toModelScopeUrl(requestUrl);
  if (!ms) {
    return requestUrl;
  }
  if (await probeUrl(ms)) {
    console.log('[downloadSource] using ModelScope:', ms);
    return ms;
  }
  console.log('[downloadSource] ModelScope unavailable, using', requestUrl);
  return requestUrl;
}
