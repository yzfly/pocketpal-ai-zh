/**
 * LlmBackend —— 端侧推理后端接缝（ADR-0001 阶段三）。
 *
 * llama.cpp（经 llama.rn）是第一个实现。未来引入第二后端
 * （Apple Foundation Models、MLC、ExecuTorch 等）时，在此新增实现，
 * 由 LlmEngine 按模型/设备选择注入。
 */
import {getBackendDevicesInfo, initLlama, loadLlamaModelInfo} from 'llama.rn';
import type {
  ContextParams,
  LlamaContext,
  NativeBackendDeviceInfo,
} from 'llama.rn';

/**
 * 一次已加载模型的会话面：补全、分词、嵌入、KV session 存取与释放。
 *
 * 从首个实现（LlamaContext）Pick 派生——接口形状即 llama.cpp 的形状，
 * 这是有意的：在第二个后端真实存在之前，任何"更通用"的签名都是猜测。
 * 届时将此类型改为自有声明，并让 LlmBackend.loadModel 返回 LlmSession。
 */
export type LlmSession = Pick<
  LlamaContext,
  | 'completion'
  | 'stopCompletion'
  | 'tokenize'
  | 'embedding'
  | 'saveSession'
  | 'loadSession'
  | 'release'
>;

export interface LlmBackend {
  /** 后端标识，如 'llama.cpp' */
  readonly id: string;

  /**
   * 加载模型并创建原生推理 context。
   *
   * 返回类型暂为 LlamaContext 而非 LlmSession：现有消费方还依赖
   * llama.cpp 特有面（multimodal、bench、getFormattedChat）。
   * 收窄到 LlmSession 是第二后端落地时的迁移项。
   */
  loadModel(
    params: ContextParams,
    onProgress?: (progress: number) => void,
  ): Promise<LlamaContext>;

  /** 不加载权重，仅读取模型文件元数据（GGUF KV 对） */
  readModelInfo(modelPath: string): Promise<Object>;

  /** 枚举本后端可用的计算设备 */
  getDevices(): Promise<NativeBackendDeviceInfo[]>;
}

export const llamaCppBackend: LlmBackend = {
  id: 'llama.cpp',
  loadModel: (params, onProgress) => initLlama(params, onProgress),
  readModelInfo: modelPath => loadLlamaModelInfo(modelPath),
  getDevices: () => getBackendDevicesInfo(),
};
