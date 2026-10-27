# 软件名称：Multi-site Operations Monitoring Tool (多站点运维检测工具)

## 软件版本：1.0.0

## 完成日期：2025年05月30日

## 首次发表日期：2025年05月30日

----

## 文档修订历史

| 版本号 | 修订日期   | 修订人          | 修订说明         |
| :----- | :--------- | :-------------- | :--------------- |
| 1.0    | 2024-07-30 | Gemini Assistant | 初版             |

----

## 文档目录

1. 第一章 概述
2. 第二章 软件组成与架构设计
    * 2.1 总体架构
    * 2.2 模块划分
    * 2.3 进程间通信 (IPC) 设计
    * 2.4 数据结构设计
    * 2.5 目录结构
3. 第三章 功能规格与实现细节
    * 3.1 IP/域名地理位置查询
    * 3.2 Ping 测试
    * 3.3 HTTP 测试
    * 3.4 DNS 测试
    * 3.5 MTR 测试
    * 3.6 路由追踪
    * 3.7 收藏夹功能
4. 第四章 用户手册与操作指南
    * 4.1 安装指南
    * 4.2 界面说明
    * 4.3 功能操作步骤
    * 4.4 快捷键
    * 4.5 设置选项
5. 第五章 开发与测试
    * 5.1 开发环境要求
    * 5.2 构建流程
    * 5.3 测试情况
    * 5.4 代码仓库
6. 第六章 附录
    * 6.1 许可证
    * 6.2 参考资料

----

## 第一章 概述

### 1.1 软件简介

Multi-site Monitor（中文名称：多站点运维检测工具）是一款基于 Electron 和 Vue 3 技术栈构建的跨平台桌面应用程序。它集成了一系列常用的网络测试和诊断工具，旨在帮助用户便捷地测量网络性能、查询IP地理位置信息，以及进行基础的网络运维检测。本软件面向需要进行网络故障排查、性能监控或了解全球服务器分布的IT专业人士、网络管理员及其他相关用户。

### 1.2 软件目的

本软件的开发目的是为了解决在进行多站点或跨区域网络服务运维时，需要频繁使用多种命令行工具进行测试和诊断的痛点。通过将 Ping、HTTP 测试、DNS 查询、MTR、路由追踪以及 IP 地理位置查询等功能整合到一个具有现代化图形用户界面的应用中，极大地提高了操作效率和结果的可视性。软件致力于提供一个统一、易用且功能强大的平台，简化网络问题的诊断流程。

### 1.3 主要功能列表

* 批量 IP 地址或域名地理位置查询。
* 详细的 Ping 测试，提供延迟、丢包率等统计数据。
* HTTP/HTTPS 连接测试，获取响应时间及状态码。
* DNS 记录查询，支持多种记录类型。
* MTR (My Traceroute) 路径分析。
* 路由追踪，可视化数据包路径。
* 常用测试目标的收藏夹管理。
* 结果导出功能。
* 跨平台支持（Windows, macOS, Linux）。
* 友好的图形用户界面，支持中文。

### 1.4 目标用户

本软件的主要目标用户包括但不限于：

* 网络管理员和运维工程师：用于日常网络监控、故障排查和性能优化。
* 网站开发者和测试人员：测试网站在全球不同位置的访问性能和连通性。
* IT 技术支持人员：辅助诊断用户报告的网络问题。
* 对网络技术感兴趣的普通用户：了解网络连接状况和目标服务器信息。

### 1.5 软件特点与优势

* **功能集成度高**：将多种常用网络工具汇集于一处，无需频繁切换命令行窗口。
* **图形化界面**：直观展示测试结果，相较命令行输出更易于分析和理解。
* **跨平台兼容性**：一套代码可运行在主流桌面操作系统上。
* **易用性**：简洁的界面设计和操作流程降低了使用门槛。
* **批量处理能力**：支持批量IP/域名查询，提高了效率。
* **数据持久化**：收藏夹功能方便用户管理常用目标。

----

## 第二章 软件组成与架构设计

### 2.1 总体架构

Multi-site Monitor 软件基于 Electron 框架构建，其核心架构遵循 Electron 应用的标准模式，即由一个 Node.js 环境的**主进程 (Main Process)** 负责应用生命周期管理和原生API调用，一个或多个 Chromium 环境的**渲染进程 (Renderer Process)** 负责用户界面的渲染，以及连接两者的**预加载脚本 (Preload Script)**。这种架构充分利用了 Web 技术构建界面的灵活性和 Node.js 访问底层系统资源的强大能力，并通过预加载脚本在保证安全性的前提下实现进程间通信。

**架构图 (文字描述)**：

```
+-------------------+      +----------------------+
|  主进程 (main.js) | <--> | 预加载脚本 (preload.js)|
| - 应用生命周期    |      | - contextBridge API  |
| - 窗口管理        |      | - 安全隔离           |
| - IPC 通信后端    |      +----------|-----------+
| - Node.js APIs    |                 | 安全的 electronAPI
| - 系统调用        |                 |
| - 后台服务 (Ping, |                 |
|   IP查询等)       |                 |
+-------------------+                 |
         ^                           |
         | IPC (ipcMain)             |
         -----------------------------+
                                     |
         -----------------------------+
         | IPC (ipcRenderer)         |
         v                           |
+-------------------+      +----------------------+
| 渲染进程 (Vue App)| <--> | 用户界面 (Components)|
| - 用户界面渲染    |      | - 业务逻辑处理       |
| - 用户交互响应    |      | - 调用 electronAPI   |
| - 前端路由管理    |      +----------------------+
| - 状态管理        |
+-------------------+
```

