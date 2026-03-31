import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/login', name: 'login', component: () => import('./views/Login.vue') },
  { path: '/', name: 'dashboard', component: () => import('./views/Dashboard.vue') },
  { path: '/peers', name: 'peers', component: () => import('./views/Peers.vue') },
  { path: '/settings', name: 'settings', component: () => import('./views/Settings.vue') },
];

export const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach(async (to) => {
  if (to.name === 'login') return;
  try {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    if (!data.authenticated) return { name: 'login' };
  } catch {
    return { name: 'login' };
  }
});
