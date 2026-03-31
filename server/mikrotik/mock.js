/**
 * Mock MikroTik client for local development/demo.
 * Simulates RouterOS REST API responses with fake data.
 */

const MOCK_SERVER_KEYS = {
  publicKey: 'sK3Q7YGWI3hWzUI1hpGjGjSXzGKMnVBJCmXRDqTOmHk=',
  privateKey: 'MOCK_PRIVATE_KEY_NOT_REAL',
};

let mockPeers = [
  {
    '.id': '*1',
    interface: 'wireguard1',
    'public-key': 'aB3dEfGhIjKlMnOpQrStUvWxYz0123456789ABCDE=',
    'allowed-address': '10.0.0.2/32',
    comment: 'Phone - Rodrigo',
    disabled: 'false',
    'last-handshake': '45s',
    tx: '15728640',
    rx: '52428800',
  },
  {
    '.id': '*2',
    interface: 'wireguard1',
    'public-key': 'xY9wVuTsRqPoNmLkJiHgFeDcBa9876543210zyxwv=',
    'allowed-address': '10.0.0.3/32',
    comment: 'Laptop - Work',
    disabled: 'false',
    'last-handshake': '2h15m',
    tx: '104857600',
    rx: '209715200',
  },
  {
    '.id': '*3',
    interface: 'wireguard1',
    'public-key': 'Mn0pQrStUvWxYz1234567890AbCdEfGhIjKlMnOp=',
    'allowed-address': '10.0.0.4/32',
    comment: 'Tablet - Living Room',
    disabled: 'true',
    'last-handshake': '0s',
    tx: '0',
    rx: '0',
  },
];

let nextId = 4;

function randomizeTraffic() {
  for (const p of mockPeers) {
    if (p.disabled === 'true') continue;
    p.tx = String(parseInt(p.tx) + Math.floor(Math.random() * 102400));
    p.rx = String(parseInt(p.rx) + Math.floor(Math.random() * 204800));
    // Simulate handshake aging
    const current = parseHandshakeToSeconds(p['last-handshake']);
    if (current < 120 && Math.random() > 0.3) {
      p['last-handshake'] = Math.floor(Math.random() * 30) + 's';
    } else if (current < 300) {
      p['last-handshake'] = (current + 5) + 's';
    }
  }
}

function parseHandshakeToSeconds(str) {
  let total = 0;
  const parts = str.match(/(\d+)(h|m|s)/g) || [];
  for (const part of parts) {
    const num = parseInt(part);
    if (part.endsWith('h')) total += num * 3600;
    else if (part.endsWith('m')) total += num * 60;
    else if (part.endsWith('s')) total += num;
  }
  return total;
}

// Simulate traffic changes every 5 seconds
setInterval(randomizeTraffic, 5000);

export class MockMikroTikClient {
  constructor() {
    console.log('[MOCK] MikroTik client initialized — using fake data');
  }

  async get(path) {
    await delay(100);

    if (path.includes('/interface/wireguard/peers')) {
      return [...mockPeers];
    }

    if (path.includes('/interface/wireguard')) {
      return [{
        '.id': '*1',
        name: 'wireguard1',
        'public-key': MOCK_SERVER_KEYS.publicKey,
        'listen-port': '51820',
        running: 'true',
        mtu: '1420',
      }];
    }

    if (path.includes('/interface?name=')) {
      const totalTx = mockPeers.reduce((s, p) => s + parseInt(p.tx || '0'), 0);
      const totalRx = mockPeers.reduce((s, p) => s + parseInt(p.rx || '0'), 0);
      return [{
        name: 'wireguard1',
        'tx-byte': String(totalTx),
        'rx-byte': String(totalRx),
        running: 'true',
      }];
    }

    if (path.includes('/ip/address')) {
      return [{ address: '10.0.0.1/24', interface: 'wireguard1' }];
    }

    return [];
  }

  async put(path, body) {
    await delay(150);

    if (path.includes('/interface/wireguard/peers')) {
      const id = `*${nextId++}`;
      const newPeer = {
        '.id': id,
        interface: body.interface || 'wireguard1',
        'public-key': body['public-key'] || '',
        'allowed-address': body['allowed-address'] || '',
        comment: body.comment || '',
        disabled: 'false',
        'last-handshake': '0s',
        tx: '0',
        rx: '0',
      };
      mockPeers.push(newPeer);
      return { '.id': id };
    }

    return {};
  }

  async patch(path, body) {
    await delay(100);
    const id = path.split('/').pop();
    const peer = mockPeers.find(p => p['.id'] === id);
    if (peer) {
      if (body.comment !== undefined) peer.comment = body.comment;
      if (body.disabled !== undefined) peer.disabled = body.disabled;
    }
    return {};
  }

  async delete(path) {
    await delay(100);
    const id = path.split('/').pop();
    mockPeers = mockPeers.filter(p => p['.id'] !== id);
    return {};
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
