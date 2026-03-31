<template>
  <div class="lang-toggle">
    <button
      :class="{ active: locale === 'en' }"
      @click="setLang('en')"
    >EN</button>
    <button
      :class="{ active: locale === 'es' }"
      @click="setLang('es')"
    >ES</button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();

function setLang(lang) {
  locale.value = lang;
  localStorage.setItem('lang', lang);
}
</script>

<style scoped>
.lang-toggle {
  display: flex;
  gap: 4px;
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 3px;
}
.lang-toggle button {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}
.lang-toggle button:hover {
  color: var(--text-primary);
}
.lang-toggle button.active {
  background: var(--accent);
  color: white;
}
</style>
