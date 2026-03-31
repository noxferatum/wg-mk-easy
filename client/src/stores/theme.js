import { defineStore } from 'pinia';
import { ref, watchEffect } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  const theme = ref(localStorage.getItem('theme') || 'system');

  function setTheme(value) {
    theme.value = value;
    localStorage.setItem('theme', value);
  }

  watchEffect(() => {
    const root = document.documentElement;
    if (theme.value === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme.value);
    }
  });

  return { theme, setTheme };
});
