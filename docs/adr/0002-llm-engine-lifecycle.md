# ADR-0002: LlmEngine 接管 context 生命周期，LlmBackend 成为后端接缝

- 状态: 已采纳
- 日期: 2026-07-02
- 前置: ADR-0001（阶段一已落地）
- 分支: chinese-v2

## 背景

ADR-0001 阶段一收口了 import 边界，但原生 context 的生命周期机制
仍散落在 `ModelStore` 里：互斥串行链、stop-await-release 防竞态、
活跃补全 promise 追踪、multimodal 子 context 释放。本 ADR 落地
阶段二（生命周期入引擎）与阶段三（后端接缝）。

## 决策

### 机制与策略分层

**引擎持有机制，store 持有策略** ——这是本次重构的唯一分界线：

| 归属 | 内容 |
|------|------|
| `LlmEngine`（机制） | context 句柄所有权、`runExclusive` 互斥串行队列、stop-await-release、活跃补全 promise、`inferencing`/`isStreaming` 标志位、经 backend 加载 |
| `ModelStore`（策略） | 何时加载哪个模型、last-one-wins、内存确认弹窗、前后台自动释放、benchmark 独占、multimodal 配置解析、模型列表与下载 |

依赖方向永远是 store → engine；引擎不 import 任何 store。

### 兼容层：访问器对转发

`modelStore.context` / `inferencing` / `isStreaming` 保留为
getter/setter 访问器对，读写都转发引擎。理由：

- 20+ 个消费方（screens/hooks/utils）与 50+ 处测试直接读写这些
  属性，改签名会产生海量 diff，违背绞杀者纪律；
- MobX 把访问器对推断为带 setter 的 computed，响应式链
  （UI 观察 → store computed → engine observable）自然成立。

### 时序保真原则

三处刻意保持与重构前逐指令一致的行为：

1. `engine.loadModel` **不**自行赋值 `context`——加载后还有 stop
   tokens、thinking 探测、multimodal 初始化，context 对观察者可见
   的时机由 store 决定（原时序）。
2. multimodal 释放判定以**回调**传入 `releaseUnsafe`，引擎在补全
   完全停止后才评估——判定本身是策略（缓存标志 + `isContextLoading`
   防护，模型切换期间会刻意跳过 mm 释放），归 store。
3. `runExclusive` 的互斥链吞错误保链不断裂、错误仍抛给调用方——
   与原 `contextOperationMutex` 语义一致。

### LlmBackend 接缝（阶段三）

`backend.ts` 定义 `LlmBackend`（loadModel / readModelInfo /
getDevices），`llamaCppBackend` 为首个实现，经构造注入 `LlmEngine`。

`LlmSession` 会话面类型从 `LlamaContext` 以 `Pick` 派生（completion、
stopCompletion、tokenize、embedding、saveSession、loadSession、
release）。**接口形状即 llama.cpp 的形状，这是有意的**：第二个后端
真实存在之前，任何"更通用"的签名都是猜测。`loadModel` 暂返回
`LlamaContext` 而非 `LlmSession`，因为现有消费方依赖 llama.cpp
特有面（multimodal、bench、getFormattedChat）；收窄类型是第二
后端落地时的迁移项，不是现在的仪式。

## 备选方案

- **把 completion 执行也搬进引擎**：现有 `CompletionEngine` 接口
  （本地/远程双实现）已承担补全抽象，引擎只需为释放安全追踪
  promise。搬动会与该接口职责重叠。放弃。
- **凭空设计"通用" LlmSession 签名**：无第二实现可校验，必然返工。
  放弃。
- **改掉所有消费方对 `modelStore.context` 的直接引用**：diff 巨大、
  rebase 灾难，且访问器对已达成同等解耦。放弃。

## 后果

- 正面：生命周期竞态逻辑集中在一个 150 行的引擎类里可单独推演；
  benchmark 独占、双后端、无 store 的 headless 推理都有了挂点；
  `ModelStore` 不再持有任何原生机制。
- 负面：store 与 engine 的标志位是同一份状态的两个名字（访问器
  转发），读代码时需要知道所有权在引擎——注释与 ADR 负责传达。
- 中性：multimodal 释放后 store 侧状态清理时机从"mm 释放成功后
  立即"变为"整个释放完成后的 finally"，最终状态一致，中间窗口
  毫秒级且无观察者依赖。
