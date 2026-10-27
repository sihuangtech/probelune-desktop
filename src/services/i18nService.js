import { ref, reactive } from 'vue'
import zhCN from '../locales/zh-CN.js'
import enUS from '../locales/en-US.js'
import storageService from './storage.js'
import { appInfo } from '../config/appInfo'

// 语言包
const messages = {
  'zh-CN': zhCN,
  'en-US': enUS
}

// 当前语言
const currentLanguage = ref('zh-CN')

// 应用版本和构建日期
const appVersion = ref('未知版本')
const buildDate = ref('未知构建日期')

// 当前主题
const currentTheme = ref('light')

// 响应式的翻译函数
const t = (key, params = {}) => {
  const keys = key.split('.')
  let value = messages[currentLanguage.value]

  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k]
    } else {
      return key // 如果找不到翻译，返回原key
    }
  }

  if (typeof value === 'string') {
    // 简单的参数替换
    return value.replace(/\{(\w+)\}/g, (match, param) => {
      return params[param] || match
    })
  }

  return key
}

// 设置语言
const setLanguage = (lang) => {
  if (messages[lang]) {
    currentLanguage.value = lang
    // 保存到本地存储
    const uiSettings = storageService.getSettings('ui') || {}
    uiSettings.language = lang
    storageService.saveSettings('ui', uiSettings)

    // 更新HTML lang属性
    document.documentElement.lang = lang

    // 更新窗口标题
    updateWindowTitle()

    console.log('语言已切换到:', lang)
  }
}

// 更新窗口标题函数
const updateWindowTitle = () => {
  const appTitle = currentLanguage.value.startsWith('zh')
    ? appInfo.name['zh-CN']
    : appInfo.name[currentLanguage.value];
  document.title = appTitle;
  console.log('窗口标题已更新:', appTitle);
}

// 设置主题
const setTheme = (theme) => {
  currentTheme.value = theme

  // 应用主题到HTML
  const html = document.documentElement
  html.classList.remove('light', 'dark')

  if (theme === 'auto') {
    // 跟随系统主题
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    html.classList.add(prefersDark ? 'dark' : 'light')

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (currentTheme.value === 'auto') {
        html.classList.remove('light', 'dark')
        html.classList.add(e.matches ? 'dark' : 'light')
      }
    })
  } else {
    html.classList.add(theme)
  }

  // 保存到本地存储
  const uiSettings = storageService.getSettings('ui') || {}
  uiSettings.theme = theme
  storageService.saveSettings('ui', uiSettings)

  console.log('主题已切换到:', theme)
}

// 获取当前语言
const getCurrentLanguage = () => currentLanguage.value

// 获取当前主题
const getCurrentTheme = () => currentTheme.value

// 获取可用语言列表
const getAvailableLanguages = () => {
  return [
    { value: 'zh-CN', label: '简体中文' },
    { value: 'en-US', label: 'English' }
  ]
}

// 获取可用主题列表
const getAvailableThemes = () => {
  return [
    { value: 'light', label: t('settings.lightTheme') || '浅色主题' },
    { value: 'dark', label: t('settings.darkTheme') || '深色主题' },
    { value: 'auto', label: t('settings.autoTheme') || '跟随系统' }
  ]
}

// 初始化
const init = async () => {
  // 从本地存储加载设置
  const uiSettings = storageService.getSettings('ui') || {}

  // 设置语言
  const savedLanguage = uiSettings.language || 'zh-CN'
  setLanguage(savedLanguage)

  // 设置主题
  const savedTheme = uiSettings.theme || 'light'
  setTheme(savedTheme)

  // 获取应用版本和构建日期（确保在 Electron 环境下）
  if (window.electronAPI) {
    try {
      appVersion.value = await window.electronAPI.getAppVersion();
      buildDate.value = await window.electronAPI.getBuildDate();
      console.log('获取到应用版本:', appVersion.value);
      console.log('获取到构建日期:', buildDate.value);
    } catch (error) {
      console.error('获取应用版本或构建日期失败:', error);
    }
  } else {
    console.warn('非 Electron 环境，无法获取应用版本和构建日期');
  }
}

export default {
  t,
  setLanguage,
  setTheme,
  getCurrentLanguage,
  getCurrentTheme,
  getAvailableLanguages,
  getAvailableThemes,
  init,
  currentLanguage,
  currentTheme,
  appVersion, // 暴露给其他组件
  buildDate // 暴露给其他组件
}