**主进程**负责应用的"后端"逻辑，如执行网络命令、读写文件（通过 `electron-store` ）、与操作系统的交互等。**渲染进程**负责"前端"界面，响应用户操作，并通过预加载脚本请求主进程完成需要底层权限或计算的任务。**预加载脚本**则是在渲染进程加载内容前运行，提供了主进程授权的 API 子集，防止渲染进程直接访问完整的 Node.js 环境带来安全风险。

### 2.2 模块划分

软件的组成模块可以从进程和功能两个维度来划分：

* **主进程模块 (`main.js`)**：
  * **应用核心**：管理 `app` 和 `BrowserWindow` 的生命周期，处理应用就绪、窗口关闭等事件。
  * **IPC 后端**：定义 `ipcMain.handle` 处理程序，接收渲染进程发来的请求并执行相应的操作。例如，`resolve-dns`, `ping-test`, `ip2location-lookup` 等。
  * **系统交互层**：封装对 `child_process`, `dns`, `http`, `https`, `shell`, `Menu` 等 Node.js 原生模块的调用，实现网络测试和系统功能。
  * **数据存储层**：通过 `electron-store-wrapper.js` 模块提供统一的接口，负责将用户配置、收藏夹数据等读写到本地。

* **预加载脚本模块 (`preload.js`)**：
  * **API 暴露**：使用 `contextBridge.exposeInMainWorld` 方法，安全地将主进程中定义的 IPC 调用函数或其他必要信息（如应用版本）暴露到渲染进程的 `window.electronAPI` 对象上。这是渲染进程与主进程通信的唯一安全通道。

* **渲染进程模块 (`src` 目录下)**：
  * **应用入口 (`src/main.js`)**：Vue 应用的初始化、路由配置、全局组件和服务的注册。
  * **根组件 (`src/App.vue`)**：定义应用的整体布局，包含导航和主内容区域，通过路由管理不同页面的显示。
  * **页面组件 (`src/components/`)**：
    *`IpLookupView.vue`：IP/域名查询功能的界面和逻辑。
    * `PingView.vue`：Ping 测试功能的界面和逻辑。
    *`HttpView.vue`：HTTP 测试功能的界面和逻辑。
    * `DnsView.vue`：DNS 测试功能的界面和逻辑。
    *`MtrView.vue`：MTR 测试功能的界面和逻辑。
    * `TracerouteView.vue`：路由追踪功能的界面和逻辑。
    *`FavoritesView.vue`：收藏夹管理功能的界面和逻辑。
    * 其他通用组件。
  * **路由模块 (`src/router/`)**：定义前端页面的路径和组件映射。
  * **服务模块 (`src/services/`)**：
    *`ip2location.js`：封装 IP 地理位置查询相关的业务逻辑，调用 `electronAPI` 发起查询请求。
    * `network.js`：封装 Ping, HTTP, DNS, MTR, Traceroute 等网络测试相关的业务逻辑，调用 `electronAPI` 执行测试命令。
    *`storage.js`：封装对本地数据存储的操作，通过 `electronAPI` 调用主进程的 `electron-store` 接口。
    * `i18nService.js`：国际化（多语言）服务，管理语言切换和文本内容。
  * **工具模块 (`src/utils/`)**：提供各种通用的辅助函数。

### 2.3 进程间通信 (IPC) 设计

进程间通信 (IPC) 是 Electron 应用的核心交互机制。在本软件中，渲染进程不直接访问 Node.js 或系统资源，而是通过预加载脚本暴露的 `electronAPI` 调用主进程提供的异步或同步 IPC 句柄。

**IPC 交互流程示例 (以 Ping 测试为例，文字描述)**：

1. **用户操作**：用户在 Ping 测试页面 (`PingView.vue`) 的输入框中输入目标主机，并点击"开始测试"按钮。
2. **渲染进程发起请求**：`PingView.vue` 组件内的事件处理函数被触发。它通过 `window.electronAPI.pingTest(host, options)` 调用预加载脚本暴露的方法。
3. **预加载脚本转发**：`preload.js` 收到调用后，通过 `ipcRenderer.invoke('ping-test', host, options)` 向主进程发送一个异步 IPC 消息，消息通道为 `'ping-test'`，并附带参数 `host` 和 `options`。
4. **主进程接收并处理**：主进程的 `main.js` 中，预先定义了 `ipcMain.handle('ping-test', async (event, host, options) => { ... })` 来监听 `'ping-test'` 通道的消息。主进程接收到消息后，执行 Ping 测试的逻辑，调用 `child_process.exec` 执行系统命令，并解析输出。
5. **主进程返回结果**：Ping 测试执行完成后，主进程将解析好的结果数据（如延迟、丢包率）作为 Promise 的返回值，通过 IPC 通道 `'ping-test'` 返回给渲染进程。
6. **渲染进程接收并更新 UI**：`preload.js` 接收到主进程的返回结果后，通过 Promise 将结果传递回 `PingView.vue` 组件。组件接收到结果后，更新界面上的表格或文本区域，显示 Ping 测试的结果。

其他功能如 IP 查询、DNS 查询等也都遵循类似的 IPC 异步通信模式。`electron-store` 的读写操作也通过 IPC 调用主进程封装的接口完成。

### 2.4 数据结构设计

软件在本地存储一些用户相关的数据，主要通过 `electron-store` 实现。例如，收藏夹的数据可能采用一个数组结构来存储多个收藏项，每个收藏项是一个对象，包含：

```javascript
{
  id: string, // 唯一标识符
  type: 'ip' | 'domain' | 'url', // 目标类型
  target: string, // 具体的 IP 地址、域名或 URL
  notes: string, // 用户备注
  createdAt: number // 创建时间戳
}
```

用户设置也存储为一个对象，包含 `ipLookupService`, `ip2locationApiKey` 等字段。

这些数据结构的设计简单直接，便于使用 `electron-store` 进行 JSON 格式的存储和读取。

### 2.5 目录结构

