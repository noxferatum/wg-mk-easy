export async function serverRoutes(app) {
  app.get('/api/server', async () => {
    const mk = app.mikrotik;
    const wgInterfaces = await mk.get('/interface/wireguard');
    const iface = wgInterfaces.find(i => i.name === app.config.wg.interface);
    return {
      name: iface?.name || '',
      publicKey: iface?.['public-key'] || '',
      listenPort: iface?.['listen-port'] || '',
      running: iface?.running === 'true',
      endpoint: app.config.wg.endpoint,
      dns: app.config.wg.dns,
      allowedIps: app.config.wg.allowedIps,
    };
  });
}
