<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1 class="login-title">{{ t('app.title') }}</h1>
        <p class="login-subtitle">{{ t('app.subtitle') }}</p>
      </div>
      <form class="login-form" @submit.prevent="handleLogin">
        <input
          v-model="password"
          type="password"
          :placeholder="t('auth.password')"
          autofocus
        />
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" :disabled="loading">
          {{ loading ? '...' : t('auth.enter') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth.js';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();

const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleLogin() {
  if (!password.value) return;
  loading.value = true;
  error.value = '';
  try {
    await authStore.login(password.value);
    router.push('/');
  } catch (e) {
    error.value = t('auth.wrongPassword');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}
.login-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}
.login-header {
  text-align: center;
  margin-bottom: 32px;
}
.login-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 8px;
}
.login-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
}
.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.login-form input {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}
.login-form input:focus {
  border-color: var(--accent);
}
.error {
  color: var(--danger);
  font-size: 13px;
  text-align: center;
}
.login-form button {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 600;
  transition: background 0.2s;
}
.login-form button:hover:not(:disabled) {
  background: var(--accent-hover);
}
.login-form button:disabled {
  opacity: 0.6;
}
</style>