项目的目录结构清晰，将主进程、预加载脚本和渲染进程的代码分开，并按功能或类型组织前端代码：

```
MultiSiteMonitor/
├── node_modules/           # 项目依赖库
├── public/                 # 静态资源文件 (在构建时复制到 dist 目录)
│   ├── favicon.ico
│   └── index.html          # 渲染进程的 HTML 模板
├── src/                    # 前端源代码 (Vue 应用)
│   ├── assets/             # 前端静态资源 (图片、字体等)
│   │   └── logo.png
│   ├── components/         # Vue 组件
│   │   ├── common/         # 通用组件
│   │   ├── IpLookupView.vue    # IP查询页面组件
│   │   ├── PingView.vue        # Ping测试页面组件
│   │   ├── HttpView.vue        # HTTP测试页面组件
│   │   ├── DnsView.vue         # DNS测试页面组件
│   │   ├── MtrView.vue         # MTR测试页面组件
│   │   ├── TracerouteView.vue  # 路由追踪页面组件
│   │   └── FavoritesView.vue   # 收藏夹页面组件
│   ├── config/             # 前端配置 (如 appInfo.js)
│   ├── router/             # Vue Router 配置
│   │   └── index.js
│   ├── services/           # 前端业务逻辑服务
│   │   ├── ip2location.js      # IP查询服务封装
│   │   ├── network.js          # 网络测试服务封装
│   │   ├── storage.js          # 本地存储服务封装
│   │   └── i18nService.js      # 国际化服务
│   ├── utils/              # 前端工具函数
│   │   └── index.js
│   ├── App.vue             # Vue 根组件
│   └── main.js             # Vue 应用入口文件
├── dist/                   # Vite 构建输出目录 (前端静态文件)
├── release/                # electron-builder 构建输出目录 (应用安装包和可执行文件)
├── main.js                 # Electron 主进程文件
├── preload.js              # 预加载脚本文件
├── package.json            # npm 和 electron-builder 配置文件
├── vite.config.js          # Vite 前端构建配置文件
├── electron-store-wrapper.js # electron-store 的主进程封装
├── .env.example            # 环境变量示例文件
├── .gitignore              # Git 忽略文件配置
├── LICENSE                 # 许可证文件
└── README.md               # 项目说明文档
└── DOCUMENT.md             # 本文档
```

这种结构将前端代码、主进程代码、构建配置和文档等分开放置，提高了项目的可维护性。

----

## 第三章 功能规格与实现细节

本章详细阐述软件各项核心功能的具体规格、用户交互以及背后的实现方式。

### 3.1 IP/域名地理位置查询

* **功能描述**：用户输入 IP 或域名列表，软件通过调用第三方地理位置查询服务 API 获取其归属地信息（国家、地区、城市、ISP）。支持批量查询和结果导出。
* **输入**：位于界面左侧文本区域的一列 IP 地址或域名。用户可以通过设置页面配置使用的查询服务和 API 密钥。
* **输出**：在界面右侧的表格中逐行显示查询结果，包含原始输入、实际查询的 IP、国家、地区、城市、ISP 以及本次查询使用的服务提供商。用户可将表格数据导出为 CSV 文件。
* **实现细节**：
  * **前端 (`IpLookupView.vue`, `src/services/ip2location.js`)**：
    *监听用户输入和"开始查询"按钮点击事件。
    * 从文本区域获取输入列表，过滤空行和无效格式（基本校验）。
    *通过 `window.electronAPI.ip2locationLookup(target, userSettings)` 调用主进程的 IPC 句柄。对于域名，调用主进程的 DNS 解析 IPC 句柄先获取 IP。
    * 接收主进程返回的查询结果，更新界面表格。
    * 提供导出按钮，收集表格数据并可能通过另一个 IPC 句柄触发主进程的文件保存操作。
  * **主进程 (`main.js`, `electron-store-wrapper.js`)**：
    *监听 `ipcMain.handle('ip2location-lookup', ...)` 句柄。
    * 接收渲染进程发来的 IP/域名和用户设置。
    *如果输入是域名，调用 Node.js `dns.resolve4` 进行解析。
    * 根据用户设置的服务类型，选择对应的 API（ip-api, ipapi, ip2location.io, ipinfo.io）。
    *使用 Node.js `http` 或 `https` 模块向选定服务的 API 发起请求，带上 IP 或域名及 API 密钥（如果需要）。
    * 设置请求超时。
    *接收 API 响应，解析 JSON 数据，提取所需的地理位置信息。
    * 处理 API 返回的错误信息或 HTTP 状态码非 200 的情况。
    *将解析好的结构化数据或错误信息通过 Promise 返回给渲染进程。
    * 通过 `electron-store-wrapper` 提供接口供渲染进程通过 IPC 调用以加载/保存用户设置和收藏夹数据。
* **异常处理**：
  * DNS 解析失败：返回解析失败信息。
  * API 请求超时：返回超时错误。
  * API 返回错误状态码或错误信息：根据 API 返回的具体错误信息向用户报告。
  * 网络连接问题：捕获请求错误并提示用户检查网络。

### 3.2 Ping 测试

