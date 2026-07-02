import {FIREBASE_FUNCTIONS_URL} from '@env';

export const HF_DOMAIN = 'https://huggingface.co';
export const HF_API_BASE = `${HF_DOMAIN}/api/models`;

// ─── HF 镜像（中国大陆网络加速）───────────────────────────────────────
// 数据层始终保存规范的 huggingface.co URL（解析校验、去重、token 门控均依赖
// 规范域名）；镜像改写只发生在真正发起网络请求的收口处（HF API 请求、
// DownloadManager、TTS 引擎下载、外部网页跳转）。
//
// Token 不变量：HF token 只允许发给 huggingface.co 本身，绝不发给镜像。
// 镜像开启时请求一律走镜像且不携带 token（受限模型需关闭镜像后直连下载）。
export const HF_MIRROR_DOMAIN = 'https://hf-mirror.com';

let hfMirrorEnabled = true;

// 由 UIStore 在初始化/设置变更时同步，避免 config → store 的循环依赖。
// 注意：持久化状态恢复完成前按默认值（开启）生效，存在一个短暂窗口。
export const setHfMirrorEnabled = (enabled: boolean) => {
  hfMirrorEnabled = enabled;
};

export const isHfMirrorEnabled = () => hfMirrorEnabled;

const swapDomain = (url: string, from: string, to: string): string => {
  if (url === from || url.startsWith(`${from}/`)) {
    return to + url.slice(from.length);
  }
  return url;
};

// 请求收口处调用：镜像开启时把 huggingface.co 改写为镜像域名。
// 只适用于不携带认证信息的请求；带 token 的请求用 resolveHfRequest。
export const applyHfMirror = (url: string): string =>
  hfMirrorEnabled ? swapDomain(url, HF_DOMAIN, HF_MIRROR_DOMAIN) : url;

// 反向规范化：镜像 URL → huggingface.co。与运行时开关无关，用于
// URL 比对（如 Android 恢复下载时按 URL 匹配模型）以及请求前的归一。
export const canonicalizeHfUrl = (url: string): string =>
  swapDomain(url, HF_MIRROR_DOMAIN, HF_DOMAIN);

// 带认证请求的统一收口。强制两条不变量：
// 1. token 绝不与镜像域名组合（先归一再决定，防止已是镜像的 URL —— 如
//    分页 Link header —— 带上 token 发出去）；
// 2. 镜像开启时一律走镜像、不携带 token（行为可预期：受限模型需关闭镜像）。
export const resolveHfRequest = (
  url: string,
  authToken?: string | null,
): {url: string; authToken: string | null} => {
  const canonical = canonicalizeHfUrl(url);
  if (hfMirrorEnabled) {
    return {
      url: swapDomain(canonical, HF_DOMAIN, HF_MIRROR_DOMAIN),
      authToken: null,
    };
  }
  return {url: canonical, authToken: authToken ?? null};
};

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
  // 数据层 URL 保持规范域名；浏览器打开时在 Linking.openURL 处经
  // applyHfMirror 改写（官方站在目标网络不可达）。
  modelWebPage: (modelId: string) => `${HF_DOMAIN}/${modelId}`,

  // Benchmark Endpoint
  benchmarkSubmit: () => `${FIREBASE_BASE}/api/v1/submit`,

  // Feedback Endpoint
  feedbackSubmit: () => `${FIREBASE_BASE}/feedback`,
};
