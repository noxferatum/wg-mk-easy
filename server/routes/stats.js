export async function statsRoutes(app) {
  app.get('/api/stats', async () => {
    const mk = app.mikrotik;
    const wgConfig = app.config.wg;
    const peers = await mk.get(`/interface/wireguard/peers?interface=${wgConfig.interface}`);
    const iface = await mk.get(`/interface?name=${wgConfig.interface}`);
    let online = 0, totalTx = 0, totalRx = 0;
    for (const p of peers) {
      totalTx += parseInt(p.tx || '0', 10);
      totalRx += parseInt(p.rx || '0', 10);
      if (p['last-handshake'] && p['last-handshake'] !== '0s') {
        const seconds = parseHandshake(p['last-handshake']);
        if (seconds < 180) online++;
      }
    }
    return {
      totalPeers: peers.length, online, offline: peers.length - online,
      totalTx, totalRx,
      interfaceTx: parseInt(iface[0]?.['tx-byte'] || '0', 10),
      interfaceRx: parseInt(iface[0]?.['rx-byte'] || '0', 10),
    };
  });
}

function parseHandshake(str) {
  let total = 0;
  const parts = str.match(/(\d+)(w|d|h|m|s)/g) || [];
  for (const part of parts) {
    const num = parseInt(part);
    if (part.endsWith('w')) total += num * 604800;
    else if (part.endsWith('d')) total += num * 86400;
    else if (part.endsWith('h')) total += num * 3600;
    else if (part.endsWith('m')) total += num * 60;
    else if (part.endsWith('s')) total += num;
  }
  return total;
}
