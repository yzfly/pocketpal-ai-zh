import type {
  DeviceRules,
  RuleCandidate,
  Tier,
} from '../services/deviceRules/types';

// ─── 中文版增补模型 ──────────────────────────────────────────────────
// 上游会在启动后拉取远程规则（jsdelivr: a-ghorbani/pocketpal-device-rules）
// 并以远程结果重建预设列表，直接改打包的 rules JSON 会在远程拉取成功后被
// reconcilePresets 清掉。因此中文版的增补模型在这里定义，并在
// resolvePresetModels 入口对（打包的或远程拉取的）规则统一注入，
// 保证无论规则来源如何都存在。
//
// 条目字段与 bundledDeviceRules 的 candidates 解析结果（RuleCandidate）一致；
// 仓库与文件名均已在 hf-mirror 验证可用。

const QWEN35_0_8B: RuleCandidate = {
  model: 'qwen3.5-0.8b',
  displayName: 'Qwen3.5 0.8B',
  hfRepo: 'unsloth/Qwen3.5-0.8B-GGUF',
  hfFilename: 'Qwen3.5-0.8B-Q4_K_M.gguf',
  params: 752393024,
  sizeBytes: 532517120,
  multimodal: true,
  mmproj: {
    hfRepo: 'unsloth/Qwen3.5-0.8B-GGUF',
    hfFilename: 'mmproj-F16.gguf',
    sizeBytes: 204987232,
    modalities: ['vision'],
  },
};

const MINICPM5_1B: RuleCandidate = {
  model: 'minicpm5-1b',
  displayName: 'MiniCPM5 1B',
  hfRepo: 'openbmb/MiniCPM5-1B-GGUF',
  hfFilename: 'MiniCPM5-1B-Q4_K_M.gguf',
  params: 1080632832,
  sizeBytes: 688065920,
};

const QWEN35_2B: RuleCandidate = {
  model: 'qwen3.5-2b',
  displayName: 'Qwen3.5 2B',
  hfRepo: 'unsloth/Qwen3.5-2B-GGUF',
  hfFilename: 'Qwen3.5-2B-Q4_K_M.gguf',
  params: 1881825088,
  sizeBytes: 1280835840,
  multimodal: true,
  mmproj: {
    hfRepo: 'unsloth/Qwen3.5-2B-GGUF',
    hfFilename: 'mmproj-F16.gguf',
    sizeBytes: 668227264,
    modalities: ['vision'],
  },
};

const QWEN35_4B: RuleCandidate = {
  model: 'qwen3.5-4b',
  displayName: 'Qwen3.5 4B',
  hfRepo: 'unsloth/Qwen3.5-4B-GGUF',
  hfFilename: 'Qwen3.5-4B-Q4_K_M.gguf',
  params: 4205751296,
  sizeBytes: 2740937888,
  multimodal: true,
  mmproj: {
    hfRepo: 'unsloth/Qwen3.5-4B-GGUF',
    hfFilename: 'mmproj-F16.gguf',
    sizeBytes: 672423616,
    modalities: ['vision'],
  },
};

const QWEN35_9B: RuleCandidate = {
  model: 'qwen3.5-9b',
  displayName: 'Qwen3.5 9B',
  hfRepo: 'unsloth/Qwen3.5-9B-GGUF',
  hfFilename: 'Qwen3.5-9B-Q4_K_M.gguf',
  params: 8953803264,
  sizeBytes: 5680522464,
  multimodal: true,
  mmproj: {
    hfRepo: 'unsloth/Qwen3.5-9B-GGUF',
    hfFilename: 'mmproj-F16.gguf',
    sizeBytes: 918166080,
    modalities: ['vision'],
  },
};

const DEEPSEEK_R1_8B: RuleCandidate = {
  model: 'deepseek-r1-qwen3-8b',
  displayName: 'DeepSeek R1 8B',
  hfRepo: 'unsloth/DeepSeek-R1-0528-Qwen3-8B-GGUF',
  hfFilename: 'DeepSeek-R1-0528-Qwen3-8B-Q4_K_M.gguf',
  params: 8190735360,
  sizeBytes: 5027785216,
};

export const chineseExtraCandidates: Record<Tier, RuleCandidate[]> = {
  low: [QWEN35_0_8B, MINICPM5_1B],
  mid: [QWEN35_2B, MINICPM5_1B],
  high: [QWEN35_4B],
  flagship: [QWEN35_9B, DEEPSEEK_R1_8B, QWEN35_4B],
};

// 识别 Qwen 系候选（按稳定标识与仓库名双重匹配），用于推荐列表置顶。
// DeepSeek R1 蒸馏版仓库名含 Qwen3，同样命中——中文强模型置顶，符合预期。
export const isQwenCandidate = (candidate: RuleCandidate): boolean =>
  /qwen/i.test(candidate.model) || /qwen/i.test(candidate.hfRepo);

// 对任意来源（打包/远程）的规则注入中文版增补模型并做 Qwen 优先排序。
// 返回新对象，不修改入参。按 model 标识去重，规则自带的条目优先。
export const applyChinesePreferences = (rules: DeviceRules): DeviceRules => {
  const tiers = {} as DeviceRules['tiers'];
  (Object.keys(rules.tiers) as Tier[]).forEach(tier => {
    const existing = rules.tiers[tier].models;
    const seen = new Set(existing.map(c => c.model));
    const extras = (chineseExtraCandidates[tier] ?? []).filter(
      c => !seen.has(c.model),
    );
    const merged = [...existing, ...extras].sort(
      (a, b) => Number(isQwenCandidate(b)) - Number(isQwenCandidate(a)),
    );
    tiers[tier] = {models: merged};
  });
  return {...rules, tiers};
};
