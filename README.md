<div align="center">

<img src="src/assets/brand/mark-512.png" alt="口袋AI logo" width="120" />

# 口袋AI

**完全在手机上运行的私人 AI 助手**

模型在本地运行，聊天数据不出设备。离线可用，登录可选。

[English](./README_en.md) | 简体中文

</div>

---

口袋AI 基于开源项目 [PocketPal AI](https://github.com/a-ghorbani/pocketpal-ai) 二次开发，与上游 v1.22.1 同步（2026 年 11 月），推理引擎为 llama.cpp v0.9.0。它是独立应用：包名 `com.pocketwisdom`（沿用口袋AI 旧中文版），可以和上游 PocketPal 同时安装。

> 使用指南：https://mp.weixin.qq.com/s/szj3L6RdFhZYPgCcP_9YEw

## ✨ 中文版特色

在上游全部功能的基础上，中文版做了以下优化：

- **HF 镜像加速**：内置 [hf-mirror.com](https://hf-mirror.com) 镜像（设置中可开关），模型、语音识别与朗读语音的下载都走镜像，无需科学上网；HF 令牌绝不发给镜像（下载受限模型时关闭镜像即可直连）
- **中文模型优先**：推荐列表以国内团队的开源模型为主（通义千问、面壁、蚂蚁、小米、腾讯等），按手机实测速度与能力排序，并移除了被新版本取代或中文能力偏弱的旧模型
- **最新推理引擎**：llama.cpp 升级到 v0.9.0（上游 App 目前为 v0.8.0），Hexagon NPU 与 OpenCL 加速库同步重新编译
- **默认中文界面**：首次启动即为简体中文（可切换繁体中文及其他 10+ 种语言）
- **小白友好的模型名**：模型按用途命名（口袋助手 mini / 标准版 / 专业版 / 旗舰版、小钢炮、混元翻译……），并附一句话说明，不用懂量化、参数量；默认推荐 0.8B mini，下载最小（约 0.5 GB）、所有手机都不卡，也能看图；想要更聪明可选 2B 标准版
- **国内可用的账号**：邮箱 + 密码注册登录，基于 Supabase Auth，经国内服务器中转直连；登录是可选的，不登录也能完整使用
- **应用内更新**：启动时自动检查新版本（国内地址），一键下载、校验并安装
- **黑白极简界面**：参考 Vercel / Geist 的黑白配色与小圆角
- **纯本地助手**：移除了上游的 PalsHub 在线市场和 Plus 付费功能，所有功能免费

## 🧠 内置推荐模型

应用会根据设备内存与芯片档位自动推荐合适的模型（2026 年 11 月更新）。速度为 Redmi K30 Pro（骁龙 865 / 12GB，4 线程纯 CPU）实测的生成速度：

App 里显示的是右侧的中文名。

| 模型 | App 中的名字 | 来源 | 下载大小 | 特点 | K30 Pro 速度 |
|------|------|------|---------|------|-------------|
| Ling 3.0 Tiny | 百灵 极速版 | 蚂蚁 | ~4.6 GB | MoE（总 8B / 激活 1.3B），速度与能力兼顾，旗舰机首选 | 20.0 tok/s |
| Qwen3.5 0.8B / 2B / 4B / 9B | 口袋助手 mini / 标准版 / 专业版 / 旗舰版 | 通义千问 | 0.5 / 1.3 / 2.7 / 5.6 GB | 通用对话 + 看图 | 2B 16.6、4B 6.9、9B 3.7 tok/s |
| MiniCPM5 1B / 2B | 小钢炮 mini / 标准版 | 面壁智能 | 0.7 / 1.6 GB | 同尺寸综合能力最强之一 | 2B 15.5 tok/s |
| Spark-X2.6 4B | Spark 学习版 | XHToken | ~2.4 GB | 智能体与编程能力强化 | 9.1 tok/s |
| Nanbeige4.2 3B | 南北阁 写作版 | Nanbeige 团队 | ~2.5 GB | 手机小模型榜并列第一，质量高但偏慢 | 5.5 tok/s |
| LFM3 1.7B | Liquid 极速版 | Liquid | ~1.0 GB | 支持中文，同档最快 | 22.5 tok/s |
| MiMo-V2.6 9B（编程） | MiMo 编程旗舰版 | 小米 | ~5.5 GB | 基于 Qwen3.5-9B 蒸馏，编程与智能体 | — |
| FrogNano 4B（编程） | FrogNano 编程版 | 微软 | ~2.7 GB | 基于 Qwen3.5-4B，仓库级编程 | — |
| 混元翻译 Hy-MT2 1.8B | 混元翻译 | 腾讯 | ~1.1 GB | 专用翻译，30+ 语种互译 | — |
| MiniCPM-V 4.7 1B | 小钢炮 看图版 | 面壁智能 | ~1.8 GB | 看图、读文档、识别文字 | — |
| Huihui Qwen3.5 2B / 4B abliterated | 口袋助手 无拘版 / 无拘专业版 | 社区微调 | 1.2 / 2.5 GB | 去除了内容限制的 Qwen3.5，回答不设限，内容请自行判断 | — |

也可以在模型页直接搜索 Hugging Face 上的任意 GGUF 模型下载使用（走镜像加速）。

> 性能小贴士：
> - 线程数默认取大核数量（骁龙 865 为 4），多开小核反而慢 20%~35%；首次启动自动设置，可在设置里调整。
> - MTP 投机解码在纯 CPU 手机上会变慢（K30 Pro 实测 Qwen3.5 2B 从 14.2 降到 8.2 tok/s），默认关闭；有 NPU/GPU 加速的新旗舰可在设置里尝试开启。
> - ≥2B 的模型优先选 Q4_0 量化，ARM CPU 与 NPU 加速效果最好。

## 🚀 主要功能（与上游同步）

- **完全离线**：推理全部在本地进行，支持后台下载、自动加载/卸载模型
- **多模态**：支持视觉模型，可拍照/发图与 AI 对话
- **助手**：内置聊天、编程、学习、角色扮演、写作、看图助手，也可自定义系统提示词与角色
- **语音输入与免提语音对话**：端侧 Whisper 识别，全程离线
- **语音朗读（TTS）**：内置多种本地语音引擎
- **本地 API 服务**：可把手机上的模型以 OpenAI 兼容接口提供给局域网内的其他应用
- **性能基准测试**：测试设备推理速度，可提交到[排行榜](https://pocketpal.dev/leaderboard)
- **实时性能显示**：逐 token 速度、内存占用一目了然

## 📲 安装

- **Android**：从 [Releases](https://github.com/yzfly/pocketpal-ai-zh/releases) 下载最新 APK 安装
- **iOS**：需自行使用 Xcode 构建（欢迎有开发者账号的朋友协助上架）

> 旧版（v1.6.9）APK 与 DeepSeek 模型文件仍可通过百度网盘获取（提取码 xtbf）：
> https://pan.baidu.com/s/1fnMiflbqNrbd4CpRxvXvOQ

## 🔄 发布更新（维护者）

1. 提高 `android/app/build.gradle` 的 `versionCode`，用**同一个发布密钥**签名构建 APK（签名不同无法覆盖安装）：构建前在环境变量或 `.env` 中设置 `APP_RELEASE_STORE_FILE`（仓库外的绝对路径）、`APP_RELEASE_KEY_ALIAS`、`APP_RELEASE_STORE_PASSWORD`、`APP_RELEASE_KEY_PASSWORD`。
2. 生成更新清单：`node scripts/make-update-manifest.js <apk> <apk 的 https 下载地址> notes.txt > update.json`（`--min <versionCode>` 可强制旧版本更新）。
3. 把 APK 和 `update.json` 上传到国内可直连的地址（如国内对象存储或自有服务器），`.env` 中 `UPDATE_MANIFEST_URL` 指向 `update.json`。

## 🛠️ 本地开发

```bash
git clone git@github.com:yzfly/pocketpal-ai-zh.git
cd pocketpal-ai-zh
yarn install
cp .env.example .env   # 填入账号中转地址 ACCOUNT_API_URL、Supabase Publishable Key 与更新清单地址（不要提交）

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
- [Qwen](https://github.com/QwenLM)、[OpenBMB](https://github.com/OpenBMB)、[inclusionAI](https://huggingface.co/inclusionAI)、[小米 MiMo](https://huggingface.co/XiaomiMiMo)、[腾讯混元](https://huggingface.co/tencent) 等团队开源的优秀模型

## 👤 作者

**云中江树**

- 微信公众号：云中江树
- GitHub：[@yzfly](https://github.com/yzfly)

## 📄 开源协议

本项目遵循上游的 [MIT License](./LICENSE)。
