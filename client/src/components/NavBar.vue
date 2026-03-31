<template>
  <nav class="navbar">
    <div class="nav-inner">
      <div class="nav-left">
        <router-link to="/" class="logo">wg-mk-easy</router-link>
        <div class="nav-links" :class="{ open: menuOpen }">
          <router-link to="/" @click="menuOpen = false">{{ t('nav.dashboard') }}</router-link>
          <router-link to="/peers" @click="menuOpen = false">{{ t('nav.peers') }}</router-link>
          <router-link to="/settings" @click="menuOpen = false">{{ t('nav.settings') }}</router-link>
        </div>
      </div>
      <div class="nav-right">
        <ThemeToggle />
        <LangToggle />
        <button class="btn-logout" @click="handleLogout">{{ t('auth.logout') }}</button>
      </div>
      <button class="hamburger" @click="menuOpen = !menuOpen" aria-label="Menu">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
    <!-- Mobile overlay -->
    <div v-if="menuOpen" class="mobile-menu">
      <div class="mobile-nav-links">
        <router-link to="/" @click="menuOpen = false">{{ t('nav.dashboard') }}</router-link>
        <router-link to="/peers" @click="menuOpen = false">{{ t('nav.peers') }}</router-link>
        <router-link to="/settings" @click="menuOpen = false">{{ t('nav.settings') }}</router-link>
      </div>
      <div class="mobile-controls">
        <ThemeToggle />
        <LangToggle />
        <button class="btn-logout" @click="handleLogout">{{ t('auth.logout') }}</button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth.js';
import ThemeToggle from './ThemeToggle.vue';
import LangToggle from './LangToggle.vue';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const menuOpen = ref(false);

async function handleLogout() {
  await authStore.logout();
  router.push('/login');
}
</script>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  z-index: 100;
}
.nav-inner {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}
.nav-left {
  display: flex;
  align-items: center;
  gap: 32px;
}
.logo {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent);
  text-decoration: none;
}
.nav-links {
  display: flex;
  gap: 8px;
}
.nav-links a {
  padding: 6px 14px;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  text-decoration: none;
}
.nav-links a:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}
.nav-links a.router-link-exact-active {
  color: var(--accent);
  background: var(--bg-secondary);
}
.nav-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.btn-logout {
  padding: 6px 16px;
  border: 1px solid var(--danger);
  border-radius: 8px;
  background: transparent;
  color: var(--danger);
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}
.btn-logout:hover {
  background: var(--danger);
  color: white;
}
.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  padding: 8px;
  background: transparent;
  border: none;
}
.hamburger span {
  display: block;
  width: 22px;
  height: 2px;
  background: var(--text-primary);
  border-radius: 2px;
  transition: all 0.2s;
}
.mobile-menu {
  display: none;
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  padding: 16px 20px;
  flex-direction: column;
  gap: 16px;
  z-index: 99;
}
.mobile-nav-links {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.mobile-nav-links a {
  padding: 10px 14px;
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s;
}
.mobile-nav-links a:hover,
.mobile-nav-links a.router-link-exact-active {
  color: var(--accent);
  background: var(--bg-secondary);
}
.mobile-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .nav-links,
  .nav-right {
    display: none;
  }
  .hamburger {
    display: flex;
  }
  .mobile-menu {
    display: flex;
  }
}
</style>
