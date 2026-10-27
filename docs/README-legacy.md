# Multi-site Operations Monitoring Tool (多站点运维检测工具)

一个基于 Electron + Vue3 的多功能网络测试工具，用于测量多个网站的延迟、获取 IP 地理位置信息以及提供运维检测功能。

![License](https://img.shields.io/badge/license-GPL--3.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)
![Vue](https://img.shields.io/badge/Vue-3.5-green.svg)
![Electron](https://img.shields.io/badge/Electron-44.4-blue.svg)

## 🚀 功能特性

### 🔍 IP/域名地理位置查询

- 支持批量查询多个IP地址或域名
- 显示详细的地理位置信息（国家、地区、城市、ISP等）
- 集成IP2Location API服务
- 支持导出查询结果

### 🌐 多种网络测试功能

- **Ping 测试**：测量网络延迟和丢包率，支持自定义数据包大小、超时时间、测试次数
- **HTTP 测试**：测试网站响应时间和状态，支持GET/POST/HEAD方法
- **DNS 测试**：测试域名解析性能，支持A/AAAA/CNAME/MX记录查询
- **MTR 测试**：网络路径分析，显示每个跳转点的详细信息
- **路由追踪**：显示数据包经过的路由路径

### ⭐ 收藏夹功能

- 本地持久化存储收藏记录
- 支持添加、编辑、删除收藏
- 支持备注和搜索功能
- 一键启动各种网络测试

### 🎨 用户界面

- 现代化的图形界面设计
- 基于Element Plus组件库
- 响应式布局，支持多种屏幕尺寸
- 中文界面，操作简单直观

## 📋 系统要求

- **操作系统**: Windows 10+, macOS 10.14+, Ubuntu 18.04+
- **Node.js**: 20.19+（或 22.12+）
- **内存**: 最少 512MB RAM
- **磁盘空间**: 最少 200MB 可用空间

## 🛠 安装说明

### 1. 克隆项目

```bash
git clone https://gitee.com/Snake-Konginchrist/MultiSiteLatencyTool.git
cd MultiSiteLatencyTool
```

### 2. 安装依赖

```bash
npm install
```

> 💡 **开发说明**:
>
> - 项目默认忽略 `package-lock.json` 文件，不会被Git跟踪
> - 安装时可能会有一些可选依赖的警告，这些通常可以忽略

### 3. 配置环境变量

创建 `.env` 文件并配置API密钥：

```bash
# IP2Location API 配置
IP2LOCATION_API_KEY=your_api_key_here

# 应用配置
NODE_ENV=development
VITE_APP_TITLE=MultiSite Latency Tool
VITE_APP_VERSION=1.0.0
```

> 💡 **获取API密钥**: 请访问 [IP2Location](https://www.ip2location.com/) 注册账户并获取免费API密钥
>
> 📋 **环境变量说明**: 可以复制 `.env.example` 文件为 `.env` 并修改相应配置
>
> 🔐 **代码签名**: 默认会使用您的开发者证书。如需禁用签名，请在 `.env` 中添加 `CSC_IDENTITY_AUTO_DISCOVERY=false`

## 🚀 使用方法

### 开发模式

```bash
npm run electron:dev
```

启动开发服务器和Electron应用，支持热重载

### 预览生产版本

```bash
npm run electron:preview
```

构建并预览生产版本

### 构建应用

```bash
# 构建所有平台
npm run electron:build

# 构建特定平台
npm run dist:win    # Windows (所有架构)
npm run dist:mac    # macOS (所有架构)
npm run dist:linux  # Linux (所有架构)

# 构建特定平台和架构
# Windows
npm run dist:win:x64        # Windows 64位
npm run dist:win:ia32       # Windows 32位
npm run dist:win:arm64      # Windows ARM64

# macOS
npm run dist:mac:x64        # macOS Intel (x64)
npm run dist:mac:arm64      # macOS Apple Silicon (ARM64)
npm run dist:mac:universal  # macOS 通用版本 (x64 + ARM64)

# Linux
npm run dist:linux:x64      # Linux 64位
npm run dist:linux:arm64    # Linux ARM64 (如树莓派等)

# 不签名构建（开发测试推荐）
npm run dist:unsigned       # 所有平台不签名构建
npm run dist:win:unsigned   # Windows 不签名构建
npm run dist:mac:unsigned   # macOS 不签名构建
npm run dist:linux:unsigned # Linux 不签名构建
```

> 💡 **关于代码签名**：
>
> - **默认构建**：会使用您的开发者证书进行签名，显示开发者信息
> - **不签名构建**：使用 `unsigned` 版本，不显示开发者信息，适合开发测试
> - **macOS**：签名的应用提供更好的用户体验，减少安全警告
> - **Windows**：签名的应用避免 SmartScreen 警告，提高用户信任度
>
> 💡 **关于Windows安装程序**：
>
> - 项目使用NSIS创建自定义安装程序，支持用户选择安装位置
> - 卸载时会彻底清理应用数据，避免残留
> - 支持x64、ia32和ARM64三种架构

## 📖 功能使用指南

### IP/域名查询

1. 在首页输入框中输入IP地址或域名（每行一个）
2. 点击"开始查询"按钮
3. 查看详细的地理位置信息
4. 可将常用地址添加到收藏夹

### Ping测试

1. 切换到"Ping测试"页面
2. 输入要测试的主机地址
3. 配置测试参数（数据包大小、超时时间、测试次数）
4. 点击"开始测试"查看结果

### HTTP测试

1. 切换到"HTTP测试"页面
2. 输入要测试的URL
3. 选择HTTP方法（GET/POST/HEAD）
4. 点击"开始测试"查看响应时间和状态

### DNS测试

1. 切换到"DNS测试"页面
2. 输入要查询的域名
3. 选择记录类型（A/AAAA/CNAME/MX）
4. 点击"开始测试"查看解析结果

### MTR测试

1. 切换到"MTR测试"页面
2. 输入目标主机
3. 配置测试次数
4. 查看详细的路径分析结果

### 路由追踪

1. 切换到"路由追踪"页面
2. 输入目标主机
3. 配置最大跳数
4. 查看完整的路由路径

### 收藏夹管理

1. 切换到"收藏夹"页面
2. 添加新的收藏项目
3. 编辑或删除现有收藏
4. 使用搜索功能快速查找
5. 一键启动各种测试

## ⌨️ 快捷键

- **开发者工具**：
  - macOS: `Command + Shift + I`
  - Windows/Linux: `Ctrl + Shift + I`

## 🏗 技术栈

- **前端框架**: Vue 3.5 + Composition API
- **UI组件库**: Element Plus 2.14
- **路由管理**: Vue Router 5.3
- **桌面框架**: Electron 44.4
- **构建工具**: Vite 8.3
- **HTTP客户端**: Axios 1.20
- **数据存储**: electron-store 11.0

## 📁 项目结构

```text
MultiSiteLatencyTool/
├── src/
│   ├── components/          # Vue组件
│   │   ├── IpLookupView.vue    # IP查询页面
│   │   ├── PingView.vue        # Ping测试页面
│   │   ├── HttpView.vue        # HTTP测试页面
│   │   ├── DnsView.vue         # DNS测试页面
│   │   ├── MtrView.vue         # MTR测试页面
│   │   ├── TracerouteView.vue  # 路由追踪页面
│   │   └── FavoritesView.vue   # 收藏夹页面
│   ├── router/             # 路由配置
│   ├── services/           # 业务服务
│   │   ├── ip2location.js      # IP地理位置服务
│   │   ├── network.js          # 网络测试服务
│   │   └── storage.js          # 数据存储服务
│   ├── utils/              # 工具函数
│   ├── App.vue             # 主应用组件
│   └── main.js             # Vue应用入口
├── public/                 # 静态资源
├── dist/                   # 构建输出
├── main.js                 # Electron主进程
├── preload.js              # 预加载脚本
├── package.json            # 项目配置
├── vite.config.js          # Vite配置
└── README.md               # 项目说明
```

## 🔧 开发指南

### 添加新功能

1. 在 `src/views/` 目录下创建新的Vue组件
2. 在 `src/router/index.js` 中添加路由配置
3. 在 `src/App.vue` 中添加导航菜单项
4. 如需要，在 `src/services/` 中添加相应的服务

### 调试技巧

- 使用快捷键打开开发者工具
- 查看控制台输出了解应用状态
- 使用Vue DevTools调试Vue组件

## 🤝 贡献指南

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目基于 [GPL-3.0 License](LICENSE) 开源协议。

## 🙏 致谢

- [IP2Location](https://www.ip2location.com/) - 提供IP地理位置数据服务
- [Element Plus](https://element-plus.org/) - 优秀的Vue 3组件库
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架

## 📞 联系方式

- 作者: Snake Konginchrist
- 项目地址: [Gitee](https://gitee.com/Snake-Konginchrist/MultiSiteLatencyTool-Desktop)
- 问题反馈: [Issues](https://gitee.com/Snake-Konginchrist/MultiSiteLatencyTool-Desktop/issues)

---

⭐ 如果这个项目对你有帮助，请给它一个星标！
