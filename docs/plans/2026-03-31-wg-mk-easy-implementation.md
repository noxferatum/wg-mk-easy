# wg-mk-easy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web-based WireGuard peer manager for MikroTik RouterOS, deployable as a single Docker container.

**Architecture:** Monolith Node.js app — Fastify serves both the REST API (proxying to RouterOS) and the Vue 3 SPA as static files. WebSocket pushes real-time peer status. No database; state lives in RouterOS.

**Tech Stack:** Node.js 20, Fastify 5, Vue 3 (Composition API), Pinia, Vue Router, Vue I18n, Chart.js, Vite, Docker

---

### Task 1: Project scaffolding and config

**Files:**
- Create: `package.json`
- Create: `server/index.js`
- Create: `server/config.js`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `LICENSE`

- [ ] **Step 1: Initialize npm project**

Run:
```bash
cd /mnt/c/Users/noxfe/Documents/Desarrollos/wg-mk-easy
npm init -y
```

- [ ] **Step 2: Install server dependencies**

Run:
```bash
npm install fastify @fastify/websocket @fastify/static @fastify/cookie @fastify/cors jsonwebtoken node-fetch tweetnacl tweetnacl-util qrcode dotenv
npm install -D vitest
```

- [ ] **Step 3: Create .gitignore**

Create `.gitignore`:
```
node_modules/
dist/
data/config.json
.env
*.log
```

- [ ] **Step 4: Create LICENSE**

Create `LICENSE` with MIT license text, copyright "2026 wg-mk-easy contributors".

- [ ] **Step 5: Create .env.example**

Create `.env.example`:
```env
PASSWORD=changeme
ROUTER_HOST=192.168.88.1
ROUTER_USER=admin
ROUTER_PASS=your_router_password
WG_INTERFACE=wireguard1
WG_ENDPOINT=your.domain.com:51820
WG_DNS=1.1.1.1
WG_ALLOWED_IPS=0.0.0.0/0
LANG=en
TZ=Europe/Madrid
```

- [ ] **Step 6: Create server/config.js**

```js
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  password: process.env.PASSWORD || 'changeme',
  jwtSecret: process.env.JWT_SECRET || process.env.PASSWORD || 'changeme',
  router: {
    host: process.env.ROUTER_HOST || '192.168.88.1',
    user: process.env.ROUTER_USER || 'admin',
    pass: process.env.ROUTER_PASS || '',
  },
  wg: {
    interface: process.env.WG_INTERFACE || 'wireguard1',
    endpoint: process.env.WG_ENDPOINT || 'vpn.example.com:51820',
    dns: process.env.WG_DNS || '1.1.1.1',
    allowedIps: process.env.WG_ALLOWED_IPS || '0.0.0.0/0',
  },
  lang: process.env.LANG || 'en',
  tz: process.env.TZ || 'Europe/Madrid',
};
```

- [ ] **Step 7: Create server/index.js (minimal)**

```js
import Fastify from 'fastify';
import { config } from './config.js';

const app = Fastify({ logger: true });

app.get('/api/health', async () => ({ status: 'ok' }));

app.listen({ port: config.port, host: '0.0.0.0' }, (err) => {
  if (err) { app.log.error(err); process.exit(1); }
});
```

- [ ] **Step 8: Add type module to package.json**

Add `"type": "module"` and scripts to `package.json`:
```json
{
  "type": "module",
  "scripts": {
    "dev": "node --watch server/index.js",
    "start": "node server/index.js",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 9: Verify server starts**

Run: `npm run dev`
Expected: Server listening on port 3000. `curl http://localhost:3000/api/health` returns `{"status":"ok"}`.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: project scaffolding with Fastify server and config"
```

---

### Task 2: MikroTik REST API client

**Files:**
- Create: `server/mikrotik/client.js`
- Create: `server/mikrotik/__tests__/client.test.js`

- [ ] **Step 1: Write the test**

Create `server/mikrotik/__tests__/client.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MikroTikClient } from '../client.js';

