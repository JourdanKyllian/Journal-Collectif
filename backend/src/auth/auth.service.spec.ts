import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { AuthService } from './auth.service';
import { Session } from './entities/session.entity';
import { Users } from '../users/entities/user.entity';
import { Role } from '../roles/entities/roles.entity';
import {
  formatRefreshToken,
  generateSecret,
  hashSecret,
  parseRefreshToken,
} from './refresh-token';
import {
  DUMMY_PASSWORD_HASH,
  ROTATION_GRACE_MS,
  sessionTtls,
} from './auth.constants';

// `compare` reste réel, mais espionnable (le namespace `import * as` de bcrypt est figé).
jest.mock('bcrypt', () => {
  const actual = jest.requireActual<typeof import('bcrypt')>('bcrypt');
  return { ...actual, compare: jest.fn(actual.compare) };
});

type Fn = (...args: unknown[]) => Promise<unknown>;

const SID = '0b6f3c1e-8d2a-4f7e-9a1b-2c3d4e5f6a7b';

describe('AuthService', () => {
  let service: AuthService;
  let passwordHash: string;

  const users = {
    findOne: jest.fn<Fn>(),
    update: jest.fn<Fn>(),
    save: jest.fn<Fn>(),
  };
  const sessions = {
    create: jest.fn().mockImplementation((s: unknown) => s),
    save: jest.fn<Fn>().mockResolvedValue({}),
    findOne: jest.fn<Fn>(),
    find: jest.fn<Fn>(),
    update: jest.fn<Fn>(),
    delete: jest.fn<Fn>(),
    createQueryBuilder: jest.fn(),
  };
  const jwt = {
    signAsync: jest.fn<Fn>().mockResolvedValue('signed.jwt.token'),
  };

  const qb = () => {
    const chain: Record<string, jest.Mock> = {};
    for (const m of ['delete', 'update', 'set', 'where', 'andWhere']) {
      chain[m] = jest.fn().mockReturnValue(chain);
    }
    chain.execute = jest.fn<Fn>().mockResolvedValue({});
    return chain;
  };

  const user = (role = 'utilisateur') => ({
    id: 7,
    email: 'a@b.fr',
    password: passwordHash,
    role: { libelle: role },
  });

  const liveSession = (secret: string, overrides: object = {}) => ({
    id: SID,
    userId: 7,
    user: user(),
    refreshTokenHash: hashSecret(secret),
    previousRefreshTokenHash: null,
    rotatedAt: null,
    revokedAt: null,
    expiresAt: new Date(Date.now() + 3_600_000),
    ipAddress: '1.1.1.1',
    userAgent: 'ua',
    ...overrides,
  });

  beforeEach(async () => {
    passwordHash = await bcrypt.hash('Correct-Horse-Battery-1', 4);
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(Users), useValue: users },
        { provide: getRepositoryToken(Role), useValue: {} },
        { provide: getRepositoryToken(Session), useValue: sessions },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = module.get(AuthService);

    sessions.createQueryBuilder.mockImplementation(qb);
    sessions.find.mockResolvedValue([]);
    sessions.update.mockResolvedValue({ affected: 1 });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('ouvre une session : stocke le SHA-256 du secret, jamais le secret', async () => {
      users.findOne.mockResolvedValue(user());

      const result = await service.login('a@b.fr', 'Correct-Horse-Battery-1', {
        ip: '203.0.113.9',
        userAgent: 'Mozilla',
        deviceId: 'device-1',
      });

      const stored = sessions.save.mock.calls[0][0] as Session;
      const parsed = parseRefreshToken(result.refreshToken);
      expect(parsed?.sessionId).toBe(stored.id);
      expect(stored.refreshTokenHash).toBe(hashSecret(parsed!.secret));
      expect(JSON.stringify(stored)).not.toContain(parsed!.secret);
      expect(stored).toMatchObject({
        userId: 7,
        ipAddress: '203.0.113.9',
        userAgent: 'Mozilla',
        deviceIdentifier: 'device-1',
        revokedAt: null,
        previousRefreshTokenHash: null,
      });
      expect(result.sessionId).toBe(stored.id);
    });

    it('signe un access token `{ sub, sid }` de la durée du rôle', async () => {
      users.findOne.mockResolvedValue(user('redacteur'));
      const result = await service.login('a@b.fr', 'Correct-Horse-Battery-1');

      expect(jwt.signAsync).toHaveBeenCalledWith(
        { sub: 7, sid: result.sessionId },
        { expiresIn: 15 * 60 },
      );
      expect(result.accessTtlMs).toBe(sessionTtls('redacteur').accessMs);
      expect(result.refreshTtlMs).toBe(sessionTtls('redacteur').refreshMs);
    });

    it('rejette un mauvais mot de passe sans créer de session', async () => {
      users.findOne.mockResolvedValue(user());
      await expect(service.login('a@b.fr', 'mauvais')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(sessions.save).not.toHaveBeenCalled();
    });

    it('rejette un e-mail inconnu en comparant quand même à un hash factice', async () => {
      users.findOne.mockResolvedValue(null);
      const compare = bcrypt.compare as unknown as jest.Mock;
      compare.mockClear();

      await expect(service.login('inconnu@b.fr', 'x')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(compare).toHaveBeenCalledTimes(1);
      expect(compare).toHaveBeenCalledWith('x', DUMMY_PASSWORD_HASH);
      expect(sessions.save).not.toHaveBeenCalled();
    });

    it('plafonne les appareils : supprime les sessions actives les plus anciennes', async () => {
      users.findOne.mockResolvedValue(user());
      sessions.find.mockResolvedValue(
        Array.from({ length: 10 }, (_, i) => ({ id: `old-${i}` })),
      );

      await service.login('a@b.fr', 'Correct-Horse-Battery-1');

      expect(sessions.delete).toHaveBeenCalledWith(['old-0']);
    });
  });

  describe('refresh', () => {
    it('fait tourner le secret de façon atomique et conserve l’ancien pour la grâce', async () => {
      const secret = generateSecret();
      const session = liveSession(secret);
      sessions.findOne.mockResolvedValue(session);

      const result = await service.refresh(formatRefreshToken(SID, secret));

      const [criteria, changes] = sessions.update.mock.calls[0] as [
        Record<string, unknown>,
        Record<string, unknown>,
      ];
      expect(criteria).toMatchObject({
        id: SID,
        refreshTokenHash: hashSecret(secret),
      });
      expect(changes.previousRefreshTokenHash).toBe(hashSecret(secret));
      const next = parseRefreshToken(result.refreshToken);
      expect(next?.sessionId).toBe(SID);
      expect(next?.secret).not.toBe(secret);
      expect(changes.refreshTokenHash).toBe(hashSecret(next!.secret));
    });

    it('perd la course contre un refresh concurrent : access token seul, session intacte', async () => {
      const secret = generateSecret();
      sessions.findOne
        .mockResolvedValueOnce(liveSession(secret))
        // relecture : l'autre requête a déjà fait tourner le secret
        .mockResolvedValueOnce(
          liveSession(generateSecret(), {
            previousRefreshTokenHash: hashSecret(secret),
            rotatedAt: new Date(),
          }),
        );
      sessions.update.mockResolvedValueOnce({ affected: 0 });

      const result = await service.refresh(formatRefreshToken(SID, secret));

      expect(result.refreshToken).toBeUndefined();
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(sessions.update).not.toHaveBeenCalledWith(
        { id: SID },
        expect.objectContaining({ revokedAt: expect.any(Date) }),
      );
    });

    it('accepte l’ancien secret pendant la fenêtre de grâce, sans rotation', async () => {
      const old = generateSecret();
      sessions.findOne.mockResolvedValue(
        liveSession(generateSecret(), {
          previousRefreshTokenHash: hashSecret(old),
          rotatedAt: new Date(Date.now() - 2_000),
        }),
      );

      const result = await service.refresh(formatRefreshToken(SID, old));

      expect(result.refreshToken).toBeUndefined();
      expect(result.sessionId).toBe(SID);
    });

    it('révoque la session quand l’ancien secret est rejoué hors fenêtre de grâce', async () => {
      const old = generateSecret();
      sessions.findOne.mockResolvedValue(
        liveSession(generateSecret(), {
          previousRefreshTokenHash: hashSecret(old),
          rotatedAt: new Date(Date.now() - ROTATION_GRACE_MS - 1_000),
        }),
      );

      await expect(
        service.refresh(formatRefreshToken(SID, old)),
      ).rejects.toThrow(UnauthorizedException);
      expect(sessions.update).toHaveBeenCalledWith(
        { id: SID },
        { revokedAt: expect.any(Date) },
      );
    });

    it('révoque la session pour un secret inconnu', async () => {
      sessions.findOne.mockResolvedValue(liveSession(generateSecret()));
      await expect(
        service.refresh(formatRefreshToken(SID, generateSecret())),
      ).rejects.toThrow(UnauthorizedException);
      expect(sessions.update).toHaveBeenCalledWith(
        { id: SID },
        { revokedAt: expect.any(Date) },
      );
    });

    it.each([
      ['révoquée', { revokedAt: new Date() }],
      ['expirée', { expiresAt: new Date(Date.now() - 1) }],
      ['orpheline (utilisateur supprimé)', { user: null }],
    ])(
      'rejette une session %s sans rien révoquer de plus',
      async (_label, patch) => {
        const secret = generateSecret();
        sessions.findOne.mockResolvedValue(liveSession(secret, patch));
        await expect(
          service.refresh(formatRefreshToken(SID, secret)),
        ).rejects.toThrow(UnauthorizedException);
        expect(sessions.update).not.toHaveBeenCalled();
      },
    );

    it('rejette un token inconnu ou mal formé sans lire la base', async () => {
      sessions.findOne.mockResolvedValue(null);
      await expect(
        service.refresh(formatRefreshToken(SID, generateSecret())),
      ).rejects.toThrow(UnauthorizedException);

      sessions.findOne.mockClear();
      await expect(
        service.refresh('eyJhbGciOi.jwt.pas-un-refresh'),
      ).rejects.toThrow(UnauthorizedException);
      expect(sessions.findOne).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('révoque la session', async () => {
      await service.logout(SID);
      expect(sessions.update).toHaveBeenCalledWith(
        { id: SID, revokedAt: expect.anything() },
        { revokedAt: expect.any(Date) },
      );
    });

    it('avec un refresh token : révoque seulement si le secret est le bon', async () => {
      const secret = generateSecret();
      sessions.findOne.mockResolvedValue(liveSession(secret));

      await service.logoutWithRefreshToken(
        formatRefreshToken(SID, generateSecret()),
      );
      expect(sessions.update).not.toHaveBeenCalled();

      await service.logoutWithRefreshToken(formatRefreshToken(SID, secret));
      expect(sessions.update).toHaveBeenCalledTimes(1);
    });

    it('ignore silencieusement un token invalide', async () => {
      await expect(
        service.logoutWithRefreshToken('n’importe quoi'),
      ).resolves.toBeUndefined();
      expect(sessions.findOne).not.toHaveBeenCalled();
    });
  });

  describe('revokeOtherSessions', () => {
    it('révoque toutes les sessions de l’utilisateur sauf la courante', async () => {
      const builder = qb();
      sessions.createQueryBuilder.mockReturnValue(builder);

      await service.revokeOtherSessions(7, 'courante');

      expect(builder.where).toHaveBeenCalledWith(
        expect.stringContaining('user_id = :userId'),
        { userId: 7 },
      );
      expect(builder.andWhere).toHaveBeenCalledWith('id != :exceptSessionId', {
        exceptSessionId: 'courante',
      });
    });
  });
});
