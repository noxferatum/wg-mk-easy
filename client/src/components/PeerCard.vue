<template>
  <div class="peer-card" :class="{ disabled: peer.disabled }">
    <div class="peer-header">
      <div class="peer-status">
        <span class="status-dot" :class="isOnline ? 'online' : 'offline'"></span>
        <span class="peer-name">{{ peer.name || t('peers.noName') }}</span>
      </div>
      <span class="peer-address">{{ peer.address }}</span>
    </div>

    <div class="peer-stats">
      <div class="stat">
        <span class="stat-label">{{ t('peers.upload') }}</span>
        <span class="stat-value tx">{{ formatBytes(peer.tx) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">{{ t('peers.download') }}</span>
        <span class="stat-value rx">{{ formatBytes(peer.rx) }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">{{ t('peers.lastSeen') }}</span>
        <span class="stat-value">{{ lastSeenText }}</span>
      </div>
    </div>

    <div class="peer-actions">
      <button class="btn-icon" :title="t('peers.showQr')" @click="$emit('show-qr', peer)">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm11-2h2v2h-2v-2zm-4 0h2v2h-2v-2zm8 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2z"/>
        </svg>
      </button>
      <button class="btn-icon" :title="t('peers.downloadConfig')" @click="$emit('download', peer)">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-7 2h14v2H5v-2z"/>
        </svg>
      </button>
      <button
        class="btn-icon"
        :class="peer.disabled ? 'btn-enable' : 'btn-disable'"
        :title="peer.disabled ? t('peers.enable') : t('peers.disable')"
        @click="$emit('toggle', peer)"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path v-if="peer.disabled" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          <path v-else d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-13h2v6h-2V7zm0 8h2v2h-2v-2z"/>
        </svg>
      </button>
      <button class="btn-icon btn-danger" :title="t('peers.delete')" @click="$emit('delete', peer)">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4h-3.5z"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  peer: { type: Object, required: true },
});

defineEmits(['show-qr', 'download', 'toggle', 'delete']);

const isOnline = computed(() => {
  if (!props.peer.lastHandshake) return false;
  const diff = Date.now() - new Date(props.peer.lastHandshake).getTime();
  return diff < 3 * 60 * 1000; // 3 minutes
});

const lastSeenText = computed(() => {
  if (!props.peer.lastHandshake) return '-';
  const diff = Date.now() - new Date(props.peer.lastHandshake).getTime();
  if (diff < 60_000) return '< 1 min';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} min`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} h`;
  return `${Math.floor(diff / 86400_000)} d`;
});

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
</script>

<style scoped>
.peer-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.2s;
}
.peer-card:hover {
  border-color: var(--accent);
}
.peer-card.disabled {
  opacity: 0.5;
}
.peer-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.peer-status {
  display: flex;
  align-items: center;
  gap: 8px;
}
.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status-dot.online {
  background: var(--success);
  box-shadow: 0 0 8px var(--success);
}
.status-dot.offline {
  background: var(--danger);
}
.peer-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--text-primary);
}
.peer-address {
  font-size: 13px;
  color: var(--text-secondary);
  font-family: monospace;
}
.peer-stats {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat-label {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.stat-value.tx {
  color: var(--accent);
}
.stat-value.rx {
  color: var(--warning);
}
.peer-actions {
  display: flex;
  gap: 8px;
  border-top: 1px solid var(--border);
  padding-top: 12px;
}
.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  transition: all 0.2s;
}
.btn-icon:hover {
  color: var(--text-primary);
  border-color: var(--text-secondary);
}
.btn-enable {
  color: var(--success);
}
.btn-enable:hover {
  border-color: var(--success);
}
.btn-disable {
  color: var(--warning);
}
.btn-disable:hover {
  border-color: var(--warning);
}
.btn-danger {
  color: var(--danger);
}
.btn-danger:hover {
  border-color: var(--danger);
  color: var(--danger);
}
</style>
