import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import type { Session } from './entities/session.entity';
import type { Repository } from 'typeorm';

type Fn = (...args: unknown[]) => Promise<unknown>;

describe('JwtStrategy.validate', () => {
  const findOne = jest.fn<Fn>();
  let strategy: JwtStrategy;

  const live = (overrides: object = {}) => ({
    id: 'sid-1',
    userId: 7,
    revokedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    user: { id: 7, email: 'a@b.fr', role: { libelle: 'admin' } },
    ...overrides,
  });

  beforeEach(() => {
    findOne.mockReset();
    process.env.JWT_SECRET = 'x'.repeat(48);
    strategy = new JwtStrategy({ findOne } as unknown as Repository<Session>);
  });

  it('renvoie l’utilisateur et le rôle courants lus en base, pas ceux du token', async () => {
    findOne.mockResolvedValue(live());
    await expect(strategy.validate({ sub: 7, sid: 'sid-1' })).resolves.toEqual({
      userId: 7,
      email: 'a@b.fr',
      role: 'admin',
      sessionId: 'sid-1',
    });
    expect(findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'sid-1', userId: 7 } }),
    );
  });

  it('retombe sur « utilisateur » quand le rôle est absent', async () => {
    findOne.mockResolvedValue(
      live({ user: { id: 7, email: 'a@b.fr', role: null } }),
    );
    const result = await strategy.validate({ sub: 7, sid: 'sid-1' });
    expect(result.role).toBe('utilisateur');
  });

  it.each([
    ['sans sid (ancien token)', { sub: 7 }, null],
    ['sans sub', { sid: 'sid-1' }, null],
    ['session inconnue', { sub: 7, sid: 'sid-1' }, null],
    [
      'session révoquée',
      { sub: 7, sid: 'sid-1' },
      live({ revokedAt: new Date() }),
    ],
    [
      'session expirée',
      { sub: 7, sid: 'sid-1' },
      live({ expiresAt: new Date(Date.now() - 1) }),
    ],
    ['utilisateur supprimé', { sub: 7, sid: 'sid-1' }, live({ user: null })],
  ])('rejette : %s', async (_label, payload, session) => {
    findOne.mockResolvedValue(session);
    await expect(strategy.validate(payload)).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