* **功能描述**：执行标准的 Ping 命令，测量到目标主机的网络延迟和丢包率。支持配置数据包大小、测试次数和超时。
* **输入**：一个目标主机（IP 或域名）。用户可在界面上设置 Ping 次数、数据包大小（字节）和超时时间（秒）。
* **输出**：在界面下方文本区域实时显示 Ping 命令的原始输出。测试完成后，在界面上方展示总结性统计数据：发送/接收/丢失数据包数量、丢包率百分比、最小/平均/最大延迟、以及 TTL。
* **实现细节**：
  * **前端 (`PingView.vue`, `src/services/network.js`)**：
    *监听用户输入和"开始测试"按钮点击事件。
    * 获取输入的目标主机和配置参数。
    *通过 `window.electronAPI.pingTest({ host, count, size, timeout })` 调用主进程的 IPC 句柄。
    * 接收主进程实时返回的输出（如果实现为流式传输，本项目中为一次性返回解析结果）或最终结果，更新界面。
  * **主进程 (`main.js`)**：
    *监听 `ipcMain.handle('ping-test', ...)` 句柄。
    * 接收渲染进程发来的参数。
    *根据 `process.platform`（`'win32'` vs 其他）构建正确的 Ping 命令字符串，例如 Windows: `ping -n ${count} -l ${size} -w ${timeout * 1000} ${host}`，Linux/macOS: `ping -c ${count} -s ${size} -W ${timeout} ${host}`。
    * 使用 Node.js `child_process.exec` 执行构建好的 Ping 命令。
    *捕获 `exec` 命令的标准输出 (`stdout`) 和标准错误 (`stderr`)。
    * 根据输出的文本内容和操作系统差异，使用正则表达式解析出关键统计信息（丢包率、延迟等）。
    * 将解析好的结构化结果通过 Promise 返回给渲染进程。
* **异常处理**：
  * 主机不可达或 Ping 命令执行失败：捕获 `child_process.exec` 的错误，返回错误信息。
  * 解析输出失败：如果 Ping 输出格式与预期不符，可能导致解析失败，返回解析错误或原始输出。

### 3.3 HTTP 测试

* **功能描述**：测试指定 URL 的 HTTP/HTTPS 连接，测量从发起请求到接收到响应头的耗时，并获取 HTTP 状态码。
* **输入**：一个完整的 HTTP 或 HTTPS URL。用户可以选择 HTTP 方法（GET, POST, HEAD）。
* **输出**：显示测试的 URL、使用的 HTTP 方法、实际请求的 URL (处理重定向后)、响应时间（毫秒）、HTTP 状态码。
* **实现细节**：
  * **前端 (`HttpView.vue`, `src/services/network.js`)**：
    *监听用户输入和按钮点击。
    * 获取输入的 URL 和选定的方法。
    *通过 `window.electronAPI.httpTest(url, method)` 调用主进程 IPC 句柄。
    * 接收主进程返回的结果，更新界面显示。
  * **主进程 (`main.js`)**：
    *监听 `ipcMain.handle('http-test', ...)` 句柄。
    * 接收 URL 和方法。
    *解析 URL 以确定协议 (`http:` 或 `https:` )、主机名、端口和路径。
    * 使用 Node.js `http` 或 `https` 模块创建请求对象 (`protocol.request(options, (res) => { ... })`)。
    *记录请求开始时间。
    * 在 `res.on('data')` 或 `res.on('end')` 中捕获响应的结束，记录结束时间，计算响应时间。
    *获取 `res.statusCode` 作为 HTTP 状态码。
    * 处理重定向（默认 `http`/`https` 模块不会自动跟随重定向，可能需要手动处理或使用第三方库，本项目可能依赖 Node.js 默认行为或假设不需要跟随）。
    * 将响应时间、状态码等信息通过 Promise 返回给渲染进程。
* **异常处理**：
  * 网络连接错误或 DNS 解析失败：捕获 `req.on('error')` 事件，返回错误信息。
  * 请求超时：捕获 `req.on('timeout')` 事件，返回超时错误。
  * URL 格式无效：在前端或主进程进行基本校验并提示。

### 3.4 DNS 测试

* **功能描述**：查询指定域名的特定 DNS 记录类型，如 A (IPv4), AAAA (IPv6), CNAME, MX (邮件交换记录) 等。
* **输入**：一个域名。用户在界面上选择要查询的 DNS 记录类型。
* **输出**：在界面上显示查询的域名、记录类型，以及查询到的所有对应的 DNS 记录列表和详情。
* **实现细节**：
  * **前端 (`DnsView.vue`, `src/services/network.js`)**：
    *监听用户输入和按钮点击。
    * 获取输入的域名和选定的记录类型。
    *通过 `window.electronAPI.dnsTest(domain, recordType)` 调用主进程 IPC 句柄。
    * 接收主进程返回的结果，更新界面显示。
  * **主进程 (`main.js`)**：
    *监听 `ipcMain.handle('dns-test', ...)` 句柄。
    * 接收域名和记录类型。
    * 使用 Node.js `dns` 模块中对应记录类型的查询方法，例如：
      * `dns.resolve(domain, 'A')` 获取 A 记录。
      * `dns.resolve4(domain)` 获取 IPv4 地址 (A 记录)。
      * `dns.resolve6(domain)` 获取 IPv6 地址 (AAAA 记录)。
      * `dns.resolveCname(domain)` 获取 CNAME 记录。
      * `dns.resolveMx(domain)` 获取 MX 记录。
      * `dns.resolveTxt(domain)` 获取 TXT 记录等。
    * 将查询到的记录数据（通常是数组）通过 Promise 返回给渲染进程。
* **异常处理**：
  * 域名不存在或 DNS 服务器无响应：捕获 `dns` 模块的错误，返回错误信息（如 `ENOTFOUND`, `ESERVFAIL` 等）。
  * 不支持的记录类型：在前端或主进程进行校验。

### 3.5 MTR 测试

