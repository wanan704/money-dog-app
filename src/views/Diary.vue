<template>
  <div class="page">
    <van-nav-bar title="成功日记">
      <template #right>
        <van-icon name="replay" size="20" @click="drawRandom" />
      </template>
    </van-nav-bar>

    <!-- 月历 -->
    <div class="card">
      <div class="cal-header">
        <van-icon name="arrow-left" @click="shiftMonth(-1)" />
        <span>{{ monthLabel }}</span>
        <van-icon name="arrow" @click="shiftMonth(1)" />
      </div>
      <div class="cal-grid">
        <div v-for="w in ['一','二','三','四','五','六','日']" :key="w" class="cal-week">{{ w }}</div>
        <div
          v-for="cell in calendarCells"
          :key="cell.key"
          class="cal-day"
          :class="{ dim: !cell.inMonth, active: cell.date === selectedDate, today: cell.date === today }"
          @click="selectDate(cell)"
        >
          {{ cell.day }}
          <span v-if="cell.count" class="dot">{{ cell.count > 9 ? '9+' : cell.count }}</span>
        </div>
      </div>
      <div class="cal-footer">
        <van-button size="mini" plain type="primary" @click="selectedDate = ''">
          {{ selectedDate ? '查看全部' : '全部记录' }}
        </van-button>
        <span v-if="selectedDate" class="muted">正在看 {{ selectedDate }}</span>
      </div>
    </div>

    <!-- 条目列表 -->
    <div v-if="entries.length === 0" class="card muted">
      {{ selectedDate ? '这一天还没有记录' : '还没有记录，点右下角写下第一条吧' }}
    </div>
    <div v-for="e in entries" :key="e.id" class="card entry" @click="editEntry(e)">
      <div class="entry-head">
        <span class="muted">{{ e.date }}</span>
        <van-icon name="delete-o" color="#c8c9cc" @click.stop="removeEntry(e)" />
      </div>
      <div class="entry-content">{{ e.content }}</div>
      <div v-if="e.images?.length" class="entry-images">
        <img
          v-for="(img, i) in e.images"
          :key="i"
          :src="blobUrl(img)"
          @click.stop="preview(e, i)"
        />
      </div>
    </div>

    <van-button class="fab" type="primary" round icon="plus" size="large" @click="addEntry" />

    <DiaryEditor
      v-model:show="showEditor"
      :entry="editingEntry"
      :default-date="selectedDate"
      @saved="load"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import { showConfirmDialog, showImagePreview, showToast } from 'vant'
import { db } from '../db'
import { blobUrl } from '../utils/image'
import DiaryEditor from '../components/DiaryEditor.vue'

const today = dayjs().format('YYYY-MM-DD')
const monthCursor = ref(dayjs().startOf('month'))
const selectedDate = ref('')
const allEntries = ref([])
const countByDate = ref({})
const showEditor = ref(false)
const editingEntry = ref(null)

const monthLabel = computed(() => monthCursor.value.format('YYYY年M月'))

const entries = computed(() => {
  const list = selectedDate.value
    ? allEntries.value.filter((e) => e.date === selectedDate.value)
    : allEntries.value
  return [...list].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.createdAt - a.createdAt))
})

// 生成月历格子（含每天条数角标）
const calendarCells = computed(() => {
  const start = monthCursor.value
  const daysInMonth = start.daysInMonth()
  // dayjs: 周日=0，转成周一开头
  const firstWeekday = (start.day() + 6) % 7
  const cells = []
  const prevDays = firstWeekday
  const prevMonth = start.subtract(1, 'month')
  const prevMonthDays = prevMonth.daysInMonth()
  for (let i = 0; i < prevDays; i++) {
    cells.push({ key: 'p' + i, day: prevMonthDays - prevDays + 1 + i, inMonth: false, date: '' })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = start.date(d).format('YYYY-MM-DD')
    cells.push({ key: date, day: d, inMonth: true, date, count: countByDate.value[date] || 0 })
  }
  let next = 1
  while (cells.length % 7 !== 0) {
    cells.push({ key: 'n' + next, day: next++, inMonth: false, date: '' })
  }
  return cells
})

async function load() {
  allEntries.value = await db.diary.toArray()
  const map = {}
  for (const e of allEntries.value) map[e.date] = (map[e.date] || 0) + 1
  countByDate.value = map
}

function shiftMonth(delta) {
  monthCursor.value = monthCursor.value.add(delta, 'month')
}

function selectDate(cell) {
  if (!cell.inMonth) return
  selectedDate.value = selectedDate.value === cell.date ? '' : cell.date
}

function addEntry() {
  editingEntry.value = null
  showEditor.value = true
}

function editEntry(e) {
  editingEntry.value = e
  showEditor.value = true
}

async function removeEntry(e) {
  await showConfirmDialog({ title: '删除这条记录？', message: e.content.slice(0, 40) })
  await db.diary.delete(e.id)
  showToast('已删除')
  load()
}

function preview(e, index) {
  showImagePreview({ images: e.images.map(blobUrl), startPosition: index, closeable: true })
}

// 随机回顾一条历史记录
function drawRandom() {
  if (allEntries.value.length === 0) {
    showToast('还没有记录')
    return
  }
  const pick = allEntries.value[Math.floor(Math.random() * allEntries.value.length)]
  selectedDate.value = ''
  monthCursor.value = dayjs(pick.date).startOf('month')
  showConfirmDialog({
    title: `来自 ${pick.date} 的证据`,
    message: pick.content,
    confirmButtonText: '继续加油',
    cancelButtonText: '换一条'
  }).catch(() => drawRandom())
}

onMounted(load)
</script>

<style scoped>
.cal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 10px;
}
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}
.cal-week {
  text-align: center;
  font-size: 12px;
  color: #969799;
  padding: 4px 0;
}
.cal-day {
  position: relative;
  text-align: center;
  font-size: 13px;
  padding: 7px 0;
  border-radius: 8px;
}
.cal-day.dim {
  color: #c8c9cc;
}
.cal-day.today {
  color: var(--md-primary);
  font-weight: 500;
}
.cal-day.active {
  background: var(--md-primary);
  color: #fff;
}
.dot {
  position: absolute;
  top: 0;
  right: 2px;
  font-size: 10px;
  background: #ee0a24;
  color: #fff;
  border-radius: 8px;
  padding: 0 4px;
  line-height: 14px;
}
.cal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}
.entry-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.entry-content {
  margin: 6px 0;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-all;
  white-space: pre-wrap;
}
.entry-images {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.entry-images img {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
}
</style>
