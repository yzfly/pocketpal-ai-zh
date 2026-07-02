/**
 * LlmEngine —— 原生推理 context 的唯一所有者（ADR-0001 阶段二）。
 *
 * 引擎持有"机制"：context 句柄、加载/释放的互斥串行队列、
 * stop-await-release 防竞态模式、活跃补全 promise 追踪、推理标志位。
 * "策略"（何时加载哪个模型、last-one-wins、前后台自动释放、
 * benchmark 独占、内存确认弹窗）仍属 ModelStore。
 *
 * 引擎不 import 任何 store —— 依赖方向永远是 store → engine。
 */
import {makeAutoObservable, observable, runInAction} from 'mobx';

import type {ContextParams, LlamaContext} from 'llama.rn';

import {llamaCppBackend, type LlmBackend} from './backend';

export class LlmEngine {
  /** 当前原生 context。undefined = 未加载。 */
  context: LlamaContext | undefined = undefined;

  inferencing: boolean = false;
  isStreaming: boolean = false;

  /**
   * 活跃补全 promise。释放 context 前必须等它结束——
   * stopCompletion() 只发停止信号不等待，补全回调若在 context
   * 释放后触发会导致原生层 SIGSEGV。
   */
  private activeCompletionPromise: Promise<unknown> | null = null;

  /** 加载/释放操作的互斥链，防止并发原生操作导致内存泄漏或崩溃 */
  private operationMutex: Promise<void> = Promise.resolve();

  constructor(readonly backend: LlmBackend = llamaCppBackend) {
    // 私有簿记字段（activeCompletionPromise、operationMutex）无法在
    // overrides 里排除（MobX 类型限制），随 makeAutoObservable 成为
    // 无观察者的 observable——与重构前 ModelStore 的同名字段先例一致
    makeAutoObservable(this, {
      backend: false,
      context: observable.ref,
    });
  }

  /**
   * 在互斥队列中串行执行一次 context 操作（加载/释放/独占接管）。
   * 队列链自身吞掉错误以保持不断裂；错误仍通过返回的 promise 抛给调用方。
   */
  runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const operationPromise = this.operationMutex.then(operation);
    this.operationMutex = operationPromise.then(
      () => {},
      () => {},
    );
    return operationPromise;
  }

  /**
   * 经后端加载模型。调用方必须已持有互斥（在 runExclusive 内）。
   *
   * 有意不在此处赋值 this.context：加载后还有 stop tokens、thinking
   * 探测、multimodal 初始化等步骤，context 对观察者可见的时机由
   * 调用方决定（保持与收口前完全一致的时序）。
   */
  loadModel(
    params: ContextParams,
    onProgress?: (progress: number) => void,
  ): Promise<LlamaContext> {
    return this.backend.loadModel(params, onProgress);
  }

  /**
   * 释放当前 context。调用方必须已持有互斥。
   *
   * Stop-Await-Release 模式：
   * 1. 发停止信号（stopCompletion 只信号不等待）
   * 2. 等活跃补全 promise 真正结束
   * 3. （按调用方策略回调判定）先释放 multimodal 子 context——
   *    回调在补全完全停止后才评估，避免对繁忙 context 发查询
   * 4. 释放主 context
   *
   * 错误向上抛（由调用方决定日志与兜底），但无论成败
   * this.context 都会被清空。
   */
  async releaseUnsafe(
    opts: {shouldReleaseMultimodal?: () => Promise<boolean>} = {},
  ): Promise<void> {
    const ctx = this.context;
    if (!ctx) {
      return;
    }

    try {
      if (
        this.inferencing ||
        this.isStreaming ||
        this.activeCompletionPromise
      ) {
        console.log('Stopping active completion before context release');

        try {
          await ctx.stopCompletion();
        } catch (stopError) {
          console.warn('Error stopping completion:', stopError);
          // Continue with release even if stop fails
        }

        if (this.activeCompletionPromise) {
          console.log('Waiting for completion promise to finish...');
          await this.activeCompletionPromise.catch(() => {});
          this.activeCompletionPromise = null;
        }

        runInAction(() => {
          this.inferencing = false;
          this.isStreaming = false;
        });
      }

      const releaseMultimodal = opts.shouldReleaseMultimodal
        ? await opts.shouldReleaseMultimodal().catch(() => false)
        : false;
      if (releaseMultimodal) {
        console.log('Releasing multimodal context first');
        try {
          await ctx.releaseMultimodal();
        } catch (error) {
          console.error('Error releasing multimodal context:', error);
        }
      }

      await ctx.release();
      console.log('released');
    } finally {
      runInAction(() => {
        this.context = undefined;
      });
    }
  }

  setContext(ctx: LlamaContext | undefined) {
    this.context = ctx;
  }

  setInferencing(value: boolean) {
    this.inferencing = value;
  }

  setIsStreaming(value: boolean) {
    this.isStreaming = value;
  }

  /** 登记活跃补全 promise，releaseUnsafe 会在释放前等它结束 */
  registerCompletionPromise(promise: Promise<unknown>) {
    this.activeCompletionPromise = promise;
  }

  clearCompletionPromise() {
    this.activeCompletionPromise = null;
  }
}

export const llmEngine = new LlmEngine();
