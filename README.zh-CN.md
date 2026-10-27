# 巡汐 Probelune 桌面端

[English](README.md) · [网页面板](https://github.com/sihuangtech/probelune-dashboard) · [产品与 PRD](https://github.com/sihuangtech/probelune)

Electron + Vue 桌面诊断工具。无需服务器即可使用本地 IP 查询、HTTP、Ping、DNS、MTR 和路由追踪；连接面板后，可对比本机与远程节点的观测结果。

## 功能

- 独立本地工具、收藏、历史记录与中英文界面。
- 多面板连接，支持时使用操作系统加密保存会话。
- 真实监测概览、本机与远端对照，结果明确标注来源。
- 收藏导入预览、节点选择、已有目标跳过，不覆盖远端配置。
- 远程即时任务、取消与脱敏结果导出。
- 命令参数数组、超时与输出限制、正常证书校验和隔离的 IPC。

## 运行

使用 Node.js 26+ 和 npm，不需要同级仓库即可运行本地工具。

```sh
git clone https://github.com/sihuangtech/probelune-desktop.git
cd probelune-desktop
npm ci
npm run electron:dev
```

生产渲染构建可执行 `npm run build && npm start`。从 Probelune 入口输入面板 HTTPS 地址并登录；HTTP 仅供显式允许的受控开发网络。桌面端不会自动变成持续探测节点。

地理位置查询可能访问第三方服务，地理注释不证明真实物理位置。MTR/路由追踪需要系统工具与权限；缺失时报告能力问题，不能把中间跳点不响应直接判为链路故障。

## 打包

```sh
npm run pack
npm run dist:mac
npm run dist:win
npm run dist:linux
```

各平台正式发布需在对应系统构建并配置签名/公证。本地已生成 macOS arm64 无签名应用；渲染构建成功不代表签名安装包验收通过。开发打包可在构建网页后执行 `CSC_IDENTITY_AUTO_DISCOVERY=false npm exec electron-builder -- --mac --dir --publish never`。

## 迁移与安全

仓库已更名为 **sihuangtech/probelune-desktop**，保留原 Git 历史。为读取旧用户收藏与设置，应用 ID `cn.skstudio.multisitetool` 和数据目录 `multi-site-monitor` 保持兼容，界面名称统一为 Probelune。详见[迁移和开发说明](docs/PROBELUNE.md)。

面板令牌只在主进程中使用；支持时通过 OS safeStorage 加密。没有可靠加密后端的环境仅保存在内存。断开连接尝试远程退出并清除本地连接；面板不可达时可能仍需从网页撤销会话。

[更新记录](CHANGELOG.md) · [贡献](CONTRIBUTING.md) · [安全](SECURITY.md) · [验收](https://github.com/sihuangtech/probelune/blob/main/docs/acceptance.md)

采用 [GPL-3.0-or-later](LICENSE)，保留原作者与版权声明。


## 星标历史

[![星标历史](https://api.star-history.com/svg?repos=sihuangtech/probelune-desktop&type=Date)](https://star-history.com/#sihuangtech/probelune-desktop&Date)

## 联系开发者

- 开发者: [Snake Konginchrist](https://github.com/Snake-Konginchrist)
- 邮箱: [developer@skstudio.cn](mailto:developer@skstudio.cn)
- 问题反馈: [GitHub Issues](https://github.com/sihuangtech/probelune-desktop/issues)
