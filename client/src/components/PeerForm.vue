<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h3>{{ t('peers.create') }}</h3>
        <button class="btn-close" @click="$emit('close')">&times;</button>
      </div>
      <form class="modal-body" @submit.prevent="handleCreate">
        <div v-if="!created" class="form-group">
          <label for="peer-name">{{ t('peers.name') }}</label>
          <input
            id="peer-name"
            v-model="name"
            type="text"
            :placeholder="t('peers.name')"
            autofocus
          />
          <p v-if="error" class="error">{{ error }}</p>
          <button type="submit" class="btn-create" :disabled="loading">
            {{ loading ? '...' : t('peers.create') }}
          </button>
        </div>
        <div v-else class="created-result">
          <p class="success-msg">Peer created!</p>
          <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Code" class="qr-image" />
          <button type="button" class="btn-download" @click="downloadConfig">
            {{ t('peers.downloadConfig') }}
          </button>
          <button type="button" class="btn-close-bottom" @click="$emit('close')">OK</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePeersStore } from '../stores/peers.js';

const { t } = useI18n();
const peersStore = usePeersStore();

defineEmits(['close']);

const name = ref('');
const loading = ref(false);
const error = ref('');
const created = ref(false);
const qrDataUrl = ref('');
const configString = ref('');

async function handleCreate() {
  if (!name.value.trim()) return;
  loading.value = true;
  error.value = '';
  try {
    const result = await peersStore.createPeer(name.value.trim());
    qrDataUrl.value = result.qr || '';
    configString.value = result.config || '';
    created.value = true;
    await peersStore.fetchPeers();
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function downloadConfig() {
  const blob = new Blob([configString.value], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.value || 'peer'}.conf`;
  a.click();
  URL.revokeObjectURL(url);
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}
.modal-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  width: 100%;
  max-width: 420px;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 20px 0;
}
.modal-header h3 {
  font-size: 18px;
  color: var(--text-primary);
}
.btn-close {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 24px;
  line-height: 1;
  padding: 4px;
}
.btn-close:hover {
  color: var(--text-primary);
}
.modal-body {
  padding: 20px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.form-group label {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}
.form-group input {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
}
.form-group input:focus {
  border-color: var(--accent);
}
.error {
  color: var(--danger);
  font-size: 13px;
}
.btn-create {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}
.btn-create:hover:not(:disabled) {
  background: var(--accent-hover);
}
.btn-create:disabled {
  opacity: 0.6;
}
.created-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.success-msg {
  color: var(--success);
  font-weight: 600;
}
.qr-image {
  width: 240px;
  height: 240px;
  border-radius: 8px;
  background: white;
  padding: 12px;
}
.btn-download {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  width: 100%;
  justify-content: center;
  transition: background 0.2s;
}
.btn-download:hover {
  background: var(--accent-hover);
}
.btn-close-bottom {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  width: 100%;
  transition: all 0.2s;
}
.btn-close-bottom:hover {
  border-color: var(--text-secondary);
}
</style>
