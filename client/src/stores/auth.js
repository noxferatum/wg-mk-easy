import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const authenticated = ref(false);

  async function login(password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) throw new Error('Invalid password');
    authenticated.value = true;
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'DELETE' });
    authenticated.value = false;
  }

  async function check() {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    authenticated.value = data.authenticated;
    return data.authenticated;
  }

  return { authenticated, login, logout, check };
});
