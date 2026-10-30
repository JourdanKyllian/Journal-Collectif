import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import type { MembershipService } from '../tenant/membership.service';
import type { TenantContext } from '../tenant/tenant.context';
import type { Session } from './entities/session.entity';
import type { Repository } from 'typeorm';

type Fn = (...args: unknown[]) => Promise<unknown>;

describe('JwtStrategy.validate', () => {
  const findOne = jest.fn<Fn>();
  const resolveRole = jest.fn<Fn>();
  const tryGet = jest.fn();
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
    resolveRole.mockReset();
    tryGet.mockReset();
    tryGet.mockReturnValue({ id: 1, slug: 'journal-a' });
    resolveRole.mockResolvedValue({ role: 'admin', isMember: true });
    process.env.JWT_SECRET = 'x'.repeat(48);
    strategy = new JwtStrategy(
      { findOne } as unknown as Repository<Session>,
      { resolveRole } as unknown as MembershipService,
      { tryGet } as unknown as TenantContext,
    );
  });

  it('renvoie l’utilisateur et le rôle courants lus en base, pas ceux du token', async () => {
    findOne.mockResolvedValue(live());
    await expect(strategy.validate({ sub: 7, sid: 'sid-1' })).resolves.toEqual({
      userId: 7,
      email: 'a@b.fr',
      role: 'admin',
      sessionId: 'sid-1',
      isJournalMember: true,
      isPlatformAdmin: false,
      mustChangePassword: false,
    });
    expect(findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'sid-1', userId: 7 } }),
    );
  });

  it('résout le rôle dans le journal courant, avec le rôle global en simple repli', async () => {
    findOne.mockResolvedValue(
      live({ user: { id: 7, email: 'a@b.fr', role: { libelle: 'admin' } } }),
    );
    resolveRole.mockResolvedValue({ role: 'utilisateur', isMember: false });

    const result = await strategy.validate({ sub: 7, sid: 'sid-1' });

    expect(resolveRole).toHaveBeenCalledWith(7, 'admin', {
      id: 1,
      slug: 'journal-a',
    });
    expect(result).toMatchObject({
      role: 'utilisateur',
      isJournalMember: false,
    });
  });

  it('expose les indicateurs de niveau plateforme et de mot de passe provisoire', async () => {
    findOne.mockResolvedValue(
      live({
        user: {
          id: 7,
          email: 'a@b.fr',
          role: null,
          is_platform_admin: true,
          must_change_password: true,
        },
      }),
    );
    const result = await strategy.validate({ sub: 7, sid: 'sid-1' });
    expect(result).toMatchObject({
      isPlatformAdmin: true,
      mustChangePassword: true,
    });
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
