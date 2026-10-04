import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('./views/Home.vue'), meta: { title: '首页' } },
  { path: '/diary', name: 'diary', component: () => import('./views/Diary.vue'), meta: { title: '成功日记' } },
  { path: '/wishes', name: 'wishes', component: () => import('./views/Wishes.vue'), meta: { title: '愿望清单' } },
  { path: '/wish/:id', name: 'wishDetail', component: () => import('./views/WishDetail.vue'), meta: { title: '愿望详情' } },
  { path: '/stats', name: 'stats', component: () => import('./views/Stats.vue'), meta: { title: '统计' } },
  { path: '/settings', name: 'settings', component: () => import('./views/Settings.vue'), meta: { title: '我的' } }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
