import type {
  DeviceRules,
  RuleCandidate,
  Tier,
} from '../services/deviceRules/types';

// ─── 中文版推荐模型（2026-11 更新）────────────────────────────────────
// 上游会在启动后拉取远程规则（jsdelivr: a-ghorbani/pocketpal-device-rules）
// 并以远程结果重建预设列表，直接改打包的 rules JSON 会在远程拉取成功后被
// reconcilePresets 清掉。因此中文版的推荐模型在这里定义，并在
// resolvePresetModels 入口对（打包的或远程拉取的）规则统一注入，
// 保证无论规则来源如何都存在。
//
// 选型原则（面向大陆用户）：
// 1. 中文能力优先：国内团队开源的模型排在前面（通义千问、面壁、Nanbeige、
//    小米、蚂蚁、腾讯等），其后才是上游的国际模型。
// 2. 只收 llama.cpp v0.9.0 已支持的架构，文件均为官方或知名量化者发布。
// 3. 量化：≥2B 优先 Q4_0（ARM CPU 走重排内核、Hexagon/OpenCL 加速最好），
//    1B 以下用 Q4_K_M（小模型对量化误差更敏感）。
// 4. Qwen3.5 统一使用带 MTP 头的 GGUF（unsloth/*-MTP-GGUF，只比普通版大约 4%）。
//    MTP 投机解码默认关闭：K30 Pro（骁龙 865，纯 CPU）实测开启后反而变慢
//    （2B 14.2→8.2 tok/s，4B 6.6→4.7 tok/s），因为 Qwen3.5 的线性注意力层
//    每次验证都要做状态检查点/回滚。有 GPU/NPU 加速的机型可在设置里自行开启。
// 5. 各档默认（排第一）都是口袋助手标准版（Qwen3.5 2B），保证各型号流畅不卡顿；
//    其余按能力与速度排序。K30 Pro（4 线程）实测生成速度：Ling 3.0 Tiny 20.0、
//    LFM3 1.7B 22.5、Qwen3.5 2B 16.6、MiniCPM5 2B 15.5、Spark-X2.6 4B 9.1、
//    Qwen3.5 4B 6.9、Nanbeige4.2 3B 5.5、Qwen3.5 9B 3.7 tok/s。
//
// 条目字段与 bundledDeviceRules 的 candidates 解析结果（RuleCandidate）一致；
// 文件名与字节数均按 Hugging Face 仓库核对（2026-11-08）。

// ── 通用对话（通义千问 Qwen3.5，Apache-2.0，带视觉）──────────────────
const QWEN35_0_8B: RuleCandidate = {
  model: 'qwen3.5-0.8b',
  displayName: '口袋助手 mini',
  hfRepo: 'unsloth/Qwen3.5-0.8B-MTP-GGUF',
  hfFilename: 'Qwen3.5-0.8B-Q4_K_M.gguf',
  params: 752393024,
  sizeBytes: 549698976,
  multimodal: true,
  mmproj: {
    hfRepo: 'unsloth/Qwen3.5-0.8B-MTP-GGUF',
    hfFilename: 'mmproj-F16.gguf',
    sizeBytes: 204987104,
    modalities: ['vision'],
  },
};

const QWEN35_2B: RuleCandidate = {
  model: 'qwen3.5-2b',
  displayName: '口袋助手 标准版',
  hfRepo: 'unsloth/Qwen3.5-2B-MTP-GGUF',
  hfFilename: 'Qwen3.5-2B-Q4_0.gguf',
  params: 1881825088,
  sizeBytes: 1256787360,
  multimodal: true,
  mmproj: {
    hfRepo: 'unsloth/Qwen3.5-2B-MTP-GGUF',
    hfFilename: 'mmproj-F16.gguf',
    sizeBytes: 668227136,
    modalities: ['vision'],
  },
};

const QWEN35_4B: RuleCandidate = {
  model: 'qwen3.5-4b',
  displayName: '口袋助手 专业版',
  hfRepo: 'unsloth/Qwen3.5-4B-MTP-GGUF',
  hfFilename: 'Qwen3.5-4B-Q4_0.gguf',
  params: 4205751296,
  sizeBytes: 2669209920,
  multimodal: true,
  mmproj: {
    hfRepo: 'unsloth/Qwen3.5-4B-MTP-GGUF',
    hfFilename: 'mmproj-F16.gguf',
    sizeBytes: 672423488,
    modalities: ['vision'],
  },
};

