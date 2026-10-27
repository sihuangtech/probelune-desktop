// 应用信息配置
export const appInfo = {
  name: {
    'zh-CN': '巡汐 Probelune', // 应用名称（中文）
    'en-US': 'Probelune' // 应用名称（英文）
  },
  // 直接使用全局注入的版本和构建日期
  version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '未知版本',
  buildDate: typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : '未知构建日期'
}

// 获取应用信息
export const getAppInfo = () => {
  // 直接返回 appInfo 对象
  return appInfo;
}

// 获取应用名称（根据语言）
export const getAppName = (language = 'zh-CN') => {
  return appInfo.name[language] || appInfo.name['zh-CN']
}

// 获取版本信息
export const getVersion = () => {
  // 直接返回 appInfo 中的版本
  return appInfo.version;
}

// 获取构建信息
export const getBuildInfo = (language = 'zh-CN') => {
  return {
    version: appInfo.version,
    buildDate: appInfo.buildDate
  }
}