* **功能描述**：执行 MTR 命令，结合 Ping 和 Traceroute 功能，持续检测数据包到达目标主机路径上每个网络节点的性能（丢包率、延迟）。
* **输入**：一个目标主机（IP 或域名）。用户可配置 MTR 测试的次数。
* **输出**：在界面下方文本区域实时显示 MTR 命令的原始输出。输出通常以表格形式展示路径上的每个跳跃点 (hop)，包括跳跃点编号、主机名/IP、以及该跳跃点的丢包率和 Ping 延迟统计。
* **实现细节**：
  * **前端 (`MtrView.vue`, `src/services/network.js`)**：
    *监听用户输入和按钮点击。
    * 获取目标主机和配置参数。
    *通过 `window.electronAPI.mtrTest({ host, count })` 调用主进程 IPC 句柄。
    * 接收主进程实时返回的输出行，追加到界面文本区域。
  * **主进程 (`main.js`)**：
    *监听 `ipcMain.handle('mtr-test', ...)` 句柄。
    * 接收参数。
    *检查用户系统是否安装了 MTR 命令 (这通常需要在主进程中尝试执行命令或进行路径检查)。如果未安装，提示用户。
    * 根据操作系统构建 MTR 命令字符串，例如 `mtr -c ${count} ${host}`。
    *使用 Node.js `child_process.spawn` 或 `exec` 执行 MTR 命令。使用 `spawn` 更适合处理持续输出的命令。
    * 捕获标准输出流 (`stdout`) 的数据块。
    *将捕获到的输出数据块通过**异步** IPC 消息 (`event.sender.send('mtr-output', data)`) 实时发送回渲染进程。
    * 监听进程退出事件 (`process.on('exit')` 或 `close`) 和错误事件 (`process.on('error')`)。
* **异常处理**：
  * MTR 命令未找到：提示用户安装 MTR。
  * 命令执行错误：捕获 `child_process` 错误，返回错误信息。
  * 目标主机不可达：MTR 输出中会显示相关信息，由前端解析或直接展示原始输出。

### 3.6 路由追踪

* **功能描述**：显示数据包从本地主机到目标主机的网络路径，列出沿途经过的路由器 IP 地址或主机名及其延迟。
* **输入**：一个目标主机（IP 或域名）。用户可配置最大跳数。
* **输出**：在界面下方文本区域实时显示路由追踪命令的原始输出。输出通常显示每个跳跃点的编号、多次探测的延迟以及该跳跃点的主机名或 IP 地址。
* **实现细节**：
  * **前端 (`TracerouteView.vue`, `src/services/network.js`)**：
    *监听用户输入和按钮点击。
    * 获取目标主机和配置参数。
    *通过 `window.electronAPI.tracerouteTest({ host, maxHops })` 调用主进程 IPC 句柄。
    * 接收主进程实时返回的输出行，追加到界面文本区域。
  * **主进程 (`main.js`)**：
    *监听 `ipcMain.handle('traceroute-test', ...)` 句柄。
    * 接收参数。
    *根据 `process.platform` 构建路由追踪命令，例如 Windows: `tracert -h ${maxHops} ${host}`，Linux/macOS: `traceroute -m ${maxHops} ${host}`。
    * 使用 Node.js `child_process.spawn` 执行命令。
    *捕获标准输出流 (`stdout`) 的数据块，并通过**异步** IPC 消息 (`event.sender.send('traceroute-output', data)`) 实时发送回渲染进程。
    * 监听进程退出事件和错误事件。
* **异常处理**：
  * 命令执行错误：捕获 `child_process` 错误，返回错误信息。
  * 目标主机不可达或路径超时：输出中会显示超时信息，由前端解析或直接展示原始输出。

### 3.7 收藏夹功能

* **功能描述**：允许用户保存常用的 IP 地址、域名或 URL，方便快速访问和管理。支持为收藏项添加备注、搜索和一键启动相关测试。
* **输入**：待收藏的网络目标地址、备注信息。
* **输出**：在收藏夹页面以列表形式展示所有收藏项。列表项显示目标地址和备注，并提供编辑、删除、以及快速启动 Ping, HTTP, DNS 等测试的按钮。
* **实现细节**：
  * **前端 (`FavoritesView.vue`, `src/services/storage.js`)**：
    *界面组件负责收藏列表的显示、添加/编辑/删除对话框的交互。
    * 在组件加载时，通过 `window.electronAPI.getFavorites()` 调用主进程接口加载收藏数据。
    *用户添加、编辑、删除收藏时，通过 `window.electronAPI.saveFavorites(favoritesData)` 或 `window.electronAPI.deleteFavorite(id)` 调用主进程接口更新数据。
    * 提供搜索输入框，根据用户输入过滤显示的收藏列表。
    * 收藏项旁边的测试按钮，点击后调用相应的网络测试功能 IPC 句柄，并传递收藏项的目标地址作为参数。
  * **主进程 (`main.js`, `electron-store-wrapper.js`)**:
    *通过 `electron-store-wrapper.js` 封装 `electron-store` 库的读写操作。
    * `electron-store` 库自动处理将数据 (`get`, `set`, `delete`) 存储到用户数据目录下的 JSON 文件中。
    *主进程暴露 `getFavorites`, `saveFavorites`, `deleteFavorite` 等 IPC 句柄供渲染进程调用。
    * `getFavorites` 句柄读取本地存储的收藏数据并返回。
    *`saveFavorites` 句柄接收更新后的收藏数据，并保存到本地。
    * `deleteFavorite` 句柄接收收藏项 ID，从数据中移除对应项并保存。
* **异常处理**：
  * 读写文件权限问题：`electron-store` 会处理此类错误，主进程捕获并可能通过 IPC 通知渲染进程。
  * 数据格式损坏：`electron-store` 有一定的健壮性，但极端情况下可能需要手动清理存储文件。

----

## 第四章 用户手册与操作指南

本章指导用户如何安装软件并使用各项功能。

### 4.1 安装指南

请根据您的需求和技术背景选择合适的安装方式。

**方式一：从源代码构建和运行 (适合开发者)**

