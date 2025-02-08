# 口袋AI 📱🤖

口袋AI是一款强大的离线AI助手，让你随时随地与AI对话！基于小型语言模型(SLMs)，无需联网即可在手机上运行，是[PocketPal AI](https://github.com/a-ghorbani/pocketpal-ai)项目的中文优化版本。

![](https://files.mdnice.com/user/43439/706c3e5d-1996-4b5c-a24b-297af69328ec.jpg)


使用指南：
https://mp.weixin.qq.com/s/szj3L6RdFhZYPgCcP_9YEw

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

欢迎贡献，一起把这个强大的AI助手带到iOS平台！

## 🚀 快速开始

### 下载安装

1. 通过以下链接下载最新版本：
   > https://yzliu-generic.pkg.coding.net/pocketai/android/PocketAI-by-LangGPT.apk?version=latest

2. 安装完成后打开应用

【软件及模型下载】

如果您无法下载软件或遇到模型下载速度慢的问题，可以通过以下百度网盘链接获取：

百度网盘链接: https://pan.baidu.com/s/1fnMiflbqNrbd4CpRxvXvOQ 提取码: xtbf

文件说明：
1. 软件安装包：PocketAI-by-LangGPT-1.6.9.apk (52.26MB)

2. 可选模型文件（请根据设备性能选择合适的版本）：
- DeepSeek-R1-深度思考推荐版.gguf (1.04GB) - 适合大多数设备
- DeepSeek-R1-深度思考无拘版.gguf (1.04GB) - 无限制版本
- DeepSeek-R1-深度思考专业版.gguf (2.81GB) - 性能增强版
- DeepSeek-R1-深度思考旗舰版.gguf (4.36GB) - 高性能版本
- DeepSeek-R1-深度思考至尊版.gguf (5.37GB) - 顶级性能版本

使用步骤：
1. 下载并安装 apk 文件
2. 下载所需的模型文件（.gguf）
3. 打开应用，选择"加载本地模型"，选择已下载的模型文件即可使用

注意：请根据您设备的存储空间和性能选择合适的模型文件。较大的模型文件会提供更好的效果，但也需要更多的设备资源。

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

我们特别欢迎iOS开发者的加入！

如果你想参与开发，请按以下步骤配置环境：

### 环境要求

- Node.js (18.0或更高版本)
- Yarn
- React Native CLI
- Android Studio (安卓开发)
- Xcode (iOS开发，仅macOS)

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

3. **iOS专属配置**
   ```bash
   cd ios
   pod install  # 安装iOS依赖
   cd ..
   ```

4. **运行项目**

   安卓：
   ```bash
   yarn android  # 启动安卓应用
   ```

   iOS：
   ```bash
   yarn ios  # 启动iOS模拟器
   ```

   启动开发服务器：
   ```bash
   yarn start  # 启动Metro服务
   ```

### 实用脚本

- **清理构建文件**
  ```bash
  yarn clean
  ```

- **代码检查**
  ```bash
  yarn lint      # 代码风格检查
  yarn typecheck # 类型检查
  ```

- **运行测试**
  ```bash
  yarn test
  ```

## 🤝 参与贡献

我们欢迎所有形式的贡献，特别是以下方面：

- 🍎 iOS版本开发（急需iOS开发者加入）
- 🌐 中文模型适配与优化
- 🎨 界面设计改进
- 📱 设备兼容性提升和功能完善
- 📖 文档完善
- 🐛 Bug修复

### 贡献指南

1. **Fork 仓库**
    - 访问项目主页，点击 Fork 按钮

2. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **开发并测试**
    - 对于安卓：
      ```bash
      yarn android
      ```
    - 对于iOS：
      ```bash
      yarn ios
      ```

4. **代码检查**
   ```bash
   yarn lint      # 代码风格检查
   yarn typecheck # 类型检查
   ```

5. **提交代码**
    - 使用规范的提交信息格式：
      ```bash
      git commit -m "feat: 添加新功能"
      git commit -m "fix: 修复某个问题"
      ```

6. **推送并创建 Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```
    - 访问 GitHub，创建 Pull Request
    - 详细描述你的改动

我们会认真审查每一个 Pull Request，并及时反馈。

## 📝 开发计划

重点目标：
- [ ] **iOS版本开发**: 寻找iOS开发者共同开发，让更多用户受益
- [ ] 增加联网搜索、接入在线API等功能
- [ ] 优化更多设备兼容性
- [ ] 支持更多中文模型，开放本地模型API接口
- [ ] 增强用户界面体验
- [ ] 完善开发文档

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

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yzfly/pocketpal-ai-zh&type=Date)](https://star-history.com/#yzfly/pocketpal-ai-zh&Date)