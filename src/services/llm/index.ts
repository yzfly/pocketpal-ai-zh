/**
 * LLM 引擎门面 —— 全代码库唯一允许 import 'llama.rn' 的位置。
 *
 * 边界由 .eslintrc.js 的 no-restricted-imports 强制（仅本目录豁免），
 * 决策与三阶段路线图见 docs/adr/0001-llm-engine-boundary.md。
 *
 * 阶段一（已落地）：1:1 透传重导出，不改任何行为。
 * 阶段二（已落地）：LlmEngine（engine.ts）持有原生 context 的所有权
 *         与生命周期机制；策略仍在 ModelStore。见 ADR-0002。
 * 阶段三（已落地）：LlmBackend 接缝（backend.ts），llama.cpp 为首个实现。
 *
 * 新增对 llama.rn 符号的依赖时，先在此登记导出，再从 'services/llm'
 * 导入——这是有意设计的摩擦，用来保持引用面清单可审计。
 */

// ─── 引擎与后端 ──────────────────────────────────────────────
export {LlmEngine, llmEngine} from './engine';
export {llamaCppBackend} from './backend';
export type {LlmBackend, LlmSession} from './backend';

// ─── 运行时符号 ───────────────────────────────────────────────
// 原生模块的完整可执行面。除本文件外，任何代码不得直接触碰。
export {
  // 加载 GGUF 并创建原生推理 context（Metal/CPU 后端选择在参数中）
  initLlama,
  // 不加载权重，仅读取 GGUF 元数据（架构、参数量、chat template 等）
  loadLlamaModelInfo,
  // 枚举可用计算后端设备（GPU/CPU），用于设备分档与后端选择
  getBackendDevicesInfo,
  // 原生层日志开关与监听，benchmark 用其提取性能信号
  toggleNativeLog,
  addNativeLogListener,
  // llama.cpp 构建信息（版本号 + commit），展示于关于页
  BuildInfo,
  // 原生 context 句柄类。运行时实例只应由 initLlama 产生；
  // 作为值导出是为了测试侧 mock 构造与 instanceof 判断。
  LlamaContext,
} from 'llama.rn';

// ─── 类型 ────────────────────────────────────────────────────
export type {
  // context 初始化参数（n_ctx、n_gpu_layers、flash_attn 等）
  ContextParams,
  // 补全请求参数与流式 token 数据
  CompletionParams,
  TokenData,
  // 工具调用（function calling）结构
  ToolCall,
  // jinja 模板格式化结果（含 thinking 标签探测、媒体标记）
  JinjaFormattedChatResult,
  // 后端设备信息
  NativeBackendDeviceInfo,
  // 原生层 context 描述（测试 fixtures 使用）
  NativeLlamaContext,
} from 'llama.rn';
