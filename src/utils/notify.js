import { showToast } from 'vant'
import dayjs from 'dayjs'
import { getSetting, setSetting } from '../db'

// 每日提醒：App 打开期间定时触发 + 打开时补发错过的提醒
let timer = null

export async function requestNotifyPermission() {
  if (!('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  return await Notification.requestPermission()
}

// 安卓 Chrome 必须通过 ServiceWorkerRegistration 发通知，直接 new Notification 会失败
async function showNotification(title, body) {
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(title, {
        body,
        icon: './icons/icon-192.png',
        badge: './icons/icon-192.png'
      })
      return true
    }
  } catch (e) {
    // 继续尝试降级方案
  }
  try {
    new Notification(title, { body, icon: './icons/icon-192.png' })
    return true
  } catch (e) {
    showToast(body)
    return false
  }
}

// 供"测试通知"按钮使用
export async function testNotification() {
  return await showNotification('钱钱日记', '通知功能正常，今晚记得写成功日记')
}

function msUntilNext(hour, minute) {
  const now = new Date()
  const next = new Date()
  next.setHours(hour, minute, 0, 0)
  if (next <= now) next.setDate(next.getDate() + 1)
  return next - now
}

async function fire() {
  await setSetting('lastRemindedDate', dayjs().format('YYYY-MM-DD'))
  await showNotification('钱钱日记提醒你', '写今天的成功日记，翻一翻梦想相册吧')
  schedule() // 安排下一次
}

async function schedule() {
  clearTimeout(timer)
  const enabled = await getSetting('reminderEnabled', false)
  if (!enabled) return
  const [h, m] = (await getSetting('reminderTime', '21:00')).split(':').map(Number)
  timer = setTimeout(fire, msUntilNext(h, m))

  // 补发逻辑：今天已过提醒时间但还没提醒过（比如白天没打开 App）
  const today = dayjs().format('YYYY-MM-DD')
  const last = await getSetting('lastRemindedDate', '')
  if (last !== today) {
    const now = new Date()
    if (now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m)) {
      await fire()
    }
  }
}

export function initReminder() {
  schedule()
  // 从后台切回前台时重新校准（顺便补发）
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) schedule()
  })
}

export function rescheduleReminder() {
  schedule()
}
