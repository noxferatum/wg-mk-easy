<template>
  <div id="app">
    <NavBar v-if="authStore.authenticated" />
    <main :class="{ 'with-nav': authStore.authenticated }">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useThemeStore } from './stores/theme.js';
import { useAuthStore } from './stores/auth.js';
import NavBar from './components/NavBar.vue';

const themeStore = useThemeStore();
const authStore = useAuthStore();

onMounted(() => authStore.check());
</script>

<style>
.with-nav { padding-top: 60px; }
main { min-height: 100vh; padding: 20px; max-width: 1200px; margin: 0 auto; }
</style>
