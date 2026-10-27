# Probelune migration and development

This repository preserves the former `multisiteprobe-desktop-community` history. Existing clones can run `git remote set-url origin https://github.com/sihuangtech/probelune-desktop.git`. No force-push or new unrelated history is needed.

The visible product name is Probelune. `cn.skstudio.multisitetool` and the existing `multi-site-monitor` user-data path are retained deliberately. Do not delete that directory to upgrade. Existing local favorites remain local; import is an explicit preview followed by monitor creation. Existing remote targets are skipped and failures are reported per item.

## Module boundaries

- `main.js`: window lifecycle, navigation permissions and trusted IPC registration.
- `preload.js`: narrow context-isolated bridge.
- `src/utils/*Service.js`: local adapters and main-process dashboard transport.
- `src/services/desktopApi.js`: serializable renderer calls; Vue proxies never cross IPC directly.
- `DashboardView.vue` and dashboard components: connections, overview, import and comparisons.
- Existing local views and stores remain independent of the dashboard.

HTTP diagnostics are GET/HEAD only, bounded to 1 MiB, validate TLS by default and do not fall back to plaintext. Custom DNS queries create independent resolvers. Ping/MTR/traceroute use validated hosts and argument arrays, with bounded execution. Geographic annotation failures do not erase route evidence. Desktop execution takes the user's local network privileges; it is not the server's remotely delegated node policy.

Dashboard requests reject redirects and require HTTPS unless explicitly allowed. Passwords are used only for login. Saved session records use `safeStorage`; insecure Linux basic-text backends result in memory-only connections. Exports include summary fields rather than raw response bodies, headers or target URLs. The IP lookup feature necessarily contacts configured third-party geolocation services; see its UI settings.

## Development and validation

Use `npm ci`, `npm run electron:dev`, `npm run build` and the platform packaging scripts in package.json. For dependency range upgrades use `npm exec --yes npm-check-updates -- -u`, then `npm install`; inspect breaking changes, never hand-edit lockfiles. The repository retains its CJS main process and uses `vite.config.mjs` for current Vite's ESM configuration.

实际验证应覆盖本地诊断、带错误的目标、不同角色、面板离线、会话撤销、收藏导入与真实 Electron 窗口。不要仅凭 Vite 构建通过宣称整个桌面功能或各系统安装包已验证。旧文档和 [原 README](README-legacy.md)保留作历史参考，当前入口和约束以双语 README 与本文为准。
