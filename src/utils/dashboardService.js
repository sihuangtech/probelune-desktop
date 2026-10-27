const { app, safeStorage } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");
let sessions;
const file = () => path.join(app.getPath("userData"), "probelune-sessions.bin");
const persistent = () =>
  safeStorage.isEncryptionAvailable() &&
  (process.platform !== "linux" ||
    safeStorage.getSelectedStorageBackend() !== "basic_text");
async function load() {
  if (sessions) return;
  sessions = [];
  try {
    sessions = JSON.parse(safeStorage.decryptString(await fs.readFile(file())));
  } catch (error) {
    if (error.code !== "ENOENT")
      console.warn("Saved dashboard credentials could not be unlocked");
  }
}
async function save() {
  // 系统密钥环不可用时仅保留内存会话，禁止降级为明文凭据文件。
  if (!persistent()) return;
  await fs.mkdir(path.dirname(file()), { recursive: true });
  await fs.writeFile(
    file() + ".tmp",
    safeStorage.encryptString(JSON.stringify(sessions)),
    { mode: 0o600 },
  );
  await fs.rename(file() + ".tmp", file());
}
const publicSession = (s) => ({
  id: s.id,
  url: s.url,
  username: s.username,
  role: s.role,
  expires: s.expires,
  persistent: persistent(),
});
async function request(session, route, method = "GET", body) {
  if (
    !/^\/(overview|monitors|nodes|diagnostics|incidents|auth\/logout)(\/[^?#]+)?(\?[^#]*)?$/.test(
      route,
    ) ||
    !["GET", "POST", "PUT", "DELETE"].includes(method)
  )
    throw new Error("Unsupported dashboard request");
  const response = await fetch(session.url + "/api/v1" + route, {
    method,
    redirect: "error",
    signal: AbortSignal.timeout(15000),
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + session.token,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  if (text.length > 8 * 1024 * 1024)
    throw new Error("Dashboard response is too large");
  const value = text ? JSON.parse(text) : null;
  if (!response.ok) throw new Error(value?.error || `HTTP ${response.status}`);
  return value;
}
module.exports = {
  async execute(action, payload = {}) {
    await load();
    if (action === "list") return sessions.map(publicSession);
    if (action === "connect") {
      const url = new URL(payload.url);
      if (
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        !["", "/"].includes(url.pathname) ||
        (url.protocol !== "https:" &&
          !(url.protocol === "http:" && payload.allowHttp))
      )
        throw new Error("Use an HTTPS origin, or explicitly allow HTTP");
      const response = await fetch(url.origin + "/api/v1/auth/login", {
        method: "POST",
        redirect: "error",
        signal: AbortSignal.timeout(15000),
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Probelune Desktop",
        },
        body: JSON.stringify({
          username: payload.username,
          password: payload.password,
        }),
      });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || "Sign-in failed");
      const s = {
        id: randomUUID(),
        url: url.origin,
        username: value.user.username,
        role: value.user.role,
        token: value.token,
        expires: value.expires,
      };
      sessions = sessions.filter(
        (v) => v.url !== s.url || v.username !== s.username,
      );
      sessions.push(s);
      await save();
      return publicSession(s);
    }
    const session = sessions.find((v) => v.id === payload.id);
    if (!session) throw new Error("Select a dashboard instance");
    if (action === "disconnect") {
      let warning = "";
      try {
        await request(session, "/auth/logout", "POST");
      } catch {
        warning =
          "Remote revocation unavailable; revoke the session in the dashboard.";
      }
      sessions = sessions.filter((s) => s.id !== session.id);
      await save();
      return { warning };
    }
    if (action === "request")
      return request(session, payload.path, payload.method, payload.body);
    throw new Error("Unknown dashboard action");
  },
};
