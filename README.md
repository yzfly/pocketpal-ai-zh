<div align="center">

<img src="src/assets/pocketpal-dark-v2.png" alt="口袋AI logo" width="120" />

# 口袋AI（PocketPal AI 中文版）

**完全在手机上运行的私人 AI 助手**

模型在本地运行，聊天数据不出设备。无需账号、无需云端、离线可用。

[English](./README_en.md) | 简体中文

</div>

---

口袋AI 是 [PocketPal AI](https://github.com/a-ghorbani/pocketpal-ai) 的中文优化版本，架构与上游 v1.16.0 保持同步。

> 使用指南：https://mp.weixin.qq.com/s/szj3L6RdFhZYPgCcP_9YEw

## ✨ 中文版特色

在上游全部功能的基础上，中文版做了以下优化：

- **HF 镜像加速**：内置 [hf-mirror.com](https://hf-mirror.com) 镜像（设置中可开关），无需科学上网即可搜索和下载模型；携带 HF 令牌的请求始终直连官方，令牌不会经过第三方
- **中文模型优先**：内置最新 Qwen3 / Qwen3.5 全系小模型（0.6B ~ 4B）及 MiniCPM5，并在推荐列表中把 Qwen 置顶——Qwen 系列是当前中文能力最强的端侧小模型
- **默认中文界面**：首次启动即为简体中文（可切换繁体中文及其他 10+ 种语言）

## 🧠 内置推荐模型

应用会根据设备内存与芯片档位自动推荐合适的模型（2026 年 7 月更新）：

| 模型 | 参数量 | 下载大小 | 能力 | 适合设备 |
|------|--------|---------|------|---------|
| Qwen3 0.6B | 0.6B | ~0.5 GB | 文本 | 入门机型 |
| Qwen3.5 0.8B | 0.8B | ~0.5 GB | 文本 + 视觉 | 入门机型 |
| MiniCPM5 1B | 1.1B | ~0.7 GB | 文本 | 入门/中端机型 |
| Qwen3 1.7B | 1.7B | ~1.3 GB | 文本 | 中端机型 |
| Qwen3.5 2B | 2B | ~1.3 GB | 文本 + 视觉 | 中端机型 |
| Qwen3.5 4B | 4B | ~2.7 GB | 文本 + 视觉 | 旗舰机型（8GB 内存以上） |
| Qwen3.5 9B | 9B | ~5.7 GB | 文本 + 视觉 | 顶级旗舰（12GB 内存以上） |
| DeepSeek R1 8B | 8B | ~5.0 GB | 文本 + 深度思考 | 顶级旗舰（12GB 内存以上） |

也可以在模型页直接搜索 Hugging Face 上的任意 GGUF 模型下载使用（走镜像加速）。

> 说明：Qwen3.6 目前仅发布了 27B / 35B-A3B 等大模型，暂无适合手机的小尺寸版本；字节 Seed 开源版（Seed-OSS）最小为 36B，同样不适合端侧。二者的小模型一旦发布，会第一时间跟进。

## 🚀 主要功能（与上游同步）

- **完全离线**：推理全部在本地进行，支持后台下载、自动加载/卸载模型
- **多模态**：支持视觉模型，可拍照/发图与 AI 对话
- **Pals 助手**：可自定义系统提示词与角色，一键切换
- **语音朗读（TTS）**：内置多种本地语音引擎
- **性能基准测试**：测试设备推理速度，可提交到[排行榜](https://pocketpal.dev/leaderboard)
- **实时性能显示**：逐 token 速度、内存占用一目了然

## 📲 安装

- **Android**：从 [Releases](https://github.com/yzfly/pocketpal-ai-zh/releases) 下载最新 APK 安装
- **iOS**：需自行使用 Xcode 构建（欢迎有开发者账号的朋友协助上架）

> 旧版（v1.6.9）APK 与 DeepSeek 模型文件仍可通过百度网盘获取（提取码 xtbf）：
> https://pan.baidu.com/s/1fnMiflbqNrbd4CpRxvXvOQ

## 🛠️ 本地开发

```bash
git clone git@github.com:yzfly/pocketpal-ai-zh.git
cd pocketpal-ai-zh
yarn install

# iOS
cd ios && pod install && cd ..
yarn ios

# Android
yarn android
```

更多开发文档见上游仓库的[开发指南](https://github.com/a-ghorbani/pocketpal-ai#development-setup)。

## 🤝 致谢

- [a-ghorbani/pocketpal-ai](https://github.com/a-ghorbani/pocketpal-ai) —— 本项目的全部核心能力来自上游及其社区
- [llama.cpp](https://github.com/ggerganov/llama.cpp) 与 [llama.rn](https://github.com/mybigday/llama.rn)
- [hf-mirror.com](https://hf-mirror.com) 提供的镜像服务
- [Qwen](https://github.com/QwenLM)、[OpenBMB](https://github.com/OpenBMB) 团队开源的优秀中文模型

## 👤 作者

**云中江树**

- 微信公众号：云中江树
- GitHub：[@yzfly](https://github.com/yzfly)

## 📄 开源协议

本项目遵循上游的 [MIT License](./LICENSE)。
