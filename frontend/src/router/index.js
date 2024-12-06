import { createRouter, createWebHistory } from 'vue-router'

import routes from './routes'

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ y: 0 }),
  routes
})

export default router