// 图片压缩：最长边压到 maxSize，转 JPEG，控制本地存储体积
// 任何一步失败都回退为原始文件，保证"能传上去"优先于"压得小"
export function compressImage(file, maxSize = 1600, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    // 兜底定时器：个别机型 onload/onerror 都不触发时也能返回
    const fallbackTimer = setTimeout(() => {
      URL.revokeObjectURL(url)
      resolve(file)
    }, 8000)

    img.onload = () => {
      try {
        let { width, height } = img
        if (Math.max(width, height) > maxSize) {
          const ratio = maxSize / Math.max(width, height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => {
            clearTimeout(fallbackTimer)
            URL.revokeObjectURL(url)
            resolve(blob || file)
          },
          'image/jpeg',
          quality
        )
      } catch (e) {
        clearTimeout(fallbackTimer)
        URL.revokeObjectURL(url)
        resolve(file)
      }
    }
    img.onerror = () => {
      clearTimeout(fallbackTimer)
      URL.revokeObjectURL(url)
      resolve(file) // 解码失败（如超大图/特殊格式）时直接用原图
    }
    img.src = url
  })
}

// Blob -> 可显示 URL（WeakMap 缓存，避免重复创建）
const urlCache = new WeakMap()
export function blobUrl(blob) {
  if (!blob) return ''
  if (!urlCache.has(blob)) {
    urlCache.set(blob, URL.createObjectURL(blob))
  }
  return urlCache.get(blob)
}
