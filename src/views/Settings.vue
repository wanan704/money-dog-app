<template>
  <div class="page">
    <van-nav-bar title="我的" />

    <div class="section-title">外观</div>
    <van-cell-group inset>
      <van-cell title="深色模式">
        <template #right-icon>
          <van-switch
            :model-value="themeMode === 'dark'"
            size="20"
            active-color="#534AB7"
            @update:model-value="toggleTheme"
          />
        </template>
      </van-cell>
    </van-cell-group>

    <div class="section-title">每日提醒</div>
    <van-cell-group inset>
      <van-cell title="开启提醒">
        <template #right-icon>
          <van-switch v-model="reminderEnabled" size="20" active-color="#534AB7" @change="saveReminder" />
        </template>
      </van-cell>
      <van-cell title="提醒时间" :value="reminderTime" is-link @click="showTimePicker = true" />
      <van-cell title="通知权限" :value="permissionText" is-link @click="askPermission" />
      <van-cell title="测试通知" label="立即发一条通知验证功能" is-link @click="doTestNotify" />
    </van-cell-group>
    <div class="tip">
      提示：PWA 提醒依赖浏览器后台运行，请在系统设置中允许浏览器自启动/后台活动。
    </div>

    <div class="section-title">数据备份</div>
    <van-cell-group inset>
      <van-cell title="导出备份" label="日记、愿望、图片打包为 zip" is-link @click="doExport" />
      <van-cell title="导入备份" label="覆盖现有数据并恢复" is-link @click="triggerImport" />
    </van-cell-group>
    <div class="tip">
      数据只存在本机浏览器中，清除浏览器数据会丢失，请定期导出备份。
    </div>
    <input ref="fileInput" type="file" accept=".zip" style="display: none" @change="doImport" />

    <div class="section-title">关于</div>
    <van-cell-group inset>
      <van-cell title="钱钱日记" label="成功日记 · 愿望清单 · 梦想相册 · 梦想储蓄罐" />
      <van-cell title="版本" :value="versionText" />
    </van-cell-group>

    <van-popup v-model:show="showTimePicker" position="bottom" round>
      <van-time-picker
        v-model="timeArr"
        title="选择提醒时间"
        @confirm="onTimeConfirm"
        @cancel="showTimePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import { getSetting, setSetting } from '../db'
import { exportBackup, importBackup } from '../utils/backup'
import { requestNotifyPermission, rescheduleReminder, testNotification } from '../utils/notify'
import { themeMode, setTheme } from '../utils/theme'

const reminderEnabled = ref(false)
const reminderTime = ref('21:00')
const showTimePicker = ref(false)
const timeArr = ref(['21', '00'])
const fileInput = ref(null)
// 构建时间由 vite define 注入，用于核对手机端是否已更新到最新版
const versionText = `1.1.1（构建 ${typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'dev'}）`

const permissionText = computed(() => {
  if (!('Notification' in window)) return '不支持'
  return { granted: '已授权', denied: '已拒绝', default: '未授权' }[Notification.permission]
})

async function load() {
  reminderEnabled.value = await getSetting('reminderEnabled', false)
  reminderTime.value = await getSetting('reminderTime', '21:00')
  timeArr.value = reminderTime.value.split(':')
}

async function saveReminder() {
  await setSetting('reminderEnabled', reminderEnabled.value)
  if (reminderEnabled.value) await askPermission()
  rescheduleReminder()
  showToast(reminderEnabled.value ? '提醒已开启' : '提醒已关闭')
}

async function onTimeConfirm() {
  reminderTime.value = `${timeArr.value[0]}:${timeArr.value[1]}`
  await setSetting('reminderTime', reminderTime.value)
  showTimePicker.value = false
  rescheduleReminder()
  showToast('已保存')
}

async function doTestNotify() {
  const result = await requestNotifyPermission()
  if (result !== 'granted') {
    showToast('请先授权通知权限')
    return
  }
  const ok = await testNotification()
  showToast(ok ? '已发送，请查看通知栏' : '发送失败，请检查系统通知设置')
}

async function toggleTheme(val) {
  await setTheme(val ? 'dark' : 'light')
  showToast(val ? '已切换深色模式' : '已切换浅色模式')
}

async function askPermission() {
  const result = await requestNotifyPermission()
  if (result === 'granted') showToast('通知权限已授权')
  else if (result === 'denied') showToast('通知被拒绝，请在浏览器设置中开启')
  else if (result === 'unsupported') showToast('当前环境不支持通知')
}

async function doExport() {
  try {
    await exportBackup()
    showToast('备份已导出')
  } catch (e) {
    showToast('导出失败：' + e.message)
  }
}

function triggerImport() {
  fileInput.value.click()
}

async function doImport(e) {
  const file = e.target.files[0]
  e.target.value = ''
  if (!file) return
  await showConfirmDialog({ title: '导入将覆盖现有全部数据', message: '确定继续吗？' })
  try {
    await importBackup(file)
    showToast('恢复成功')
  } catch (err) {
    showToast('导入失败：' + err.message)
  }
}

onMounted(load)
</script>

<style scoped>
.tip {
  font-size: 12px;
  color: #969799;
  padding: 8px 24px;
  line-height: 1.6;
}
</style>
