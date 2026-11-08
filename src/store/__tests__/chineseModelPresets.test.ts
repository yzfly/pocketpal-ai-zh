import {
  applyChinesePreferences,
  chineseExtraCandidates,
  supersededUpstreamModels,
} from '../chineseModelPresets';

import type {
  DeviceRules,
  RuleCandidate,
  Tier,
} from '../../services/deviceRules/types';

const candidate = (model: string, hfRepo = `org/${model}`): RuleCandidate => ({
  model,
  hfRepo,
  hfFilename: `${model}.gguf`,
});

const makeRules = (
  tiers: Partial<Record<Tier, RuleCandidate[]>>,
): DeviceRules =>
  ({
    schemaVersion: '1',
    platform: 'android',
    rulesVersion: 'test',
    classifier: {} as DeviceRules['classifier'],
    tiers: {
      low: {models: tiers.low ?? []},
      mid: {models: tiers.mid ?? []},
      high: {models: tiers.high ?? []},
      flagship: {models: tiers.flagship ?? []},
    },
  }) as DeviceRules;

const ids = (rules: DeviceRules, tier: Tier) =>
  rules.tiers[tier].models.map(m => m.model);

describe('chineseModelPresets', () => {
  it('中文版推荐按既定顺序排在上游条目之前', () => {
    const rules = makeRules({flagship: [candidate('gemma-4-e4b')]});
    const out = ids(applyChinesePreferences(rules), 'flagship');
    const curated = chineseExtraCandidates.flagship.map(c => c.model);
    expect(out.slice(0, curated.length)).toEqual(curated);
    expect(out[out.length - 1]).toBe('gemma-4-e4b');
  });

  it('同一标识以中文版条目为准（Qwen3.5 换成带 MTP 头的 GGUF）', () => {
    const upstreamQwen = candidate('qwen3.5-4b', 'unsloth/Qwen3.5-4B-GGUF');
    const out = applyChinesePreferences(makeRules({high: [upstreamQwen]}));
    const entries = out.tiers.high.models.filter(m => m.model === 'qwen3.5-4b');
    expect(entries).toHaveLength(1);
    expect(entries[0].hfRepo).toBe('unsloth/Qwen3.5-4B-MTP-GGUF');
  });

  it('移除已被取代的上游条目，其余上游条目保持相对顺序', () => {
    const rules = makeRules({
      mid: [
        candidate('lfm2.5-1.2b'),
        candidate('qwen3-1.7b'),
        candidate('smollm3-3b'),
        candidate('gemma-3-1b'),
      ],
    });
    const out = ids(applyChinesePreferences(rules), 'mid');
    expect(out).not.toContain('qwen3-1.7b');
    expect(out).not.toContain('smollm3-3b');
    expect(out.indexOf('lfm2.5-1.2b')).toBeLessThan(out.indexOf('gemma-3-1b'));
  });

  it('中文版条目之间不重复，且不包含被取代的条目', () => {
    (Object.keys(chineseExtraCandidates) as Tier[]).forEach(tier => {
      const models = chineseExtraCandidates[tier].map(c => c.model);
      expect(new Set(models).size).toBe(models.length);
      models.forEach(m => expect(supersededUpstreamModels.has(m)).toBe(false));
    });
  });

  it('多模态条目都带 mmproj，且文件大小已填写', () => {
    Object.values(chineseExtraCandidates)
      .flat()
      .forEach(c => {
        expect(c.sizeBytes).toBeGreaterThan(0);
        if (c.multimodal) {
          expect(c.mmproj?.sizeBytes).toBeGreaterThan(0);
        }
      });
  });

  it('不修改入参规则对象', () => {
    const rules = makeRules({low: [candidate('gemma-3-1b')]});
    const before = rules.tiers.low.models.length;
    applyChinesePreferences(rules);
    expect(rules.tiers.low.models).toHaveLength(before);
  });
});
