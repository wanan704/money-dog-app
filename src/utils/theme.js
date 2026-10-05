import { ref } from 'vue'
import { getSetting, setSetting } from '../db'

// 全局主题：light / dark
export const themeMode = ref('light')

export async function initTheme() {
  themeMode.value = await getSetting('themeMode', 'light')
  applyTheme()
}

export async function setTheme(mode) {
  themeMode.value = mode
  await setSetting('themeMode', mode)
  applyTheme()
}

function applyTheme() {
  const dark = themeMode.value === 'dark'
  // dark：我们自己的样式；van-theme-dark：Vant 组件（含 teleport 到 body 的弹窗）
  document.documentElement.classList.toggle('dark', dark)
  document.documentElement.classList.toggle('van-theme-dark', dark)
}
