// 腾讯云开发 CloudBase 身份认证 HTTP 客户端（邮箱 + 密码）。
//
// 不用 @cloudbase/js-sdk：它依赖 Node 模块且强制 react-native-mmkv v3。
// 这里直接调用 CloudBase 的 HTTP 认证接口（/auth/v1/*），国内网关无需翻墙。
// 配置来自 .env（CLOUDBASE_ENV_ID / CLOUDBASE_REGION / CLOUDBASE_PUBLISHABLE_KEY），
// 值不入仓库。

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CLOUDBASE_ENV_ID,
  CLOUDBASE_PUBLISHABLE_KEY,
  CLOUDBASE_REGION,
} from '@env';

export interface CloudBaseTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
  sub?: string;
}

export interface CloudBaseUser {
  sub: string;
  name?: string;
  username?: string;
  email?: string;
  phone_number?: string;
  picture?: string;
  status?: string;
}

export interface CaptchaChallenge {
  /** data:image/... base64 图片 */
  image: string;
  token: string;
}

export class CloudBaseError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'CloudBaseError';
  }
}

const DEVICE_ID_KEY = 'cloudbase.deviceId';
const INTL_REGIONS = [
  'ap-singapore',
  'ap-hongkong',
  'ap-tokyo',
  'na-siliconvalley',
  'eu-frankfurt',
];

export function isCloudBaseConfigured(): boolean {
  return Boolean(CLOUDBASE_ENV_ID && CLOUDBASE_PUBLISHABLE_KEY);
}

function baseUrl(): string {
  const region = CLOUDBASE_REGION || 'ap-shanghai';
  const intl = INTL_REGIONS.includes(region) ? '.intl' : '';
  return `https://${CLOUDBASE_ENV_ID}.api${intl}.tcloudbasegateway.com`;
}

let deviceIdPromise: Promise<string> | null = null;

function randomId(): string {
  const hex = '0123456789abcdef';
  let out = '';
  for (let i = 0; i < 32; i++) {
    out += hex[Math.floor(Math.random() * 16)];
  }
  return out;
}

function getDeviceId(): Promise<string> {
  if (!deviceIdPromise) {
    deviceIdPromise = (async () => {
      try {
        const saved = await AsyncStorage.getItem(DEVICE_ID_KEY);
        if (saved) {
          return saved;
        }
      } catch {}
      const id = randomId();
      try {
        await AsyncStorage.setItem(DEVICE_ID_KEY, id);
      } catch {}
      return id;
    })();
  }
  return deviceIdPromise;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  accessToken?: string;
  captchaToken?: string;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  if (!isCloudBaseConfigured()) {
    throw new CloudBaseError('not_configured', '账号服务未配置', 0);
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${opts.accessToken ?? CLOUDBASE_PUBLISHABLE_KEY}`,
    'x-device-id': await getDeviceId(),
  };
  if (opts.captchaToken) {
    headers['x-captcha-token'] = opts.captchaToken;
  }
  let res: Response;
  try {
    res = await fetch(baseUrl() + path, {
      method: opts.method ?? 'POST',
      headers,
      body: opts.method === 'GET' ? undefined : JSON.stringify(opts.body ?? {}),
    });
  } catch (e) {
    throw new CloudBaseError('network_error', String(e), 0);
  }
  const text = await res.text();
  let json: any = {};
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = {};
    }
  }
  if (!res.ok) {
    const code =
      json.error ||
      json.code ||
      (res.status === 501 ? 'not_supported' : 'http_' + res.status);
    throw new CloudBaseError(
      String(code),
      String(json.error_description || json.message || code),
      res.status,
    );
  }
  return json as T;
}

export const cloudBaseAuth = {
  signIn(email: string, password: string, captchaToken?: string) {
    return request<CloudBaseTokens>('/auth/v1/signin', {
      body: {username: email, password},
      captchaToken,
    });
  },

  /** 发送邮箱验证码，返回 verification_id；is_user=true 表示邮箱已注册 */
  sendEmailCode(email: string, captchaToken?: string) {
    return request<{
      verification_id: string;
      expires_in: number;
      is_user?: boolean;
    }>('/auth/v1/verification', {body: {email, target: 'ANY'}, captchaToken});
  },

  verifyCode(verificationId: string, code: string) {
    return request<{verification_token: string; expires_in: number}>(
      '/auth/v1/verification/verify',
      {body: {verification_id: verificationId, verification_code: code}},
    );
  },

  signUp(email: string, password: string, verificationToken: string) {
    return request<CloudBaseTokens>('/auth/v1/signup', {
      body: {
        email,
        password,
        verification_token: verificationToken,
        // 用户名设为邮箱，之后才能用“邮箱 + 密码”登录
        username: email,
        name: email.split('@')[0],
      },
    });
  },

  refresh(refreshToken: string) {
    return request<CloudBaseTokens>('/auth/v1/token', {
      body: {grant_type: 'refresh_token', refresh_token: refreshToken},
    });
  },

  me(accessToken: string) {
    return request<CloudBaseUser>('/auth/v1/user/me', {
      method: 'GET',
      accessToken,
    });
  },

  signOut(accessToken: string) {
    return request<unknown>('/auth/v1/user/signout', {accessToken, body: {}});
  },

  async getCaptcha(): Promise<CaptchaChallenge> {
    const r = await request<{data: string; token: string}>(
      '/auth/v1/captcha/data',
      {
        body: {},
      },
    );
    return {image: r.data, token: r.token};
  },

  async verifyCaptcha(token: string, answer: string): Promise<string> {
    const r = await request<{captcha_token: string}>(
      '/auth/v1/captcha/data/verify',
      {
        body: {token, key: answer},
      },
    );
    return r.captcha_token;
  },
};

/** 把 CloudBase 错误码转成给普通用户看的中文提示 */
export function describeAccountError(e: unknown): string {
  const code = e instanceof CloudBaseError ? e.code : '';
  switch (code) {
    case 'invalid_username_or_password':
      return '邮箱或密码不正确';
    case 'password_not_set':
      return '这个账号还没有设置密码';
    case 'invalid_status':
      return '账号已被停用';
    case 'invalid_verification_code':
      return '验证码不正确或已过期';
    case 'captcha_required':
      return '请先完成图形验证码';
    case 'invalid_captcha':
      return '图形验证码不正确';
    case 'user_already_exists':
    case 'username_already_exists':
    case 'already_exists':
      return '该邮箱已注册，请直接登录';
    case 'resource_exhausted':
    case 'rate_limit_exceeded':
      return '操作太频繁，请稍后再试';
    case 'not_configured':
      return '账号服务暂未开通';
    case 'not_supported':
      return '服务端未开启邮箱密码登录';
    case 'network_error':
      return '网络连接失败，请检查网络';
    default:
      return '操作失败，请稍后重试';
  }
}
