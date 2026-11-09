import {
  formatCount,
  timeAgo,
  formatBytes,
  formatNumber,
  getDisplayNameFromFilename,
  getOriginalModelName,
} from '../formatters';
import {ModelOrigin} from '../types';

describe('formatBytes', () => {
  it('should format bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1024)).toBe('1.02 kB');
    expect(formatBytes(1048576)).toBe('1.05 MB');
  });
});

describe('formatNumber', () => {
  it('should format numbers correctly', () => {
    expect(formatNumber(500)).toBe('500');
    expect(formatNumber(1500)).toBe('1.5k');
    expect(formatNumber(1500000)).toBe('1.5m');
  });
});

describe('getDisplayNameFromFilename', () => {
  it('should strip .gguf extension', () => {
    expect(getDisplayNameFromFilename('model-q4_0.gguf')).toBe('model-q4_0');
  });

  it('should strip .GGUF extension (case-insensitive)', () => {
    expect(getDisplayNameFromFilename('model-q4_0.GGUF')).toBe('model-q4_0');
  });

  it('should return empty string for empty input', () => {
    expect(getDisplayNameFromFilename('')).toBe('');
  });

  it('should return filename unchanged if no .gguf extension', () => {
    expect(getDisplayNameFromFilename('model-q4_0')).toBe('model-q4_0');
  });
});

describe('getOriginalModelName', () => {
  it('should return the filename-derived name for preset models', () => {
    const presetModel = {
      id: 'some/preset/gemma-2-2b-it-Q6_K.gguf',
      filename: 'gemma-2-2b-it-Q6_K.gguf',
      origin: ModelOrigin.PRESET,
    };

    expect(getOriginalModelName(presetModel)).toBe('gemma 2 2b it');
  });

  it('should strip .gguf for local models', () => {
    const localModel = {
      id: 'local-id',
      filename: 'my-model.gguf',
      origin: ModelOrigin.LOCAL,
    };

    expect(getOriginalModelName(localModel)).toBe('my model');
  });

  it('should derive the name from the filename for any preset', () => {
    const orphanPreset = {
      id: 'unknown-preset-id',
      filename: 'orphan.gguf',
      origin: ModelOrigin.PRESET,
    };

    expect(getOriginalModelName(orphanPreset)).toBe('orphan');
  });

  it('should strip .gguf for HF models', () => {
    const hfModel = {
      id: 'hf-id',
      filename: 'hf-model.gguf',
      origin: ModelOrigin.HF,
    };

    expect(getOriginalModelName(hfModel)).toBe('hf model');
  });
});

describe('formatCount', () => {
  it('uses 万/亿 for Chinese and k/m elsewhere', () => {
    const {l10n} = require('../../locales');
    expect(formatCount(254_050, l10n.zh)).toBe('25.4 万');
    expect(formatCount(1_550_000, l10n.zh)).toBe('155 万');
    expect(formatCount(928, l10n.zh)).toBe('928');
    expect(formatCount(320_000_000, l10n.zh_Hant)).toBe('3.2 亿');
    expect(formatCount(254_050, l10n.en)).toBe('254.05k');
  });
});

describe('timeAgo in Chinese', () => {
  it('drops the space before 天/小时', () => {
    const {l10n} = require('../../locales');
    const threeDaysAgo = Date.now() - 3 * 24 * 3600 * 1000 - 1000;
    expect(timeAgo(threeDaysAgo, l10n.zh, 'short')).toBe('3天前');
    expect(timeAgo(threeDaysAgo, l10n.en, 'short')).toContain('3 days');
  });
});
