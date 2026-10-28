# Probelune Desktop

[简体中文](README.zh-CN.md) · [Dashboard](https://github.com/sihuangtech/probelune-dashboard) · [Product / PRD](https://github.com/sihuangtech/probelune)

**Probelune (巡汐)** desktop diagnostics, built with Electron and Vue. Use local IP lookup, HTTP, Ping, DNS, MTR and traceroute without a server, or connect to your dashboard to compare this computer with remote probe locations.

## Features

- Independent local diagnostic tools, saved targets, history and English/Chinese UI.
- Multiple dashboard connections with encrypted session storage where the OS supports it.
- Live multi-node monitoring overview and explicitly labelled local/remote comparisons.
- Preview local favorite imports, select execution nodes and skip existing targets.
- One-off remote jobs, cancellation and redacted comparison exports.
- Structured process arguments, bounded command/network execution, normal TLS verification and isolated renderer IPC.

## Run from source

Use Node.js 26+ and npm. No adjacent repository is required for local tools.

```sh
git clone https://github.com/sihuangtech/probelune-desktop.git
cd probelune-desktop
npm ci
npm run electron:dev
```

For a production renderer: `npm run build && npm start`. Open the Probelune panel entry to add a dashboard HTTPS origin and sign in. HTTP requires explicit opt-in for controlled development networks. Local tools keep working without a dashboard. Remote checks require nodes registered with the dashboard; the desktop does not become a continuous background node.

IP geolocation may query external services and is an annotation, not proof of physical location. MTR/traceroute require suitable host tools/permissions; missing capabilities are reported. Never interpret an unresponsive intermediate router as definitive link failure.

## Packaging

```sh
npm run pack
npm run dist:mac
npm run dist:win
npm run dist:linux
```

Run each release build on its target OS with the required signing/notarization setup. Local validation produced an unsigned macOS arm64 `.app`; CI checks other platforms separately. A renderer build is not evidence of a signed installer's behavior. `CSC_IDENTITY_AUTO_DISCOVERY=false npm exec electron-builder -- --mac --dir --publish never` creates an unsigned local macOS package after the renderer is built.

## Migration and security

This is the renamed repository **sihuangtech/probelune-desktop**, retaining the former desktop project's Git history. The legacy application ID `cn.skstudio.multisitetool` and data directory `multi-site-monitor` remain to preserve existing settings/favorites. The user-facing product name is Probelune. See [migration and development](docs/PROBELUNE.md).

Dashboard tokens stay in the main process. OS `safeStorage` encrypts saved connections; where secure encryption is unavailable the app uses memory-only sessions. Disconnect attempts remote logout and removes the local connection. An offline failure may require revocation through the dashboard later.

[Changelog](CHANGELOG.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Acceptance](https://github.com/sihuangtech/probelune/blob/main/docs/acceptance.md)

GPL-3.0-or-later; original authorship and license notices are retained. [LICENSE](LICENSE).

## Star History

[![Star history](https://api.star-history.com/svg?repos=sihuangtech/probelune-desktop&type=Date)](https://star-history.com/#sihuangtech/probelune-desktop&Date)

## Contact

- Developer: [Snake Konginchrist](https://github.com/Snake-Konginchrist)
- Email: [developer@skstudio.cn](mailto:developer@skstudio.cn)
- Feedback: [GitHub Issues](https://github.com/sihuangtech/probelune-desktop/issues)
