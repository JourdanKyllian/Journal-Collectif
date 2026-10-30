/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment -- supertest renvoie `res.body` en `any` */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { Role } from '../src/roles/entities/roles.entity';
import { JournalMember } from '../src/tenant/entities/journal-member.entity';
import { Journal } from '../src/tenant/entities/journal.entity';
import { Users } from '../src/users/entities/user.entity';

const PASSWORD = 'E2e-Passw0rd!';
const NEW_PASSWORD = 'Nouveau-Passw0rd!-2026';
const DEFAULT_SLUG = 'collectif-chalonnais';

// Un journal unique par passage : la base de test garde ses journaux d'un passage à l'autre.
const RUN = Date.now().toString(36);
const SLUG_B = `tb-${RUN}`;
const SLUG_C = `tc-${RUN}`;
const GRASSE = { nom: 'Grasse', code_insee: '06069', code_postal: '06130' };
const CANNES = { nom: 'Cannes', code_insee: '06029', code_postal: '06400' };

describe('Multi-tenant : résolution, provisioning, masquage, isolation (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;

  type Call = {
    token?: string;
    journal?: string;
    query?: string;
    body?: object;
  };
  const call = (
    method: 'get' | 'post' | 'patch' | 'delete',
    url: string,
    { token, journal, query, body }: Call = {},
  ) => {
    const req = request(app.getHttpServer())[method](
      `/api/v1${url}${query ? `?${query}` : ''}`,
    );
    if (token) req.set('Authorization', `Bearer ${token}`);
    if (journal) req.set('X-Journal', journal);
    return body ? req.send(body) : req;
  };

  const login = async (email: string, password = PASSWORD): Promise<string> =>
    (
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('X-Client', 'mobile')
        .send({ email, password })
        .expect(201)
    ).body.access_token as string;

  const roleOf = async (libelle: string) =>
    ds.getRepository(Role).findOneByOrFail({ libelle });

  const ensureUser = async (
    email: string,
    globalRole: string,
    extra: Partial<Users> = {},
  ) => {
    const users = ds.getRepository(Users);
    const user =
      (await users.findOne({ where: { email }, relations: ['profile'] })) ??
      users.create({ email });
    user.password = await bcrypt.hash(PASSWORD, 4);
    user.role = await roleOf(globalRole);
    user.is_phone_verified = true;
    user.must_change_password = false;
    user.is_platform_admin = false;
    Object.assign(user, extra);
    user.profile = Object.assign(user.profile ?? {}, {
      firstname: 'T',
      lastname: email.split('@')[0],
    });
    return users.save(user);
  };

  const makeMember = async (
    userId: number,
    journalId: number,
    role: string,
  ) => {
    const members = ds.getRepository(JournalMember);
    const existing = await members.findOne({ where: { userId, journalId } });
    const roleEntity = await roleOf(role);
    if (existing) {
      existing.roleId = roleEntity.id;
      await members.save(existing);
    } else {
      await members.save(
        members.create({ userId, journalId, roleId: roleEntity.id }),
      );
    }
  };

  const journalId = async (slug: string) =>
    (await ds.getRepository(Journal).findOneByOrFail({ slug })).id;

  /** Provisionne un journal et renvoie son super admin initial, prêt à se connecter. */
  const provision = async (
    platformToken: string,
    slug: string,
    email: string,
  ) => {
    const res = await call('post', '/journals/provision', {
      token: platformToken,
      body: {
        slug,
        nom_journal: `Journal ${slug}`,
        nom_ville: 'Grasse',
        communes: [GRASSE, CANNES],
        super_admin: { email, firstname: 'Initial', lastname: 'Admin' },
      },
    }).expect(201);
    return res.body as {
      journal: {
        id: number;
        slug: string;
        statut: string;
        communes: unknown[];
      };
      super_admin: {
        id: number;
        email: string;
        created: boolean;
        temporary_password?: string;
      };
    };
  };

  let platform: string; // jeton de l'opérateur de la plateforme
  let adminA: string; // admin du journal par défaut (compte antérieur au multi-tenant)
  let superB: string; // super admin du journal B, après changement de mot de passe

  beforeAll(async () => {
    if (!/test/i.test(process.env.DB_NAME ?? process.env.DATABASE_URL ?? '')) {
      throw new Error('Les tests e2e doivent cibler une base « test ».');
    }
    process.env.AUTH_THROTTLE_LOGIN_IP = '100000';
    process.env.AUTH_THROTTLE_LOGIN_ACCOUNT = '100000';
    process.env.AUTH_THROTTLE_REFRESH_IP = '100000';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    ds = app.get(DataSource);
    await ds.runMigrations();

    const roles = ds.getRepository(Role);
    for (const libelle of [
      'super_admin',
      'admin',
      'redacteur',
      'utilisateur',
    ]) {
      if (!(await roles.findOneBy({ libelle }))) {
        await roles.save(roles.create({ libelle }));
      }
    }

    await ensureUser('t-platform@test.local', 'utilisateur', {
      is_platform_admin: true,
    });
    // Compte antérieur au multi-tenant : rôle global admin, aucune adhésion.
    await ensureUser('t-admin-a@test.local', 'admin');
    await ensureUser('t-citoyen@test.local', 'utilisateur');
    await ds.query(
      `DELETE FROM journal_member WHERE user_id IN (SELECT id FROM users WHERE email IN ('t-admin-a@test.local','t-citoyen@test.local','t-platform@test.local'))`,
    );

    platform = await login('t-platform@test.local');
    adminA = await login('t-admin-a@test.local');
  });

  afterAll(async () => {
    for (const name of [
      'AUTH_THROTTLE_LOGIN_IP',
      'AUTH_THROTTLE_LOGIN_ACCOUNT',
      'AUTH_THROTTLE_REFRESH_IP',
    ]) {
      delete process.env[name];
    }
    await app.close();
  });

  describe('résolution du journal courant', () => {
    it('sans en-tête : le journal historique, pour que les clients existants continuent de fonctionner', async () => {
      const res = await call('get', '/journals/current').expect(200);
      expect(res.body).toMatchObject({ slug: DEFAULT_SLUG, statut: 'actif' });
    });

    it('un journal inconnu est introuvable, par en-tête comme par paramètre', async () => {
      await call('get', '/journals/current', { journal: 'nexiste-pas' }).expect(
        404,
      );
      await call('get', '/journals/current', {
        query: 'journal=nexiste-pas',
      }).expect(404);
      await call('get', '/journals/current', { journal: '9999999' }).expect(
        404,
      );
      await call('get', '/journals/current', {
        journal: 'x'.repeat(200),
      }).expect(404);
    });

    it('accepte le slug (insensible à la casse), l’identifiant et ?journal=', async () => {
      const id = await journalId(DEFAULT_SLUG);
      const variants: Call[] = [
        { journal: DEFAULT_SLUG.toUpperCase() },
        { journal: String(id) },
        { query: `journal=${DEFAULT_SLUG}` },
      ];
      for (const variant of variants) {
        const res = await call('get', '/journals/current', variant).expect(200);
        expect(res.body.slug).toBe(DEFAULT_SLUG);
      }
    });

    it('l’en-tête l’emporte sur le paramètre', async () => {
      const res = await call('get', '/journals/current', {
        journal: DEFAULT_SLUG,
        query: 'journal=nexiste-pas',
      }).expect(200);
      expect(res.body.slug).toBe(DEFAULT_SLUG);
    });
  });

  describe('provisioning (plateforme)', () => {
    const payload = (slug: string, email: string) => ({
      slug,
      nom_journal: 'Journal test',
      nom_ville: 'Grasse',
      communes: [GRASSE],
      super_admin: { email, firstname: 'A', lastname: 'B' },
    });

    it('refuse l’anonyme, un citoyen et un admin de journal', async () => {
      const body = payload(`x-${RUN}`, 'qq@test.local');
      await call('post', '/journals/provision', { body }).expect(401);
      await call('post', '/journals/provision', { token: adminA, body }).expect(
        403,
      );
      await call('post', '/journals/provision', {
        token: await login('t-citoyen@test.local'),
        body,
      }).expect(403);
    });

    it('crée un journal en configuration, ses communes et son super admin à mot de passe provisoire', async () => {
      const result = await provision(
        platform,
        SLUG_B,
        `t-super-b-${RUN}@test.local`,
      );

      expect(result.journal).toMatchObject({
        slug: SLUG_B,
        statut: 'en_configuration',
      });
      expect(result.journal.communes).toHaveLength(2);
      expect(result.super_admin.created).toBe(true);
      expect(result.super_admin.temporary_password).toMatch(/^Tmp-/);

      const user = await ds
        .getRepository(Users)
        .findOneByOrFail({ id: result.super_admin.id });
      expect(user.must_change_password).toBe(true);
      expect(user.password).not.toContain('Tmp-'); // jamais stocké en clair
      const member = await ds.getRepository(JournalMember).findOneOrFail({
        where: { userId: user.id, journalId: result.journal.id },
        relations: ['role'],
      });
      expect(member.role.libelle).toBe('super_admin');
    });

    it('refuse un slug déjà pris, réservé ou invalide, et une payload incomplète', async () => {
      await call('post', '/journals/provision', {
        token: platform,
        body: payload(SLUG_B, 'autre@test.local'),
      }).expect(409);
      await call('post', '/journals/provision', {
        token: platform,
        body: payload('admin', 'autre@test.local'),
      }).expect(409);
      for (const slug of ['a', 'Pas Valide', 'sous_tiret', '-debut']) {
        await call('post', '/journals/provision', {
          token: platform,
          body: payload(slug, 'autre@test.local'),
        }).expect(400);
      }
      await call('post', '/journals/provision', {
        token: platform,
        body: { ...payload(`y-${RUN}`, 'autre@test.local'), communes: [] },
      }).expect(400);
      await call('post', '/journals/provision', {
        token: platform,
        body: {
          ...payload(`y-${RUN}`, 'autre@test.local'),
          communes: [{ nom: 'X', code_insee: 'abc', code_postal: '1' }],
        },
      }).expect(400);
    });

    it('réutilise une commune existante au lieu d’en créer une seconde', async () => {
      const [{ count }] = await ds.query<{ count: string }[]>(
        `SELECT count(*) FROM commune WHERE code_insee = $1`,
        [GRASSE.code_insee],
      );
      expect(Number(count)).toBe(1);
    });

    it('un compte existant devient super admin du nouveau journal sans mot de passe renvoyé', async () => {
      const result = await provision(platform, SLUG_C, 't-citoyen@test.local');
      expect(result.super_admin.created).toBe(false);
      expect(result.super_admin).not.toHaveProperty('temporary_password');
      // l'obligation de changer de mot de passe s'applique aussi : c'est elle qui ouvre le journal
      const user = await ds
        .getRepository(Users)
        .findOneByOrFail({ email: 't-citoyen@test.local' });
      expect(user.must_change_password).toBe(true);
    });
  });

  describe('journal en configuration : masqué, puis ouvert par son super admin', () => {
    let temporary: string;
    let superTempToken: string;
    const SUPER_B = `t-super-b-${RUN}@test.local`;

    beforeAll(async () => {
      const row = await ds
        .getRepository(Users)
        .findOneByOrFail({ email: SUPER_B });
      // le mot de passe provisoire n'est pas relisible : on en pose un connu, comme le ferait l'opérateur
      temporary = 'Provisoire-Passw0rd!-2026';
      row.password = await bcrypt.hash(temporary, 4);
      await ds.getRepository(Users).save(row);
    });

    it('est invisible de l’anonyme et d’un autre compte (404), y compris son contenu', async () => {
      await call('get', '/journals/current', { journal: SLUG_B }).expect(404);
      await call('get', '/article/published', { journal: SLUG_B }).expect(404);
      await call('get', '/categorie', { journal: SLUG_B }).expect(404);
      await call('get', '/settings', { journal: SLUG_B }).expect(404);
      await call('get', '/article/published', {
        journal: SLUG_B,
        token: adminA,
      }).expect(404);
    });

    it('n’apparaît pas dans l’annuaire public', async () => {
      const res = await call('get', '/journals', {
        query: `q=${SLUG_B}`,
      }).expect(200);
      expect(res.body.data).toHaveLength(0);
    });

    it('l’opérateur de la plateforme peut le consulter', async () => {
      const res = await call('get', '/journals/current', {
        journal: SLUG_B,
        token: platform,
      }).expect(200);
      expect(res.body.statut).toBe('en_configuration');
    });

    it('son super admin peut se connecter malgré le masquage, et voit son rôle de membre', async () => {
      superTempToken = await login(SUPER_B, temporary);
      const me = await call('get', '/auth/me', {
        token: superTempToken,
        journal: SLUG_B,
      }).expect(200);
      expect(me.body).toMatchObject({
        role: 'super_admin',
        must_change_password: true,
        journal: { slug: SLUG_B, statut: 'en_configuration' },
      });
    });

    it('tant que le mot de passe provisoire n’est pas changé, tout le reste est bloqué', async () => {
      const res = await call('get', '/article/admin/stats', {
        token: superTempToken,
        journal: SLUG_B,
      }).expect(403);
      expect(res.body.message).toContain('changer votre mot de passe');
      await call('post', '/categorie', {
        token: superTempToken,
        journal: SLUG_B,
        body: { libelle: 'X', icon: '📰', image_bandeau_url: '/x.jpg' },
      }).expect(403);
    });

    it('exige un mot de passe réellement différent du provisoire', async () => {
      await call('patch', '/auth/security', {
        token: superTempToken,
        journal: SLUG_B,
        body: { currentPassword: temporary, newPassword: temporary },
      }).expect(400);
    });

    it('en changeant son mot de passe, le super admin lève l’obligation et ouvre le journal', async () => {
      await call('patch', '/auth/security', {
        token: superTempToken,
        journal: SLUG_B,
        body: { currentPassword: temporary, newPassword: NEW_PASSWORD },
      }).expect(200);

      const journal = await ds
        .getRepository(Journal)
        .findOneByOrFail({ slug: SLUG_B });
      expect(journal.statut).toBe('actif');
      const user = await ds
        .getRepository(Users)
        .findOneByOrFail({ email: SUPER_B });
      expect(user.must_change_password).toBe(false);

      // désormais public
      await call('get', '/journals/current', { journal: SLUG_B }).expect(200);
      await call('get', '/article/published', { journal: SLUG_B }).expect(200);

      superB = await login(SUPER_B, NEW_PASSWORD);
      await call('get', '/article/admin/stats', {
        token: superB,
        journal: SLUG_B,
      }).expect(200);
    });

    it('un compte qui n’est pas super admin de ce journal ne l’ouvre pas en changeant son mot de passe', async () => {
      // t-citoyen est super admin du journal C : le changement de mot de passe sur B ne touche pas B
      const slugD = `td-${RUN}`;
      await provision(platform, slugD, `t-super-d-${RUN}@test.local`);
      const row = await ds
        .getRepository(Users)
        .findOneByOrFail({ email: 't-citoyen@test.local' });
      row.password = await bcrypt.hash(temporary, 4);
      await ds.getRepository(Users).save(row);
      const token = await login('t-citoyen@test.local', temporary);

      await call('patch', '/auth/security', {
        token,
        journal: slugD, // il n'en est pas membre
        body: { currentPassword: temporary, newPassword: NEW_PASSWORD },
      }).expect(404); // journal masqué pour un non-membre : rien ne change
      expect(
        (await ds.getRepository(Journal).findOneByOrFail({ slug: slugD }))
          .statut,
      ).toBe('en_configuration');
    });
  });

  describe('annuaire public', () => {
    it('ne liste que les journaux actifs, sans coordonnées, avec leurs communes', async () => {
      const res = await call('get', '/journals', {
        query: `q=${SLUG_B}`,
      }).expect(200);
      expect(res.body.data).toHaveLength(1);
      const item = res.body.data[0];
      expect(item).toMatchObject({ slug: SLUG_B, statut: 'actif' });
      expect(item.communes.map((c: { nom: string }) => c.nom).sort()).toEqual([
        'Cannes',
        'Grasse',
      ]);
      expect(item).not.toHaveProperty('email_contact');
      expect(item).not.toHaveProperty('tel_contact');
      expect(res.body.meta).toMatchObject({ page: 1, total: 1 });
    });

    it.each([
      ['code INSEE', `commune=${GRASSE.code_insee}`, 1],
      ['nom de commune', 'commune=gras', 1],
      ['code postal', `code_postal=${CANNES.code_postal}`, 1],
      ['commune absente', 'commune=06999', 0],
      ['code postal absent', 'code_postal=75001', 0],
    ])('filtre par %s', async (_label, filter, expected) => {
      const res = await call('get', '/journals', {
        query: `q=${SLUG_B}&${filter}`,
      }).expect(200);
      expect(res.body.data).toHaveLength(expected);
    });

    it('trouve le journal historique par sa ville et pagine', async () => {
      const res = await call('get', '/journals', {
        query: 'limit=1&page=1',
      }).expect(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta.limit).toBe(1);
      await call('get', '/journals', { query: 'limit=1000' }).expect(400);
      await call('get', '/journals', { query: 'code_postal=abc' }).expect(400);
    });

    it('un journal en maintenance disparaît de l’annuaire et refuse les non-membres (503)', async () => {
      await call('patch', `/journals/${SLUG_B}/statut`, {
        token: platform,
        body: { statut: 'maintenance' },
      }).expect(200);

      expect(
        (await call('get', '/journals', { query: `q=${SLUG_B}` }).expect(200))
          .body.data,
      ).toHaveLength(0);
      await call('get', '/article/published', { journal: SLUG_B }).expect(503);
      // ses membres continuent de travailler
      await call('get', '/article/admin/stats', {
        token: superB,
        journal: SLUG_B,
      }).expect(200);

      await call('patch', `/journals/${SLUG_B}/statut`, {
        token: platform,
        body: { statut: 'actif' },
      }).expect(200);
      await call('get', '/article/published', { journal: SLUG_B }).expect(200);
    });

    it('seule la plateforme change un statut, et seulement vers actif ou maintenance', async () => {
      await call('patch', `/journals/${SLUG_B}/statut`, {
        token: adminA,
        body: { statut: 'maintenance' },
      }).expect(403);
      await call('patch', `/journals/${SLUG_B}/statut`, {
        body: { statut: 'maintenance' },
      }).expect(401);
      await call('patch', `/journals/${SLUG_B}/statut`, {
        token: platform,
        body: { statut: 'en_configuration' },
      }).expect(400);
      await call('patch', '/journals/inconnu-xyz/statut', {
        token: platform,
        body: { statut: 'actif' },
      }).expect(404);
    });
  });

  describe('isolation des données entre journaux', () => {
    const cat = (libelle: string) => ({
      libelle,
      icon: '🏷️',
      image_bandeau_url: '/b.jpg',
    });
    let catA: number;
    let catB: number;
    let articleB: number;
    let articleA: number;

    it('deux journaux peuvent avoir une catégorie du même nom, chacun ne voit que les siennes', async () => {
      const name = `Sport-${RUN}`;
      catA = (
        await call('post', '/categorie', {
          token: adminA,
          body: cat(name),
        }).expect(201)
      ).body.id;
      catB = (
        await call('post', '/categorie', {
          token: superB,
          journal: SLUG_B,
          body: cat(name),
        }).expect(201)
      ).body.id;
      await call('post', '/categorie', {
        token: adminA,
        body: cat(name),
      }).expect(409); // doublon dans le même journal

      const inA = (await call('get', '/categorie').expect(200)).body as {
        id: number;
      }[];
      const inB = (
        await call('get', '/categorie', { journal: SLUG_B }).expect(200)
      ).body as { id: number }[];
      expect(inA.map((c) => c.id)).toContain(catA);
      expect(inA.map((c) => c.id)).not.toContain(catB);
      expect(inB.map((c) => c.id)).toEqual([catB]);
    });

    it('une catégorie d’un autre journal est introuvable en lecture, modification et suppression', async () => {
      await call('get', `/categorie/${catB}`).expect(404);
      await call('patch', `/categorie/${catB}`, {
        token: adminA,
        body: { libelle: 'Piraté' },
      }).expect(404);
      await call('delete', `/categorie/${catB}`, { token: adminA }).expect(404);
      await call('get', `/categorie/${catB}`, { journal: SLUG_B }).expect(200);
    });

    it('les articles sont cloisonnés : listes, lecture, compteurs', async () => {
      articleB = (
        await call('post', '/article', {
          token: superB,
          journal: SLUG_B,
          body: {
            titre: `Article B ${RUN}`,
            contenu: '<p>b</p>',
            categorieId: catB,
            statut: 'publie',
          },
        }).expect(201)
      ).body.id;
      articleA = (
        await call('post', '/article', {
          token: adminA,
          body: {
            titre: `Article A ${RUN}`,
            contenu: '<p>a</p>',
            categorieId: catA,
            statut: 'publie',
          },
        }).expect(201)
      ).body.id;

      const listA = (
        await call('get', '/article/published', { query: `q=${RUN}` }).expect(
          200,
        )
      ).body.data;
      const listB = (
        await call('get', '/article/published', {
          journal: SLUG_B,
          query: `q=${RUN}`,
        }).expect(200)
      ).body.data;
      expect(listA.map((a: { id: number }) => a.id)).toEqual([articleA]);
      expect(listB.map((a: { id: number }) => a.id)).toEqual([articleB]);

      await call('get', `/article/${articleB}`).expect(404);
      await call('get', `/article/${articleA}`, { journal: SLUG_B }).expect(
        404,
      );
      await call('get', `/article/${articleB}`, { journal: SLUG_B }).expect(
        200,
      );

      const statsB = (
        await call('get', '/article/admin/stats', {
          token: superB,
          journal: SLUG_B,
        }).expect(200)
      ).body;
      expect(statsB.total).toBe(1);
      const adminB = (
        await call('get', '/article/admin/all', {
          token: superB,
          journal: SLUG_B,
        }).expect(200)
      ).body;
      expect(adminB.meta.total).toBe(1);
    });

    it('une catégorie d’un autre journal ne peut pas être utilisée pour un article', async () => {
      await call('post', '/article', {
        token: superB,
        journal: SLUG_B,
        body: { titre: 'X', contenu: '<p>x</p>', categorieId: catA },
      }).expect(400);
    });

    it('un admin d’un journal ne peut ni modifier, ni publier, ni supprimer les articles d’un autre', async () => {
      await call('patch', `/article/${articleB}`, {
        token: adminA,
        body: { titre: 'Piraté' },
      }).expect(404);
      await call('patch', `/article/${articleB}/unpublish`, {
        token: adminA,
      }).expect(404);
      await call('delete', `/article/${articleB}`, { token: adminA }).expect(
        404,
      );
      await call('get', `/article/${articleB}/history`, {
        token: adminA,
      }).expect(404);
      // et sur le journal B, ce compte n'est qu'un citoyen
      await call('patch', `/article/${articleB}/unpublish`, {
        token: adminA,
        journal: SLUG_B,
      }).expect(403);
      await call('delete', `/article/${articleB}`, {
        token: adminA,
        journal: SLUG_B,
      }).expect(403);
      expect(
        (
          await call('get', `/article/${articleB}`, { journal: SLUG_B }).expect(
            200,
          )
        ).body.titre,
      ).toBe(`Article B ${RUN}`);
    });

    it('les alertes sont cloisonnées', async () => {
      const alert = { type: 'info', title: `Alerte ${RUN}`, message: 'm' };
      const alertB = (
        await call('post', '/alerts', {
          token: superB,
          journal: SLUG_B,
          body: alert,
        }).expect(201)
      ).body.id;

      const inA = (await call('get', '/alerts').expect(200)).body as {
        id: number;
      }[];
      const inB = (
        await call('get', '/alerts', { journal: SLUG_B }).expect(200)
      ).body as { id: number }[];
      expect(inA.map((a) => a.id)).not.toContain(alertB);
      expect(inB.map((a) => a.id)).toEqual([alertB]);

      await call('patch', `/alerts/${alertB}`, {
        token: adminA,
        body: { title: 'Piraté' },
      }).expect(404);
      await call('delete', `/alerts/${alertB}`, { token: adminA }).expect(404);
      await call('patch', `/alerts/${alertB}`, {
        token: superB,
        journal: SLUG_B,
        body: { title: 'Modifiée' },
      }).expect(200);
    });

    it('les réglages sont ceux du journal courant : écrire sur B ne touche pas A', async () => {
      const before = (await call('get', '/settings').expect(200)).body;

      await call('patch', '/settings', {
        token: superB,
        journal: SLUG_B,
        body: { nom_journal: `Nom B ${RUN}`, email_contact: 'b@test.local' },
      }).expect(200);

      const b = (
        await call('get', '/settings', { journal: SLUG_B }).expect(200)
      ).body;
      const a = (await call('get', '/settings').expect(200)).body;
      expect(b).toMatchObject({
        slug: SLUG_B,
        nom_journal: `Nom B ${RUN}`,
        email_contact: 'b@test.local',
      });
      expect(a.nom_journal).toBe(before.nom_journal);
      expect(a.slug).toBe(DEFAULT_SLUG);
      // l'annuaire et /journals/current suivent
      expect(
        (
          await call('get', '/journals/current', { journal: SLUG_B }).expect(
            200,
          )
        ).body.nom_journal,
      ).toBe(`Nom B ${RUN}`);
      // un admin de A ne peut pas écrire les réglages de B
      await call('patch', '/settings', {
        token: adminA,
        journal: SLUG_B,
        body: { nom_journal: 'Piraté' },
      }).expect(403);
    });
  });

  describe('rôles et comptes par journal', () => {
    const SHARED = `t-shared-${RUN}@test.local`;
    let shared: Users;
    let sharedToken: string;
    let adminBId: number;

    beforeAll(async () => {
      shared = await ensureUser(SHARED, 'utilisateur');
      await makeMember(shared.id, await journalId(DEFAULT_SLUG), 'admin');
      sharedToken = await login(SHARED);
    });

    it('un même compte a un rôle par journal, avec un seul jeton', async () => {
      const inA = await call('get', '/auth/me', { token: sharedToken }).expect(
        200,
      );
      const inB = await call('get', '/auth/me', {
        token: sharedToken,
        journal: SLUG_B,
      }).expect(200);
      expect(inA.body.role).toBe('admin');
      expect(inB.body.role).toBe('utilisateur');

      await call('get', '/users/all', { token: sharedToken }).expect(200);
      await call('get', '/users/all', {
        token: sharedToken,
        journal: SLUG_B,
      }).expect(403);
    });

    it('le rôle global d’un compte antérieur ne vaut que pour le journal historique', async () => {
      const inA = await call('get', '/auth/me', { token: adminA }).expect(200);
      const inB = await call('get', '/auth/me', {
        token: adminA,
        journal: SLUG_B,
      }).expect(200);
      expect(inA.body.role).toBe('admin');
      expect(inB.body.role).toBe('utilisateur');
      await call('post', '/categorie', {
        token: adminA,
        journal: SLUG_B,
        body: { libelle: 'Infiltré', icon: 'x', image_bandeau_url: '/x' },
      }).expect(403);
    });

    it('la liste des comptes est limitée au journal courant', async () => {
      const inB = (
        await call('get', '/users/all', {
          token: superB,
          journal: SLUG_B,
          query: 'limit=100',
        }).expect(200)
      ).body.data as { email: string }[];
      const emailsB = inB.map((u) => u.email);
      expect(emailsB).toContain(`t-super-b-${RUN}@test.local`);
      expect(emailsB).not.toContain('t-admin-a@test.local');
      expect(emailsB).not.toContain(SHARED);

      const inA = (
        await call('get', '/users/all', {
          token: adminA,
          query: `q=t-&limit=100`,
        }).expect(200)
      ).body.data as { email: string }[];
      const emailsA = inA.map((u) => u.email);
      expect(emailsA).toContain('t-admin-a@test.local');
      expect(emailsA).toContain(SHARED);
      expect(emailsA).not.toContain(`t-super-b-${RUN}@test.local`);
    });

    it('la liste affiche le rôle du compte dans le journal courant', async () => {
      const inA = (
        await call('get', '/users/all', {
          token: adminA,
          query: `q=${SHARED}`,
        }).expect(200)
      ).body.data;
      expect(inA[0].role.libelle).toBe('admin');
      expect(inA[0]).not.toHaveProperty('password');
    });

    it('un admin ne peut ni lire, ni modifier, ni vérifier, ni supprimer un compte d’un autre journal', async () => {
      const superBRow = await ds
        .getRepository(Users)
        .findOneByOrFail({ email: `t-super-b-${RUN}@test.local` });
      adminBId = superBRow.id;
      await call('patch', `/users/${adminBId}`, {
        token: adminA,
        body: { email: 'vole@test.local', password: 'Un-Nouveau-Passw0rd!!' },
      }).expect(404);
      await call('patch', `/users/${adminBId}/verification`, {
        token: adminA,
        body: { verified: false },
      }).expect(404);
      await call('delete', `/users/${adminBId}`, { token: adminA }).expect(404);

      const intact = await ds
        .getRepository(Users)
        .findOneByOrFail({ id: adminBId });
      expect(intact.email).toBe(`t-super-b-${RUN}@test.local`);
      // l'inverse : le super admin de B ne touche pas aux comptes de A
      const adminARow = await ds
        .getRepository(Users)
        .findOneByOrFail({ email: 't-admin-a@test.local' });
      await call('patch', `/users/${adminARow.id}`, {
        token: superB,
        journal: SLUG_B,
        body: { email: 'vole@test.local' },
      }).expect(404);
      await call('delete', `/users/${adminARow.id}`, {
        token: superB,
        journal: SLUG_B,
      }).expect(404);
    });

    it('les limites de rôles sont par journal : chaque journal a son propre super admin', async () => {
      // B a déjà son super admin ; en créer un second y est refusé…
      await call('post', '/users/create', {
        token: superB,
        journal: SLUG_B,
        body: {
          email: `t-second-${RUN}@test.local`,
          password: 'Un-Mot-De-Passe-Long-1!',
          firstname: 'S',
          lastname: 'S',
          role: 'super_admin',
        },
      }).expect(409);
      // …mais A n'est pas concerné par le super admin de B : on y compte les siens
      const countB = await ds.getRepository(JournalMember).count({
        where: {
          journalId: await journalId(SLUG_B),
          role: { libelle: 'super_admin' },
        },
      });
      expect(countB).toBe(1);
    });

    it('un compte créé dans un journal n’appartient qu’à ce journal', async () => {
      const email = `t-redac-b-${RUN}@test.local`;
      const created = (
        await call('post', '/users/create', {
          token: superB,
          journal: SLUG_B,
          body: {
            email,
            password: 'Un-Mot-De-Passe-Long-1!',
            firstname: 'R',
            lastname: 'B',
            role: 'redacteur',
          },
        }).expect(201)
      ).body;
      expect(created.role.libelle).toBe('redacteur');
      expect(created).not.toHaveProperty('password');

      const redac = await login(email, 'Un-Mot-De-Passe-Long-1!');
      expect(
        (
          await call('get', '/auth/me', {
            token: redac,
            journal: SLUG_B,
          }).expect(200)
        ).body.role,
      ).toBe('redacteur');
      expect(
        (await call('get', '/auth/me', { token: redac }).expect(200)).body.role,
      ).toBe('utilisateur');

      const listA = (
        await call('get', '/users/all', {
          token: adminA,
          query: `q=${email}`,
        }).expect(200)
      ).body.data;
      expect(listA).toHaveLength(0);
    });

    it('une inscription rejoint le journal où elle a lieu, comme simple citoyen', async () => {
      const email = `t-inscrit-${RUN}@test.local`;
      const password = 'Un-Mot-De-Passe-Long-1!';
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .set('X-Journal', SLUG_B)
        .send({
          username: 'inscrit',
          email,
          password,
          confirmPassword: password,
        })
        .expect(201);

      const inB = (
        await call('get', '/users/all', {
          token: superB,
          journal: SLUG_B,
          query: `q=${email}`,
        }).expect(200)
      ).body.data;
      expect(inB).toHaveLength(1);
      expect(inB[0].role.libelle).toBe('utilisateur');
      expect(
        (
          await call('get', '/users/all', {
            token: adminA,
            query: `q=${email}`,
          }).expect(200)
        ).body.data,
      ).toHaveLength(0);
    });

    it('retirer un compte d’un journal ne supprime pas son compte s’il appartient à un autre', async () => {
      await makeMember(shared.id, await journalId(SLUG_B), 'redacteur');

      await call('delete', `/users/${shared.id}`, {
        token: superB,
        journal: SLUG_B,
      }).expect(200);

      // plus membre de B…
      expect(
        (
          await call('get', '/auth/me', {
            token: sharedToken,
            journal: SLUG_B,
          }).expect(200)
        ).body.role,
      ).toBe('utilisateur');
      // …mais son compte et son rôle dans A sont intacts
      expect(
        (await call('get', '/auth/me', { token: sharedToken }).expect(200)).body
          .role,
      ).toBe('admin');
      expect(
        await ds.getRepository(Users).count({ where: { id: shared.id } }),
      ).toBe(1);
    });

    it('retirer le dernier rattachement d’un compte le supprime', async () => {
      const email = `t-last-${RUN}@test.local`;
      const id = (
        await call('post', '/users/create', {
          token: superB,
          journal: SLUG_B,
          body: {
            email,
            password: 'Un-Mot-De-Passe-Long-1!',
            firstname: 'L',
            lastname: 'L',
            role: 'redacteur',
          },
        }).expect(201)
      ).body.id as number;
      const token = await login(email, 'Un-Mot-De-Passe-Long-1!');

      await call('delete', `/users/${id}`, {
        token: superB,
        journal: SLUG_B,
      }).expect(200);

      await call('get', '/auth/me', { token, journal: SLUG_B }).expect(401); // compte supprimé : jeton mort
    });
  });

  describe('rétrocompatibilité du journal historique', () => {
    it('un contenu créé sans journal explicite est rattaché au journal courant, ou à défaut au journal historique', async () => {
      const categories = ds.getRepository('Categorie');
      const row = await categories.save(
        categories.create({
          libelle: `Hors-requête-${RUN}`,
          icon: '🧪',
          image_bandeau_url: '/h.jpg',
        }),
      );
      expect((row as unknown as { journalId: number }).journalId).toBe(
        await journalId(DEFAULT_SLUG),
      );
    });

    it('les données du journal historique ne fuient pas dans un nouveau journal', async () => {
      const res = await call('get', '/article/published', {
        journal: SLUG_B,
        query: 'limit=100',
      }).expect(200);
      for (const article of res.body.data) {
        expect(article.journalId).toBe(await journalId(SLUG_B));
      }
    });
  });
});
