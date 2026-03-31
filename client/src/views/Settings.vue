<template>
  <div class="settings-page">
    <h2 class="page-title">{{ t('settings.title') }}</h2>

    <section class="settings-section">
      <h3 class="section-title">{{ t('settings.theme') }}</h3>
      <div class="section-card">
        <div class="setting-row">
          <span class="setting-label">{{ t('settings.theme') }}</span>
          <ThemeToggle />
        </div>
        <div class="setting-row">
          <span class="setting-label">{{ t('settings.language') }}</span>
          <LangToggle />
        </div>
      </div>
    </section>

    <section class="settings-section">
      <h3 class="section-title">{{ t('settings.wgConfig') }}</h3>
      <div class="section-card">
        <div v-if="loading" class="loading">Loading...</div>
        <template v-else>
          <div class="info-row">
            <span class="info-label">{{ t('settings.endpoint') }}</span>
            <span class="info-value">{{ serverInfo.endpoint || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Public Key</span>
            <span class="info-value mono">{{ serverInfo.publicKey || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Listen Port</span>
            <span class="info-value">{{ serverInfo.listenPort || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">{{ t('settings.dns') }}</span>
            <span class="info-value">{{ serverInfo.dns || '-' }}</span>
          </div>
        </template>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import ThemeToggle from '../components/ThemeToggle.vue';
import LangToggle from '../components/LangToggle.vue';

const { t } = useI18n();

const loading = ref(true);
const serverInfo = ref({
  endpoint: '',
  publicKey: '',
  listenPort: '',
  dns: '',
});

onMounted(async () => {
  try {
    const res = await fetch('/api/server');
    const data = await res.json();
    serverInfo.value = {
      endpoint: data.endpoint || '',
      publicKey: data.publicKey || '',
      listenPort: data.listenPort || '',
      dns: data.dns || '',
    };
  } catch {
    // ignore
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}
.settings-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
}
.section-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.setting-label {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 500;
}
.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}
.info-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}
.info-row:first-child {
  padding-top: 0;
}
.info-label {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}
.info-value {
  font-size: 14px;
  color: var(--text-primary);
}
.info-value.mono {
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
  text-align: right;
  max-width: 60%;
}
.loading {
  text-align: center;
  color: var(--text-secondary);
  padding: 20px;
}
</style>
