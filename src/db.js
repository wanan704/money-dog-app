import Dexie from 'dexie'

// 本地数据库：所有数据只存在本机浏览器 IndexedDB 中
export const db = new Dexie('moneyDogDB')

db.version(1).stores({
  diary: '++id, date, createdAt',        // { id, date: 'YYYY-MM-DD', content, images: Blob[], createdAt, updatedAt }
  wishes: '++id, done, isTop3, createdAt', // { id, title, desc, cover: Blob|null, targetAmount, isTop3, done, doneAt, createdAt }
  wishImages: '++id, wishId, createdAt', // { id, wishId, image: Blob, createdAt }
  savings: '++id, wishId, createdAt',    // { id, wishId, amount, note, createdAt }
  settings: 'key'                        // { key, value }
})

export async function getSetting(key, def = null) {
  const row = await db.settings.get(key)
  return row ? row.value : def
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value })
}

// 计算连续记录天数（今天没记则从头一天往前算）
export async function calcStreak() {
  const all = await db.diary.orderBy('date').reverse().uniqueKeys()
  const days = new Set(all)
  if (days.size === 0) return 0
  const fmt = (d) => d.toISOString().slice(0, 10)
  let cursor = new Date()
  if (!days.has(fmt(cursor))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(fmt(cursor))) return 0
  }
  let streak = 0
  while (days.has(fmt(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}
