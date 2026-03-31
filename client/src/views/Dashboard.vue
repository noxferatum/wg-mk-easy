<template>
  <div class="dashboard">
    <h2 class="page-title">{{ t('nav.dashboard') }}</h2>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">{{ t('dashboard.totalPeers') }}</span>
        <span class="stat-value">{{ stats.totalPeers }}</span>
      </div>
      <div class="stat-card online">
        <span class="stat-label">{{ t('dashboard.online') }}</span>
        <span class="stat-value">{{ stats.online }}</span>
      </div>
      <div class="stat-card offline">
        <span class="stat-label">{{ t('dashboard.offline') }}</span>
        <span class="stat-value">{{ stats.offline }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">{{ t('dashboard.traffic') }}</span>
        <span class="stat-value">{{ formatBytes(stats.totalTraffic) }}</span>
      </div>
    </div>

    <div class="chart-section">
      <StatsChart :tx-data="chartTx" :rx-data="chartRx" :labels="chartLabels" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWebSocket } from '../composables/useWebSocket.js';
import StatsChart from '../components/StatsChart.vue';

const { t } = useI18n();

const stats = ref({
  totalPeers: 0,
  online: 0,
  offline: 0,
  totalTraffic: 0,
});

const chartTx = ref([0, 0, 0, 0, 0, 0]);
const chartRx = ref([0, 0, 0, 0, 0, 0]);
const chartLabels = ref(['-5m', '-4m', '-3m', '-2m', '-1m', 'now']);

async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    const data = await res.json();
    stats.value = {
      totalPeers: data.totalPeers ?? 0,
      online: data.online ?? 0,
      offline: data.offline ?? 0,
      totalTraffic: data.totalTraffic ?? 0,
    };
  } catch {
    // ignore fetch errors silently
  }
}

useWebSocket((msg) => {
  if (msg.type === 'stats') {
    stats.value = {
      totalPeers: msg.data.totalPeers ?? stats.value.totalPeers,
      online: msg.data.online ?? stats.value.online,
      offline: msg.data.offline ?? stats.value.offline,
      totalTraffic: msg.data.totalTraffic ?? stats.value.totalTraffic,
    };
  }
  if (msg.type === 'chart') {
    chartTx.value = msg.data.tx || chartTx.value;
    chartRx.value = msg.data.rx || chartRx.value;
    chartLabels.value = msg.data.labels || chartLabels.value;
  }
});

onMounted(fetchStats);

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}
.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}
.stat-card.online .stat-value {
  color: var(--success);
}
.stat-card.offline .stat-value {
  color: var(--danger);
}
.chart-section {
  margin-top: 8px;
}
</style>
