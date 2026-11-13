// 应用内更新（仅 Android）。
//
// 更新清单 update.json 同时向下面所有地址取，谁先回来用谁（版本更高的优先）：
//   1. .env 的 UPDATE_MANIFEST_URL（可选，多个用英文逗号分隔）；
//   2. 内置的 GitCode 发行版地址（国内快）和 GitHub Releases 地址（海外快）。
//      每次发版把 update.json 和 APK 作为附件传到这两处。
// 下载安装包前先探测清单里的各个地址，从最快的开始下，其余作备用。
// 清单格式：
//   {
//     "versionCode": 160,              // 必填，大于当前 versionCode 才提示
//     "versionName": "1.23.0",
//     "notes": ["更新说明1", "更新说明2"],
//     "apkUrl": "https://.../PocketWisdom-1.23.0.apk",
//     "apkUrls": ["https://备用地址/…apk"], // 可选，apkUrl 下载失败后依次尝试
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
  /** 备用下载地址，apkUrl 失败后依次尝试 */
  apkUrls?: string[];
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
const FETCH_TIMEOUT_MS = 10 * 1000;

/** GitHub Releases 上最新一版的清单（海外快，国内慢且不稳定） */
export const DEFAULT_MANIFEST_URL =
  'https://github.com/yzfly/pocketpal-ai-zh/releases/latest/download/update.json';

/** GitCode 发行版上最新一版的清单（国内快）。GitCode 的 latest 写在 tag 的位置上 */
export const GITCODE_MANIFEST_URL =
  'https://gitcode.com/langgpt/pocketpal-ai-zh/releases/download/latest/update.json';

/** 内置清单地址 */
export const BUILTIN_MANIFEST_URLS = [
  GITCODE_MANIFEST_URL,
  DEFAULT_MANIFEST_URL,
];

/** 清单地址：.env 配置的在前，其后是内置的 GitCode 与 GitHub（去重） */
export function manifestUrls(configured: string | undefined): string[] {
  const urls = (configured ?? '')
    .split(',')
    .map(u => u.trim())
    .filter(Boolean);
  return [...urls, ...BUILTIN_MANIFEST_URLS].filter(
    (u, i, all) => all.indexOf(u) === i,
  );
}

/** 安装包下载地址：apkUrl 在前，其后是 https 的备用地址（去重） */
export function apkSources(m: UpdateManifest): string[] {
  const extra = Array.isArray(m.apkUrls) ? m.apkUrls : [];
  return [m.apkUrl, ...extra].filter(
    (u, i, all) =>
      typeof u === 'string' && /^https:\/\//.test(u) && all.indexOf(u) === i,
  );
}

async function fetchManifest(url: string): Promise<UpdateManifest> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    // 地址原样请求：GitCode 的发行版地址带上任何查询参数都会返回 404，
    // 所以不能用 ?t=时间戳 的办法绕缓存，改用请求头。
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error('http ' + res.status);
    }
    const m = await res.json();
    if (!isValidManifest(m)) {
      throw new Error('invalid manifest');
    }
    return m;
  } finally {
    clearTimeout(timer);
  }
}

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

/** 第一个清单到手后，再等其他地址这么久，好挑出版本更新的那份 */
const MANIFEST_GRACE_MS = 1500;

/**
 * 同时向所有地址取清单，不排队等超时：谁先回来就用谁；
 * 短暂多等一下其余地址，若有版本更高的（某个源还没同步时）用更高的。
 */
export async function fetchBestManifest(
  urls: string[],
  fetchOne: (url: string) => Promise<UpdateManifest> = fetchManifest,
  graceMs: number = MANIFEST_GRACE_MS,
): Promise<UpdateManifest> {
  const arrived: UpdateManifest[] = [];
  const attempts = urls.map(url =>
    fetchOne(url).then(m => {
      arrived.push(m);
      return m;
    }),
  );
  // 第一个成功的；全部失败时抛错
  await new Promise<void>((resolve, reject) => {
    let failed = 0;
    attempts.forEach(p =>
      p.then(
        () => resolve(),
        () => {
          failed += 1;
          if (failed === attempts.length) {
            reject(new Error('no manifest'));
          }
        },
      ),
    );
  });
  if (arrived.length < urls.length) {
    await Promise.race([
      Promise.allSettled(attempts),
      new Promise(resolve => setTimeout(resolve, graceMs)),
    ]);
  }
  return arrived.reduce((best, m) =>
    Number(m.versionCode) > Number(best.versionCode) ? m : best,
  );
}

const PROBE_BYTES = 64 * 1024;
const PROBE_TIMEOUT_MS = 6 * 1000;

/** 取安装包开头一小段，成功即返回；用来比较各下载地址谁先连上、谁快 */
async function probeUrl(url: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {Range: `bytes=0-${PROBE_BYTES - 1}`},
      signal: controller.signal,
    });
    // 只认 206：不支持分段的地址会把整个安装包发回来，不能当作探测
    if (res.status !== 206) {
      throw new Error('http ' + res.status);
    }
    await res.arrayBuffer();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 把下载地址按“谁先取完开头一小段”重排：最快的排第一，其余保持原顺序作备用。
 * 只有一个地址或全部探测失败时，原样返回。
 */
export async function fastestFirst(
  urls: string[],
  probe: (url: string) => Promise<void> = probeUrl,
): Promise<string[]> {
  if (urls.length < 2) {
    return urls;
  }
  const winner = await new Promise<string | null>(resolve => {
    let failed = 0;
    urls.forEach(url =>
      probe(url).then(
        () => resolve(url),
        () => {
          failed += 1;
          if (failed === urls.length) {
            resolve(null);
          }
        },
      ),
    );
  });
  return winner ? [winner, ...urls.filter(u => u !== winner)] : urls;
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
    return Platform.OS === 'android' && !!NativeAppUpdate;
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
    // 更新装好后，上一次下载的安装包（约 200 MB）不再有用，启动时清掉
    NativeAppUpdate?.cleanup?.(this.currentVersionCode)?.catch(() => {});
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
      const found = await fetchBestManifest(manifestUrls(UPDATE_MANIFEST_URL));
      const newer = isNewer(found, this.currentVersionCode);
      runInAction(() => {
        this.manifest = found;
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
      // 先探测各下载地址，最快的排第一，其余作备用
      const sources = await fastestFirst(apkSources(m));
      for (let i = 0; i < sources.length; i++) {
        try {
          const id = await NativeAppUpdate.download(
            sources[i],
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
          break;
        } catch (e) {
          // 还有备用地址就换下一个，从头下载
          if (i === sources.length - 1) {
            throw e;
          }
          runInAction(() => {
            this.status = 'downloading';
            this.progress = 0;
          });
        }
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
