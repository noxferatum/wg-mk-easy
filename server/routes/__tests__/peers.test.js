import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import { peersRoutes } from '../peers.js';

const mockClient = { get: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() };

async function buildApp() {
  const app = Fastify();
  await app.register(cookie);
  app.decorate('config', { password: 'test', jwtSecret: 'test', wg: { interface: 'wireguard1', endpoint: 'vpn.test.com:51820', dns: '1.1.1.1', allowedIps: '0.0.0.0/0' } });
  app.decorate('mikrotik', mockClient);
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
    mockClient.get.mockResolvedValueOnce([]).mockResolvedValueOnce([{ name: 'wireguard1', 'public-key': 'serverkey=' }]);
    mockClient.put.mockResolvedValue({ '.id': '*2' });
    const app = await buildApp();
    const res = await app.inject({ method: 'POST', url: '/api/peers', payload: { name: 'laptop' } });
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
