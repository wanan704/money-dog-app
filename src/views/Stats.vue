<template>
  <div class="page">
    <van-nav-bar title="数据统计" />

    <!-- 概览数字 -->
    <div class="grid">
      <div class="card stat">
        <div class="num">{{ streak }}</div>
        <div class="muted">连续记录天数</div>
      </div>
      <div class="card stat">
        <div class="num">{{ total }}</div>
        <div class="muted">成功日记总条数</div>
      </div>
      <div class="card stat">
        <div class="num">{{ monthCount }}</div>
        <div class="muted">本月记录条数</div>
      </div>
      <div class="card stat">
        <div class="num">{{ doneWishes }}</div>
        <div class="muted">已实现愿望</div>
      </div>
      <div class="card stat">
        <div class="num">¥{{ totalSaved }}</div>
        <div class="muted">储蓄罐累计存入</div>
      </div>
      <div class="card stat">
        <div class="num">{{ activeWishes }}</div>
        <div class="muted">进行中愿望</div>
      </div>
    </div>

    <!-- 近 6 个月趋势 -->
    <div class="section-title">近 6 个月记录趋势</div>
    <div class="card">
      <div class="bars">
        <div v-for="m in months" :key="m.label" class="bar-col">
          <div class="bar-count">{{ m.count || '' }}</div>
          <div class="bar" :style="{ height: barHeight(m.count) }"></div>
          <div class="bar-label">{{ m.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import dayjs from 'dayjs'
import { db, calcStreak } from '../db'

const streak = ref(0)
const total = ref(0)
const monthCount = ref(0)
const doneWishes = ref(0)
const activeWishes = ref(0)
const totalSaved = ref(0)
const months = ref([])
const maxMonth = ref(1)

function barHeight(count) {
  if (!count) return '4px'
  return Math.round((count / maxMonth.value) * 110) + 8 + 'px'
}

async function load() {
  streak.value = await calcStreak()
  const entries = await db.diary.toArray()
  total.value = entries.length
  const thisMonth = dayjs().format('YYYY-MM')
  monthCount.value = entries.filter((e) => e.date.startsWith(thisMonth)).length

  const wishes = await db.wishes.toArray()
  doneWishes.value = wishes.filter((w) => w.done).length
  activeWishes.value = wishes.filter((w) => !w.done).length

  const savings = await db.savings.toArray()
  totalSaved.value = savings.reduce((s, r) => s + r.amount, 0)

  // 近 6 个月
  const list = []
  for (let i = 5; i >= 0; i--) {
    const m = dayjs().subtract(i, 'month')
    const prefix = m.format('YYYY-MM')
    const count = entries.filter((e) => e.date.startsWith(prefix)).length
    list.push({ label: m.format('M月'), count })
    maxMonth.value = Math.max(maxMonth.value, count)
  }
  months.value = list
}

onMounted(load)
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.stat {
  text-align: center;
  padding: 16px;
}
.num {
  font-size: 26px;
  font-weight: 500;
  color: var(--md-primary);
}
.bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 180px;
  padding-top: 10px;
}
.bar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
}
.bar-count {
  font-size: 11px;
  color: #646566;
  margin-bottom: 4px;
}
.bar {
  width: 26px;
  background: var(--md-primary);
  border-radius: 6px 6px 0 0;
  min-height: 4px;
}
.bar-label {
  font-size: 11px;
  color: #969799;
  margin-top: 6px;
}
</style>
