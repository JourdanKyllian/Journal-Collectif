import { describe, expect, it } from '@jest/globals';
import {
  formatRefreshToken,
  generateRefreshToken,
  hashSecret,
  parseRefreshToken,
  safeEqualHex,
} from './refresh-token';

describe('refresh-token', () => {
  it('génère un token `idSession.secret` que parse retrouve à l’identique', () => {
    const { sessionId, secret, token } = generateRefreshToken();
    expect(token).toBe(`${sessionId}.${secret}`);
    expect(parseRefreshToken(token)).toEqual({ sessionId, secret });
  });

  it('génère des secrets de 256 bits, uniques', () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a.secret).toHaveLength(43);
    expect(a.secret).not.toBe(b.secret);
    expect(a.sessionId).not.toBe(b.sessionId);
  });

  it('hache en SHA-256 hexadécimal déterministe, sans jamais restituer le secret', () => {
    const hash = hashSecret('abc');
    expect(hash).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    expect(hash).toHaveLength(64);
  });

  it.each([
    undefined,
    null,
    42,
    '',
    'sans-point',
    'a.b.c',
    'pas-un-uuid.' + 'A'.repeat(43),
    '0b6f3c1e-8d2a-4f7e-9a1b-2c3d4e5f6a7b.court',
    '0b6f3c1e-8d2a-4f7e-9a1b-2c3d4e5f6a7b.' + 'A'.repeat(44),
    '0b6f3c1e-8d2a-4f7e-9a1b-2c3d4e5f6a7b.' + '!'.repeat(43),
    `eyJhbGciOiJIUzI1NiJ9.${'x'.repeat(120)}.signature`,
  ])('rejette un token mal formé : %p', (token) => {
    expect(parseRefreshToken(token)).toBeNull();
  });

  it('un JWT n’est jamais accepté comme refresh token', () => {
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjF9.c2lnbmF0dXJlc2lnbmF0dXJlc2lnbmF0dXJlc2lnbmF0dXJl';
    expect(parseRefreshToken(jwt)).toBeNull();
  });

  it('normalise l’identifiant de session en minuscules', () => {
    const secret = 'A'.repeat(43);
    const parsed = parseRefreshToken(
      formatRefreshToken('0B6F3C1E-8D2A-4F7E-9A1B-2C3D4E5F6A7B', secret),
    );
    expect(parsed?.sessionId).toBe('0b6f3c1e-8d2a-4f7e-9a1b-2c3d4e5f6a7b');
  });

  describe('safeEqualHex', () => {
    it('compare deux empreintes égales ou différentes', () => {
      const a = hashSecret('un');
      expect(safeEqualHex(a, hashSecret('un'))).toBe(true);
      expect(safeEqualHex(a, hashSecret('deux'))).toBe(false);
    });

    it('refuse une valeur absente ou de longueur différente sans lever d’erreur', () => {
      const a = hashSecret('un');
      expect(safeEqualHex(a, null)).toBe(false);
      expect(safeEqualHex(a, undefined)).toBe(false);
      expect(safeEqualHex(a, 'abcd')).toBe(false);
    });
  });
});
