<template>
  <div class="page" v-if="wish">
    <van-nav-bar :title="wish.title" left-arrow @click-left="$router.back()" />

    <!-- 概要 -->
    <div class="card">
      <div class="head">
        <img v-if="wish.cover" :src="blobUrl(wish.cover)" class="cover" @click="previewCover" />
        <div class="head-body">
          <div class="title-row">
            <van-tag v-if="wish.isTop3" type="primary">Top 3</van-tag>
            <van-tag v-if="wish.done" type="success">已实现</van-tag>
          </div>
          <div v-if="wish.desc" class="muted">{{ wish.desc }}</div>
          <van-button
            size="small"
            :type="wish.done ? 'default' : 'success'"
            round
            plain
            style="margin-top: 8px"
            @click="toggleDone"
          >
            {{ wish.done ? '恢复为进行中' : '打勾：已实现' }}
          </van-button>
        </div>
      </div>
    </div>

    <!-- 梦想储蓄罐 -->
    <template v-if="wish.targetAmount">
      <div class="section-title">梦想储蓄罐</div>
      <div class="card">
        <div class="saving-row">
          <span class="saving-num">¥{{ savedSum }}</span>
          <span class="muted">目标 ¥{{ wish.targetAmount }} · {{ progress }}%</span>
        </div>
        <van-progress :percentage="progress" stroke-width="10" color="#534AB7" style="margin: 10px 0" />
        <van-button size="small" type="primary" round @click="showSaving = true">存一笔</van-button>
        <div v-for="s in savingsList" :key="s.id" class="saving-item">
          <span>+¥{{ s.amount }} <span class="muted">{{ s.note }}</span></span>
          <span class="muted">{{ dayjs(s.createdAt).format('MM-DD') }}</span>
        </div>
      </div>
    </template>

    <!-- 梦想相册（图片墙） -->
    <div class="section-title">梦想相册 · 每天看一遍</div>
    <div class="card">
      <div class="wall">
        <div v-for="(img, i) in images" :key="img.id" class="wall-item" @click="previewImage(i)">
          <img :src="blobUrl(img.image)" />
          <van-icon name="cross" class="wall-del" @click.stop="removeImage(img)" />
        </div>
        <van-uploader :after-read="addImages" multiple accept="image/*">
          <div class="wall-add">
            <van-icon name="plus" size="24" color="#969799" />
          </div>
        </van-uploader>
      </div>
      <div v-if="images.length > 0" style="margin-top: 10px">
        <van-button size="small" plain type="primary" round @click="previewImage(0)">
          全屏翻看（视觉化练习）
        </van-button>
      </div>
    </div>

    <!-- 存入弹窗 -->
    <van-popup v-model:show="showSaving" position="bottom" round :style="{ padding: '20px 16px' }">
      <div class="saving-form">
        <div class="editor-title">存一笔</div>
        <van-field v-model="savingAmount" label="金额" type="number" placeholder="存了多少钱" />
        <van-field v-model="savingNote" label="备注" placeholder="可选" maxlength="50" />
        <van-button type="primary" round block :disabled="!savingAmount" @click="addSaving" style="margin-top: 12px">
          存入储蓄罐
        </van-button>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
import { showConfirmDialog, showImagePreview, showToast } from 'vant'
import { db } from '../db'
import { blobUrl, compressImage } from '../utils/image'

const route = useRoute()
const wishId = Number(route.params.id)

const wish = ref(null)
const images = ref([])
const savingsList = ref([])
const showSaving = ref(false)
const savingAmount = ref('')
const savingNote = ref('')

const savedSum = computed(() => savingsList.value.reduce((s, r) => s + r.amount, 0))
const progress = computed(() =>
  wish.value?.targetAmount ? Math.min(100, Math.round((savedSum.value / wish.value.targetAmount) * 100)) : 0
)

async function load() {
  wish.value = await db.wishes.get(wishId)
  images.value = await db.wishImages.where('wishId').equals(wishId).toArray()
  savingsList.value = (await db.savings.where('wishId').equals(wishId).toArray()).sort(
    (a, b) => b.createdAt - a.createdAt
  )
}

async function toggleDone() {
  const done = !wish.value.done
  await db.wishes.update(wishId, {
    done: done ? 1 : 0,
    doneAt: done ? dayjs().format('YYYY-MM-DD') : null
  })
  showToast(done ? '恭喜实现愿望' : '已恢复')
  load()
}

async function addImages(items) {
  const list = Array.isArray(items) ? items : [items]
  for (const item of list) {
    const blob = await compressImage(item.file)
    await db.wishImages.add({ wishId, image: blob, createdAt: Date.now() })
  }
  load()
}

async function removeImage(img) {
  await showConfirmDialog({ title: '删除这张图片？' })
  await db.wishImages.delete(img.id)
  load()
}

async function addSaving() {
  await db.savings.add({
    wishId,
    amount: Number(savingAmount.value),
    note: savingNote.value.trim(),
    createdAt: Date.now()
  })
  const reached = savedSum.value + Number(savingAmount.value) >= wish.value.targetAmount
  showSaving.value = false
  savingAmount.value = ''
  savingNote.value = ''
  showToast(reached ? '储蓄罐满啦，去实现它吧' : '已存入')
  load()
}

function previewCover() {
  showImagePreview({ images: [blobUrl(wish.value.cover)], closeable: true })
}

function previewImage(start) {
  showImagePreview({ images: images.value.map((i) => blobUrl(i.image)), startPosition: start, closeable: true })
}

onMounted(load)
</script>

<style scoped>
.head {
  display: flex;
  gap: 12px;
}
.cover {
  width: 84px;
  height: 84px;
  object-fit: cover;
  border-radius: 10px;
  flex-shrink: 0;
}
.head-body {
  flex: 1;
}
.title-row {
  margin-bottom: 6px;
  display: flex;
  gap: 6px;
}
.saving-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.saving-num {
  font-size: 26px;
  font-weight: 500;
  color: var(--md-primary);
}
.saving-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-top: 1px solid #f2f2f2;
  font-size: 14px;
  margin-top: 8px;
}
.wall {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.wall-item {
  position: relative;
  aspect-ratio: 1;
}
.wall-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}
.wall-del {
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  border-radius: 50%;
  padding: 2px;
  font-size: 12px;
}
.wall-add {
  aspect-ratio: 1;
  border: 1px dashed #c8c9cc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.editor-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 10px;
}
</style>