describe('MikroTikClient', () => {
  let client;

  beforeEach(() => {
    client = new MikroTikClient('192.168.88.1', 'admin', 'pass');
  });

  it('builds correct base URL', () => {
    expect(client.baseUrl).toBe('https://192.168.88.1/rest');
  });

  it('builds correct auth header', () => {
    const expected = 'Basic ' + Buffer.from('admin:pass').toString('base64');
    expect(client.authHeader).toBe(expected);
  });

  it('get() calls fetch with correct params', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve([{ name: 'peer1' }]) };
    global.fetch = vi.fn(() => Promise.resolve(mockResponse));

    const result = await client.get('/interface/wireguard/peers');

    expect(fetch).toHaveBeenCalledWith(
      'https://192.168.88.1/rest/interface/wireguard/peers',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ 'Authorization': client.authHeader }),
      })
    );
    expect(result).toEqual([{ name: 'peer1' }]);
  });

  it('put() sends JSON body', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ '.id': '*1' }) };
    global.fetch = vi.fn(() => Promise.resolve(mockResponse));

    await client.put('/interface/wireguard/peers', { 'public-key': 'abc' });

    expect(fetch).toHaveBeenCalledWith(
      'https://192.168.88.1/rest/interface/wireguard/peers',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ 'public-key': 'abc' }),
      })
    );
  });

  it('throws on non-ok response', async () => {
    global.fetch = vi.fn(() => Promise.resolve({
      ok: false, status: 401, statusText: 'Unauthorized',
      json: () => Promise.resolve({ detail: 'bad credentials' }),
    }));

    await expect(client.get('/test')).rejects.toThrow('RouterOS API error: 401');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/mikrotik/__tests__/client.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement MikroTik client**

Create `server/mikrotik/client.js`:
```js
export class MikroTikClient {
  constructor(host, user, pass) {
    this.baseUrl = `https://${host}/rest`;
    this.authHeader = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');
  }

  async request(method, path, body = null) {
    const options = {
      method,
      headers: {
        'Authorization': this.authHeader,
        'Content-Type': 'application/json',
      },
      // RouterOS uses self-signed certs by default
      ...(typeof process !== 'undefined' && { signal: AbortSignal.timeout(10000) }),
    };
    if (body) options.body = JSON.stringify(body);

    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, options);

    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      const err = new Error(`RouterOS API error: ${res.status}`);
      err.status = res.status;
      err.detail = detail;
      throw err;
    }

    return res.json();
  }

  get(path) { return this.request('GET', path); }
  put(path, body) { return this.request('PUT', path, body); }
  patch(path, body) { return this.request('PATCH', path, body); }
  delete(path) { return this.request('DELETE', path); }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run server/mikrotik/__tests__/client.test.js`
Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add server/mikrotik/
git commit -m "feat: MikroTik REST API client with tests"
```

---

### Task 3: WireGuard key generation and QR

**Files:**
- Create: `server/wireguard/keys.js`
- Create: `server/wireguard/config.js`
- Create: `server/wireguard/qr.js`
- Create: `server/wireguard/__tests__/keys.test.js`
- Create: `server/wireguard/__tests__/config.test.js`

- [ ] **Step 1: Write key generation test**

Create `server/wireguard/__tests__/keys.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { generateKeyPair } from '../keys.js';

describe('generateKeyPair', () => {
  it('returns privateKey and publicKey as base64 strings', () => {
    const { privateKey, publicKey } = generateKeyPair();
    expect(privateKey).toMatch(/^[A-Za-z0-9+/]{43}=$/);
    expect(publicKey).toMatch(/^[A-Za-z0-9+/]{43}=$/);
  });

  it('generates unique keys each time', () => {
    const a = generateKeyPair();
    const b = generateKeyPair();
    expect(a.privateKey).not.toBe(b.privateKey);
    expect(a.publicKey).not.toBe(b.publicKey);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/wireguard/__tests__/keys.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement key generation**

Create `server/wireguard/keys.js`:
```js
import nacl from 'tweetnacl';
import { encodeBase64 } from 'tweetnacl-util';

export function generateKeyPair() {
  const keyPair = nacl.box.keyPair();
  // WireGuard uses Curve25519 — tweetnacl.box uses the same curve
  return {
    privateKey: encodeBase64(keyPair.secretKey),
    publicKey: encodeBase64(keyPair.publicKey),
  };
}
```

- [ ] **Step 4: Run key test**

Run: `npx vitest run server/wireguard/__tests__/keys.test.js`
Expected: PASS.

- [ ] **Step 5: Write config generation test**

Create `server/wireguard/__tests__/config.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { generateClientConfig } from '../config.js';

