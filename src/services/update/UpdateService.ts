// 应用内更新（仅 Android）。
//
// 更新清单 update.json 放在国内可直连的地址（建议 CloudBase 静态网站托管），
// 地址来自 .env 的 UPDATE_MANIFEST_URL；没配置时整个功能关闭。清单格式：
//   {
//     "versionCode": 160,              // 必填，大于当前 versionCode 才提示
//     "versionName": "1.23.0",
//     "notes": ["更新说明1", "更新说明2"],
//     "apkUrl": "https://.../PocketWisdom-1.23.0.apk",
//     "sha256": "…",                   // 可选，下载后校验
//     "size": 220000000,               // 可选，字节
//     "minVersionCode": 150            // 可选，低于它的版本强制更新
//   }
// 用 scripts/make-update-manifest.js 从构建出的 APK 生成。

import {Platform} from 'react-native';
import {makeAutoObservable, runInAction} from 'mobx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import {UPDATE_MANIFEST_URL} from '@env';

import NativeAppUpdate from '../../specs/NativeAppUpdate';

export interface UpdateManifest {
  versionCode: number;
  versionName: string;
  notes?: string[];
  apkUrl: string;
  sha256?: string;
  size?: number;
  minVersionCode?: number;
}

export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'upToDate'
  | 'downloading'
  | 'verifying'
  | 'readyToInstall'
  | 'needPermission'
  | 'error';

const SKIP_KEY = 'update.skippedVersionCode';
const LAST_CHECK_KEY = 'update.lastCheckAt';
const AUTO_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

export function isNewer(manifest: UpdateManifest, currentCode: number) {
  return Number(manifest.versionCode) > currentCode;
}

export function isValidManifest(m: any): m is UpdateManifest {
  return (
    m &&
    Number.isInteger(Number(m.versionCode)) &&
    typeof m.apkUrl === 'string' &&
    /^https:\/\//.test(m.apkUrl)
  );
}

export class UpdateService {
  status: UpdateStatus = 'idle';
  manifest: UpdateManifest | null = null;
  /** 0–1 */
  progress = 0;
  error: string | null = null;
  /** 弹窗是否显示 */
  dialogVisible = false;

  private downloadId: string | null = null;

  constructor() {
    makeAutoObservable<UpdateService, 'downloadId'>(this, {downloadId: false});
  }

  get supported(): boolean {
    return (
      Platform.OS === 'android' && !!NativeAppUpdate && !!UPDATE_MANIFEST_URL
    );
  }

  get currentVersionCode(): number {
    return Number(DeviceInfo.getBuildNumber()) || 0;
  }

  get forced(): boolean {
    const min = this.manifest?.minVersionCode;
    return !!min && this.currentVersionCode < min;
  }

  /** 启动时调用：间隔内只查一次，跳过用户选择“忽略”的版本 */
  async autoCheck(): Promise<void> {
    if (!this.supported) {
      return;
    }
    try {
      const last = Number(await AsyncStorage.getItem(LAST_CHECK_KEY)) || 0;
      if (Date.now() - last < AUTO_CHECK_INTERVAL_MS) {
        return;
      }
      await AsyncStorage.setItem(LAST_CHECK_KEY, String(Date.now()));
    } catch {}
    const found = await this.check();
    if (!found || !this.manifest) {
      return;
    }
    let skipped = 0;
    try {
      skipped = Number(await AsyncStorage.getItem(SKIP_KEY)) || 0;
    } catch {}
    if (this.forced || skipped !== Number(this.manifest.versionCode)) {
      runInAction(() => {
        this.dialogVisible = true;
      });
    }
  }

  /** 手动检查（“关于”页）；返回是否有新版本 */
  async check(): Promise<boolean> {
    if (!this.supported) {
      return false;
    }
    runInAction(() => {
      this.status = 'checking';
      this.error = null;
    });
    try {
      const sep = UPDATE_MANIFEST_URL.includes('?') ? '&' : '?';
      const res = await fetch(`${UPDATE_MANIFEST_URL}${sep}t=${Date.now()}`, {
        headers: {Accept: 'application/json'},
      });
      if (!res.ok) {
        throw new Error('http ' + res.status);
      }
      const m = await res.json();
      if (!isValidManifest(m)) {
        throw new Error('invalid manifest');
      }
      const newer = isNewer(m, this.currentVersionCode);
      runInAction(() => {
        this.manifest = m;
        this.status = newer ? 'available' : 'upToDate';
      });
      return newer;
    } catch {
      runInAction(() => {
        this.status = 'error';
        this.error = '检查更新失败，请检查网络';
      });
      return false;
    }
  }

  showDialog() {
    this.dialogVisible = true;
  }

  async dismiss(skipThisVersion = false) {
    if (this.forced) {
      return;
    }
    this.dialogVisible = false;
    if (skipThisVersion && this.manifest) {
      try {
        await AsyncStorage.setItem(SKIP_KEY, String(this.manifest.versionCode));
      } catch {}
    }
  }

  async startDownload(): Promise<void> {
    const m = this.manifest;
    if (!m || !NativeAppUpdate) {
      return;
    }
    if (this.status === 'downloading' || this.status === 'verifying') {
      return;
    }
    runInAction(() => {
      this.status = 'downloading';
      this.progress = 0;
      this.error = null;
    });
    try {
      const id = await NativeAppUpdate.download(
        m.apkUrl,
        `PocketWisdom-${m.versionCode}.apk`,
        `口袋AI ${m.versionName || ''} 更新`,
      );
      this.downloadId = id;
      await this.waitForDownload(id);
      runInAction(() => {
        this.status = 'verifying';
      });
      const ok = await NativeAppUpdate.verify(id, m.sha256 ?? '');
      if (!ok) {
        throw new Error('checksum');
      }
      runInAction(() => {
        this.status = 'readyToInstall';
        this.progress = 1;
      });
      await this.install();
    } catch (e: any) {
      runInAction(() => {
        this.status = 'error';
        this.error =
          e?.message === 'checksum'
            ? '安装包校验失败，请重新下载'
            : '下载失败，请检查网络后重试';
      });
    }
  }

  private async waitForDownload(id: string): Promise<void> {
    for (;;) {
      await new Promise(r => setTimeout(r, 800));
      const p = await NativeAppUpdate!.getProgress(id);
      runInAction(() => {
        if (p.total > 0) {
          this.progress = Math.min(1, p.downloaded / p.total);
        }
      });
      if (p.status === 'successful') {
        return;
      }
      if (p.status === 'failed') {
        throw new Error('download');
      }
    }
  }

  /** 下载完成后调用；没有“安装未知应用”权限时先引导去设置 */
  async install(): Promise<void> {
    if (!this.downloadId || !NativeAppUpdate) {
      return;
    }
    const allowed = await NativeAppUpdate.canInstall();
    if (!allowed) {
      runInAction(() => {
        this.status = 'needPermission';
      });
      NativeAppUpdate.openInstallSettings();
      return;
    }
    runInAction(() => {
      this.status = 'readyToInstall';
    });
    await NativeAppUpdate.install(this.downloadId);
  }
}

export const updateService = new UpdateService();
