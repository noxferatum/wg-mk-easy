<template>
  <div class="peers-page">
    <div class="peers-header">
      <h2 class="page-title">{{ t('peers.title') }}</h2>
      <button class="btn-new" @click="showForm = true">+ {{ t('peers.create') }}</button>
    </div>

    <div v-if="peersStore.loading" class="loading">Loading...</div>

    <div v-else class="peers-grid">
      <PeerCard
        v-for="peer in peersStore.peers"
        :key="peer.id"
        :peer="peer"
        @show-qr="handleShowQr"
        @download="handleDownload"
        @toggle="handleToggle"
        @delete="handleDelete"
      />
    </div>

    <PeerForm v-if="showForm" @close="showForm = false" />

    <QrModal
      v-if="qrPeer"
      :peer-name="qrPeer.name"
      :qr-data-url="qrPeer.qr"
      :config-string="qrPeer.config"
      @close="qrPeer = null"
    />

    <!-- Delete confirmation -->
    <div v-if="deletePeer" class="modal-overlay" @click.self="deletePeer = null">
      <div class="confirm-card">
        <p>{{ t('peers.confirmDelete') }}</p>
        <p class="confirm-name">{{ deletePeer.name || deletePeer.address }}</p>
        <div class="confirm-actions">
          <button class="btn-cancel" @click="deletePeer = null">Cancel</button>
          <button class="btn-danger" @click="confirmDelete">{{ t('peers.delete') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePeersStore } from '../stores/peers.js';
import { useWebSocket } from '../composables/useWebSocket.js';
import PeerCard from '../components/PeerCard.vue';
import PeerForm from '../components/PeerForm.vue';
import QrModal from '../components/QrModal.vue';

const { t } = useI18n();
const peersStore = usePeersStore();

const showForm = ref(false);
const qrPeer = ref(null);
const deletePeer = ref(null);

useWebSocket((msg) => {
  if (msg.type === 'peers') {
    peersStore.updateFromWs(msg.data);
  }
});

onMounted(() => peersStore.fetchPeers());

async function handleShowQr(peer) {
  try {
    const res = await fetch(`/api/peers/${peer.id}/qr`);
    if (!res.ok) {
      alert(t('peers.qrNotAvailable') || 'QR not available. Re-create the peer to get a new QR code.');
      return;
    }
    const data = await res.json();
    qrPeer.value = { name: peer.name, qr: data.qr, config: data.config };
  } catch {
    alert(t('peers.qrNotAvailable') || 'QR not available.');
  }
}

async function handleDownload(peer) {
  try {
    const res = await fetch(`/api/peers/${peer.id}/qr`);
    if (!res.ok) {
      alert(t('peers.qrNotAvailable') || 'Config not available. Re-create the peer.');
      return;
    }
    const data = await res.json();
    const blob = new Blob([data.config], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${peer.name || 'peer'}.conf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    // ignore
  }
}

async function handleToggle(peer) {
  await peersStore.togglePeer(peer.id, !peer.disabled);
  await peersStore.fetchPeers();
}

function handleDelete(peer) {
  deletePeer.value = peer;
}

async function confirmDelete() {
  if (!deletePeer.value) return;
  await peersStore.deletePeer(deletePeer.value.id);
  deletePeer.value = null;
}
</script>

<style scoped>
.peers-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.peers-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}
.btn-new {
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}
.btn-new:hover {
  background: var(--accent-hover);
}
.loading {
  text-align: center;
  color: var(--text-secondary);
  padding: 40px;
}
.peers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
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
.confirm-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 24px;
  text-align: center;
  max-width: 360px;
  width: 100%;
}
.confirm-card p {
  color: var(--text-primary);
  margin-bottom: 8px;
}
.confirm-name {
  font-weight: 600;
  color: var(--text-secondary) !important;
  font-size: 14px;
}
.confirm-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  justify-content: center;
}
.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  transition: all 0.2s;
}
.btn-cancel:hover {
  border-color: var(--text-secondary);
}
.btn-danger {
  background: var(--danger);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}
.btn-danger:hover {
  background: var(--danger-hover);
}
</style>
