# ADR-0001: 以引擎门面收口 llama.rn，绞杀者模式演进推理架构

- 状态: 已采纳
- 日期: 2026-07-02
- 分支: chinese-v2

## 背景

本项目是端侧 LLM 应用，推理底座是 llama.cpp（经 `llama.rn` 的 JSI 绑定）。
当前 `llama.rn` 被 25+ 个文件直接 import，遍布 store、hooks、utils、screens、
components 各层；原生 context 的生命周期管理（加载、释放、互斥、前后台切换、
benchmark 独占）全部糊在 3400+ 行的 `ModelStore` 里。

这带来三个具体问题：

1. **升级面失控**。llama.cpp 社区迭代快（新模型架构、新量化格式的支持都来自
   上游 release），每次升级 `llama.rn` 版本，破坏性变更会波及所有直接引用点。
2. **不可替换**。未来若要引入第二后端（Apple Foundation Models、MLC、
   ExecuTorch）或替换绑定层，没有任何接缝可用。
3. **上游同步困难**。本分支基于 upstream PocketPal v1.16.0 重建并持续跟进，
   大范围重写 `ModelStore` 会让每次 rebase 都产生海量冲突。

## 决策

**采用绞杀者模式（Strangler Fig），分三阶段把推理架构收口到
`src/services/llm/` 引擎模块。本 ADR 落地第一阶段。**

### 阶段一（本次）：边界收口

- 新建 `src/services/llm/index.ts`，作为**全代码库唯一允许 import
  `llama.rn` 的位置**。
- 门面按 1:1 透传重导出现有公开面（5 个运行时符号 + 类型集），
  **不改任何行为**——本阶段的产物是边界，不是逻辑。
- 所有引用点（含测试、mock、fixtures）改为从 `services/llm` 导入。
  保留原符号名，把每处 diff 压缩到 import 语句一行，最小化与 upstream
  的冲突面。
- 在 `.eslintrc.js` 的 `no-restricted-imports` 中禁止 `src/` 内直接
  import `llama.rn`，仅 `src/services/llm/**` 豁免。**边界靠 lint 强制，
  不靠约定**（沿用本项目 automation bridge 与 Paper 组件的既有纪律模式）。
- Jest 的 `moduleNameMapper` 仍将 `llama.rn` 映射到统一 mock，门面在测试
  环境下自动透传 mock，测试无需感知。

### 阶段二（后续）：生命周期入引擎

把 `ModelStore` 中的原生 context 所有权迁入引擎模块：单例 context +
串行任务队列 + 互斥锁、前后台自动释放、内存告警主动卸载、benchmark
独占模式。`ModelStore` 退化为向引擎转发的薄壳，只保留 UI 状态。

### 阶段三（后续）：多后端接缝

在引擎内提出 `LlmBackend` 接口（load / unload / completion 流式 /
tokenize / embedding / session 存取），llama.cpp 成为其第一个实现。
模型能力（chat template、thinking 标签、多模态）继续从 GGUF 元数据
运行时探测，**永不按模型名硬编码**——保证社区新模型的 GGUF 无需改
代码即可加载。

## 备选方案

- **一步到位重写 ModelStore**：架构上最干净，但与 upstream 的 rebase
  成本不可接受，且大爆炸式重构风险高。放弃。
- **只加约定不加 lint**：边界会在三个月内被侵蚀（现状就是这么来的）。放弃。
- **types 与 engine 拆成多文件**：阶段一门面是纯透传，拆分是仪式感；
  等阶段二逻辑进来时再拆。放弃（暂缓）。

## 后果

- 正面：升级 `llama.rn` 只碰一个文件；后端替换有了接缝；lint 保证边界
  不回退；每个迁移点 diff 一行，rebase 友好。
- 负面：多一层间接（纯重导出，无运行时开销）；新增依赖时需先在门面
  登记导出，属有意为之的摩擦。

## 引用面清单（收口时点）

运行时符号：`initLlama`、`loadLlamaModelInfo`、`getBackendDevicesInfo`、
`toggleNativeLog`、`addNativeLogListener`、`BuildInfo`、`LlamaContext`（类）。

纯类型：`ContextParams`、`CompletionParams`、`ToolCall`、`TokenData`、
`JinjaFormattedChatResult`、`NativeBackendDeviceInfo`、`NativeLlamaContext`。
