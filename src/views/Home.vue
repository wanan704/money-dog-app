<template>
  <div class="page">
    <van-nav-bar title="钱钱日记" />

    <!-- 连续记录 -->
    <div class="card hero">
      <div class="hero-num">{{ streak }}</div>
      <div class="muted">连续记录天数</div>
      <div class="hero-sub">今天已记 {{ todayCount }} 条 · 累计 {{ totalCount }} 条</div>
      <van-button type="primary" round block class="hero-btn" @click="showEditor = true">
        记一笔成功
      </van-button>
    </div>

    <!-- Top3 愿望 -->
    <div class="section-title">最重要的愿望</div>
    <div v-if="topWishes.length === 0" class="card muted">
      还没有重点愿望，去愿望清单标记 Top 3 吧
    </div>
    <div v-else class="wish-scroll">
      <div v-for="w in topWishes" :key="w.id" class="wish-card" @click="$router.push(`/wish/${w.id}`)">
        <img v-if="w.cover" :src="blobUrl(w.cover)" class="wish-cover" />
        <div v-else class="wish-cover placeholder">
          <van-icon name="star" size="28" color="#fff" />
        </div>
        <div class="wish-title">{{ w.title }}</div>
        <van-progress
          v-if="w.targetAmount"
          :percentage="w.progress"
          stroke-width="6"
          color="var(--md-primary)"
        />
      </div>
    </div>

    <!-- 随机回顾 -->
    <div class="section-title">不自信的时候，翻翻证据</div>
    <div class="card">
      <div v-if="randomEntry">
        <div class="muted">{{ randomEntry.date }}</div>
        <div class="random-content">{{ randomEntry.content }}</div>
      </div>
      <div v-else class="muted">还没有记录，写下第一条成功日记吧</div>
      <van-button size="small" plain type="primary" round style="margin-top: 10px" @click="drawRandom">
        换一条
      </van-button>
    </div>

    <DiaryEditor v-model:show="showEditor" @saved="load" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import { db, calcStreak } from '../db'
import { blobUrl } from '../utils/image'
import DiaryEditor from '../components/DiaryEditor.vue'

const streak = ref(0)
const todayCount = ref(0)
const totalCount = ref(0)
const topWishes = ref([])
const randomEntry = ref(null)
const showEditor = ref(false)
let allEntries = []

async function load() {
  streak.value = await calcStreak()
  const today = dayjs().format('YYYY-MM-DD')
  allEntries = await db.diary.toArray()
  todayCount.value = allEntries.filter((e) => e.date === today).length
  totalCount.value = allEntries.length

  const wishes = await db.wishes.where('isTop3').equals(1).and((w) => !w.done).toArray()
  for (const w of wishes) {
    if (w.targetAmount) {
      const saved = await db.savings.where('wishId').equals(w.id).toArray()
      const sum = saved.reduce((s, r) => s + r.amount, 0)
      w.progress = Math.min(100, Math.round((sum / w.targetAmount) * 100))
    }
  }
  topWishes.value = wishes
  drawRandom()
}

function drawRandom() {
  if (allEntries.length === 0) {
    randomEntry.value = null
    return
  }
  let pick = allEntries[Math.floor(Math.random() * allEntries.length)]
  if (allEntries.length > 1 && randomEntry.value && pick.id === randomEntry.value.id) {
    pick = allEntries[(allEntries.indexOf(pick) + 1) % allEntries.length]
  }
  randomEntry.value = pick
}

onMounted(load)
</script>

<style scoped>
.hero {
  text-align: center;
  padding: 22px 16px;
}
.hero-num {
  font-size: 44px;
  font-weight: 500;
  color: var(--md-primary);
  line-height: 1.1;
}
.hero-sub {
  margin: 6px 0 14px;
  font-size: 13px;
  color: #646566;
}
.hero-btn {
  max-width: 240px;
  margin: 0 auto;
}
.wish-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding: 4px 12px 8px;
}
.wish-card {
  flex: 0 0 150px;
  background: #fff;
  border-radius: 12px;
  padding: 10px;
}
.wish-cover {
  width: 100%;
  height: 90px;
  object-fit: cover;
  border-radius: 8px;
}
.wish-cover.placeholder {
  background: var(--md-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}
.wish-title {
  font-size: 13px;
  margin: 8px 0 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.random-content {
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-all;
}
</style>
