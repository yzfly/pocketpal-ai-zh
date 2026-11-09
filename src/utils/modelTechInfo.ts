// 模型卡片的技术参数：给“详情”展开区和卡片摘要行用。
// 只做纯函数整理，不依赖 store，便于测试。

import {Model, ModelOrigin} from './types';

const QUANT_RE =
  /(?:^|[-_.])((?:UD-)?I?Q\d(?:_[A-Z0-9]+)*|BF16|F16|F32|FP16|MXFP4)(?=[-_.]|$)/i;

/** 从 GGUF 文件名里取量化类型，如 Q4_0、Q4_K_M、IQ4_XS、F16 */
export function getQuantization(filename?: string): string | undefined {
  if (!filename) {
    return undefined;
  }
  const base = filename
    .replace(/\.gguf$/i, '')
    .replace(/-\d{5}-of-\d{5}$/i, '');
  const m = QUANT_RE.exec(base);
  return m ? m[1].toUpperCase() : undefined;
}

/** 参数量的短写：0.8B、1.9B、9B、500M */
export function formatParamsShort(params?: number): string | undefined {
  if (!params || params <= 0) {
    return undefined;
  }
  if (params >= 1e9) {
    const v = params / 1e9;
    return `${v >= 10 ? Math.round(v) : Number(v.toFixed(1))}B`;
  }
  return `${Math.round(params / 1e6)}M`;
}

/** 中文界面按“亿”显示参数量：752M → “7.5 亿”，1.9B → “19 亿” */
export function formatParamsYi(params?: number): string | undefined {
  if (!params || params <= 0) {
    return undefined;
  }
  const v = params / 1e8;
  return `${v >= 10 ? Math.round(v) : Number(v.toFixed(1))} 亿`;
}

/** 原始模型仓库（作者/仓库名） */
export function getSourceRepo(model: Model): string | undefined {
  if (model.hfModel?.id) {
    return model.hfModel.id;
  }
  if (model.author && model.repo) {
    return `${model.author}/${model.repo}`;
  }
  return model.repo || undefined;
}

export type OriginKey = 'preset' | 'hf' | 'local' | 'remote';

export function getOriginKey(model: Model): OriginKey {
  switch (model.origin) {
    case ModelOrigin.HF:
      return 'hf';
    case ModelOrigin.LOCAL:
      return 'local';
    case ModelOrigin.REMOTE:
      return 'remote';
    default:
      return 'preset';
  }
}
