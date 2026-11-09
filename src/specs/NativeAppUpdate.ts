import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  /** 用系统 DownloadManager 下载安装包，返回下载 id */
  download(url: string, fileName: string, title: string): Promise<string>;
  /** 返回 {status, downloaded, total}；status: pending|running|paused|successful|failed */
  getProgress(id: string): Promise<{
    status: string;
    downloaded: number;
    total: number;
  }>;
  /** 校验 SHA-256（小写十六进制）；传空字符串跳过校验 */
  verify(id: string, sha256: string): Promise<boolean>;
  /** 是否已允许“安装未知应用” */
  canInstall(): Promise<boolean>;
  /** 打开本应用的“安装未知应用”设置页 */
  openInstallSettings(): void;
  /** 调起系统安装界面 */
  install(id: string): Promise<void>;
}

export default TurboModuleRegistry.get<Spec>('AppUpdateModule');
