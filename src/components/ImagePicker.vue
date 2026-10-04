<template>
  <van-uploader
    v-model="fileList"
    multiple
    :max-count="maxCount"
    accept="image/*"
    :after-read="afterRead"
    @delete="onDelete"
    upload-text="添加图片"
  />
</template>

<script setup>
import { ref, watch } from 'vue'
import { showToast } from 'vant'
import { compressImage, blobUrl } from '../utils/image'

// v-model 绑定 Blob 数组，组件内部负责压缩与预览
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  maxCount: { type: Number, default: 9 }
})
const emit = defineEmits(['update:modelValue'])

const fileList = ref([])

// 外部数据 -> 预览列表（仅初始化/外部重置时同步）
watch(
  () => props.modelValue,
  (val) => {
    if (val.length !== fileList.value.length) {
      fileList.value = val.map((blob) => ({ url: blobUrl(blob) }))
    }
  },
  { immediate: true }
)

async function afterRead(items) {
  const list = Array.isArray(items) ? items : [items]
  const blobs = [...props.modelValue]
  for (const item of list) {
    try {
      blobs.push(await compressImage(item.file))
    } catch (e) {
      showToast(e.message)
    }
  }
  emit('update:modelValue', blobs)
}

function onDelete(item, { index }) {
  const blobs = [...props.modelValue]
  blobs.splice(index, 1)
  emit('update:modelValue', blobs)
}
</script>
