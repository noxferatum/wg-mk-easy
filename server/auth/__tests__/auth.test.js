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
    const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { password: 'testpass' } });
    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toMatch(/token=/);
  });

  it('POST /api/auth/login with wrong password returns 401', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { password: 'wrong' } });
    expect(res.statusCode).toBe(401);
  });

  it('protected route without token returns 401', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'GET', url: '/api/protected' });
    expect(res.statusCode).toBe(401);
  });

  it('protected route with valid token returns 200', async () => {
    const app = await buildApp();
    const loginRes = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { password: 'testpass' } });
    const cookieHeader = loginRes.headers['set-cookie'];
    const res = await app.inject({ method: 'GET', url: '/api/protected', headers: { cookie: cookieHeader } });
    expect(res.statusCode).toBe(200);
  });

  it('DELETE /api/auth/logout clears cookie', async () => {
    const app = await buildApp();
    const res = await app.inject({ method: 'DELETE', url: '/api/auth/logout' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toMatch(/token=;/);
  });
});
