// Vue 响应式对象不能跨 Electron contextBridge；先转成 JSON 协议对象。
export const invoke = (channel, ...args) =>
  window.electronAPI.invoke(channel, ...JSON.parse(JSON.stringify(args)));
