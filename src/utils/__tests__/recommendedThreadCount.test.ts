import {Platform} from 'react-native';

import NativeHardwareInfo from '../../specs/NativeHardwareInfo';
import {getRecommendedThreadCount} from '../deviceCapabilities';

const mockCpu = (info: object) =>
  (NativeHardwareInfo.getCPUInfo as jest.Mock).mockResolvedValueOnce(info);

describe('getRecommendedThreadCount', () => {
  const originalOS = Platform.OS;
  beforeAll(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
  });
  afterAll(() => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: originalOS,
    });
  });

  it('有小核簇时只用性能核（骁龙 865：4 大核 + 4 小核 → 4）', async () => {
    mockCpu({cores: 8, perfCoreCount: 4});
    await expect(getRecommendedThreadCount()).resolves.toBe(4);
  });

  it('没有小核簇时沿用上游的 80% 规则（8 个性能核 → 6）', async () => {
    mockCpu({cores: 8, perfCoreCount: 8});
    await expect(getRecommendedThreadCount()).resolves.toBe(6);
  });

  it('读不到性能核信息时沿用上游规则', async () => {
    mockCpu({cores: 8});
    await expect(getRecommendedThreadCount()).resolves.toBe(6);
  });

  it('4 核及以下用全部核心', async () => {
    mockCpu({cores: 4, perfCoreCount: 2});
    await expect(getRecommendedThreadCount()).resolves.toBe(2);
    mockCpu({cores: 4});
    await expect(getRecommendedThreadCount()).resolves.toBe(4);
  });

  it('性能核数异常（<2）时忽略', async () => {
    mockCpu({cores: 8, perfCoreCount: 1});
    await expect(getRecommendedThreadCount()).resolves.toBe(6);
  });
});
