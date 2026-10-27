"use strict";
const {
  app,
  BrowserWindow,
  ipcMain,
  shell,
  Menu,
  session,
} = require("electron");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const handlers = require("./src/utils/ipcHandlers");
const dashboard = require("./src/utils/dashboardService");
const isDev = process.env.NODE_ENV === "development";
const entry = pathToFileURL(path.join(__dirname, "dist/index.html")).href;
// 保留旧版数据目录，升级品牌后仍可读取用户收藏和设置。
app.setPath(
  "userData",
  path.join(app.getPath("appData"), "multi-site-monitor"),
);
function trusted(event) {
  const frame = event.senderFrame;
  return (
    frame &&
    frame === event.sender.mainFrame &&
    (isDev
      ? new URL(frame.url).origin === "http://localhost:3000"
      : frame.url.split("#")[0] === entry)
  );
}
function handle(channel, callback) {
  ipcMain.handle(channel, (event, ...args) => {
    if (!trusted(event)) throw new Error("Untrusted IPC sender");
    return callback(event, ...args);
  });
}
function external(url) {
  const u = new URL(url);
  if (!["https:", "http:"].includes(u.protocol) || u.username || u.password)
    throw new Error("Unsupported URL");
  return shell.openExternal(u.href);
}
function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 850,
    minHeight: 600,
    title: "Probelune · 巡汐",
    icon: path.join(__dirname, "assets/icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      additionalArguments: [`--probelune-version=${app.getVersion()}`],
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    external(url).catch(() => {});
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    if (
      url !== entry &&
      !(isDev && new URL(url).origin === "http://localhost:3000")
    )
      event.preventDefault();
  });
  if (isDev) window.loadURL("http://localhost:3000");
  else window.loadFile("dist/index.html");
}
app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, _permission, callback) => callback(false),
  );
  Menu.setApplicationMenu(null);
  createWindow();
  app.on("activate", () => {
    if (!BrowserWindow.getAllWindows().length) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
const channels = {
  "resolve-dns": handlers.handleDnsResolve,
  "dns-test": handlers.handleDnsTest,
  "ping-test": handlers.handlePingTest,
  "http-test": handlers.handleHttpTest,
  "ip2location-lookup": handlers.handleIp2LocationLookup,
  "check-mtr-status": handlers.handleCheckMtrStatus,
  "check-traceroute-status": handlers.handleCheckTracerouteStatus,
  "mtr-test": handlers.handleMtrTest,
  "traceroute-test": handlers.handleTracerouteTest,
};
for (const [name, handler] of Object.entries(channels)) handle(name, handler);
handle("open-external", (_event, url) => external(url));
handle("dashboard", (_event, action, payload) =>
  dashboard.execute(action, payload),
);
