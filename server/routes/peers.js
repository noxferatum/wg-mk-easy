import { generateKeyPair } from '../wireguard/keys.js';
import { generateClientConfig } from '../wireguard/config.js';
import { generateQrDataUrl } from '../wireguard/qr.js';

export async function peersRoutes(app) {
  const prefix = '/api/peers';

  app.get(prefix, async (request) => {
    const mk = app.mikrotik;
    const wgInterface = app.config.wg.interface;
    const peers = await mk.get(`/interface/wireguard/peers?interface=${wgInterface}`);
    return { peers: peers.map(parsePeer) };
  });

  app.post(prefix, async (request, reply) => {
    const { name } = request.body;
    const mk = app.mikrotik;
    const wgConfig = app.config.wg;
    const { privateKey, publicKey } = generateKeyPair();
    const existingPeers = await mk.get(`/interface/wireguard/peers?interface=${wgConfig.interface}`);
    const usedIps = existingPeers.map(p => p['allowed-address']?.replace('/32', '')).filter(Boolean);
    const nextIp = findNextIp(usedIps);
    const wgInterfaces = await mk.get('/interface/wireguard');
    const serverInterface = wgInterfaces.find(i => i.name === wgConfig.interface);
    const serverPublicKey = serverInterface?.['public-key'] || '';
    await mk.put('/interface/wireguard/peers', {
      interface: wgConfig.interface,
      'public-key': publicKey,
      'allowed-address': `${nextIp}/32`,
      comment: name || 'wg-mk-easy peer',
    });
    const clientConfig = generateClientConfig({
      privateKey, address: `${nextIp}/32`, dns: wgConfig.dns,
      publicKey: serverPublicKey, endpoint: wgConfig.endpoint, allowedIps: wgConfig.allowedIps,
    });
    const qr = await generateQrDataUrl(clientConfig);
    reply.code(201);
    return { peer: { name, address: `${nextIp}/32`, publicKey, qr, config: clientConfig } };
  });

  app.patch(`${prefix}/:id`, async (request) => {
    const { id } = request.params;
    const { name, disabled } = request.body;
    const update = {};
    if (name !== undefined) update.comment = name;
    if (disabled !== undefined) update.disabled = disabled ? 'true' : 'false';
    await app.mikrotik.patch(`/interface/wireguard/peers/${id}`, update);
    return { ok: true };
  });

  app.delete(`${prefix}/:id`, async (request) => {
    const { id } = request.params;
    await app.mikrotik.delete(`/interface/wireguard/peers/${id}`);
    return { ok: true };
  });
}

function parsePeer(raw) {
  return {
    id: raw['.id'], name: raw.comment || '', publicKey: raw['public-key'] || '',
    address: raw['allowed-address'] || '', disabled: raw.disabled === 'true',
    lastHandshake: raw['last-handshake'] || '', tx: parseInt(raw.tx || '0', 10), rx: parseInt(raw.rx || '0', 10),
  };
}

function findNextIp(usedIps, subnet = '10.0.0') {
  const used = new Set(usedIps.map(ip => parseInt(ip.split('.')[3], 10)));
  for (let i = 2; i < 255; i++) { if (!used.has(i)) return `${subnet}.${i}`; }
  throw new Error('No available IPs in subnet');
}