const QWEN35_9B: RuleCandidate = {
  model: 'qwen3.5-9b',
  displayName: '口袋助手 旗舰版',
  hfRepo: 'unsloth/Qwen3.5-9B-MTP-GGUF',
  hfFilename: 'Qwen3.5-9B-Q4_0.gguf',
  params: 8953803264,
  sizeBytes: 5551599968,
  minRamGb: 10,
  multimodal: true,
  mmproj: {
    hfRepo: 'unsloth/Qwen3.5-9B-MTP-GGUF',
    hfFilename: 'mmproj-F16.gguf',
    sizeBytes: 918165984,
    modalities: ['vision'],
  },
};

// ── 无拘版（huihui-ai abliterated，Apache-2.0）────────────────────────
// 基于 Qwen3.5，用 abliteration 去除了“拒绝回答”方向、能力基本不变；
// 采用 mradermacher 的 imatrix Q4_0 量化（ARM CPU 最快），视觉投影取同系列
// 非 imatrix 仓库的 f16 mmproj。内容不受安全对齐约束，界面会提示用户自行判断。
const QWEN35_2B_UNCENSORED: RuleCandidate = {
  model: 'qwen3.5-2b-abliterated',
  displayName: '口袋助手 无拘版',
  hfRepo: 'mradermacher/Huihui-Qwen3.5-2B-abliterated-i1-GGUF',
  hfFilename: 'Huihui-Qwen3.5-2B-abliterated.i1-Q4_0.gguf',
  params: 1881825088,
  sizeBytes: 1204847328,
  multimodal: true,
  mmproj: {
    hfRepo: 'mradermacher/Huihui-Qwen3.5-2B-abliterated-GGUF',
    hfFilename: 'Huihui-Qwen3.5-2B-abliterated.mmproj-f16.gguf',
    sizeBytes: 668227200,
    modalities: ['vision'],
  },
};

const QWEN35_4B_UNCENSORED: RuleCandidate = {
  model: 'qwen3.5-4b-abliterated',
  displayName: '口袋助手 无拘专业版',
  hfRepo: 'mradermacher/Huihui-Qwen3.5-4B-abliterated-i1-GGUF',
  hfFilename: 'Huihui-Qwen3.5-4B-abliterated.i1-Q4_0.gguf',
  params: 4205751296,
  sizeBytes: 2549798464,
  multimodal: true,
  mmproj: {
    hfRepo: 'mradermacher/Huihui-Qwen3.5-4B-abliterated-GGUF',
    hfFilename: 'Huihui-Qwen3.5-4B-abliterated.mmproj-f16.gguf',
    sizeBytes: 672423552,
    modalities: ['vision'],
  },
};

// ── 通用对话（其他国内团队）──────────────────────────────────────────
// 面壁智能 MiniCPM5（Apache-2.0）：同尺寸综合能力最强的一档。
const MINICPM5_1B: RuleCandidate = {
  model: 'minicpm5-1b',
  displayName: '小钢炮 mini',
  hfRepo: 'openbmb/MiniCPM5-1B-GGUF',
  hfFilename: 'MiniCPM5-1B-Q4_K_M.gguf',
  params: 1080632832,
  sizeBytes: 688065920,
};

const MINICPM5_2B: RuleCandidate = {
  model: 'minicpm5-2b',
  displayName: '小钢炮 标准版',
  hfRepo: 'openbmb/MiniCPM5-2B-GGUF',
  hfFilename: 'MiniCPM5-2B-Q4_K_M.gguf',
  params: 2516756480,
  sizeBytes: 1561318368,
};

// Nanbeige4.2 3B（Apache-2.0）：Artificial Analysis 手机端小模型榜并列第一；
// 循环层架构计算量大，速度偏慢（K30 Pro 5.5 tok/s），适合追求质量的场景。
const NANBEIGE42_3B: RuleCandidate = {
  model: 'nanbeige4.2-3b',
  displayName: '南北阁 写作版',
  hfRepo: 'bartowski/Nanbeige_Nanbeige4.2-3B-GGUF',
  hfFilename: 'Nanbeige_Nanbeige4.2-3B-Q4_0.gguf',
  params: 4169800704,
  sizeBytes: 2540524704,
};

