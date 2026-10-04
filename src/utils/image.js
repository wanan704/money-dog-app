// 图片压缩：最长边压到 maxSize，转 JPEG，控制本地存储体积
export function compressImage(file, maxSize = 1600, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
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
          URL.revokeObjectURL(url)
          blob ? resolve(blob) : reject(new Error('图片压缩失败'))
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片读取失败'))
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
