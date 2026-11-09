declare const __E2E__: boolean;
declare const __E2E_SKIP_ONBOARDING__: boolean;

declare module '@env' {
  export const FIREBASE_FUNCTIONS_URL: string;
  export const APPCHECK_DEBUG_TOKEN_ANDROID: string;
  export const APPCHECK_DEBUG_TOKEN_IOS: string;

  // 账号：Supabase Auth 的地址（国内经北京机中转）与 publishable key
  export const ACCOUNT_API_URL: string;
  export const ACCOUNT_PUBLISHABLE_KEY: string;

  // 应用内更新清单 update.json 的地址（国内可直连）
  export const UPDATE_MANIFEST_URL: string;

  // App Configuration
  export const APP_URL: string;
}
