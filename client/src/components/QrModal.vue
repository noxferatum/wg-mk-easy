<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-header">
        <h3>{{ peerName }}</h3>
        <button class="btn-close" @click="$emit('close')">&times;</button>
      </div>
      <div class="modal-body">
        <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Code" class="qr-image" />
        <button class="btn-download" @click="downloadConfig">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-7 2h14v2H5v-2z"/>
          </svg>
          {{ t('peers.downloadConfig') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  peerName: { type: String, default: '' },
  qrDataUrl: { type: String, default: '' },
  configString: { type: String, default: '' },
});

defineEmits(['close']);

function downloadConfig() {
  const blob = new Blob([props.configString], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${props.peerName || 'peer'}.conf`;
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
  max-width: 400px;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}
.qr-image {
  width: 280px;
  height: 280px;
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
  transition: background 0.2s;
  width: 100%;
  justify-content: center;
}
.btn-download:hover {
  background: var(--accent-hover);
}
</style>
