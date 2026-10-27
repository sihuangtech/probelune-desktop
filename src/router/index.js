import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {path:'/dashboard',name:'dashboard',component:()=>import('../views/DashboardView.vue')},
  {
    path: '/',
    name: 'ip-lookup',
    component: () => import('../views/IpLookupView.vue')
  },
  {
    path: '/ping',
    name: 'ping',
    component: () => import('../views/PingView.vue')
  },
  {
    path: '/http',
    name: 'http',
    component: () => import('../views/HttpView.vue')
  },
  {
    path: '/dns',
    name: 'dns',
    component: () => import('../views/DnsView.vue')
  },
  {
    path: '/mtr',
    name: 'mtr',
    component: () => import('../views/MtrView.vue')
  },
  {
    path: '/traceroute',
    name: 'traceroute',
    component: () => import('../views/TracerouteView.vue')
  },
  {
    path: '/favorites',
    name: 'favorites',
    component: () => import('../views/FavoritesView.vue')
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsView.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
