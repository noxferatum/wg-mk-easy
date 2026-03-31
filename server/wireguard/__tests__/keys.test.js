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
  });
});
