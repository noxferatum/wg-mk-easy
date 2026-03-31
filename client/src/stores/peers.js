import { defineStore } from 'pinia';
import { ref } from 'vue';

export const usePeersStore = defineStore('peers', () => {
  const peers = ref([]);
  const loading = ref(false);

  async function fetchPeers() {
    loading.value = true;
    try {
      const res = await fetch('/api/peers');
      const data = await res.json();
      peers.value = data.peers;
    } finally {
      loading.value = false;
    }
  }

  async function createPeer(name) {
    const res = await fetch('/api/peers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to create peer');
    return res.json();
  }

  async function deletePeer(id) {
    await fetch(`/api/peers/${id}`, { method: 'DELETE' });
    peers.value = peers.value.filter(p => p.id !== id);
  }

  async function togglePeer(id, disabled) {
    await fetch(`/api/peers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disabled }),
    });
  }

  function updateFromWs(data) {
    for (const update of data) {
      const peer = peers.value.find(p => p.id === update.id);
      if (peer) Object.assign(peer, update);
    }
  }

  return { peers, loading, fetchPeers, createPeer, deletePeer, togglePeer, updateFromWs };
});
