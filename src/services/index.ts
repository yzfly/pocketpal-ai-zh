// 账号（腾讯云开发 CloudBase 邮箱 + 密码）
export {
  accountService,
  AccountService,
  CloudBaseError,
  describeAccountError,
  isCloudBaseConfigured,
} from './account';
export type {CloudBaseUser, CaptchaChallenge} from './account';

// 应用内更新（Android）
export {updateService} from './update';
export type {UpdateManifest, UpdateStatus} from './update';