// Spark-X2.6 4B（Apache-2.0）：端侧智能体与编程能力强化。
const SPARK_X26_4B: RuleCandidate = {
  model: 'spark-x2.6-4b',
  displayName: 'Spark 学习版',
  hfRepo: 'bartowski/Spark-X2.6-4B-GGUF',
  hfFilename: 'Spark-X2.6-4B-Q4_0.gguf',
  params: 4112079360,
  sizeBytes: 2412137088,
};

// 蚂蚁 Ling 3.0 Tiny（MIT）：MoE，总参数约 8B、每个 token 只激活约 1B，
// 速度接近 1B 模型、能力接近 8B 模型；需要 8GB 以上内存。
const LING30_TINY: RuleCandidate = {
  model: 'ling-3.0-tiny',
  displayName: '百灵 极速版',
  hfRepo: 'bartowski/Ling-3.0-tiny-GGUF',
  hfFilename: 'Ling-3.0-tiny-Q4_0.gguf',
  params: 7893392800,
  sizeBytes: 4623917248,
  minRamGb: 8,
};

// Liquid LFM3 1.7B（LFM 开放许可，支持中文）：同档最快，适合中端机日常对话。
const LFM3_1_7B: RuleCandidate = {
  model: 'lfm3-1.7b',
  displayName: 'Liquid 极速版',
  hfRepo: 'LiquidAI/LFM3-1.7B-GGUF',
  hfFilename: 'LFM3-1.7B-QAD-Q4_0.gguf',
  params: 1728801536,
  sizeBytes: 1049615680,
};

// ── 专项能力 ──────────────────────────────────────────────────────────
// 腾讯混元 Hy-MT2 1.8B（Apache-2.0）：专用翻译模型，中英及 30+ 语种互译。
const HY_MT2_1_8B: RuleCandidate = {
  model: 'hy-mt2-1.8b',
  displayName: '混元翻译',
  hfRepo: 'tencent/Hy-MT2-1.8B-GGUF',
  hfFilename: 'Hy-MT2-1.8B-Q4_K_M.gguf',
  params: 2038515712,
  sizeBytes: 1133080448,
};

// 小米 MiMo-V2.6 蒸馏 Qwen3.5-9B（MIT）：编程与智能体，SWE-Pro 远超原版。
const MIMO_V26_9B: RuleCandidate = {
  model: 'mimo-v2.6-distill-9b',
  displayName: 'MiMo 编程旗舰版',
  hfRepo: 'bartowski/MiMo-V2.6-Distill-Qwen-9B-GGUF',
  hfFilename: 'MiMo-V2.6-Distill-Qwen-9B-Q4_0.gguf',
  params: 8953803264,
  sizeBytes: 5482829344,
  minRamGb: 10,
  multimodal: true,
  mmproj: {
    hfRepo: 'bartowski/MiMo-V2.6-Distill-Qwen-9B-GGUF',
    hfFilename: 'mmproj-MiMo-V2.6-Distill-Qwen-9B-f16.gguf',
    sizeBytes: 918166048,
    modalities: ['vision'],
  },
};

// 微软 FrogNano 4B（MIT，基于 Qwen3.5-4B）：仓库级编程智能体。
const FROGNANO_4B: RuleCandidate = {
  model: 'frognano-4b',
  displayName: 'FrogNano 编程版',
  hfRepo: 'bartowski/FrogNano-4B-2609-GGUF',
  hfFilename: 'FrogNano-4B-2609-Q4_0.gguf',
  params: 4205751296,
  sizeBytes: 2715739936,
};

