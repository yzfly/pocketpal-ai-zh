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
