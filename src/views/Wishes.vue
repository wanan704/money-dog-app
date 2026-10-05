<template>
  <div class="page">
    <van-nav-bar title="愿望清单" />

    <van-tabs v-model:active="tab" color="var(--md-primary)">
      <van-tab title="进行中" />
      <van-tab title="已实现" />
    </van-tabs>

    <div v-if="filtered.length === 0" class="card muted">
      {{ tab === 0 ? '还没有进行中的愿望，点右下角加一个吧' : '还没有实现的愿望，加油' }}
    </div>

    <div v-for="w in filtered" :key="w.id" class="card wish" @click="$router.push(`/wish/${w.id}`)">
      <van-checkbox
        :model-value="!!w.done"
        checked-color="#534AB7"
        @click.stop
        @update:model-value="toggleDone(w)"
      />
      <img v-if="w.cover" :src="blobUrl(w.cover)" class="cover" />
      <div v-else class="cover placeholder">
        <van-icon name="star" size="20" color="#c8c9cc" />
      </div>
      <div class="wish-body">
        <div class="wish-title" :class="{ done: w.done }">
          <van-tag v-if="w.isTop3" type="primary" plain>Top</van-tag>
          {{ w.title }}
        </div>
        <div class="muted">
          <template v-if="w.targetAmount">已存 ¥{{ w.saved }} / ¥{{ w.targetAmount }}</template>
          <template v-else-if="w.done">实现于 {{ w.doneAt }}</template>
          <template v-else>{{ w.desc || '未设目标金额' }}</template>
        </div>
      </div>
      <van-icon
        :name="w.isTop3 ? 'star' : 'star-o'"
        :color="w.isTop3 ? '#f7b500' : '#c8c9cc'"
        size="22"
        @click.stop="toggleTop(w)"
      />
    </div>

    <van-button class="fab" type="primary" round icon="plus" size="large" @click="openEditor(null)" />

    <!-- 新增 / 编辑愿望 -->
    <van-popup v-model:show="showEditor" position="bottom" round :style="{ height: '78%' }">
      <div class="editor">
        <div class="editor-header">
          <span class="editor-title">{{ editing?.id ? '编辑愿望' : '新愿望' }}</span>
          <div>
            <van-button v-if="editing?.id" size="small" plain type="danger" round style="margin-right: 8px" @click="removeWish">
              删除
            </van-button>
            <van-button size="small" type="primary" round :disabled="!form.title.trim()" @click="saveWish">
              保存
            </van-button>
          </div>
        </div>
        <van-field v-model="form.title" label="愿望" placeholder="想要什么？" maxlength="50" />
        <van-field v-model="form.desc" label="描述" type="textarea" rows="2" placeholder="为什么想要它（可选）" maxlength="200" />
        <van-field v-model="form.targetAmount" label="目标金额" type="number" placeholder="可选，单位元" />
        <van-cell title="标记为重点愿望（Top 3）">
          <template #right-icon>
            <van-switch v-model="form.isTop3" size="20" active-color="#534AB7" />
          </template>
        </van-cell>
        <div class="picker-wrap">
          <div class="muted" style="margin-bottom: 6px">封面图（梦想相册的第一张）</div>
          <ImagePicker v-model="form.coverArr" :max-count="1" />
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import { showConfirmDialog, showToast } from 'vant'
import { db } from '../db'
import { blobUrl } from '../utils/image'
import ImagePicker from '../components/ImagePicker.vue'

const tab = ref(0)
const wishes = ref([])
const showEditor = ref(false)
const editing = ref(null)
const form = ref({ title: '', desc: '', targetAmount: '', isTop3: false, coverArr: [] })

const filtered = computed(() =>
  wishes.value
    .filter((w) => (tab.value === 0 ? !w.done : w.done))
    .sort((a, b) => (b.isTop3 - a.isTop3) || b.createdAt - a.createdAt)
)

async function load() {
  const list = await db.wishes.toArray()
  for (const w of list) {
    const saved = await db.savings.where('wishId').equals(w.id).toArray()
    w.saved = saved.reduce((s, r) => s + r.amount, 0)
  }
  wishes.value = list
}

function openEditor(w) {
  editing.value = w
  form.value = w
    ? {
        title: w.title,
        desc: w.desc || '',
        targetAmount: w.targetAmount || '',
        isTop3: !!w.isTop3,
        coverArr: w.cover ? [w.cover] : []
      }
    : { title: '', desc: '', targetAmount: '', isTop3: false, coverArr: [] }
  showEditor.value = true
}

async function toggleTop(w) {
  await db.wishes.update(w.id, { isTop3: w.isTop3 ? 0 : 1 })
  load()
}

async function toggleDone(w) {
  const done = !w.done
  await db.wishes.update(w.id, {
    done: done ? 1 : 0,
    doneAt: done ? dayjs().format('YYYY-MM-DD') : null
  })
  showToast(done ? '恭喜实现愿望' : '已恢复为进行中')
  load()
}

async function saveWish() {
  const data = {
    title: form.value.title.trim(),
    desc: form.value.desc.trim(),
    targetAmount: form.value.targetAmount ? Number(form.value.targetAmount) : null,
    isTop3: form.value.isTop3 ? 1 : 0,
    cover: form.value.coverArr[0] || null
  }
  if (editing.value?.id) {
    await db.wishes.update(editing.value.id, data)
  } else {
    await db.wishes.add({ ...data, done: 0, doneAt: null, createdAt: Date.now() })
  }
  showToast('已保存')
  showEditor.value = false
  load()
}

async function removeWish() {
  await showConfirmDialog({ title: '删除这个愿望？', message: '相关图片和存款记录会一并删除' })
  const id = editing.value.id
  await db.wishes.delete(id)
  await db.wishImages.where('wishId').equals(id).delete()
  await db.savings.where('wishId').equals(id).delete()
  showEditor.value = false
  showToast('已删除')
  load()
}

// 从详情页返回时刷新（通过路由事件简单处理：每次进入页面都 load）
onMounted(load)
defineExpose({ load })
</script>

<style scoped>
.wish {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cover {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}
.cover.placeholder {
  background: var(--md-primary);
  display: flex;
  align-items: center;
  justify-content: center;
}
.wish-body {
  flex: 1;
  min-width: 0;
}
.wish-title {
  font-size: 15px;
  margin-bottom: 4px;
}
.wish-title.done {
  text-decoration: line-through;
  color: #969799;
}
.editor {
  padding: 16px;
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
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
  padding: 10px 16px;
}
</style>