1. **安装必备环境**：
    * 访问 [Node.js 官网](https://nodejs.org/) 下载并安装 Node.js (版本 16.0 或更高)。安装时请确保包含 npm (Node Package Manager)。
    * 访问 [Git 官网](https://git-scm.com/) 下载并安装 Git。
    * (可选，用于 MTR 测试) 如果您需要使用 MTR 功能，请根据您的操作系统安装 MTR 工具。
        * macOS: 使用 Homebrew (`brew install mtr`)
        * Linux (Debian/Ubuntu): `sudo apt-get install mtr`
        * Windows: 可以查找第三方的 MTR 实现或使用 WSL (Windows Subsystem for Linux)。

2. **克隆项目仓库**：
    * 打开终端或命令提示符。
    * 执行以下命令克隆项目的 Gitee 仓库：

        ```bash
        git clone https://gitee.com/Snake-Konginchrist/MultiSiteLatencyTool-Desktop.git
        ```

    * 进入项目根目录：

        ```bash
        cd MultiSiteLatencyTool-Desktop
        ```

3. **安装项目依赖**：
    * 在项目根目录执行以下命令安装所有开发和生产依赖：

        ```bash
        npm install
        ```

        > **提示**：安装过程可能需要一些时间，并可能显示一些关于可选依赖的警告，这些通常不影响软件的核心功能。

4. **配置环境变量 (可选)**：
    * 如果您需要使用 IP2Location 或 IPInfo 的高级查询服务，请在项目根目录创建一个名为 `.env` 的文件。
    * 参考 `.env.example` 文件，在 `.env` 中填入您的 API 密钥：

        ```dotenv
        IP2LOCATION_API_KEY=您的IP2Location密钥
        IPINFO_TOKEN=您的IPInfo令牌
        # 其他配置... (如 NODE_ENV=development)
        ```

5. **运行开发模式**：
    * 在项目根目录执行：

        ```bash
        npm run electron:dev
        ```

    * 这会启动一个本地开发服务器（ Vite ）和 Electron 应用程序，并支持代码热重载，方便开发调试。

**方式二：下载并安装预编译的应用 (适合普通用户)**

1. **访问发布页面**：前往项目的发布页面（请联系软件提供者获取具体的下载链接）。
2. **下载对应版本**：根据您的操作系统（Windows, macOS, Linux）和架构（x64, ia32, arm64），下载最新版本的应用程序安装包或免安装压缩包。
3. **安装或运行**：
    * **Windows (.exe 安装程序)**：双击下载的 `.exe` 文件，按照安装向导的提示操作。您可以选择安装目录。安装完成后，可以在开始菜单找到软件。
    * **Windows (.zip 免安装版)**：解压下载的 `.zip` 文件到您希望存放软件的目录，然后双击解压后文件夹中的可执行文件（通常是 `Multi-site Monitor.exe`）运行。
    * **macOS (.dmg)**：双击下载的 `.dmg` 文件，将应用程序图标拖拽到"应用程序"文件夹中即可完成安装。然后可以在"应用程序"文件夹中找到并运行。
    * **macOS (.zip)**：解压 `.zip` 文件到您希望存放应用的目录，然后双击 `.app` 文件运行。
    * **Linux (.AppImage)**：给下载的 `.AppImage` 文件添加执行权限 (`chmod +x your-app.AppImage`)，然后双击或在终端运行 `./your-app.AppImage`。
    * **Linux (.deb/.rpm)**：使用系统包管理器安装，例如 Ubuntu/Debian: `sudo dpkg -i your-app.deb`，Fedora/RHEL: `sudo rpm -i your-app.rpm`。

### 4.2 界面说明

Multi-site Monitor 的用户界面设计简洁直观，主要由以下部分组成：

* **窗口顶部标题栏**：显示应用程序名称（"Multi-site Monitor"）。
* **左侧导航菜单**：一个侧边栏或顶部的标签页区域，包含各个功能模块的入口图标或文字。点击不同的菜单项可以在主内容区域切换到对应的功能页面，例如"IP 查询"、"Ping 测试"、"收藏夹"等。
* **主内容区域**：界面的主要部分，根据左侧导航菜单的选择，显示当前功能模块的具体操作界面和结果。每个功能模块的布局和元素会有所不同。
* **功能操作区 (各页面内)**：通常位于页面上方或左侧，包含用户输入测试目标、配置参数（如 Ping 次数、HTTP 方法、DNS 记录类型等）的输入框、下拉菜单和按钮。
* **结果展示区 (各页面内)**：通常位于页面下方或右侧，以表格、文本区域或图表的形式展示网络测试或查询的结果。例如，IP 查询结果表格、Ping 输出文本、路由追踪路径列表等。

### 4.3 各功能操作步骤

本节详细介绍如何使用软件的各个功能模块。

#### 4.3.1 IP/域名地理位置查询

1. 在左侧导航菜单中点击"IP 查询"图标或文字，进入 IP 查询页面。
2. 页面左侧有一个大的文本输入区域。每行输入一个您要查询的 IP 地址或域名。您可以手动输入，也可以从其他地方复制粘贴。
3. （可选）如果您配置了 IP2Location 或 IPInfo 的 API 密钥，并且希望使用它们进行查询，可以在设置中选择对应的服务。
4. 点击输入区域下方的"开始查询"按钮。
5. 软件将开始逐个查询您输入的地址。查询结果会实时显示在页面右侧的表格中。
6. 表格包含列：原始输入、查询到的 IP、国家、地区、城市、ISP 和本次查询使用的服务。
7. 查询完成后，您可以点击表格上方的"导出 CSV"按钮将结果保存到本地文件。
8. 选中表格中的某一行（或多行），点击"添加到收藏夹"按钮，可以将该查询目标及其信息保存到收藏夹。

#### 4.3.2 Ping 测试

1. 在左侧导航菜单中点击"Ping 测试"图标或文字，进入 Ping 测试页面。
2. 页面上方有输入框用于输入要 Ping 的目标主机（IP 地址或域名）。
3. 输入框下方通常有用于配置测试参数的选项，例如：
    * **次数**：Ping 数据包的数量（默认通常为 4 次）。
    * **大小**：Ping 数据包的大小（字节）。
    * **超时**：等待每个回复的超时时间（秒）。
    根据需要调整这些参数。
4. 点击"开始测试"按钮。
5. 软件将在页面下方的文本区域实时显示 Ping 命令的输出。
6. 测试完成后，页面上方会显示总结性统计数据，如发送/接收/丢失数据包、丢包率、最小/平均/最大延迟等。

#### 4.3.3 HTTP 测试

1. 在左侧导航菜单中点击"HTTP 测试"图标或文字，进入 HTTP 测试页面。
2. 页面上方有输入框用于输入要测试的 URL (以 `http://` 或 `https://` 开头)。
3. 输入框旁边有下拉菜单，用于选择 HTTP 方法：GET, POST, HEAD。
4. 点击"开始测试"按钮。
5. 软件将显示测试结果，包括请求的 URL、使用的 HTTP 方法、响应时间（毫秒）和 HTTP 状态码（例如 200 表示成功，404 表示未找到）。

#### 4.3.4 DNS 测试

1. 在左侧导航菜单中点击"DNS 测试"图标或文字，进入 DNS 测试页面。
2. 页面上方有输入框用于输入要查询的域名。
3. 输入框旁边有下拉菜单，用于选择要查询的 DNS 记录类型，如 A, AAAA, CNAME, MX, TXT 等。
4. 点击"开始测试"按钮。
5. 软件将显示查询结果，列出该域名下指定记录类型的所有记录详情。

#### 4.3.5 MTR 测试

1. 在左侧导航菜单中点击"MTR 测试"图标或文字，进入 MTR 测试页面。
2. 页面上方有输入框用于输入目标主机（IP 或域名）。
3. （可选）输入框下方有用于配置 MTR 测试次数的选项。
4. 点击"开始测试"按钮。
5. 软件将在页面下方的文本区域实时显示 MTR 命令的输出。输出以表格形式展示路径上的每个跳跃点及其性能数据。
    > **注意**：使用此功能需要在您的操作系统中已安装 MTR 工具。

#### 4.3.6 路由追踪

1. 在左侧导航菜单中点击"路由追踪"图标或文字，进入路由追踪页面。
2. 页面上方有输入框用于输入目标主机（IP 或域名）。
3. （可选）输入框下方有用于配置最大跳数的选项。
4. 点击"开始测试"按钮。
5. 软件将在页面下方的文本区域实时显示路由追踪命令的输出，列出数据包经过的每个路由器。

#### 4.3.7 收藏夹功能

1. 在左侧导航菜单中点击"收藏夹"图标或文字，进入收藏夹页面。
2. 页面显示您已收藏的所有网络目标列表。
3. 列表的每一项显示目标的地址和您添加的备注。
4. 列表上方有搜索框，可以根据地址或备注快速过滤收藏项。
5. 点击列表项旁边的笔形图标，可以编辑该收藏项的地址或备注。
6. 点击列表项旁边的垃圾桶图标，可以删除该收藏项。
7. 列表项旁边还有快速启动按钮，点击对应的按钮可以直接开始该目标的 Ping, HTTP, DNS 等测试。
8. 在 IP 查询或其他测试页面中，选中结果后点击"添加到收藏夹"按钮也可以将目标添加到此处。

### 4.4 快捷键

* **打开开发者工具**：在开发模式下运行应用时，可以使用 `Ctrl + Shift + I` (Windows/Linux) 或 `Command + Shift + I` (macOS) 组合键快速打开 Electron 的开发者工具，用于检查元素、查看控制台输出、调试 JavaScript 代码等。

### 4.5 设置选项

软件可能提供设置页面，用于配置一些全局选项。通常在主界面菜单或某个特定按钮中进入。可能包含的设置项有：

* **IP 查询服务选择**：选择使用哪个第三方服务进行 IP 地理位置查询（如自动、IP-API、IPAPI、IP2Location、IPInfo）。
* **API 密钥配置**：输入和保存 IP2Location 或 IPInfo 的 API 密钥，以便使用这些服务。
* **IP 查询超时**：设置 IP 查询请求的超时时间。
* 其他可能的语言设置等。

请访问设置页面以查看和修改这些选项。

----

## 第五章 开发与测试

本章为希望贡献代码或深入了解软件内部机制的开发者提供指导。

### 5.1 开发环境要求

确保您的开发环境满足以下条件：

* **操作系统**: Windows 10+, macOS 10.14+, Ubuntu 18.04+ 或其他兼容的 Linux 发行版。建议在开发前更新操作系统到最新稳定版本。
* **Node.js**: 版本 16.0.0 或更高。推荐使用 Node Version Manager (nvm) 或类似的工具来安装和管理多个 Node.js 版本，以确保使用正确的版本。
* **npm 或 yarn**: 随 Node.js 安装，用于管理项目依赖。本项目主要使用 npm。
* **Git**: 用于版本控制和克隆项目仓库。
* **MTR 工具 (可选)**: 如果您需要在开发环境中测试 MTR 功能，请按照 4.1 章节的说明安装 MTR 工具。
* **推荐的开发工具**: Visual Studio Code, WebStorm 等支持 JavaScript/TypeScript, Vue, Node.js 和 Electron 开发的 IDE 或代码编辑器。安装相关的插件（如 Vue 语言特性支持、ESLint、Prettier）将有助于提高开发效率。

### 5.2 构建流程

本项目使用 Vite 作为前端构建工具，使用 Electron Builder 进行 Electron 应用的打包和构建。构建相关的命令都定义在 `package.json` 文件的 `scripts` 字段中，通过 `npm run` 命令执行。

构建流程通常包括以下几个步骤：

1. **前端构建**：使用 Vite 构建前端 Vue 应用，将源代码编译、打包、优化成静态文件（HTML, CSS, JavaScript）存放在 `dist` 目录下。命令通常是 `npm run build`。
2. **Electron 资源准备**：将主进程文件 (`main.js`)、预加载脚本 (`preload.js`) 以及其他 Electron 运行所需的资源（如 `package.json` 的一部分、`electron-store-wrapper.js`）准备好。
3. **依赖安装**：Electron Builder 会根据 `package.json` 中的 `dependencies` 安装应用运行所需的 Node.js 模块到应用的资源目录中。
4. **打包**：Electron Builder 将 Electron 运行时、前端静态文件、主进程/预加载脚本、依赖模块以及其他配置好的额外资源整合成一个应用目录结构。
5. **构建安装包/可执行文件**：根据 `package.json` 中的 `build` 配置和指定的平台/架构参数，将打包好的应用目录进一步处理，生成特定格式的安装包（如 Windows 的 NSIS `.exe`、macOS 的 `.dmg`）或可执行文件（如 Linux 的 `.AppImage`、Windows 的 `.zip` 免安装版）。

**常用构建命令**：

* `npm run dev`: 启动 Vite 开发服务器和 Electron 应用，用于开发调试，支持热重载。
* `npm run electron:dev`: 等同于 `npm run dev`。
* `npm run build`: 只构建前端静态文件。
* `npm run electron:build`: 执行前端构建后，再执行 Electron Builder 构建所有平台的默认架构版本。
* `npm run dist`: 等同于 `electron:build`。
* `npm run pack`: 执行前端构建后，使用 Electron Builder 只进行打包（生成应用目录），不生成最终安装包或可执行文件。
* `npm run dist:win`: 构建 Windows 平台（默认所有架构）。
* `npm run dist:win:x64`: 构建 Windows 64位架构。
* `npm run dist:win:ia32`: 构建 Windows 32位架构。
* `npm run dist:win:arm64`: 构建 Windows ARM64架构。
* `npm run dist:mac`: 构建 macOS 平台（默认 x64 和 arm64）。
* `npm run dist:mac:universal`: 构建 macOS 通用二进制包 (x64 + arm64)。
* `npm run dist:linux`: 构建 Linux 平台（默认所有架构）。
* `npm run dist:unsigned`: 构建所有平台的不签名版本，用于测试，避免签名配置问题。
* 其他分平台分架构的构建命令请参考 `package.json` 的 `scripts` 字段。

**Electron Builder 配置 (`package.json: build`)**：

`package.json` 文件中的 `build` 字段包含了 `electron-builder` 的详细配置项，这些配置决定了应用的打包方式、包含的文件、图标、应用名称、目标平台和格式、以及特定平台的详细设置（如 Windows NSIS 安装程序的配置）。开发者可以修改这些配置来定制构建过程。

### 5.3 测试情况

在软件开发过程中，主要采用了以下测试方法：

* **单元测试**: 针对前端或主进程中独立的函数和模块进行单元测试，验证其逻辑正确性。*(目前项目中尚未包含全面的自动化单元测试，主要依赖手动和集成测试)*。
* **集成测试**: 测试主进程和渲染进程之间的 IPC 通信以及不同模块之间的协作是否正常。例如，测试前端发起 Ping 请求后，主进程是否正确执行命令并返回结果。
* **手动功能测试**: 在开发模式 (`npm run electron:dev`) 和不同平台的构建产物上，由开发者手动执行软件的各项功能，检查其用户界面、交互逻辑和核心功能（网络测试、IP 查询、收藏夹管理）是否按预期工作，并验证在不同操作系统和架构下的兼容性。
* **回归测试**: 在代码修改或新功能添加后，重复执行关键的手动测试用例，确保修改没有引入新的问题或破坏现有功能。
* **安装包测试**: 下载构建好的安装包，在目标操作系统上进行安装、运行、使用和卸载测试，验证安装过程是否顺畅，应用是否能正常启动和运行，卸载是否彻底。

尽管本项目目前自动化测试覆盖不够全面，但通过上述不同层级的手动测试和集成测试，可以有效地发现和修复大部分功能性问题，确保软件的稳定性和可用性。

### 5.4 代码仓库

本项目源代码公开托管在 Gitee 平台：

```markdown
https://gitee.com/Snake-Konginchrist/MultiSiteLatencyTool-Desktop
```

欢迎开发者查阅代码、提交问题报告或通过 Pull Request 参与贡献。

----

## 第六章 附录

### 6.1 许可证

本项目遵循 [GNU General Public License v3.0 (GPL-3.0)](https://www.gnu.org/licenses/gpl-3.0.en.html) 开源协议。您可以在遵守协议条款的前提下自由使用、分发和修改本项目。详细的协议文本请查阅项目根目录下的 `LICENSE` 文件。

### 6.2 参考资料

* **Electron 官方文档**：[https://www.electronjs.org/docs](https://www.electronjs.org/docs) (了解 Electron 应用开发的基础知识、主进程/渲染进程、IPC 等)
* **Vue 3 官方文档**：[https://vuejs.org/](https://vuejs.org/) (了解 Vue 3 框架的使用，包括组件、响应式系统、组合式 API 等)
* **Element Plus 官方文档**：[https://element-plus.org/](https://element-plus.org/) (了解 UI 组件库的使用)
* **Electron Builder 文档**：[https://www.electron.build/](https://www.electron.build/) (了解如何配置和使用 Electron Builder 打包应用)
* **Node.js 官方文档**：[https://nodejs.org/api/](https://nodejs.org/api/) (查询 Node.js 内置模块如 `child_process`, `dns`, `http`, `https`, `path`, `util` 等的用法)