// 面壁 MiniCPM-V 4.7 1B（Apache-2.0）：看图、读文档、识别文字。
const MINICPM_V47_1B: RuleCandidate = {
  model: 'minicpm-v-4.7-1b',
  displayName: '小钢炮 看图版',
  hfRepo: 'openbmb/MiniCPM-V-4.7-1B-gguf',
  hfFilename: 'MiniCPM-V-4_7-1B-Q4_0.gguf',
  params: 1554476272,
  sizeBytes: 644159072,
  multimodal: true,
  mmproj: {
    hfRepo: 'openbmb/MiniCPM-V-4.7-1B-gguf',
    hfFilename: 'mmproj-model-f16.gguf',
    sizeBytes: 1110117984,
    modalities: ['vision'],
  },
};

// 各档位的中文版推荐，按推荐顺序排列（排在上游条目之前）。
// 档位含义见 bundledDeviceRules 的 _selection_policy：
//   low 4-6GB 入门机 / mid 6-8GB 中端 / high 8GB 级高端 / flagship 旗舰（8-12GB+）。
export const chineseExtraCandidates: Record<Tier, RuleCandidate[]> = {
  low: [QWEN35_0_8B, MINICPM5_1B],
  mid: [
    QWEN35_2B,
    MINICPM5_2B,
    LFM3_1_7B,
    MINICPM5_1B,
    HY_MT2_1_8B,
    MINICPM_V47_1B,
    QWEN35_2B_UNCENSORED,
  ],
  // 高端与旗舰机也默认推荐 2B：K30 Pro 实测 16 tok/s 左右，各型号都不卡顿；
  // 4B 及以上作为“更聪明但更慢”的可选项排在后面。
  high: [
    QWEN35_2B,
    QWEN35_4B,
    SPARK_X26_4B,
    MINICPM5_2B,
    NANBEIGE42_3B,
    FROGNANO_4B,
    HY_MT2_1_8B,
    MINICPM_V47_1B,
    QWEN35_2B_UNCENSORED,
    QWEN35_4B_UNCENSORED,
  ],
  flagship: [
    QWEN35_2B,
    LING30_TINY,
    QWEN35_4B,
    SPARK_X26_4B,
    QWEN35_9B,
    MIMO_V26_9B,
    NANBEIGE42_3B,
    MINICPM5_2B,
    FROGNANO_4B,
    HY_MT2_1_8B,
    MINICPM_V47_1B,
    QWEN35_2B_UNCENSORED,
    QWEN35_4B_UNCENSORED,
  ],
};

// 上游规则里已被更新版本取代、或中文能力明显偏弱的条目，从推荐列表移除
// （已下载的模型不受影响，reconcilePresets 会保留）。
export const supersededUpstreamModels = new Set<string>([
  'qwen3-0.6b', // → Qwen3.5 0.8B
  'qwen3-1.7b', // → Qwen3.5 2B
  'spark-x2.5-1.7b', // → Spark-X2.6
  'spark-x2.5-4b', // → Spark-X2.6 4B
  'gemma-3-4b', // → Gemma 4 E2B/E4B
  'smollm3-3b', // 英文为主
  'phi-4-mini-instruct', // 英文为主
  'ministral-3-3b', // 英文为主
  'lfm2-2.6b', // → LFM2.5
  'lfm2-vl-1.6b', // → Qwen3.5 / MiniCPM-V 视觉
]);

// 对任意来源（打包/远程）的规则注入中文版推荐模型并排序。
// 返回新对象，不修改入参。按 model 标识去重：同一标识以中文版条目为准
// （例如 Qwen3.5 换成带 MTP 头的 GGUF），中文版条目整体排在上游条目之前，
// 上游剩余条目保持原相对顺序。
export const applyChinesePreferences = (rules: DeviceRules): DeviceRules => {
  const tiers = {} as DeviceRules['tiers'];
  (Object.keys(rules.tiers) as Tier[]).forEach(tier => {
    const extras = chineseExtraCandidates[tier] ?? [];
    const curated = new Set(extras.map(c => c.model));
    const upstream = rules.tiers[tier].models.filter(
      c => !curated.has(c.model) && !supersededUpstreamModels.has(c.model),
    );
    tiers[tier] = {models: [...extras, ...upstream]};
  });
  return {...rules, tiers};
};

