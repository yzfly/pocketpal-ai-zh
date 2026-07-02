import {FIREBASE_FUNCTIONS_URL} from '@env';

export const HF_DOMAIN = 'https://huggingface.co';
export const HF_API_BASE = `${HF_DOMAIN}/api/models`;

// ─── HF 镜像（中国大陆网络加速）───────────────────────────────────────
// 数据层始终保存规范的 huggingface.co URL（解析校验、去重、token 门控均依赖
// 规范域名）；镜像改写只发生在真正发起网络请求的收口处（HF API 请求、
// DownloadManager、TTS 引擎下载）。带认证 token 的请求不改写——token
// 只允许发给 huggingface.co 本身，不能经第三方代理转发。
export const HF_MIRROR_DOMAIN = 'https://hf-mirror.com';

let hfMirrorEnabled = true;

// 由 UIStore 在初始化/设置变更时同步，避免 config → store 的循环依赖。
export const setHfMirrorEnabled = (enabled: boolean) => {
  hfMirrorEnabled = enabled;
};

export const isHfMirrorEnabled = () => hfMirrorEnabled;

// 请求收口处调用：把 huggingface.co 改写为镜像域名。hasAuth 为 true
// （请求会附带 HF token）时保持直连。
export const applyHfMirror = (url: string, hasAuth = false): string => {
  if (!hfMirrorEnabled || hasAuth) {
    return url;
  }
  return url.replace(
    /^https:\/\/huggingface\.co(\/|$)/,
    `${HF_MIRROR_DOMAIN}$1`,
  );
};

// 反向规范化：镜像 URL → huggingface.co。与运行时开关无关，用于
// URL 比对（如 Android 恢复下载时按 URL 匹配模型），确保无论下载
// 当时镜像开关如何，都能对上规范 URL。
export const canonicalizeHfUrl = (url: string): string =>
  url.replace(/^https:\/\/hf-mirror\.com(\/|$)/, `${HF_DOMAIN}$1`);

// Fallback for Firebase Functions URL if not configured
const FIREBASE_BASE =
  FIREBASE_FUNCTIONS_URL || 'https://placeholder-firebase-functions.com';

export const urls = {
  // API URLs
  modelsList: () => `${HF_API_BASE}`,
  modelTree: (modelId: string) => `${HF_API_BASE}/${modelId}/tree/main`,
  modelSpecs: (modelId: string) => `${HF_API_BASE}/${modelId}`,

  // Web URLs
  modelDownloadFile: (modelId: string, filename: string) =>
    `${HF_DOMAIN}/${modelId}/resolve/main/${filename}`,
  modelWebPage: (modelId: string) => `${HF_DOMAIN}/${modelId}`,

  // Benchmark Endpoint
  benchmarkSubmit: () => `${FIREBASE_BASE}/api/v1/submit`,

  // Feedback Endpoint
  feedbackSubmit: () => `${FIREBASE_BASE}/feedback`,
};
