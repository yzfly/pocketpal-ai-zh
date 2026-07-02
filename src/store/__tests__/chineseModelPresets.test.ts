import {
  applyChinesePreferences,
  chineseExtraCandidates,
  isQwenCandidate,
} from '../chineseModelPresets';

import type {
  DeviceRules,
  RuleCandidate,
} from '../../services/deviceRules/types';

const candidate = (model: string, hfRepo = `org/${model}`): RuleCandidate => ({
  model,
  hfRepo,
  hfFilename: `${model}.gguf`,
});

const makeRules = (tiers: Record<string, RuleCandidate[]>): DeviceRules =>
  ({
    schemaVersion: '1',
    platform: 'ios',
    rulesVersion: 'test',
    classifier: {} as DeviceRules['classifier'],
    tiers: {
      low: {models: tiers.low ?? []},
      mid: {models: tiers.mid ?? []},
      high: {models: tiers.high ?? []},
      flagship: {models: tiers.flagship ?? []},
    },
  }) as DeviceRules;

describe('chineseModelPresets', () => {
  it('给每个档位注入中文版增补模型', () => {
    const rules = makeRules({low: [candidate('gemma-3-1b')]});
    const out = applyChinesePreferences(rules);
    const lowModels = out.tiers.low.models.map(m => m.model);
    for (const extra of chineseExtraCandidates.low) {
      expect(lowModels).toContain(extra.model);
    }
    expect(lowModels).toContain('gemma-3-1b');
  });

  it('按 model 标识去重，规则自带条目优先', () => {
    const remoteQwen = candidate('qwen3.5-0.8b', 'remote/qwen-repo');
    const rules = makeRules({low: [remoteQwen]});
    const out = applyChinesePreferences(rules);
    const entries = out.tiers.low.models.filter(
      m => m.model === 'qwen3.5-0.8b',
    );
    expect(entries).toHaveLength(1);
    expect(entries[0].hfRepo).toBe('remote/qwen-repo');
  });

  it('Qwen 系候选稳定置顶，非 Qwen 相对顺序不变', () => {
    const rules = makeRules({
      mid: [
        candidate('smollm3-3b'),
        candidate('qwen3-1.7b'),
        candidate('lfm2-2.6b'),
      ],
    });
    const out = applyChinesePreferences(rules);
    const models = out.tiers.mid.models;
    const firstNonQwen = models.findIndex(m => !isQwenCandidate(m));
    // 置顶段之后不应再出现 Qwen 条目
    expect(models.slice(firstNonQwen).some(isQwenCandidate)).toBe(false);
    // 非 Qwen 条目保持原相对顺序
    const nonQwen = models.filter(m => !isQwenCandidate(m)).map(m => m.model);
    expect(nonQwen.indexOf('smollm3-3b')).toBeLessThan(
      nonQwen.indexOf('lfm2-2.6b'),
    );
  });

  it('不修改入参规则对象', () => {
    const rules = makeRules({low: [candidate('gemma-3-1b')]});
    const before = rules.tiers.low.models.length;
    applyChinesePreferences(rules);
    expect(rules.tiers.low.models).toHaveLength(before);
  });

  it('isQwenCandidate 覆盖 DeepSeek R1 Qwen 蒸馏版', () => {
    expect(
      isQwenCandidate(
        candidate(
          'deepseek-r1-qwen3-8b',
          'unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF',
        ),
      ),
    ).toBe(true);
    expect(isQwenCandidate(candidate('gemma-3-1b'))).toBe(false);
  });
});
