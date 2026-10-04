import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import dayjs from 'dayjs'
import { db } from '../db'

// 导出：data.json + 图片文件打包成 zip
export async function exportBackup() {
  const zip = new JSZip()
  const data = { version: 1, exportedAt: new Date().toISOString() }

  const addBlob = async (zipFolder, name, blob) => {
    zipFolder.file(name, blob)
    return `images/${name}`
  }
  const imgDir = zip.folder('images')
  let imgSeq = 0

  // 日记（含图片）
  const diaryRows = await db.diary.toArray()
  data.diary = []
  for (const row of diaryRows) {
    const imagePaths = []
    for (const blob of row.images || []) {
      imagePaths.push(await addBlob(imgDir, `img_${imgSeq++}.jpg`, blob))
    }
    data.diary.push({ ...row, images: undefined, imagePaths })
  }

  // 愿望（含封面）
  const wishRows = await db.wishes.toArray()
  data.wishes = []
  for (const row of wishRows) {
    let coverPath = null
    if (row.cover) coverPath = await addBlob(imgDir, `img_${imgSeq++}.jpg`, row.cover)
    data.wishes.push({ ...row, cover: undefined, coverPath })
  }

  // 愿望图片墙
  const wishImgRows = await db.wishImages.toArray()
  data.wishImages = []
  for (const row of wishImgRows) {
    const imagePath = await addBlob(imgDir, `img_${imgSeq++}.jpg`, row.image)
    data.wishImages.push({ ...row, image: undefined, imagePath })
  }

  data.savings = await db.savings.toArray()
  data.settings = await db.settings.toArray()

  zip.file('data.json', JSON.stringify(data, null, 2))
  const content = await zip.generateAsync({ type: 'blob' })
  saveAs(content, `钱钱日记备份_${dayjs().format('YYYYMMDD_HHmm')}.zip`)
}

// 导入：清空现有数据并恢复（调用前需用户确认）
export async function importBackup(file) {
  const zip = await JSZip.loadAsync(file)
  const data = JSON.parse(await zip.file('data.json').async('string'))

  const readBlob = async (path) => {
    if (!path) return null
    return await zip.file(path).async('blob')
  }

  await db.transaction('rw', [db.diary, db.wishes, db.wishImages, db.savings, db.settings], async () => {
    await Promise.all([db.diary.clear(), db.wishes.clear(), db.wishImages.clear(), db.savings.clear()])

    for (const row of data.diary || []) {
      const images = []
      for (const p of row.imagePaths || []) images.push(await readBlob(p))
      const { imagePaths, ...rest } = row
      await db.diary.add({ ...rest, images })
    }
    for (const row of data.wishes || []) {
      const cover = await readBlob(row.coverPath)
      const { coverPath, ...rest } = row
      await db.wishes.add({ ...rest, cover })
    }
    for (const row of data.wishImages || []) {
      const image = await readBlob(row.imagePath)
      const { imagePath, ...rest } = row
      await db.wishImages.add({ ...rest, image })
    }
    for (const row of data.savings || []) await db.savings.add(row)
    for (const row of data.settings || []) await db.settings.put(row)
  })
}
