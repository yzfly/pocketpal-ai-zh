import {makeAutoObservable, runInAction} from 'mobx';
import * as Keychain from 'react-native-keychain';

import {
  AccountError,
  AccountTokens,
  AccountUser,
  accountAuth,
  isAccountConfigured,
} from './SupabaseAuthClient';

const TOKEN_SERVICE = 'pocketwisdom.account';

export class AccountService {
  user: AccountUser | null = null;
  ready = false;
  busy = false;

  private tokens: AccountTokens | null = null;

  constructor() {
    makeAutoObservable<AccountService, 'tokens'>(this, {tokens: false});
  }

  get isConfigured(): boolean {
    return isAccountConfigured();
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

  private async saveTokens(tokens: AccountTokens | null) {
    this.tokens = tokens;
    if (tokens) {
      await Keychain.setGenericPassword('account', JSON.stringify(tokens), {
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
      const user = await accountAuth.me(this.tokens.access_token);
      runInAction(() => {
        this.user = user;
      });
    } catch (e) {
      if (e instanceof AccountError && (e.status === 401 || e.status === 403)) {
        try {
          const fresh = await accountAuth.refresh(this.tokens.refresh_token);
          await this.saveTokens(fresh);
          const user = await accountAuth.me(fresh.access_token);
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

  private async run<T>(fn: () => Promise<T>): Promise<T> {
    runInAction(() => {
      this.busy = true;
    });
    try {
      return await fn();
    } finally {
      runInAction(() => {
        this.busy = false;
      });
    }
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.run(async () => {
      const tokens = await accountAuth.signIn(email.trim(), password);
      await this.saveTokens(tokens);
      await this.loadUser();
    });
  }

  async signUp(email: string, password: string): Promise<void> {
    await this.run(async () => {
      const tokens = await accountAuth.signUp(email.trim(), password);
      await this.saveTokens(tokens);
      await this.loadUser();
    });
  }

  async signOut(): Promise<void> {
    const token = this.tokens?.access_token;
    if (token) {
      await accountAuth.signOut(token).catch(() => undefined);
    }
    await this.saveTokens(null);
    runInAction(() => {
      this.user = null;
    });
  }
}

export const accountService = new AccountService();
