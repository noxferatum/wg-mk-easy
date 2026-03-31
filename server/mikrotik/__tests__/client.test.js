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
      expect.objectContaining({ method: 'GET', headers: expect.objectContaining({ 'Authorization': client.authHeader }) })
    );
    expect(result).toEqual([{ name: 'peer1' }]);
  });

  it('put() sends JSON body', async () => {
    const mockResponse = { ok: true, json: () => Promise.resolve({ '.id': '*1' }) };
    global.fetch = vi.fn(() => Promise.resolve(mockResponse));
    await client.put('/interface/wireguard/peers', { 'public-key': 'abc' });
    expect(fetch).toHaveBeenCalledWith(
      'https://192.168.88.1/rest/interface/wireguard/peers',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ 'public-key': 'abc' }) })
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
