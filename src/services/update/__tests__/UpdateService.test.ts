jest.unmock('../../../services');

import {isNewer, isValidManifest} from '../UpdateService';

describe('update manifest helpers', () => {
  const m = {
    versionCode: 160,
    versionName: '1.23.0',
    apkUrl: 'https://x/a.apk',
  };

  it('accepts a well-formed https manifest', () => {
    expect(isValidManifest(m)).toBe(true);
  });

  it('rejects http or missing fields', () => {
    expect(isValidManifest({...m, apkUrl: 'http://x/a.apk'})).toBe(false);
    expect(isValidManifest({apkUrl: 'https://x/a.apk'})).toBe(false);
    expect(isValidManifest(null)).toBeFalsy();
  });

  it('only offers a strictly higher versionCode', () => {
    expect(isNewer(m, 159)).toBe(true);
    expect(isNewer(m, 160)).toBe(false);
    expect(isNewer(m, 161)).toBe(false);
  });
});

describe('update sources', () => {
  const {
    manifestUrls,
    apkSources,
    DEFAULT_MANIFEST_URL,
    GITCODE_MANIFEST_URL,
  } = require('../UpdateService');

  it('lists configured manifest urls first, then GitCode and GitHub', () => {
    expect(manifestUrls('')).toEqual([
      GITCODE_MANIFEST_URL,
      DEFAULT_MANIFEST_URL,
    ]);
    expect(manifestUrls(undefined)).toEqual([
      GITCODE_MANIFEST_URL,
      DEFAULT_MANIFEST_URL,
    ]);
    expect(manifestUrls(' https://a/u.json , https://b/u.json ')).toEqual([
      'https://a/u.json',
      'https://b/u.json',
      GITCODE_MANIFEST_URL,
      DEFAULT_MANIFEST_URL,
    ]);
    expect(manifestUrls(DEFAULT_MANIFEST_URL)).toEqual([
      DEFAULT_MANIFEST_URL,
      GITCODE_MANIFEST_URL,
    ]);
  });

  it('takes the first manifest to arrive, without waiting for slow sources', async () => {
    const {fetchBestManifest} = require('../UpdateService');
    const m = (versionCode: number) => ({
      versionCode,
      versionName: 'x',
      apkUrl: 'https://a/x.apk',
    });
    const never = new Promise<any>(() => {});
    const fetchOne = jest.fn((url: string) =>
      url === 'fast' ? Promise.resolve(m(5)) : never,
    );
    await expect(
      fetchBestManifest(['slow', 'fast'], fetchOne, 10),
    ).resolves.toEqual(m(5));
    expect(fetchOne).toHaveBeenCalledTimes(2);
  });

  it('prefers the newer manifest when two sources answer close together', async () => {
    const {fetchBestManifest} = require('../UpdateService');
    const m = (versionCode: number) => ({
      versionCode,
      versionName: 'x',
      apkUrl: 'https://a/x.apk',
    });
    const fetchOne = (url: string) =>
      url === 'stale'
        ? Promise.resolve(m(5))
        : new Promise<any>(r => setTimeout(() => r(m(6)), 5));
    await expect(
      fetchBestManifest(['stale', 'fresh'], fetchOne, 200),
    ).resolves.toEqual(m(6));
  });

  it('fails only when every manifest source fails', async () => {
    const {fetchBestManifest} = require('../UpdateService');
    await expect(
      fetchBestManifest(['a', 'b'], () => Promise.reject(new Error('x')), 10),
    ).rejects.toThrow('no manifest');
  });

  it('puts the fastest download link first and keeps the rest as fallbacks', async () => {
    const {fastestFirst} = require('../UpdateService');
    const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
    const probe = (url: string) =>
      url === 'b'
        ? delay(1)
        : url === 'c'
          ? delay(30)
          : Promise.reject(new Error('x'));
    await expect(fastestFirst(['a', 'b', 'c'], probe)).resolves.toEqual([
      'b',
      'a',
      'c',
    ]);
    // 全部探测失败或只有一个地址：保持原样
    await expect(
      fastestFirst(['a', 'b'], () => Promise.reject(new Error('x'))),
    ).resolves.toEqual(['a', 'b']);
    const single = jest.fn();
    await expect(fastestFirst(['a'], single)).resolves.toEqual(['a']);
    expect(single).not.toHaveBeenCalled();
  });

  it('lists apk mirrors after apkUrl, https only, de-duplicated', () => {
    expect(
      apkSources({
        versionCode: 161,
        versionName: '1.22.2',
        apkUrl: 'https://a/x.apk',
        apkUrls: ['https://b/x.apk', 'http://c/x.apk', 'https://a/x.apk'],
      }),
    ).toEqual(['https://a/x.apk', 'https://b/x.apk']);
  });
});

