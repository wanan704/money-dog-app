import { showToast } from 'vant'
import { getSetting } from '../db'

// 每日提醒：App 打开期间生效（PWA 限制，需保持浏览器后台运行）
let timer = null

export async function requestNotifyPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  return await Notification.requestPermission()
}

function msUntilNext(hour, minute) {
  const now = new Date()
  const next = new Date()
  next.setHours(hour, minute, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  return next - now
}

async function fire() {
  const text = '写今天的成功日记，翻一翻梦想相册吧'
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification('钱钱日记提醒你', { body: text, icon: './icons/icon-192.png' })
    } catch (e) {
      showToast(text)
    }
  } else {
    showToast(text)
  }
  schedule() // 安排下一天
}

async function schedule() {
  clearTimeout(timer)
  const enabled = await getSetting('reminderEnabled', false)
  if (!enabled) return
  const time = (await getSetting('reminderTime', '21:00')).split(':')
  timer = setTimeout(fire, msUntilNext(Number(time[0]), Number(time[1])))
}

export function initReminder() {
  schedule()
  // 从后台切回前台时重新校准
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) schedule()
  })
}

export function rescheduleReminder() {
  schedule()
}