// ─── 首次引导（选 Pal 页）的三档模型 ─────────────────────────────────
// 上游在 onboarding/onboardingPals.ts 里为每个 Pal 写死了三档模型（Gemma 3 /
// LFM2.5 / lmstudio 的 Qwen3.5 Q4_K_M），这是大陆用户打开 App 后看到的第一个
// 选择。这里复用上面的推荐条目，保证引导页注册的模型 id 与推荐列表一致
// （不会重复下载同一模型的不同量化）。三档按体积递增：
//   quick ≈ 0.5-0.7 GB，balanced ≈ 1.3-1.6 GB（默认选中），best ≈ 2.4-2.7 GB。
// 9B 级模型不放进引导页：引导页不区分机型，需要 10GB+ 内存的模型留给推荐列表。
export type ChineseOnboardingPalKey =
  | 'pip'
  | 'codie'
  | 'sage'
  | 'echo'
  | 'muse';

export const chineseOnboardingModels: Record<
  ChineseOnboardingPalKey,
  {quick: RuleCandidate; balanced: RuleCandidate; best: RuleCandidate}
> = {
  // 智能聊天
  pip: {quick: MINICPM5_1B, balanced: QWEN35_2B, best: QWEN35_4B},
  // 编程：最佳档用基于 Qwen3.5-4B 的编程智能体微调
  codie: {quick: QWEN35_0_8B, balanced: QWEN35_2B, best: FROGNANO_4B},
  // 教育：面壁 MiniCPM5 + Spark-X2.6（教育场景训练）
  sage: {quick: MINICPM5_1B, balanced: MINICPM5_2B, best: SPARK_X26_4B},
  // 角色扮演
  echo: {quick: MINICPM5_1B, balanced: QWEN35_2B, best: QWEN35_4B},
  // 创意写作：最佳档用 Nanbeige4.2 3B（中文写作与对话见长，速度偏慢）
  muse: {quick: MINICPM5_1B, balanced: MINICPM5_2B, best: NANBEIGE42_3B},
};

// ─── 新手友好的一句话说明 ─────────────────────────────────────────────
// 模型卡片在名称下方显示，按 RuleCandidate.model 标识索引。只讲“适合做什么、
// 有什么要求”，不出现量化、参数量等技术细节（技术信息仍在卡片展开详情里）。
export const chineseModelTaglines: Record<string, string> = {
  'qwen3.5-0.8b': '最小最快，入门手机也能流畅聊天',
  'qwen3.5-2b': '日常聊天又快又好，大多数手机首选',
  'qwen3.5-4b': '更聪明、回答更全面，还能看图',
  'qwen3.5-9b': '最强的口袋助手，需要 12GB 内存',
  'qwen3.5-2b-abliterated': '去除内容限制，回答更直接；内容请自行判断',
  'qwen3.5-4b-abliterated': '去除内容限制的专业版；内容请自行判断',
  'minicpm5-1b': '面壁出品，小巧省电',
  'minicpm5-2b': '面壁出品，知识问答扎实',
  'nanbeige4.2-3b': '文笔好，适合写作和长对话，速度偏慢',
  'spark-x2.6-4b': '擅长讲题和学习辅导',
  'ling-3.0-tiny': '大模型的知识量，小模型的速度；需要 8GB 内存',
  'lfm3-1.7b': '生成速度最快，适合快问快答',
  'hy-mt2-1.8b': '腾讯混元出品，专业的多语言翻译',
  'mimo-v2.6-distill-9b': '小米出品，写代码和推理能力强；需要 12GB 内存',
  'frognano-4b': '擅长写代码、找 bug',
  'minicpm-v-4.7-1b': '拍照识字、看图问答',
};

const curatedById = new Map<string, RuleCandidate>();
Object.values(chineseExtraCandidates)
  .flat()
  .forEach(c => curatedById.set(`${c.hfRepo}/${c.hfFilename}`, c));

/** 按 Model.id（`作者/仓库/文件名`）查中文版推荐条目；不是推荐模型时返回 undefined。 */
export const findCuratedCandidate = (
  modelId: string,
): RuleCandidate | undefined => curatedById.get(modelId);

/** 推荐模型的一句话说明；不是推荐模型时返回 undefined。 */
export const getChineseModelTagline = (modelId: string): string | undefined => {
  const c = curatedById.get(modelId);
  return c ? chineseModelTaglines[c.model] : undefined;
};