describe('UpdateService with fallbacks', () => {
  const GITCODE_URL =
    'https://gitcode.com/langgpt/pocketpal-ai-zh/releases/download/latest/update.json';
  const GITHUB_URL =
    'https://github.com/yzfly/pocketpal-ai-zh/releases/latest/download/update.json';
  const manifest = {
    versionCode: 999,
    versionName: '9.9.9',
    apkUrl: 'https://a/x.apk',
    apkUrls: ['https://b/x.apk'],
    sha256: 'abc',
  };
  let service: any;
  let native: any;

  beforeEach(() => {
    jest.resetModules();
    require('react-native').Platform.OS = 'android';
    native = {
      download: jest.fn(async (url: string) => url),
      getProgress: jest.fn(async (id: string) => ({
        status: id === 'https://a/x.apk' ? 'failed' : 'successful',
        downloaded: 10,
        total: 10,
      })),
      verify: jest.fn().mockResolvedValue(true),
      canInstall: jest.fn().mockResolvedValue(true),
      openInstallSettings: jest.fn(),
      install: jest.fn().mockResolvedValue(undefined),
      cleanup: jest.fn().mockResolvedValue(1),
    };
    jest.doMock('../../../specs/NativeAppUpdate', () => ({
      __esModule: true,
      default: native,
    }));
    // 默认断网：下载前的测速探测全部失败，下载地址保持清单里的顺序
    (global as any).fetch = jest.fn().mockRejectedValue(new Error('offline'));
    const {UpdateService} = require('../UpdateService');
    service = new UpdateService();
  });

  afterEach(() => {
    jest.dontMock('../../../specs/NativeAppUpdate');
  });

  it('asks every manifest source at once and uses one that answers', async () => {
    const fetchMock = jest.fn((url: string) =>
      url.includes('example.com')
        ? Promise.reject(new Error('network'))
        : Promise.resolve({ok: true, json: async () => manifest}),
    );
    (global as any).fetch = fetchMock;

    await expect(service.check()).resolves.toBe(true);
    const asked = fetchMock.mock.calls.map(c => c[0]);
    expect(asked).toHaveLength(3);
    // 地址必须原样请求：GitCode 的发行版地址带查询参数会 404
    expect(asked).toEqual([
      'https://example.com/update.json',
      GITCODE_URL,
      GITHUB_URL,
    ]);
    expect(asked[0]).toContain('example.com/update.json');
    expect(asked[1]).toContain('gitcode.com/langgpt');
    expect(asked[2]).toContain('github.com/yzfly');
    expect(service.status).toBe('available');
    expect(service.manifest.versionCode).toBe(999);
  });

  it('removes already-installed update packages on launch', async () => {
    (global as any).fetch = jest.fn().mockRejectedValue(new Error('offline'));
    await service.autoCheck();
    expect(native.cleanup).toHaveBeenCalledWith(service.currentVersionCode);
  });

  it('reports an error when no manifest url works', async () => {
    (global as any).fetch = jest
      .fn()
      .mockResolvedValue({ok: false, status: 404});
    await expect(service.check()).resolves.toBe(false);
    expect(service.status).toBe('error');
  });

  it('downloads from a mirror when apkUrl fails, then installs', async () => {
    jest.useFakeTimers();
    service.manifest = manifest;
    const done = service.startDownload();
    await jest.runAllTimersAsync();
    await done;
    jest.useRealTimers();

    expect(native.download.mock.calls.map((c: any[]) => c[0])).toEqual([
      'https://a/x.apk',
      'https://b/x.apk',
    ]);
    expect(native.verify).toHaveBeenCalledWith('https://b/x.apk', 'abc');
    expect(native.install).toHaveBeenCalledWith('https://b/x.apk');
    expect(service.status).toBe('readyToInstall');
  });

  it('starts with the download link that answers the speed probe first', async () => {
    jest.useFakeTimers();
    (global as any).fetch = jest.fn((url: string) =>
      url === 'https://b/x.apk'
        ? Promise.resolve({
            status: 206,
            arrayBuffer: async () => new ArrayBuffer(8),
          })
        : new Promise(() => {}),
    );
    native.getProgress.mockResolvedValue({
      status: 'successful',
      downloaded: 10,
      total: 10,
    });
    service.manifest = manifest;
    const done = service.startDownload();
    await jest.runAllTimersAsync();
    await done;
    jest.useRealTimers();

    expect(native.download).toHaveBeenCalledTimes(1);
    expect(native.download.mock.calls[0][0]).toBe('https://b/x.apk');
    expect(service.status).toBe('readyToInstall');
  });

  it('fails with a checksum error when every source fails verification', async () => {
    jest.useFakeTimers();
    native.getProgress.mockResolvedValue({
      status: 'successful',
      downloaded: 10,
      total: 10,
    });
    native.verify.mockResolvedValue(false);
    service.manifest = manifest;
    const done = service.startDownload();
    await jest.runAllTimersAsync();
    await done;
    jest.useRealTimers();

    expect(native.download).toHaveBeenCalledTimes(2);
    expect(native.install).not.toHaveBeenCalled();
    expect(service.status).toBe('error');
    expect(service.error).toContain('校验失败');
  });
});
