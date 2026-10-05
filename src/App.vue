<template>
  <van-config-provider :theme="themeMode">
    <router-view v-slot="{ Component }">
      <component :is="Component" />
    </router-view>

    <!-- 底部导航：愿望详情页不显示 -->
    <van-tabbar v-if="showTabbar" route active-color="#534AB7" inactive-color="#7d7e80">
      <van-tabbar-item to="/" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/diary" icon="edit">日记</van-tabbar-item>
      <van-tabbar-item to="/wishes" icon="star-o">愿望</van-tabbar-item>
      <van-tabbar-item to="/stats" icon="chart-trending-o">统计</van-tabbar-item>
      <van-tabbar-item to="/settings" icon="setting-o">我的</van-tabbar-item>
    </van-tabbar>
  </van-config-provider>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { initReminder } from './utils/notify'
import { initTheme, themeMode } from './utils/theme'

const route = useRoute()
const showTabbar = computed(() => route.name !== 'wishDetail')

onMounted(() => {
  initTheme()
  initReminder()
})
</script>
