# 口袋AI 📱🤖

口袋AI是一款强大的离线AI助手，让你随时随地与AI对话！基于小型语言模型(SLMs)，无需联网即可在手机上运行，是[PocketPal AI](https://github.com/a-ghorbani/pocketpal-ai)项目的中文优化版本。

## Model and hardware status (2026-10-31)

This Chinese fork is currently at app version 1.6.9 with `@pocketpalai/llama.rn ^0.4.8-2`. New upstream inference backends have not been ported to this build.

- **Qwen3 GGUF:** upstream PocketPal has published [Qwen3 runtime benchmarks](https://github.com/a-ghorbani/pocketpal-ai/discussions/883). Use an [upstream release](https://github.com/a-ghorbani/pocketpal-ai/releases) for newer model support; memory and quantization still affect whether a model can load.
- **Android NPU:** this fork has no Hexagon integration. Current [llama.rn documentation](https://github.com/mybigday/llama.rn#hexagon-npu-acceleration-experimental) marks Hexagon experimental and lists Qualcomm SM8450 / Snapdragon 8 Gen 1 or newer hardware. It is not a universal NPU switch. See [upstream PocketPal's hardware support](https://github.com/a-ghorbani/pocketpal-ai#readme).
- Follow [#1](https://github.com/yzfly/pocketpal-ai-zh/issues/1) and [#2](https://github.com/yzfly/pocketpal-ai-zh/issues/2) for this fork's status. No updated Chinese-fork binary with these backends has been released.

## ✨ 特色功能

- **离线运行**: 所有AI模型都在本地运行，无需担心网络问题
- **中文优化**: 深度适配中文用户体验，支持DeepSeek等优秀中文模型
- **简单易用**: 精心设计的界面，让AI交互变得简单自然
- **性能优化**: 智能内存管理，自动加载/卸载模型
- **多模型支持**: 支持多种小型语言模型，包括DeepSeek、Danube等
- **实时性能**: 实时显示推理速度，掌握AI响应状态

## 📱 支持设备

目前支持安卓设备：
- **旗舰机型(16G内存)**: 可运行8G以下模型
- **中端机型(8G内存)**: 推荐使用4G以下模型
- **其他机型**: 建议使用mini版模型

🔧 **iOS支持开发中**  
我们正在寻找开发者一起实现iOS版本！如果你：
- 有iOS开发经验
- 熟悉React Native
- 对AI应用感兴趣

欢迎加入我们，一起把这个强大的AI助手带到iOS平台！

## 🚀 快速开始

### 下载安装

1. 通过以下链接下载最新版本：
   > https://yzliu-generic.pkg.coding.net/pocketai/android/PocketAI-by-LangGPT.apk?version=latest

2. 安装完成后打开应用

### 使用步骤

1. **选择模型**
    - 进入模型配置页面
    - 根据设备配置选择合适的模型
    - 点击下载所需模型

2. **开始对话**
    - 等待模型下载完成
    - 点击"加载"按钮
    - 开始与AI助手对话

### 使用技巧

- 左滑可查看历史记录
- 右滑可删除单条消息
- 支持一键清空所有记录
- 所有数据本地存储，安全无忧

## 🛠️ 开发配置

我们特别欢迎iOS开发者的加入！如果你想参与开发，请按以下步骤配置环境：

### 环境要求

- Node.js (18.0或更高版本)
- Yarn
- React Native CLI
- Android Studio (安卓开发)

### 开发步骤

1. **克隆代码**
   ```bash
   git clone https://github.com/yzfly/pocketpal-ai-zh.git
   cd pocketpal-ai-zh
   git checkout chinese  # 切换到中文分支
   ```

2. **安装依赖**
   ```bash
   yarn install
   ```

3. **运行项目**
   ```bash
   # 启动安卓
   yarn android
   
   # 启动Metro
   yarn start
   ```

## 🤝 参与贡献

我们欢迎所有形式的贡献，特别是以下方面：

- 🍎 iOS版本开发（急需iOS开发者加入）
- 🌐 中文模型适配与优化
- 🎨 界面设计改进
- 📱 安卓设备兼容性提升
- 📖 文档完善
- 🐛 Bug修复

### 贡献步骤

1. Fork 本仓库
2. 创建新分支 (git checkout -b feature/your-feature)
3. 提交改动 (git commit -m 'feat: add new feature')
4. 推送到远程 (git push origin feature/your-feature)
5. 创建 Pull Request

## 📝 开发计划

重点目标：
- [ ] **iOS版本开发**: 寻找iOS开发者共同开发，让更多用户受益
- [ ] 增强用户界面体验
- [ ] 增加本地知识库功能
- [ ] 增加联网功能

## 📞 联系方式

- 微信公众号：云中江树
- GitHub: [yzfly](https://github.com/yzfly)
- 邮箱：ethereal_ai@hotmail.com

## 🙏 致谢

- [PocketPal AI](https://github.com/a-ghorbani/pocketpal-ai): 原始项目
- [llama.cpp](https://github.com/ggerganov/llama.cpp): 高效的本地LLM推理引擎
- [llama.rn](https://github.com/mybigday/llama.rn): React Native绑定实现

## 📄 开源协议

本项目基于 MIT 协议开源。

---

如果这个项目对你有帮助，欢迎点个⭐️支持一下！