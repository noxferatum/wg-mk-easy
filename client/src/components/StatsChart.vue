<template>
  <div class="chart-wrapper">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import { useI18n } from 'vue-i18n';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const { t } = useI18n();

const props = defineProps({
  txData: { type: Array, default: () => [] },
  rxData: { type: Array, default: () => [] },
  labels: { type: Array, default: () => [] },
});

const chartData = computed(() => ({
  labels: props.labels,
  datasets: [
    {
      label: t('peers.upload'),
      data: props.txData,
      borderColor: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#4ecca3',
      backgroundColor: 'rgba(78, 204, 163, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 2,
    },
    {
      label: t('peers.download'),
      data: props.rxData,
      borderColor: getComputedStyle(document.documentElement).getPropertyValue('--warning').trim() || '#f39c12',
      backgroundColor: 'rgba(243, 156, 18, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 2,
    },
  ],
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#a0a0b0',
      },
    },
  },
  scales: {
    x: {
      ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#a0a0b0' },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
    y: {
      ticks: { color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#a0a0b0' },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
  },
};
</script>

<style scoped>
.chart-wrapper {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 20px;
  height: 300px;
}
</style>
