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
  } = require('../UpdateService');

  it('tries configured manifest urls first, GitHub last', () => {
    expect(manifestUrls('')).toEqual([DEFAULT_MANIFEST_URL]);
    expect(manifestUrls(undefined)).toEqual([DEFAULT_MANIFEST_URL]);
    expect(manifestUrls(' https://a/u.json , https://b/u.json ')).toEqual([
      'https://a/u.json',
      'https://b/u.json',
      DEFAULT_MANIFEST_URL,
    ]);
    expect(manifestUrls(DEFAULT_MANIFEST_URL)).toEqual([DEFAULT_MANIFEST_URL]);
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
    const {UpdateService} = require('../UpdateService');
    service = new UpdateService();
  });

  afterEach(() => {
    jest.dontMock('../../../specs/NativeAppUpdate');
  });

  it('falls back to the next manifest url when the first fails', async () => {
    const fetchMock = jest
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ok: true, json: async () => manifest});
    (global as any).fetch = fetchMock;

    await expect(service.check()).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain('example.com/update.json');
    expect(fetchMock.mock.calls[1][0]).toContain('github.com/yzfly');
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
