import { afterEach, describe, expect, it } from '@jest/globals';
import { getJwtSecret } from './jwt-secret';

describe('getJwtSecret', () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env = { ...original };
  });

  it('renvoie le secret configuré', () => {
    process.env.JWT_SECRET = 'x'.repeat(48);
    expect(getJwtSecret()).toBe('x'.repeat(48));
  });

  it.each([undefined, '', 'court'])(
    'refuse hors test un secret absent ou trop court (%s)',
    (value) => {
      process.env.NODE_ENV = 'production';
      if (value === undefined) delete process.env.JWT_SECRET;
      else process.env.JWT_SECRET = value;
      expect(() => getJwtSecret()).toThrow('JWT_SECRET');
    },
  );
});
