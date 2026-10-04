<template>
  <van-popup :show="show" position="bottom" round :style="{ height: '72%' }" @update:show="close">
    <div class="editor">
      <div class="editor-header">
        <span class="editor-title">{{ entry ? '编辑记录' : '记一笔成功' }}</span>
        <van-button size="small" type="primary" round :disabled="!content.trim()" @click="save">
          保存
        </van-button>
      </div>

      <van-cell title="日期" :value="dateText" is-link @click="showCalendar = true" />
      <van-field
        v-model="content"
        type="textarea"
        rows="4"
        maxlength="500"
        show-word-limit
        placeholder="今天做成了什么事？再小也算数"
        :border="false"
      />
      <div class="picker-wrap">
        <ImagePicker v-model="images" />
      </div>

      <van-calendar v-model:show="showCalendar" :min-date="minDate" :max-date="maxDate" @confirm="onPickDate" />
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'
import { showToast } from 'vant'
import { db } from '../db'
import ImagePicker from './ImagePicker.vue'

const props = defineProps({
  show: { type: Boolean, default: false },
  entry: { type: Object, default: null },     // 传入则为编辑
  defaultDate: { type: String, default: '' }  // 新增时的默认日期
})
const emit = defineEmits(['update:show', 'saved'])

const content = ref('')
const images = ref([])
const date = ref(dayjs().format('YYYY-MM-DD'))
const showCalendar = ref(false)

const dateText = computed(() => dayjs(date.value).format('YYYY年M月D日'))
const minDate = new Date(2020, 0, 1)
const maxDate = new Date()

watch(
  () => props.show,
  (val) => {
    if (!val) return
    content.value = props.entry?.content || ''
    images.value = [...(props.entry?.images || [])]
    date.value = props.entry?.date || props.defaultDate || dayjs().format('YYYY-MM-DD')
  }
)

function onPickDate(d) {
  date.value = dayjs(d).format('YYYY-MM-DD')
  showCalendar.value = false
}

function close() {
  emit('update:show', false)
}

async function save() {
  const now = Date.now()
  if (props.entry?.id) {
    await db.diary.update(props.entry.id, {
      date: date.value,
      content: content.value.trim(),
      images: images.value,
      updatedAt: now
    })
  } else {
    await db.diary.add({
      date: date.value,
      content: content.value.trim(),
      images: images.value,
      createdAt: now,
      updatedAt: now
    })
  }
  showToast('已记下，做得好')
  emit('saved')
  close()
}
</script>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
}
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.editor-title {
  font-size: 16px;
  font-weight: 500;
}
.picker-wrap {
  padding: 8px 16px;
}
</style>
