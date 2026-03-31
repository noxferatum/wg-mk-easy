<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { useThemeStore } from './stores/theme.js';
const themeStore = useThemeStore();
</script>
