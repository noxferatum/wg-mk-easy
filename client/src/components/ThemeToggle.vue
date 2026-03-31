<template>
  <div class="theme-toggle">
    <button
      :class="{ active: themeStore.theme === 'light' }"
      :title="t('settings.light')"
      @click="themeStore.setTheme('light')"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0-3a1 1 0 01-1-1V1a1 1 0 112 0v2a1 1 0 01-1 1zm0 18a1 1 0 01-1-1v-2a1 1 0 112 0v2a1 1 0 01-1 1zm9-9a1 1 0 01-1 1h-2a1 1 0 110-2h2a1 1 0 011 1zM5 12a1 1 0 01-1 1H2a1 1 0 110-2h2a1 1 0 011 1zm14.07-6.36a1 1 0 010 1.41l-1.41 1.42a1 1 0 11-1.42-1.42l1.42-1.41a1 1 0 011.41 0zM7.76 17.66a1 1 0 010 1.41l-1.41 1.42a1 1 0 11-1.42-1.42l1.42-1.41a1 1 0 011.41 0zm10.48 1.42a1 1 0 01-1.41 0l-1.42-1.42a1 1 0 111.42-1.41l1.41 1.41a1 1 0 010 1.42zM7.76 6.34a1 1 0 01-1.41 0L4.93 4.93a1 1 0 011.42-1.42L7.76 4.93a1 1 0 010 1.41z"/>
      </svg>
    </button>
    <button
      :class="{ active: themeStore.theme === 'dark' }"
      :title="t('settings.dark')"
      @click="themeStore.setTheme('dark')"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/>
      </svg>
    </button>
    <button
      :class="{ active: themeStore.theme === 'system' }"
      :title="t('settings.system')"
      @click="themeStore.setTheme('system')"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M4 2h16a2 2 0 012 2v12a2 2 0 01-2 2h-6v2h2a1 1 0 110 2H8a1 1 0 110-2h2v-2H4a2 2 0 01-2-2V4a2 2 0 012-2zm0 2v12h16V4H4z"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useThemeStore } from '../stores/theme.js';

const { t } = useI18n();
const themeStore = useThemeStore();
</script>

<style scoped>
.theme-toggle {
  display: flex;
  gap: 4px;
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 3px;
}
.theme-toggle button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  transition: all 0.2s;
}
.theme-toggle button:hover {
  color: var(--text-primary);
}
.theme-toggle button.active {
  background: var(--accent);
  color: white;
}
</style>
