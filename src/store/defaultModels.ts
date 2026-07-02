import {Model, ModelOrigin} from '../utils/types';
import {chatTemplates, defaultCompletionParams} from '../utils/chat';
import {Platform} from 'react-native';

export const MODEL_LIST_VERSION = 11;

const iosOnlyModels: Model[] = [];

const androidOnlyModels: Model[] = [];

const crossPlatformModels: Model[] = [
  // -------- LangGPT ------
    {
      id: 'unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf',
      author: 'unsloth',
      name: "DeepSeek R1 深度思考（推荐）",
      type: 'DeepSeek 推理模型',
      description: "轻巧高效，适合绝大数机型",
      size: 1117320576, // 1.12GB
      params: 1500000000, // 1.5B 参数
      isDownloaded: false,
      downloadUrl: 'https://www.modelscope.cn/models/unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/master/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf',
      hfUrl: 'https://www.modelscope.cn/models/unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF',
      progress: 0,
      filename: 'DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf',
      isLocal: false,
      origin: ModelOrigin.PRESET,
      defaultChatTemplate: {...chatTemplates.deepseek},
      chatTemplate: chatTemplates.deepseek,
      defaultCompletionSettings: {
        ...defaultCompletionParams,
        n_predict: 2048,
        temperature: 0.7,
        penalty_repeat: 1.0,
        stop: ['</s>', '<|im_end|>'],
      },
      completionSettings: {
        ...defaultCompletionParams,
        n_predict: 2048,
        temperature: 0.7,
        penalty_repeat: 1.0,
        stop: ['</s>', '<|im_end|>'],
      },
      hfModelFile: {
        rfilename: 'DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf',
        url: 'https://www.modelscope.cn/models/unsloth/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/resolve/master/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_M.gguf',
        size: 1117320576,
        oid: '', // 需要实际值
        lfs: {
          oid: '', // 需要实际的哈希值
          size: 1117320576,
          pointerSize: 135,
        },
        canFitInStorage: true,
      }
    },
    {
      id: 'mradermacher/DeepSeek-R1-Distill-Qwen-1.5B-uncensored-GGUF/DeepSeek-R1-Distill-Qwen-1.5B-uncensored.Q4_K_M.gguf',
      author: 'mradermacher',
      name: "DeepSeek 深度思考无拘版",
      type: 'DeepSeek 推理模型',
      description: "放飞自我，无拘无束的无限制版本",
      size: 1117320576, // 1.12GB 转换为字节（参考标准版的大小）
      params: 1500000000, // 1.5B 参数转换为具体数值
      isDownloaded: false,
      downloadUrl: 'https://www.modelscope.cn/models/LangGPT/DeepSeek-R1-Distill-Qwen-1.5B-uncensored-GGUF/resolve/master/DeepSeek-R1-Distill-Qwen-1.5B-uncensored.Q4_K_M.gguf',
      hfUrl: 'https://www.modelscope.cn/models/LangGPT/DeepSeek-R1-Distill-Qwen-1.5B-uncensored-GGUF',
      progress: 0,
      filename: 'DeepSeek-R1-Distill-Qwen-1.5B-uncensored.Q4_K_M.gguf',
      isLocal: false,
      origin: ModelOrigin.PRESET,
      defaultChatTemplate: {...chatTemplates.deepseek},
      chatTemplate: chatTemplates.deepseek,
      defaultCompletionSettings: {
        ...defaultCompletionParams,
        n_predict: 2048,
        temperature: 0.7,
        penalty_repeat: 1.0,
        stop: ['</s>', '<|im_end|>'],
      },
      completionSettings: {
        ...defaultCompletionParams,
        n_predict: 2048,
        temperature: 0.7,
        penalty_repeat: 1.0,
        stop: ['</s>', '<|im_end|>'],
      },
      hfModelFile: {
        rfilename: 'DeepSeek-R1-Distill-Qwen-1.5B-uncensored.Q4_K_M.gguf',
        url: 'https://www.modelscope.cn/models/LangGPT/DeepSeek-R1-Distill-Qwen-1.5B-uncensored-GGUF/resolve/master/DeepSeek-R1-Distill-Qwen-1.5B-uncensored.Q4_K_M.gguf',
        size: 1117320576,
        oid: '', // 需要实际值
        lfs: {
          oid: '', // 需要实际的哈希值
          size: 1117320576,
          pointerSize: 135,
        },
        canFitInStorage: true,
      }
    },
    {
     id: 'unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF/DeepSeek-R1-Distill-Qwen-7B-Q2_K.gguf',
     author: 'unsloth',
     name: "DeepSeek 深度思考专业版",
     type: 'DeepSeek 推理模型',
     description: "高性能专业强大的智能助理",
     size: 3015939808, // 3.02GB 转换为字节
     params: 7000000000, // 7B 参数转换为具体数值
     isDownloaded: false,
     downloadUrl: 'https://www.modelscope.cn/models/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF/resolve/master/DeepSeek-R1-Distill-Qwen-7B-Q2_K.gguf',
     hfUrl: 'https://www.modelscope.cn/models/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF',
     progress: 0,
     filename: 'DeepSeek-R1-Distill-Qwen-7B-Q2_K.gguf',
     isLocal: false,
     origin: ModelOrigin.PRESET,
     defaultChatTemplate: {...chatTemplates.deepseek},
     chatTemplate: chatTemplates.deepseek,
     defaultCompletionSettings: {
       ...defaultCompletionParams,
       n_predict: 2048,
       temperature: 0.7,
       penalty_repeat: 1.0,
       stop: ['</s>', '<|im_end|>'],
     },
     completionSettings: {
       ...defaultCompletionParams,
       n_predict: 2048,
       temperature: 0.7,
       penalty_repeat: 1.0,
       stop: ['</s>', '<|im_end|>'],
     },
     hfModelFile: {
       rfilename: 'DeepSeek-R1-Distill-Qwen-7B-Q2_K.gguf',
       url: 'https://www.modelscope.cn/models/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF/resolve/master/DeepSeek-R1-Distill-Qwen-7B-Q2_K.gguf',
       size: 3015939808,
       oid: '', // 需要实际值
       lfs: {
         oid: '', // 需要实际的哈希值
         size: 3015939808,
         pointerSize: 135,
       },
       canFitInStorage: true,
     }
    },
    {
     id: 'unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF/DeepSeek-R1-Distill-Qwen-7B-Q4_K_M.gguf',
     author: 'unsloth',
     name: "DeepSeek 深度思考旗舰版",
     type: 'DeepSeek 推理模型',
     description: "旗舰配置，快速精准地完成各类任务",
     size: 4683073248, // 4.68GB 转换为字节
     params: 7000000000, // 7B 参数转换为具体数值
     isDownloaded: false,
     downloadUrl: 'https://www.modelscope.cn/models/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF/resolve/master/DeepSeek-R1-Distill-Qwen-7B-Q4_K_M.gguf',
     hfUrl: 'https://www.modelscope.cn/models/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF',
     progress: 0,
     filename: 'DeepSeek-R1-Distill-Qwen-7B-Q4_K_M.gguf',
     isLocal: false,
     origin: ModelOrigin.PRESET,
     defaultChatTemplate: {...chatTemplates.deepseek},
     chatTemplate: chatTemplates.deepseek,
     defaultCompletionSettings: {
       ...defaultCompletionParams,
       n_predict: 2048,
       temperature: 0.7,
       penalty_repeat: 1.0,
       stop: ['</s>', '<|im_end|>'],
     },
     completionSettings: {
       ...defaultCompletionParams,
       n_predict: 2048,
       temperature: 0.7,
       penalty_repeat: 1.0,
       stop: ['</s>', '<|im_end|>'],
     },
     hfModelFile: {
       rfilename: 'DeepSeek-R1-Distill-Qwen-7B-Q4_K_M.gguf',
       url: 'https://www.modelscope.cn/models/unsloth/DeepSeek-R1-Distill-Qwen-7B-GGUF/resolve/master/DeepSeek-R1-Distill-Qwen-7B-Q4_K_M.gguf',
       size: 4683073248,
       oid: '', // 需要实际值
       lfs: {
         oid: '', // 需要实际的哈希值
         size: 4683073248,
         pointerSize: 135,
       },
       canFitInStorage: true,
     }
    },
    {
      id: 'unsloth/DeepSeek-R1-Distill-Qwen-14B-GGUF/DeepSeek-R1-Distill-Qwen-14B-Q2_K.gguf',
      author: 'unsloth',
      name: "DeepSeek 深度思考至尊版",
      type: 'DeepSeek 推理模型',
      description: "14B顶配模型，适合高性能机型",
      size: 5775743744, // 5.77GB 转换为字节
      params: 14000000000, // 14B 参数转换为具体数值
      isDownloaded: false,
      downloadUrl: 'https://www.modelscope.cn/models/unsloth/DeepSeek-R1-Distill-Qwen-14B-GGUF/resolve/master/DeepSeek-R1-Distill-Qwen-14B-Q2_K.gguf',
      hfUrl: 'https://www.modelscope.cn/models/unsloth/DeepSeek-R1-Distill-Qwen-14B-GGUF',
      progress: 0,
      filename: 'DeepSeek-R1-Distill-Qwen-14B-Q2_K.gguf',
      isLocal: false,
      origin: ModelOrigin.PRESET,
      defaultChatTemplate: {...chatTemplates.deepseek},
      chatTemplate: chatTemplates.deepseek,
      defaultCompletionSettings: {
        ...defaultCompletionParams,
        n_predict: 2048,
        temperature: 0.7,
        penalty_repeat: 1.0,
        stop: ['</s>', '<|im_end|>'],
      },
      completionSettings: {
        ...defaultCompletionParams,
        n_predict: 2048,
        temperature: 0.7,
        penalty_repeat: 1.0,
        stop: ['</s>', '<|im_end|>'],
      },
      hfModelFile: {
        rfilename: 'DeepSeek-R1-Distill-Qwen-14B-Q2_K.gguf',
        url: 'https://www.modelscope.cn/models/unsloth/DeepSeek-R1-Distill-Qwen-14B-GGUF/resolve/master/DeepSeek-R1-Distill-Qwen-14B-Q2_K.gguf',
        size: 5775743744,
        oid: '', // 需要实际值
        lfs: {
          oid: '', // 需要实际的哈希值
          size: 5775743744,
          pointerSize: 135,
        },
        canFitInStorage: true,
      }
    },
  {
    id: 'qwen/qwen2.5-0.5b-instruct-GGUF/qwen2.5-0.5b-instruct-q2_k.gguf',
    author: 'qwen',
    name: "口袋助手 mini",
    type: 'LangGPT 优选模型',
    description: "最小最快的模型，适合旧手机", // 合并 detail 内容
    size: 415180000,  // 0.4GB 转换为字节
    params: 500000000, // 0.5B 转换为精确参数数量
    isDownloaded: false,
    downloadUrl:
      'https://www.modelscope.cn/models/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/master/qwen2.5-0.5b-instruct-q2_k.gguf',
    hfUrl: 'https://www.modelscope.cn/models/Qwen/Qwen2.5-0.5B-Instruct-GGUF',
    progress: 0,
    filename: 'qwen2.5-1.5b-instruct-q2_k.gguf', // 调整为实际文件名
    isLocal: false,
    origin: ModelOrigin.PRESET, // 添加模型来源标识
    defaultChatTemplate: {...chatTemplates.langgpt},
    chatTemplate: chatTemplates.langgpt,
    defaultCompletionSettings: {
      ...defaultCompletionParams,
      n_predict: 2048,
      temperature: 0.5,
      penalty_repeat: 1.0,  // 添加 penalty_repeat 参数
      stop: ['<|im_end|>'],
    },
    completionSettings: {
      ...defaultCompletionParams,
      n_predict: 2048,
      temperature: 0.5,
      penalty_repeat: 1.0,  // 添加 penalty_repeat 参数
      stop: ['<|im_end|>'],
    },
    hfModelFile: {          // 添加文件验证信息
      rfilename: 'qwen2.5-0.5b-instruct-q2_k.gguf',
      url: 'https://www.modelscope.cn/models/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/master/qwen2.5-0.5b-instruct-q2_k.gguf',
      size: 415180000,
      oid: '', // 需要实际的值
      lfs: {
        oid: '', // 需要实际的哈希值
        size: 415180000,
        pointerSize: 135,
      },
      canFitInStorage: true,
    },
    // 移除的字段：
    // detail
    // tags
  },
  {
    id: 'qwen/qwen2.5-1.5b-instruct-GGUF/qwen2.5-1.5b-instruct-q5_k_m.gguf',
    author: 'qwen',
    name: "口袋助手 标准版（推荐）",
    type: 'LangGPT 优选模型',
    description: "轻松胜任日常事务", // 合并原 detail
    size: 1285494304, // 1.29GB 转换为字节
    params: 1540000000, // 1.54B 转换为具体参数数
    isDownloaded: false,
    downloadUrl: 'https://www.modelscope.cn/models/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/master/qwen2.5-1.5b-instruct-q5_k_m.gguf?download=true',
    hfUrl: 'https://modelscope.cn/models/Qwen/Qwen2.5-1.5B-Instruct-GGUF',
    progress: 0,
    filename: 'qwen2.5-1.5b-instruct-q5_k_m.gguf',
    isLocal: false,
    origin: ModelOrigin.PRESET,
    defaultChatTemplate: {...chatTemplates.langgpt},
    chatTemplate: chatTemplates.langgpt,
    defaultCompletionSettings: {
      ...defaultCompletionParams,
      n_predict: 2048,
      temperature: 0.5,
      penalty_repeat: 1.0,
      stop: ['<|im_end|>'],
    },
    completionSettings: {
      ...defaultCompletionParams,
      n_predict: 2048,
      temperature: 0.5,
      penalty_repeat: 1.0,
      stop: ['<|im_end|>'],
    },
    hfModelFile: {
      rfilename: 'qwen2.5-1.5b-instruct-q5_k_m.gguf',
      url: 'https://www.modelscope.cn/models/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/master/qwen2.5-1.5b-instruct-q5_k_m.gguf?download=true',
      size: 1285494304,
      oid: '',
      lfs: {
        oid: '',
        size: 1285494304,
        pointerSize: 135,
      },
      canFitInStorage: true,
    }
  },
  {
    id: 'qwen/qwen2.5-3b-instruct-GGUF/qwen2.5-3b-instruct-q5_k_m.gguf',
    author: 'qwen',
    name: "口袋助手 专业版",
    type: 'LangGPT 优选模型',
    description: "适合处理专业级任务",
    size: 2438740384, // 2.44GB 转换为字节
    params: 3397103616, // 3.09B 转换为具体参数数
    isDownloaded: false,
    downloadUrl: 'https://www.modelscope.cn/models/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/master/qwen2.5-3b-instruct-q5_k_m.gguf?download=true',
    hfUrl: 'https://www.modelscope.cn/models/Qwen/Qwen2.5-3B-Instruct-GGUF',
    progress: 0,
    filename: 'qwen2.5-3b-instruct-q5_k_m.gguf',
    isLocal: false,
    origin: ModelOrigin.PRESET,
    defaultChatTemplate: {...chatTemplates.langgpt},
    chatTemplate: chatTemplates.langgpt,
    defaultCompletionSettings: {
      ...defaultCompletionParams,
      n_predict: 2048,
      temperature: 0.5,
      penalty_repeat: 1.0,
      stop: ['<|im_end|>'],
    },
    completionSettings: {
      ...defaultCompletionParams,
      n_predict: 2048,
      temperature: 0.5,
      penalty_repeat: 1.0,
      stop: ['<|im_end|>'],
    },
    hfModelFile: {
      rfilename: 'qwen2.5-3b-instruct-q5_k_m.gguf',
      url: 'https://www.modelscope.cn/models/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/master/qwen2.5-3b-instruct-q5_k_m.gguf?download=true',
      size: 2438740384,
      oid: '',
      lfs: {
        oid: '',
        size: 2438740384,
        pointerSize: 135,
      },
      canFitInStorage: true,
    }
  },
  {
    id: 'qwen/qwen2.5-7b-instruct-GGUF/qwen2.5-7b-instruct-q5_k_m.gguf',
    author: 'qwen',
    name: "口袋助手 旗舰版",
    type: 'LangGPT 优选模型',
    description: "最强大旗舰型号，适合高性能机型",
    size: 5444831232, // 5.44GB 转换为字节
    params: 7610000000, // 7.61B 转换为具体参数数
    isDownloaded: false,
    downloadUrl: 'https://www.modelscope.cn/models/Qwen/Qwen2.5-7B-Instruct-GGUF/resolve/master/qwen2.5-7b-instruct-q5_k_m.gguf?download=true',
    hfUrl: 'https://www.modelscope.cn/models/Qwen/Qwen2.5-3B-Instruct-GGUF',
    progress: 0,
    filename: 'qwen2.5-7b-instruct-q5_k_m.gguf',
    isLocal: false,
    origin: ModelOrigin.PRESET,
    defaultChatTemplate: {...chatTemplates.langgpt},
    chatTemplate: chatTemplates.langgpt,
    defaultCompletionSettings: {
      ...defaultCompletionParams,
      n_predict: 2048,
      temperature: 0.5,
      penalty_repeat: 1.0,
      stop: ['<|im_end|>'],
    },
    completionSettings: {
      ...defaultCompletionParams,
      n_predict: 2048,
      temperature: 0.5,
      penalty_repeat: 1.0,
      stop: ['<|im_end|>'],
    },
    hfModelFile: {
      rfilename: 'qwen2.5-7b-instruct-q5_k_m.gguf',
      url: 'https://www.modelscope.cn/models/Qwen/Qwen2.5-7B-Instruct-GGUF/resolve/master/qwen2.5-7b-instruct-q5_k_m.gguf?download=true',
      size: 5444831232,
      oid: '',
      lfs: {
        oid: '',
        size: 5444831232,
        pointerSize: 135,
      },
      canFitInStorage: true,
    }
  },

];

export const defaultModels =
  Platform.OS === 'android'
    ? [...androidOnlyModels, ...crossPlatformModels]
    : [...iosOnlyModels, ...crossPlatformModels];
