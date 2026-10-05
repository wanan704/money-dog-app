import { createRouter, createWebHashHistory } from 'vue-router'
import { showToast } from 'vant'
import Home from './views/Home.vue'

const routes = [
  { path: '/', name: 'home', component: Home, meta: { title: '首页' } },
  { path: '/diary', name: 'diary', component: () => import('./views/Diary.vue'), meta: { title: '成功日记' } },
  { path: '/wishes', name: 'wishes', component: () => import('./views/Wishes.vue'), meta: { title: '愿望清单' } },
  { path: '/wish/:id', name: 'wishDetail', component: () => import('./views/WishDetail.vue'), meta: { title: '愿望详情' } },
  { path: '/stats', name: 'stats', component: () => import('./views/Stats.vue'), meta: { title: '统计' } },
  { path: '/settings', name: 'settings', component: () => import('./views/Settings.vue'), meta: { title: '我的' } }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.onError((err) => {
  console.error('Route load error:', err)
  showToast('页面加载失败，请下拉刷新或重新打开')
})

router.afterEach((to) => {
  document.title = to.meta?.title || '钱钱日记'
})

export default router
