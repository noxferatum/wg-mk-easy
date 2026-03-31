export class PollingService {
  constructor(mikrotikClient, wgInterface, intervalMs = 5000) {
    this.client = mikrotikClient;
    this.wgInterface = wgInterface;
    this.intervalMs = intervalMs;
    this.listeners = new Set();
    this.timer = null;
  }

  addListener(fn) { this.listeners.add(fn); this.ensureRunning(); }
  removeListener(fn) { this.listeners.delete(fn); if (this.listeners.size === 0) this.stop(); }

  ensureRunning() {
    if (this.timer) return;
    this.timer = setInterval(() => this.poll(), this.intervalMs);
    this.poll();
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  async poll() {
    try {
      const peers = await this.client.get(`/interface/wireguard/peers?interface=${this.wgInterface}`);
      const data = peers.map(p => ({
        id: p['.id'], name: p.comment || '', lastHandshake: p['last-handshake'] || '',
        tx: parseInt(p.tx || '0', 10), rx: parseInt(p.rx || '0', 10), disabled: p.disabled === 'true',
      }));
      for (const fn of this.listeners) fn(data);
    } catch (err) {
      console.error('Polling error:', err.message);
    }
  }
}
