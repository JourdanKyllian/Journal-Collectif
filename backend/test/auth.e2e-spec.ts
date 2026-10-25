/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment -- supertest renvoie `res.body` en `any` */
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { Role } from '../src/roles/entities/roles.entity';
import { Users } from '../src/users/entities/user.entity';

const PASSWORD = 'E2e-Passw0rd!';
const NEW_PASSWORD = 'Nouveau-Passw0rd!-2026';
const THROTTLE_ENV = [
  'AUTH_THROTTLE_LOGIN_IP',
  'AUTH_THROTTLE_LOGIN_ACCOUNT',
  'AUTH_THROTTLE_REFRESH_IP',
];

/** Les limiteurs sont lus à la création de l'application : on peut donc en changer entre deux suites. */
async function createApp(unlimited: boolean): Promise<INestApplication> {
  for (const name of THROTTLE_ENV) {
    if (unlimited) process.env[name] = '100000';
    else delete process.env[name];
  }
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

type Res = request.Response;
const setCookies = (res: Res): string[] =>
  (res.headers['set-cookie'] as unknown as string[] | undefined) ?? [];
const cookieLine = (res: Res, name: string) =>
  setCookies(res).find((c) => c.startsWith(`${name}=`));
const cookieValue = (res: Res, name: string) =>
  cookieLine(res, name)
    ?.split(';')[0]
    .slice(name.length + 1);

describe('Authentification par sessions (e2e)', () => {
  describe('web, mobile, rotation et révocation', () => {
    let app: INestApplication;
    let ds: DataSource;

    const api = (method: 'get' | 'post' | 'patch' | 'delete', url: string) =>
      request(app.getHttpServer())[method](`/api/v1${url}`);

    const loginWeb = async (
      email: string,
      password = PASSWORD,
      headers: Record<string, string> = {},
    ) => {
      const res = await api('post', '/auth/login')
        .set(headers)
        .send({ email, password })
        .expect(201);
      return {
        res,
        access: cookieValue(res, 'access_token') as string,
        refresh: cookieValue(res, 'refresh_token') as string,
      };
    };

    const loginMobile = async (
      email: string,
      headers: Record<string, string> = {},
    ) => {
      const res = await api('post', '/auth/login')
        .set({ 'X-Client': 'mobile', ...headers })
        .send({ email, password: PASSWORD })
        .expect(201);
      return res.body as {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        session_id: string;
      };
    };

    const me = (token: string) =>
      api('get', '/auth/me').set('Authorization', `Bearer ${token}`);

    const refreshMobile = (refreshToken: string) =>
      api('post', '/auth/refresh')
        .set('X-Client', 'mobile')
        .send({ refresh_token: refreshToken });

    const sessionRow = async (id: string) =>
      (
        await ds.query<Record<string, unknown>[]>(
          'SELECT * FROM session WHERE id = $1',
          [id],
        )
      )[0];

    const activeSessions = async (email: string) =>
      Number(
        (
          await ds.query<{ count: string }[]>(
            `SELECT count(*) FROM session s JOIN users u ON u.id = s.user_id
             WHERE u.email = $1 AND s.revoked_at IS NULL AND s.expires_at > now()`,
            [email],
          )
        )[0].count,
      );

    const ensureUser = async (email: string, role: Role) => {
      const users = ds.getRepository(Users);
      const user =
        (await users.findOne({ where: { email }, relations: ['profile'] })) ??
        users.create({ email });
      user.password = await bcrypt.hash(PASSWORD, 4);
      user.role = role;
      user.is_phone_verified = true;
      user.profile = Object.assign(user.profile ?? {}, {
        firstname: 'E2E',
        lastname: role.libelle,
      });
      await users.save(user);
    };

    const CITIZEN = 'e2e-auth-citizen@test.local';
    const ADMIN = 'e2e-auth-admin@test.local';
    const ROLESHIFT = 'e2e-auth-roleshift@test.local';
    const CAP = 'e2e-auth-cap@test.local';

    beforeAll(async () => {
      if (
        !/test/i.test(process.env.DB_NAME ?? process.env.DATABASE_URL ?? '')
      ) {
        throw new Error('Les tests e2e doivent cibler une base « test ».');
      }
      app = await createApp(true);
      ds = app.get(DataSource);
      await ds.runMigrations();

      const roles = ds.getRepository(Role);
      const ensureRole = async (libelle: string) =>
        (await roles.findOneBy({ libelle })) ??
        roles.save(roles.create({ libelle }));
      const [admin, citizen] = await Promise.all([
        ensureRole('admin'),
        ensureRole('utilisateur'),
      ]);

      await ensureUser(CITIZEN, citizen);
      await ensureUser(ADMIN, admin);
      await ensureUser(ROLESHIFT, admin);
      await ensureUser(CAP, citizen);
      await ds.query(
        `DELETE FROM session WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'e2e-auth-%')`,
      );
    });

    afterAll(async () => {
      await app.close();
    });

    describe('connexion web (cookies HTTP-Only)', () => {
      it('pose les deux cookies et ne met aucun jeton dans le corps', async () => {
        const { res, access, refresh } = await loginWeb(CITIZEN);

        expect(res.body).toEqual({ message: 'Connexion réussie' });
        expect(access.split('.')).toHaveLength(3); // JWT
        expect(refresh).toMatch(/^[0-9a-f-]{36}\.[A-Za-z0-9_-]{43}$/);
        expect(cookieLine(res, 'access_token')).toMatch(/HttpOnly/i);
        expect(cookieLine(res, 'refresh_token')).toMatch(/HttpOnly/i);
      });

      it('aligne la durée des cookies sur le rôle', async () => {
        const citizen = await loginWeb(CITIZEN);
        expect(cookieLine(citizen.res, 'access_token')).toMatch(/Max-Age=3600/);
        expect(cookieLine(citizen.res, 'refresh_token')).toMatch(
          new RegExp(`Max-Age=${7 * 24 * 3600}`),
        );

        const admin = await loginWeb(ADMIN);
        expect(cookieLine(admin.res, 'access_token')).toMatch(/Max-Age=900/);
        expect(cookieLine(admin.res, 'refresh_token')).toMatch(
          new RegExp(`Max-Age=${8 * 3600}`),
        );
      });

      it('authentifie avec le cookie', async () => {
        const { access } = await loginWeb(CITIZEN);
        const res = await api('get', '/auth/me')
          .set('Cookie', `access_token=${access}`)
          .expect(200);
        expect(res.body.email).toBe(CITIZEN);
      });

      it('rejette un mauvais mot de passe et un e-mail inconnu avec le même message', async () => {
        const wrong = await api('post', '/auth/login')
          .send({ email: CITIZEN, password: 'Mauvais-1234567' })
          .expect(401);
        const unknown = await api('post', '/auth/login')
          .send({ email: 'inconnu@test.local', password: 'Mauvais-1234567' })
          .expect(401);
        expect(wrong.body.message).toBe(unknown.body.message);
      });
    });

    describe('connexion mobile (Bearer)', () => {
      it('renvoie les jetons en JSON, sans cookie', async () => {
        const res = await api('post', '/auth/login')
          .set({ 'X-Client': 'mobile', 'X-Device-Id': 'e2e-device-1' })
          .send({ email: CITIZEN, password: PASSWORD })
          .expect(201);

        expect(setCookies(res)).toHaveLength(0);
        expect(res.body).toMatchObject({
          token_type: 'Bearer',
          expires_in: 3600,
        });
        expect(res.body.refresh_token).toMatch(/^[0-9a-f-]{36}\./);
      });

      it('stocke uniquement le SHA-256 du secret, avec l’appareil et l’IP', async () => {
        const tokens = await loginMobile(CITIZEN, {
          'X-Device-Id': 'e2e-device-2',
          'User-Agent': 'Expo/1.0 e2e',
        });
        const [sessionId, secret] = tokens.refresh_token.split('.');

        const row = await sessionRow(sessionId);
        expect(row.refresh_token_hash).toBe(sha256(secret));
        expect(JSON.stringify(row)).not.toContain(secret);
        expect(row).toMatchObject({
          device_identifier: 'e2e-device-2',
          user_agent: 'Expo/1.0 e2e',
          revoked_at: null,
        });
        expect(row.ip_address).toBeTruthy();
        expect(tokens.session_id).toBe(sessionId);
      });

      it('ignore un identifiant d’appareil invalide', async () => {
        const tokens = await loginMobile(CITIZEN, {
          'X-Device-Id': 'a b<script>',
        });
        const row = await sessionRow(tokens.session_id);
        expect(row.device_identifier).toBeNull();
      });

      it('authentifie avec Authorization: Bearer', async () => {
        const tokens = await loginMobile(CITIZEN);
        const res = await me(tokens.access_token).expect(200);
        expect(res.body.email).toBe(CITIZEN);
      });
    });

    describe('extraction du token', () => {
      it('le Bearer l’emporte sur le cookie', async () => {
        const citizen = await loginMobile(CITIZEN);
        const admin = await loginWeb(ADMIN);

        const res = await api('get', '/auth/me')
          .set('Authorization', `Bearer ${citizen.access_token}`)
          .set('Cookie', `access_token=${admin.access}`)
          .expect(200);
        expect(res.body.email).toBe(CITIZEN);
      });

      it('un refresh token n’est jamais accepté comme access token', async () => {
        const tokens = await loginMobile(CITIZEN);
        await me(tokens.refresh_token).expect(401);
        await api('get', '/auth/me')
          .set('Cookie', `access_token=${tokens.refresh_token}`)
          .expect(401);
      });

      it('rejette un ancien token sans `sid`, un token expiré et une absence de token', async () => {
        const user = await ds
          .getRepository(Users)
          .findOneByOrFail({ email: CITIZEN });
        const jwt = app.get(JwtService);

        await me(await jwt.signAsync({ sub: user.id })).expect(401);

        const tokens = await loginMobile(CITIZEN);
        await me(
          await jwt.signAsync(
            { sub: user.id, sid: tokens.session_id },
            { expiresIn: '-10s' },
          ),
        ).expect(401);
        await api('get', '/auth/me').expect(401);
      });
    });

    describe('refresh', () => {
      it('mobile : fait tourner le refresh token ; l’ancien access token reste valable', async () => {
        const first = await loginMobile(CITIZEN);
        const res = await refreshMobile(first.refresh_token).expect(201);

        expect(res.body.refresh_token).toBeTruthy();
        expect(res.body.refresh_token).not.toBe(first.refresh_token);
        expect(res.body.refresh_token.split('.')[0]).toBe(first.session_id);

        await me(res.body.access_token).expect(200);
        await me(first.access_token).expect(200);
        await refreshMobile(res.body.refresh_token).expect(201);
      });

      it('web : lit le cookie refresh_token, corps vide, et pose de nouveaux cookies', async () => {
        const { refresh } = await loginWeb(CITIZEN);
        const res = await api('post', '/auth/refresh')
          .set('Cookie', `refresh_token=${refresh}`)
          .expect(201);

        const newRefresh = cookieValue(res, 'refresh_token');
        const newAccess = cookieValue(res, 'access_token');
        expect(newRefresh).toBeTruthy();
        expect(newRefresh).not.toBe(refresh);
        await api('get', '/auth/me')
          .set('Cookie', `access_token=${newAccess}`)
          .expect(200);
      });

      it('refresh concurrents : tous réussissent, un seul fait tourner le secret, la session survit', async () => {
        const first = await loginMobile(CITIZEN);

        const results = await Promise.all(
          [1, 2, 3].map(() => refreshMobile(first.refresh_token)),
        );

        expect(results.map((r) => r.status)).toEqual([201, 201, 201]);
        const rotated = results.filter((r) => r.body.refresh_token);
        expect(rotated).toHaveLength(1);

        const row = await sessionRow(first.session_id);
        expect(row.revoked_at).toBeNull();
        await refreshMobile(rotated[0].body.refresh_token).expect(201);
      });

      it('rejeu de l’ancien secret hors fenêtre de grâce : toute la session est révoquée', async () => {
        const first = await loginMobile(CITIZEN);
        const second = (await refreshMobile(first.refresh_token).expect(201))
          .body;

        // la fenêtre de grâce est écoulée
        await ds.query(
          `UPDATE session SET rotated_at = now() - interval '1 minute' WHERE id = $1`,
          [first.session_id],
        );

        await refreshMobile(first.refresh_token).expect(401);

        // le voleur comme le propriétaire légitime sont déconnectés
        await refreshMobile(second.refresh_token).expect(401);
        await me(second.access_token).expect(401);
        const row = await sessionRow(first.session_id);
        expect(row.revoked_at).not.toBeNull();
      });

      it('un secret inventé révoque la session, un token mal formé ne touche à rien', async () => {
        const tokens = await loginMobile(CITIZEN);

        await refreshMobile('pas-un-refresh-token').expect(401);
        await refreshMobile(`${tokens.session_id}.${'A'.repeat(43)}`).expect(
          401,
        );
        const row = await sessionRow(tokens.session_id);
        expect(row.revoked_at).not.toBeNull();
      });

      it('rejette un refresh sans token, et efface les cookies côté web', async () => {
        await api('post', '/auth/refresh')
          .set('X-Client', 'mobile')
          .expect(401);

        const res = await api('post', '/auth/refresh')
          .set('Cookie', 'refresh_token=n-importe-quoi')
          .expect(401);
        expect(cookieLine(res, 'access_token')).toMatch(
          /Max-Age=0|Expires=Thu, 01 Jan 1970/,
        );
        expect(cookieLine(res, 'refresh_token')).toMatch(
          /Max-Age=0|Expires=Thu, 01 Jan 1970/,
        );
      });

      it('une session expirée ne se renouvelle pas', async () => {
        const tokens = await loginMobile(CITIZEN);
        await ds.query(
          `UPDATE session SET expires_at = now() - interval '1 second' WHERE id = $1`,
          [tokens.session_id],
        );
        await refreshMobile(tokens.refresh_token).expect(401);
        await me(tokens.access_token).expect(401);
      });
    });

    describe('déconnexion et multi-appareils', () => {
      it('déconnecte un appareil sans toucher aux autres', async () => {
        const phone = await loginMobile(CITIZEN);
        const laptop = await loginWeb(CITIZEN);

        await api('post', '/auth/logout')
          .set('Authorization', `Bearer ${phone.access_token}`)
          .set('X-Client', 'mobile')
          .expect(201);

        await me(phone.access_token).expect(401);
        await refreshMobile(phone.refresh_token).expect(401);
        await api('get', '/auth/me')
          .set('Cookie', `access_token=${laptop.access}`)
          .expect(200);
      });

      it('web : déconnecte même avec un access token expiré, grâce au refresh token, et efface les cookies', async () => {
        const { refresh } = await loginWeb(CITIZEN);
        const res = await api('post', '/auth/logout')
          .set('Cookie', `refresh_token=${refresh}`)
          .expect(201);

        expect(cookieLine(res, 'access_token')).toMatch(
          /Max-Age=0|Expires=Thu, 01 Jan 1970/,
        );
        const row = await sessionRow(refresh.split('.')[0]);
        expect(row.revoked_at).not.toBeNull();
        await api('post', '/auth/refresh')
          .set('Cookie', `refresh_token=${refresh}`)
          .expect(401);
      });

      it('un refresh token au mauvais secret ne déconnecte personne', async () => {
        const tokens = await loginMobile(CITIZEN);
        await api('post', '/auth/logout')
          .set('X-Client', 'mobile')
          .send({ refresh_token: `${tokens.session_id}.${'B'.repeat(43)}` })
          .expect(201);
        await me(tokens.access_token).expect(200);
      });

      it('plafonne à 10 appareils : le plus ancien est déconnecté', async () => {
        const first = await loginMobile(CAP);
        for (let i = 0; i < 10; i++) await loginMobile(CAP);

        expect(await activeSessions(CAP)).toBeLessThanOrEqual(10);
        await me(first.access_token).expect(401);
        await refreshMobile(first.refresh_token).expect(401);
      });
    });

    describe('effets immédiats côté serveur', () => {
      it('changer de mot de passe coupe les autres appareils mais pas l’appareil courant', async () => {
        const current = await loginWeb(CITIZEN);
        const other = await loginMobile(CITIZEN);

        await api('patch', '/auth/security')
          .set('Cookie', `access_token=${current.access}`)
          .send({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD })
          .expect(200);

        await api('get', '/auth/me')
          .set('Cookie', `access_token=${current.access}`)
          .expect(200);
        await me(other.access_token).expect(401);
        await refreshMobile(other.refresh_token).expect(401);

        // remet le mot de passe d'origine pour les autres tests
        await api('patch', '/auth/security')
          .set('Cookie', `access_token=${current.access}`)
          .send({
            currentPassword: NEW_PASSWORD,
            newPassword: 'E2e-Passw0rd!-Retour-2026',
          })
          .expect(200);
        await ensureUser(
          CITIZEN,
          await ds
            .getRepository(Role)
            .findOneByOrFail({ libelle: 'utilisateur' }),
        );
      });

      it('un compte supprimé perd son accès immédiatement', async () => {
        const email = `e2e-auth-victim-${Date.now()}@test.local`;
        await ensureUser(
          email,
          await ds
            .getRepository(Role)
            .findOneByOrFail({ libelle: 'utilisateur' }),
        );
        const victim = await loginMobile(email);
        const { body } = await me(victim.access_token).expect(200);
        const admin = await loginMobile(ADMIN);

        await api('delete', `/users/${body.id}`)
          .set('Authorization', `Bearer ${admin.access_token}`)
          .expect(200);

        await me(victim.access_token).expect(401);
        await refreshMobile(victim.refresh_token).expect(401);
      });

      it('un changement de rôle s’applique sans reconnexion', async () => {
        const token = (await loginMobile(ROLESHIFT)).access_token;
        await api('get', '/users/all')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        const citizen = await ds
          .getRepository(Role)
          .findOneByOrFail({ libelle: 'utilisateur' });
        await ds
          .getRepository(Users)
          .update({ email: ROLESHIFT }, { role: citizen });

        await api('get', '/users/all')
          .set('Authorization', `Bearer ${token}`)
          .expect(403);
      });

      it('enregistre l’IP du client via X-Forwarded-For (trust proxy)', async () => {
        const tokens = await loginMobile(CITIZEN, {
          'X-Forwarded-For': '203.0.113.50',
        });
        const row = await sessionRow(tokens.session_id);
        expect(row.ip_address).toBe('203.0.113.50');
      });
    });
  });

  describe('limitation de débit', () => {
    let app: INestApplication;

    const login = (email: string, ip?: string) => {
      const req = request(app.getHttpServer()).post('/api/v1/auth/login');
      if (ip) req.set('X-Forwarded-For', ip);
      return req.send({ email, password: 'Mauvais-1234567' });
    };

    beforeEach(async () => {
      app = await createApp(false);
    });

    afterEach(async () => {
      await app.close();
    });

    afterAll(() => {
      for (const name of THROTTLE_ENV) delete process.env[name];
    });

    it('bloque un compte après 5 tentatives, sans bloquer les autres comptes', async () => {
      for (let i = 0; i < 5; i++) {
        await login('cible@test.local').expect(401);
      }
      const blocked = await login('cible@test.local').expect(429);
      const retryAfter = Number(blocked.headers['retry-after']);
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(60);
      expect(blocked.body.message).toContain('Trop de tentatives');

      await login('autre@test.local').expect(401);
    });

    it('le blocage d’un compte ignore la casse et les espaces de l’e-mail', async () => {
      for (let i = 0; i < 5; i++) await login('Cible@Test.local').expect(401);
      await login(' cible@test.local ').expect(429);
    });

    it('bloque une IP après 20 tentatives, mais pas une autre IP', async () => {
      for (let i = 0; i < 20; i++) {
        await login(`brute-${i}@test.local`, '203.0.113.1').expect(401);
      }
      await login('brute-21@test.local', '203.0.113.1').expect(429);
      await login('brute-22@test.local', '203.0.113.2').expect(401);
    });

    it('limite /auth/refresh à 30 appels par minute et par IP, indépendamment du login', async () => {
      const refresh = () =>
        request(app.getHttpServer())
          .post('/api/v1/auth/refresh')
          .set('X-Client', 'mobile')
          .send({ refresh_token: 'pas-un-refresh-token' });

      for (let i = 0; i < 30; i++) await refresh().expect(401);
      await refresh().expect(429);
      await login('encore@test.local').expect(401);
    });

    it('ne limite pas le reste de l’API', async () => {
      for (let i = 0; i < 40; i++) {
        await request(app.getHttpServer())
          .get('/api/v1/article/published?limit=1')
          .expect(200);
      }
    });
  });
});