describe('generateClientConfig', () => {
  it('generates valid WireGuard config string', () => {
    const conf = generateClientConfig({
      privateKey: 'cGVlck1vY2tQcml2YXRlS2V5QmFzZTY0U3RyaW5nMQ==',
      address: '10.0.0.2/32',
      dns: '1.1.1.1',
      publicKey: 'c2VydmVyTW9ja1B1YmxpY0tleUJhc2U2NFN0cmluZzE=',
      endpoint: 'vpn.example.com:51820',
      allowedIps: '0.0.0.0/0',
    });

    expect(conf).toContain('[Interface]');
    expect(conf).toContain('PrivateKey = cGVlck1vY2tQcml2YXRlS2V5QmFzZTY0U3RyaW5nMQ==');
    expect(conf).toContain('Address = 10.0.0.2/32');
    expect(conf).toContain('DNS = 1.1.1.1');
    expect(conf).toContain('[Peer]');
    expect(conf).toContain('PublicKey = c2VydmVyTW9ja1B1YmxpY0tleUJhc2U2NFN0cmluZzE=');
    expect(conf).toContain('Endpoint = vpn.example.com:51820');
    expect(conf).toContain('AllowedIPs = 0.0.0.0/0');
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run server/wireguard/__tests__/config.test.js`
Expected: FAIL.

- [ ] **Step 7: Implement config generation**

Create `server/wireguard/config.js`:
```js
export function generateClientConfig({ privateKey, address, dns, publicKey, endpoint, allowedIps }) {
  return `[Interface]
PrivateKey = ${privateKey}
Address = ${address}
DNS = ${dns}

[Peer]
PublicKey = ${publicKey}
Endpoint = ${endpoint}
AllowedIPs = ${allowedIps}
PersistentKeepalive = 25`;
}
```

- [ ] **Step 8: Run config test**

Run: `npx vitest run server/wireguard/__tests__/config.test.js`
Expected: PASS.

- [ ] **Step 9: Implement QR generation**

Create `server/wireguard/qr.js`:
```js
import QRCode from 'qrcode';

export async function generateQrDataUrl(configString) {
  return QRCode.toDataURL(configString, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

export async function generateQrSvg(configString) {
  return QRCode.toString(configString, { type: 'svg' });
}
```

- [ ] **Step 10: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS.

- [ ] **Step 11: Commit**

```bash
git add server/wireguard/
git commit -m "feat: WireGuard key generation, client config, and QR code"
```

---

### Task 4: Authentication (JWT)

**Files:**
- Create: `server/auth/routes.js`
- Create: `server/auth/middleware.js`
- Create: `server/auth/__tests__/auth.test.js`

- [ ] **Step 1: Write auth test**

Create `server/auth/__tests__/auth.test.js`:
```js
import { describe, it, expect } from 'vitest';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { authRoutes } from '../routes.js';
import { authMiddleware } from '../middleware.js';

async function buildApp(password = 'testpass') {
  const app = Fastify();
  await app.register(cookie);
  app.decorate('config', { password, jwtSecret: password });
  await app.register(authRoutes);
  app.get('/api/protected', { preHandler: authMiddleware }, async () => ({ ok: true }));
  return app;
}

describe('Auth', () => {
  it('POST /api/auth/login with correct password returns 200 and sets cookie', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { password: 'testpass' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toMatch(/token=/);
  });

  it('POST /api/auth/login with wrong password returns 401', async () => {
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { password: 'wrong' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('protected route without token returns 401', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/protected' });
    expect(res.statusCode).toBe(401);
  });

  it('protected route with valid token returns 200', async () => {
    const app = await buildApp();
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { password: 'testpass' },
    });
    const cookieHeader = loginRes.headers['set-cookie'];
    const res = await app.inject({
      method: 'GET',
      url: '/api/protected',
      headers: { cookie: cookieHeader },
    });
    expect(res.statusCode).toBe(200);
  });

  it('DELETE /api/auth/logout clears cookie', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'DELETE', url: '/api/auth/logout' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toMatch(/token=;/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/auth/__tests__/auth.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement auth middleware**

Create `server/auth/middleware.js`:
```js
import jwt from 'jsonwebtoken';

export async function authMiddleware(request, reply) {
  const token = request.cookies?.token;
  if (!token) {
    return reply.code(401).send({ error: 'Not authenticated' });
  }
  try {
    jwt.verify(token, request.server.config.jwtSecret);
  } catch {
    return reply.code(401).send({ error: 'Invalid token' });
  }
}
```

- [ ] **Step 4: Implement auth routes**

Create `server/auth/routes.js`:
```js
import jwt from 'jsonwebtoken';

export async function authRoutes(app) {
  app.post('/api/auth/login', async (request, reply) => {
    const { password } = request.body || {};
    if (password !== app.config.password) {
      return reply.code(401).send({ error: 'Invalid password' });
    }
    const token = jwt.sign({ admin: true }, app.config.jwtSecret, { expiresIn: '7d' });
    reply.setCookie('token', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
    });
    return { ok: true };
  });

  app.delete('/api/auth/logout', async (request, reply) => {
    reply.setCookie('token', '', { path: '/', httpOnly: true, maxAge: 0 });
    return { ok: true };
  });

  app.get('/api/auth/check', async (request, reply) => {
    const token = request.cookies?.token;
    if (!token) return { authenticated: false };
    try {
      jwt.verify(token, app.config.jwtSecret);
      return { authenticated: true };
    } catch {
      return { authenticated: false };
    }
  });
}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run server/auth/__tests__/auth.test.js`
Expected: All 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add server/auth/
git commit -m "feat: JWT authentication with login/logout/check routes"
```

---

### Task 5: Peers API routes

**Files:**
- Create: `server/routes/peers.js`
- Create: `server/routes/__tests__/peers.test.js`

- [ ] **Step 1: Write peers routes test**

Create `server/routes/__tests__/peers.test.js`:
```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { peersRoutes } from '../peers.js';

const mockClient = {
  get: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

async function buildApp() {
  const app = Fastify();
  await app.register(cookie);
  app.decorate('config', { password: 'test', jwtSecret: 'test', wg: { interface: 'wireguard1', endpoint: 'vpn.test.com:51820', dns: '1.1.1.1', allowedIps: '0.0.0.0/0' } });
  app.decorate('mikrotik', mockClient);
  // Skip auth for tests
  app.addHook('preHandler', async (req) => { req.authenticated = true; });
  await app.register(peersRoutes);
  return app;
}

describe('Peers API', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('GET /api/peers returns peer list', async () => {
    mockClient.get.mockResolvedValue([
      { '.id': '*1', comment: 'phone', 'public-key': 'abc=', 'allowed-address': '10.0.0.2/32', disabled: 'false', 'last-handshake': '1m5s', tx: '1234', rx: '5678' }
    ]);
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/peers' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.peers).toHaveLength(1);
    expect(body.peers[0].name).toBe('phone');
  });

  it('POST /api/peers creates a new peer', async () => {
    mockClient.get.mockResolvedValue([]);
    mockClient.put.mockResolvedValue({ '.id': '*2' });
    const app = await buildApp();
    const res = await app.inject({
      method: 'POST',
      url: '/api/peers',
      payload: { name: 'laptop' },
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.peer.name).toBe('laptop');
    expect(body.peer.qr).toBeTruthy();
    expect(body.peer.config).toContain('[Interface]');
  });

  it('DELETE /api/peers/:id removes peer', async () => {
    mockClient.delete.mockResolvedValue({});
    const app = await buildApp();
    const res = await app.inject({ method: 'DELETE', url: '/api/peers/*1' });
    expect(res.statusCode).toBe(200);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run server/routes/__tests__/peers.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement peers routes**

Create `server/routes/peers.js`:
```js
import { generateKeyPair } from '../wireguard/keys.js';
import { generateClientConfig } from '../wireguard/config.js';
import { generateQrDataUrl } from '../wireguard/qr.js';

export async function peersRoutes(app) {
  const prefix = '/api/peers';

  app.get(prefix, async (request) => {
    const mk = app.mikrotik;
    const wgInterface = app.config.wg.interface;
    const peers = await mk.get(`/interface/wireguard/peers?interface=${wgInterface}`);
    return {
      peers: peers.map(parsePeer),
    };
  });

  app.post(prefix, async (request, reply) => {
    const { name } = request.body;
    const mk = app.mikrotik;
    const wgConfig = app.config.wg;

    // Generate keys
    const { privateKey, publicKey } = generateKeyPair();

    // Find next available IP
    const existingPeers = await mk.get(`/interface/wireguard/peers?interface=${wgConfig.interface}`);
    const usedIps = existingPeers.map(p => p['allowed-address']?.replace('/32', '')).filter(Boolean);
    const nextIp = findNextIp(usedIps);

    // Get server public key
    const wgInterfaces = await mk.get('/interface/wireguard');
    const serverInterface = wgInterfaces.find(i => i.name === wgConfig.interface);
    const serverPublicKey = serverInterface?.['public-key'] || '';

    // Create peer on RouterOS
    await mk.put('/interface/wireguard/peers', {
      interface: wgConfig.interface,
      'public-key': publicKey,
      'allowed-address': `${nextIp}/32`,
      comment: name || 'wg-mk-easy peer',
    });

    // Generate client config and QR
    const clientConfig = generateClientConfig({
      privateKey,
      address: `${nextIp}/32`,
      dns: wgConfig.dns,
      publicKey: serverPublicKey,
      endpoint: wgConfig.endpoint,
      allowedIps: wgConfig.allowedIps,
    });
    const qr = await generateQrDataUrl(clientConfig);

    reply.code(201);
    return {
      peer: { name, address: `${nextIp}/32`, publicKey, qr, config: clientConfig },
    };
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
    id: raw['.id'],
    name: raw.comment || '',
    publicKey: raw['public-key'] || '',
    address: raw['allowed-address'] || '',
    disabled: raw.disabled === 'true',
    lastHandshake: raw['last-handshake'] || '',
    tx: parseInt(raw.tx || '0', 10),
    rx: parseInt(raw.rx || '0', 10),
  };
}

function findNextIp(usedIps, subnet = '10.0.0') {
  const used = new Set(usedIps.map(ip => parseInt(ip.split('.')[3], 10)));
  for (let i = 2; i < 255; i++) {
    if (!used.has(i)) return `${subnet}.${i}`;
  }
  throw new Error('No available IPs in subnet');
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run server/routes/__tests__/peers.test.js`
Expected: All 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add server/routes/
git commit -m "feat: peers CRUD API routes with key generation and QR"
```

---

### Task 6: Server and stats routes

**Files:**
- Create: `server/routes/server.js`
- Create: `server/routes/stats.js`

- [ ] **Step 1: Implement server routes**

Create `server/routes/server.js`:
```js
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
```

- [ ] **Step 2: Implement stats routes**

Create `server/routes/stats.js`:
```js
export async function statsRoutes(app) {
  app.get('/api/stats', async () => {
    const mk = app.mikrotik;
    const wgConfig = app.config.wg;

    const peers = await mk.get(`/interface/wireguard/peers?interface=${wgConfig.interface}`);
    const iface = await mk.get(`/interface?name=${wgConfig.interface}`);

    const now = Date.now();
    let online = 0;
    let totalTx = 0;
    let totalRx = 0;

    for (const p of peers) {
      totalTx += parseInt(p.tx || '0', 10);
      totalRx += parseInt(p.rx || '0', 10);
      if (p['last-handshake'] && p['last-handshake'] !== '0s') {
        const seconds = parseHandshake(p['last-handshake']);
        if (seconds < 180) online++;
      }
    }

    return {
      totalPeers: peers.length,
      online,
      offline: peers.length - online,
      totalTx,
      totalRx,
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
```

- [ ] **Step 3: Commit**

```bash
git add server/routes/server.js server/routes/stats.js
git commit -m "feat: server info and stats API routes"
```

---

### Task 7: WebSocket real-time updates

**Files:**
- Create: `server/ws/index.js`
- Create: `server/mikrotik/polling.js`

- [ ] **Step 1: Implement polling service**

Create `server/mikrotik/polling.js`:
```js
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
        id: p['.id'],
        name: p.comment || '',
        lastHandshake: p['last-handshake'] || '',
        tx: parseInt(p.tx || '0', 10),
        rx: parseInt(p.rx || '0', 10),
        disabled: p.disabled === 'true',
      }));
      for (const fn of this.listeners) fn(data);
    } catch (err) {
      console.error('Polling error:', err.message);
    }
  }
}
```

- [ ] **Step 2: Implement WebSocket handler**

Create `server/ws/index.js`:
```js
export async function wsRoutes(app) {
  const polling = app.polling;

  app.get('/ws', { websocket: true }, (socket) => {
    const send = (data) => {
      if (socket.readyState === 1) {
        socket.send(JSON.stringify({ type: 'peers', data }));
      }
    };

    polling.addListener(send);
    socket.on('close', () => polling.removeListener(send));
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add server/ws/ server/mikrotik/polling.js
git commit -m "feat: WebSocket real-time peer status with polling"
```

---

### Task 8: Wire up server (all routes + middleware)

**Files:**
- Modify: `server/index.js`

- [ ] **Step 1: Update server/index.js to wire everything together**

Replace `server/index.js`:
```js
import Fastify from 'fastify';
import fastifyWebsocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import fastifyCookie from '@fastify/cookie';
import { config } from './config.js';
import { MikroTikClient } from './mikrotik/client.js';
import { PollingService } from './mikrotik/polling.js';
import { authRoutes } from './auth/routes.js';
import { authMiddleware } from './auth/middleware.js';
import { peersRoutes } from './routes/peers.js';
import { serverRoutes } from './routes/server.js';
import { statsRoutes } from './routes/stats.js';
import { wsRoutes } from './ws/index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = Fastify({ logger: true });

// Plugins
await app.register(fastifyCookie);
await app.register(fastifyWebsocket);

// Decorators
app.decorate('config', config);

const mikrotik = new MikroTikClient(config.router.host, config.router.user, config.router.pass);
app.decorate('mikrotik', mikrotik);

const polling = new PollingService(mikrotik, config.wg.interface);
app.decorate('polling', polling);

// Public routes
await app.register(authRoutes);
app.get('/api/health', async () => ({ status: 'ok' }));

// Protected routes
app.register(async function protectedRoutes(app) {
  app.addHook('preHandler', authMiddleware);
  await app.register(peersRoutes);
  await app.register(serverRoutes);
  await app.register(statsRoutes);
  await app.register(wsRoutes);
});

// Serve Vue SPA (production)
const clientDist = join(__dirname, '..', 'client', 'dist');
app.register(fastifyStatic, { root: clientDist, wildcard: false });
app.setNotFoundHandler((req, reply) => {
  if (req.url.startsWith('/api/') || req.url.startsWith('/ws')) {
    return reply.code(404).send({ error: 'Not found' });
  }
  return reply.sendFile('index.html');
});

// Start
app.listen({ port: config.port, host: '0.0.0.0' }, (err) => {
  if (err) { app.log.error(err); process.exit(1); }
});

export { app };
```

- [ ] **Step 2: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS.

- [ ] **Step 3: Commit**

```bash
git add server/index.js
git commit -m "feat: wire up all server routes, auth, websocket, and static serving"
```

---

### Task 9: i18n (server-side translations)

**Files:**
- Create: `server/i18n/en.json`
- Create: `server/i18n/es.json`

- [ ] **Step 1: Create English translations**

Create `server/i18n/en.json`:
```json
{
  "app": { "title": "wg-mk-easy", "subtitle": "WireGuard Manager for MikroTik" },
  "auth": { "login": "Login", "logout": "Logout", "password": "Password", "wrongPassword": "Wrong password", "enter": "Sign in" },
  "nav": { "dashboard": "Dashboard", "peers": "Peers", "settings": "Settings" },
  "dashboard": { "totalPeers": "Total Peers", "online": "Online", "offline": "Offline", "traffic": "Traffic" },
  "peers": { "title": "Peers", "create": "New Peer", "name": "Name", "address": "Address", "status": "Status", "lastSeen": "Last Seen", "upload": "Upload", "download": "Download", "online": "Online", "offline": "Offline", "delete": "Delete", "confirmDelete": "Delete this peer?", "enable": "Enable", "disable": "Disable", "downloadConfig": "Download Config", "showQr": "Show QR", "noName": "Unnamed" },
  "settings": { "title": "Settings", "theme": "Theme", "language": "Language", "dark": "Dark", "light": "Light", "system": "System", "router": "Router Connection", "host": "Host", "user": "User", "wgConfig": "WireGuard Config", "endpoint": "Endpoint", "dns": "DNS", "allowedIps": "Allowed IPs", "save": "Save" }
}
```

- [ ] **Step 2: Create Spanish translations**

Create `server/i18n/es.json`:
```json
{
  "app": { "title": "wg-mk-easy", "subtitle": "Gestor WireGuard para MikroTik" },
  "auth": { "login": "Iniciar sesión", "logout": "Cerrar sesión", "password": "Contraseña", "wrongPassword": "Contraseña incorrecta", "enter": "Entrar" },
  "nav": { "dashboard": "Panel", "peers": "Peers", "settings": "Ajustes" },
  "dashboard": { "totalPeers": "Peers totales", "online": "En línea", "offline": "Desconectados", "traffic": "Tráfico" },
  "peers": { "title": "Peers", "create": "Nuevo Peer", "name": "Nombre", "address": "Dirección", "status": "Estado", "lastSeen": "Última conexión", "upload": "Subida", "download": "Bajada", "online": "Conectado", "offline": "Desconectado", "delete": "Eliminar", "confirmDelete": "¿Eliminar este peer?", "enable": "Habilitar", "disable": "Deshabilitar", "downloadConfig": "Descargar Config", "showQr": "Mostrar QR", "noName": "Sin nombre" },
  "settings": { "title": "Ajustes", "theme": "Tema", "language": "Idioma", "dark": "Oscuro", "light": "Claro", "system": "Sistema", "router": "Conexión al Router", "host": "Host", "user": "Usuario", "wgConfig": "Configuración WireGuard", "endpoint": "Endpoint", "dns": "DNS", "allowedIps": "IPs permitidas", "save": "Guardar" }
}
```

- [ ] **Step 3: Commit**

```bash
git add server/i18n/
git commit -m "feat: i18n translations (English + Spanish)"
```

---

### Task 10: Vue 3 client scaffolding

**Files:**
- Create: `client/package.json`
- Create: `client/vite.config.js`
- Create: `client/index.html`
- Create: `client/src/main.js`
- Create: `client/src/App.vue`
- Create: `client/src/router.js`
- Create: `client/src/stores/auth.js`
- Create: `client/src/stores/theme.js`
- Create: `client/src/stores/peers.js`
- Create: `client/src/composables/useWebSocket.js`
- Create: `client/src/assets/styles/variables.css`
- Create: `client/src/assets/styles/dark.css`
- Create: `client/src/assets/styles/light.css`

- [ ] **Step 1: Initialize Vue client**

Run:
```bash
cd /mnt/c/Users/noxfe/Documents/Desarrollos/wg-mk-easy
npm create vite@latest client -- --template vue
cd client
npm install vue-router@4 pinia vue-i18n@10 chart.js vue-chartjs
npm install -D sass
```

- [ ] **Step 2: Create vite.config.js**

Replace `client/vite.config.js`:
```js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/ws': { target: 'ws://localhost:3000', ws: true },
    },
  },
  build: { outDir: 'dist', emptyOutDir: true },
});
```

- [ ] **Step 3: Create CSS theme files**

Create `client/src/assets/styles/variables.css`:
```css
:root {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-card: #1f2b45;
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0b0;
  --accent: #4ecca3;
  --accent-hover: #3db890;
  --danger: #e74c3c;
  --danger-hover: #c0392b;
  --success: #4ecca3;
  --warning: #f39c12;
  --border: #2a3a5c;
  --radius: 12px;
  --shadow: 0 4px 24px rgba(0,0,0,0.3);
}

[data-theme="light"] {
  --bg-primary: #f5f6fa;
  --bg-secondary: #ffffff;
  --bg-card: #ffffff;
  --text-primary: #2d3436;
  --text-secondary: #636e72;
  --accent: #2d8f6f;
  --accent-hover: #248a65;
  --border: #dfe6e9;
  --shadow: 0 4px 24px rgba(0,0,0,0.08);
}

* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background 0.3s, color 0.3s;
}
```

- [ ] **Step 4: Create main.js with plugins**

Replace `client/src/main.js`:
```js
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import App from './App.vue';
import { router } from './router.js';
import en from '../../server/i18n/en.json';
import es from '../../server/i18n/es.json';
import './assets/styles/variables.css';

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('lang') || 'en',
  fallbackLocale: 'en',
  messages: { en, es },
});

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(i18n);
app.mount('#app');
```

- [ ] **Step 5: Create router**

Create `client/src/router.js`:
```js
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  { path: '/login', name: 'login', component: () => import('./views/Login.vue') },
  { path: '/', name: 'dashboard', component: () => import('./views/Dashboard.vue') },
  { path: '/peers', name: 'peers', component: () => import('./views/Peers.vue') },
  { path: '/settings', name: 'settings', component: () => import('./views/Settings.vue') },
];

export const router = createRouter({ history: createWebHistory(), routes });

router.beforeEach(async (to) => {
  if (to.name === 'login') return;
  try {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    if (!data.authenticated) return { name: 'login' };
  } catch {
    return { name: 'login' };
  }
});
```

- [ ] **Step 6: Create auth store**

Create `client/src/stores/auth.js`:
```js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

export const useAuthStore = defineStore('auth', () => {
  const authenticated = ref(false);

  async function login(password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) throw new Error('Invalid password');
    authenticated.value = true;
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'DELETE' });
    authenticated.value = false;
  }

  async function check() {
    const res = await fetch('/api/auth/check');
    const data = await res.json();
    authenticated.value = data.authenticated;
    return data.authenticated;
  }

  return { authenticated, login, logout, check };
});
```

- [ ] **Step 7: Create theme store**

Create `client/src/stores/theme.js`:
```js
import { defineStore } from 'pinia';
import { ref, watchEffect } from 'vue';

export const useThemeStore = defineStore('theme', () => {
  const theme = ref(localStorage.getItem('theme') || 'system');

  function setTheme(value) {
    theme.value = value;
    localStorage.setItem('theme', value);
  }

  watchEffect(() => {
    const root = document.documentElement;
    if (theme.value === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme.value);
    }
  });

  return { theme, setTheme };
});
```

- [ ] **Step 8: Create peers store**

Create `client/src/stores/peers.js`:
```js
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
```

- [ ] **Step 9: Create WebSocket composable**

Create `client/src/composables/useWebSocket.js`:
```js
import { ref, onMounted, onUnmounted } from 'vue';

export function useWebSocket(onMessage) {
  const connected = ref(false);
  let ws = null;
  let reconnectTimer = null;

  function connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${protocol}//${location.host}/ws`);
    ws.onopen = () => { connected.value = true; };
    ws.onclose = () => {
      connected.value = false;
      reconnectTimer = setTimeout(connect, 3000);
    };
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      onMessage(msg);
    };
  }

  onMounted(connect);
  onUnmounted(() => {
    if (ws) ws.close();
    if (reconnectTimer) clearTimeout(reconnectTimer);
  });

  return { connected };
}
```

- [ ] **Step 10: Create placeholder App.vue**

Replace `client/src/App.vue`:
```vue
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { useThemeStore } from './stores/theme.js';
const themeStore = useThemeStore();
</script>
```

- [ ] **Step 11: Verify client builds**

Run:
```bash
cd client && npm run build
```
Expected: Build succeeds (with warnings about missing views, that's OK for now).

- [ ] **Step 12: Commit**

```bash
cd /mnt/c/Users/noxfe/Documents/Desarrollos/wg-mk-easy
git add client/ package.json
git commit -m "feat: Vue 3 client scaffolding with router, stores, i18n, and theme"
```

---

### Task 11: Vue views (Login, Dashboard, Peers, Settings)

**Files:**
- Create: `client/src/views/Login.vue`
- Create: `client/src/views/Dashboard.vue`
- Create: `client/src/views/Peers.vue`
- Create: `client/src/views/Settings.vue`
- Create: `client/src/components/PeerCard.vue`
- Create: `client/src/components/PeerForm.vue`
- Create: `client/src/components/QrModal.vue`
- Create: `client/src/components/StatsChart.vue`
- Create: `client/src/components/ThemeToggle.vue`
- Create: `client/src/components/LangToggle.vue`
- Create: `client/src/components/NavBar.vue`

This is the largest task — all UI components. Each view and component will be created with full implementation. Due to size, the views are documented here as specifications; the executing agent should implement them following the design spec's screen descriptions and the stores/composables from Task 10.

- [ ] **Step 1: Create NavBar.vue** — App navigation bar with logo, nav links (Dashboard, Peers, Settings), ThemeToggle, LangToggle, and logout button. Responsive.

- [ ] **Step 2: Create Login.vue** — Centered card with password input and submit button. Calls `authStore.login()`. Redirects to `/` on success. Shows error on failure. Uses `useI18n()` for labels.

- [ ] **Step 3: Create ThemeToggle.vue** — Three-state toggle (dark/light/system) using icons. Calls `themeStore.setTheme()`.

- [ ] **Step 4: Create LangToggle.vue** — Dropdown or toggle between EN/ES. Sets `i18n.locale` and `localStorage.lang`.

- [ ] **Step 5: Create StatsChart.vue** — Chart.js line chart for traffic data. Props: `labels`, `txData`, `rxData`. Uses `vue-chartjs` with responsive sizing.

- [ ] **Step 6: Create Dashboard.vue** — Four stat cards (total peers, online, offline, traffic). StatsChart below. Fetches from `/api/stats`. Connects WebSocket for live updates.

- [ ] **Step 7: Create PeerCard.vue** — Card showing peer name, IP, status indicator (green/red dot), traffic stats, last handshake. Buttons: QR, download config, enable/disable, delete.

- [ ] **Step 8: Create PeerForm.vue** — Modal/dialog with name input to create a new peer. Calls `peersStore.createPeer()`. Shows QR code on success.

- [ ] **Step 9: Create QrModal.vue** — Modal showing QR code image and download config button. Props: `qrDataUrl`, `configString`, `peerName`.

- [ ] **Step 10: Create Peers.vue** — List of PeerCard components. "New Peer" button opens PeerForm. Fetches peers on mount. WebSocket updates via `peersStore.updateFromWs()`.

- [ ] **Step 11: Create Settings.vue** — Theme toggle, language toggle, router connection form (host/user/pass), WG config form (endpoint/DNS/allowedIPs). Save button persists to server.

- [ ] **Step 12: Update App.vue** — Add NavBar, show only on authenticated routes.

- [ ] **Step 13: Verify client builds and all views render**

Run: `cd client && npm run build`
Expected: Clean build.

- [ ] **Step 14: Commit**

```bash
git add client/
git commit -m "feat: all Vue views and components (Login, Dashboard, Peers, Settings)"
```

---

### Task 12: Docker setup

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`

- [ ] **Step 1: Create Dockerfile**

```dockerfile
# Stage 1: Build Vue client
FROM node:20-slim AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Production server
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY server/ ./server/
COPY --from=client-build /app/client/dist ./client/dist
RUN mkdir -p /data
EXPOSE 3000
USER node
CMD ["node", "server/index.js"]
```

- [ ] **Step 2: Create docker-compose.yml**

```yaml
services:
  wg-mk-easy:
    build: .
    container_name: wg-mk-easy
    restart: unless-stopped
    ports:
      - "51821:3000"
    volumes:
      - ./data:/data
    env_file: .env
```

- [ ] **Step 3: Build and test**

Run:
```bash
cp .env.example .env
# Edit .env with real values
docker compose build
docker compose up -d
curl http://localhost:51821/api/health
```
Expected: `{"status":"ok"}`

- [ ] **Step 4: Commit**

```bash
git add Dockerfile docker-compose.yml
git commit -m "feat: Docker multi-stage build and docker-compose"
```

---

### Task 13: README and final polish

**Files:**
- Create: `README.md`
- Create: `client/public/favicon.svg`

- [ ] **Step 1: Create README.md**

Full README with: project description, screenshot placeholder, features list, quickstart (Docker), environment variables table, development setup, contributing guide, license.

- [ ] **Step 2: Create favicon.svg**

Simple WireGuard-inspired SVG icon.

- [ ] **Step 3: Final test**

Run:
```bash
docker compose down
docker compose build
docker compose up -d
```
Verify: login, create peer, see QR, dashboard stats, theme toggle, language switch.

- [ ] **Step 4: Commit and tag**

```bash
git add -A
git commit -m "docs: README, favicon, and final polish"
git tag v0.1.0
```

---

## Task Dependency Order

```
Task 1 (scaffolding)
  └── Task 2 (MikroTik client)
  └── Task 3 (WG keys/QR)
  └── Task 4 (Auth)
       └── Task 5 (Peers routes)
       └── Task 6 (Server/stats routes)
       └── Task 7 (WebSocket)
            └── Task 8 (Wire up server)
  └── Task 9 (i18n)
  └── Task 10 (Vue scaffolding)
       └── Task 11 (Vue views)
            └── Task 12 (Docker)
                 └── Task 13 (README)
```

Tasks 2, 3, 4, 9, 10 can run in parallel after Task 1.
