import {makeAutoObservable, runInAction} from 'mobx';
import * as Keychain from 'react-native-keychain';

import {
  CaptchaChallenge,
  CloudBaseError,
  CloudBaseTokens,
  CloudBaseUser,
  cloudBaseAuth,
  isCloudBaseConfigured,
} from './CloudBaseAuthClient';

const TOKEN_SERVICE = 'pocketwisdom.cloudbase';

export class AccountService {
  user: CloudBaseUser | null = null;
  ready = false;
  busy = false;
  /** 服务端要求图形验证码时设置；界面显示后调用 solveCaptcha */
  captcha: CaptchaChallenge | null = null;

  private tokens: CloudBaseTokens | null = null;
  private captchaToken: string | undefined;

  constructor() {
    makeAutoObservable<AccountService, 'tokens' | 'captchaToken'>(this, {
      tokens: false,
      captchaToken: false,
    });
  }

  get isConfigured(): boolean {
    return isCloudBaseConfigured();
  }

  get isSignedIn(): boolean {
    return this.user !== null;
  }

  async init(): Promise<void> {
    try {
      if (!this.isConfigured) {
        return;
      }
      const saved = await Keychain.getGenericPassword({service: TOKEN_SERVICE});
      if (!saved) {
        return;
      }
      this.tokens = JSON.parse(saved.password);
      await this.loadUser();
    } catch (e) {
      console.warn('[account] restore session failed', e);
    } finally {
      runInAction(() => {
        this.ready = true;
      });
    }
  }

  private async saveTokens(tokens: CloudBaseTokens | null) {
    this.tokens = tokens;
    if (tokens) {
      await Keychain.setGenericPassword('cloudbase', JSON.stringify(tokens), {
        service: TOKEN_SERVICE,
      });
    } else {
      await Keychain.resetGenericPassword({service: TOKEN_SERVICE});
    }
  }

  private async loadUser(): Promise<void> {
    if (!this.tokens) {
      return;
    }
    try {
      const user = await cloudBaseAuth.me(this.tokens.access_token);
      runInAction(() => {
        this.user = user;
      });
    } catch (e) {
      if (e instanceof CloudBaseError && e.status === 401) {
        try {
          const fresh = await cloudBaseAuth.refresh(this.tokens.refresh_token);
          await this.saveTokens(fresh);
          const user = await cloudBaseAuth.me(fresh.access_token);
          runInAction(() => {
            this.user = user;
          });
          return;
        } catch {
          await this.saveTokens(null);
          runInAction(() => {
            this.user = null;
          });
          return;
        }
      }
      throw e;
    }
  }

  /** 统一处理 busy 状态与图形验证码重试 */
  private async run<T>(fn: (captchaToken?: string) => Promise<T>): Promise<T> {
    runInAction(() => {
      this.busy = true;
    });
    try {
      const token = this.captchaToken;
      this.captchaToken = undefined;
      return await fn(token);
    } catch (e) {
      if (e instanceof CloudBaseError && e.code === 'captcha_required') {
        const challenge = await cloudBaseAuth.getCaptcha().catch(() => null);
        runInAction(() => {
          this.captcha = challenge;
        });
      }
      throw e;
    } finally {
      runInAction(() => {
        this.busy = false;
      });
    }
  }

  async refreshCaptcha(): Promise<void> {
    const challenge = await cloudBaseAuth.getCaptcha();
    runInAction(() => {
      this.captcha = challenge;
    });
  }

  /** 校验图形验证码；成功后下一次请求会自动带上 */
  async solveCaptcha(answer: string): Promise<void> {
    if (!this.captcha) {
      return;
    }
    const token = await cloudBaseAuth.verifyCaptcha(this.captcha.token, answer);
    this.captchaToken = token;
    runInAction(() => {
      this.captcha = null;
    });
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.run(async captchaToken => {
      const tokens = await cloudBaseAuth.signIn(
        email.trim(),
        password,
        captchaToken,
      );
      await this.saveTokens(tokens);
      await this.loadUser();
    });
  }

  /** 发送注册验证码，返回 verificationId；邮箱已注册时抛 user_already_exists */
  async startSignUp(email: string): Promise<string> {
    return this.run(async captchaToken => {
      const r = await cloudBaseAuth.sendEmailCode(email.trim(), captchaToken);
      if (r.is_user) {
        throw new CloudBaseError('user_already_exists', 'user exists', 400);
      }
      return r.verification_id;
    });
  }

  async completeSignUp(
    email: string,
    password: string,
    verificationId: string,
    code: string,
  ): Promise<void> {
    await this.run(async () => {
      const v = await cloudBaseAuth.verifyCode(verificationId, code.trim());
      const tokens = await cloudBaseAuth.signUp(
        email.trim(),
        password,
        v.verification_token,
      );
      await this.saveTokens(tokens);
      await this.loadUser();
    });
  }

  async signOut(): Promise<void> {
    const token = this.tokens?.access_token;
    if (token) {
      await cloudBaseAuth.signOut(token).catch(() => undefined);
    }
    await this.saveTokens(null);
    runInAction(() => {
      this.user = null;
    });
  }
}

export const accountService = new AccountService();
