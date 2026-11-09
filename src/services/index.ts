// 账号（Supabase Auth 邮箱 + 密码，国内经北京机中转）
export {
  accountService,
  AccountService,
  AccountError,
  describeAccountError,
  isAccountConfigured,
} from './account';
export type {AccountUser} from './account';

// 应用内更新（Android）
export {updateService} from './update';
export type {UpdateManifest, UpdateStatus} from './update';
