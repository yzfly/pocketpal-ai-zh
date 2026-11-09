// 口袋AI 账号：Supabase Auth（GoTrue）HTTP 客户端，邮箱 + 密码。
//
// 不用 @supabase/supabase-js：只需要几个认证接口，直接 fetch 更轻，也便于
// 走国内中转。地址来自 .env 的 ACCOUNT_API_URL（北京机裸 IP 入口，例如
// https://<IP>:18443/pw，自签证书在 network_security_config 里固定），
// ACCOUNT_PUBLISHABLE_KEY 为项目的 publishable key。两者都不入仓库。
//
// 项目关闭了“邮箱确认”：注册后直接返回会话，无需验证码。

import {ACCOUNT_API_URL, ACCOUNT_PUBLISHABLE_KEY} from '@env';

export interface AccountTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
}

export interface AccountUser {
  id: string;
  email?: string;
  created_at?: string;
}

export class AccountError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'AccountError';
  }
}

const TIMEOUT_MS = 15000;

export function isAccountConfigured(): boolean {
  return Boolean(ACCOUNT_API_URL && ACCOUNT_PUBLISHABLE_KEY);
}

function baseUrl(): string {
  return (ACCOUNT_API_URL || '').replace(/\/+$/, '');
}

interface GoTrueErrorBody {
  error_code?: string;
  error?: string;
  error_description?: string;
  msg?: string;
  message?: string;
}

async function request<T>(
  path: string,
  init: {method?: string; body?: unknown; token?: string} = {},
): Promise<T> {
  if (!isAccountConfigured()) {
    throw new AccountError('not_configured', 'account not configured', 0);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      method: init.method ?? 'POST',
      headers: {
        apikey: ACCOUNT_PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
        ...(init.token ? {Authorization: `Bearer ${init.token}`} : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: controller.signal,
    });
  } catch (e) {
    throw new AccountError('network_error', String(e), 0);
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  let data: unknown;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = undefined;
    }
  }
  if (!res.ok) {
    const body = (data ?? {}) as GoTrueErrorBody;
    const code =
      body.error_code ||
      body.error ||
      (res.status === 429 ? 'over_request_rate_limit' : `http_${res.status}`);
    throw new AccountError(
      code,
      body.msg || body.error_description || body.message || code,
      res.status,
    );
  }
  return data as T;
}

interface SessionResponse extends AccountTokens {
  user?: AccountUser;
}

function toTokens(r: SessionResponse): AccountTokens {
  if (!r?.access_token || !r?.refresh_token) {
    // 项目若重新开启“邮箱确认”，注册只返回用户、不返回会话
    throw new AccountError(
      'email_not_confirmed',
      'signup returned no session',
      200,
    );
  }
  return {
    access_token: r.access_token,
    refresh_token: r.refresh_token,
    expires_in: r.expires_in,
    token_type: r.token_type,
  };
}

export const accountAuth = {
  async signUp(email: string, password: string): Promise<AccountTokens> {
    const r = await request<SessionResponse>('/auth/v1/signup', {
      body: {email, password},
    });
    return toTokens(r);
  },

  async signIn(email: string, password: string): Promise<AccountTokens> {
    const r = await request<SessionResponse>(
      '/auth/v1/token?grant_type=password',
      {body: {email, password}},
    );
    return toTokens(r);
  },

  async refresh(refreshToken: string): Promise<AccountTokens> {
    const r = await request<SessionResponse>(
      '/auth/v1/token?grant_type=refresh_token',
      {body: {refresh_token: refreshToken}},
    );
    return toTokens(r);
  },

  async me(accessToken: string): Promise<AccountUser> {
    return request<AccountUser>('/auth/v1/user', {
      method: 'GET',
      token: accessToken,
    });
  },

  async signOut(accessToken: string): Promise<void> {
    await request<unknown>('/auth/v1/logout', {token: accessToken});
  },
};

/** 把服务端错误翻译成给用户看的中文提示 */
export function describeAccountError(e: unknown): string {
  const code = e instanceof AccountError ? e.code : '';
  switch (code) {
    case 'invalid_credentials':
    case 'invalid_grant':
      return '邮箱或密码不正确';
    case 'user_already_exists':
    case 'email_exists':
      return '该邮箱已注册，请直接登录';
    case 'weak_password':
      return '密码太简单，请换一个更复杂的密码';
    case 'email_address_invalid':
    case 'validation_failed':
      return '请输入正确的邮箱地址';
    case 'user_banned':
      return '账号已被停用';
    case 'signup_disabled':
      return '暂不开放注册';
    case 'email_not_confirmed':
      return '请先到邮箱完成验证';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return '操作太频繁，请稍后再试';
    case 'not_configured':
      return '账号服务暂未开通';
    case 'network_error':
      return '网络连接失败，请检查网络';
    default:
      return '操作失败，请稍后重试';
  }
}
