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
