/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment -- supertest renvoie `res.body` en `any` */
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { Categorie } from '../src/categorie/entities/categorie.entity';
import { Profile } from '../src/profile/entities/profile.entity';
import { Role } from '../src/roles/entities/roles.entity';
import { Users } from '../src/users/entities/user.entity';
import { AdminSeedService } from '../src/common/database/seed/admin.seed';
import { TableSeedService } from '../src/common/database/seed/table.seed';

const PASSWORD = 'E2e-Passw0rd!';

type Persona =
  | 'super_admin'
  | 'admin'
  | 'redacteur'
  | 'auteur'
  | 'tiers'
  | 'nouveau';

/**
 * Nécessite une base PostgreSQL DÉDIÉE aux tests (le nom doit contenir « test »), les variables
 * DB_* (ou DATABASE_URL) et JWT_SECRET (32 caractères minimum).
 * Le test crée ses propres comptes et ses propres données (préfixe E2E-), indépendamment du seed.
 */
describe('Phase 0 : sécurité des articles, pagination (e2e)', () => {
  let app: INestApplication;
  let categorieId: number;
  let otherCategorieId: number;

  const cookies: Record<Persona, string> = {
    super_admin: '',
    admin: '',
    redacteur: '',
    auteur: '',
    tiers: '',
    nouveau: '',
  };

  async function login(email: string, password: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(201);
    const setCookie = res.headers['set-cookie'] as unknown as string[];
    const access = setCookie.find((c) => c.startsWith('access_token='));
    if (!access) throw new Error('cookie access_token absent');
    return access.split(';')[0];
  }

  const api = (
    method: 'get' | 'post' | 'patch' | 'delete',
    url: string,
    as?: Persona,
  ) => {
    const req = request(app.getHttpServer())[method](`/api/v1${url}`);
    return as ? req.set('Cookie', cookies[as]) : req;
  };

  const createArticle = async (as: Persona, body: object) =>
    (await api('post', '/article', as).send(body).expect(201)).body as {
      id: number;
    };

  beforeAll(async () => {
    const dbName = process.env.DB_NAME ?? process.env.DATABASE_URL ?? '';
    if (!/test/i.test(dbName)) {
      throw new Error(
        'Les tests e2e doivent cibler une base dont le nom contient « test ».',
      );
    }

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();

    const ds = app.get(DataSource);
    await ds.runMigrations();

    // Repart de zéro pour les données de test (les liaisons auteur/vues/images suivent en cascade).
    await ds.query("DELETE FROM article WHERE titre LIKE 'E2E-%'");

    const roles = ds.getRepository(Role);
    const users = ds.getRepository(Users);
    const categories = ds.getRepository(Categorie);

    const ensureRole = async (libelle: string) =>
      (await roles.findOneBy({ libelle })) ??
      roles.save(roles.create({ libelle }));

    const ensureUser = async (email: string, role: Role, verified: boolean) => {
      const user =
        (await users.findOne({ where: { email }, relations: ['profile'] })) ??
        users.create({ email });
      user.password = await bcrypt.hash(PASSWORD, 4);
      user.role = role;
      user.is_phone_verified = verified;
      user.profile = Object.assign(user.profile ?? new Profile(), {
        firstname: 'E2E',
        lastname: role.libelle,
      });
      await users.save(user);
    };

    const ensureCategorie = async (libelle: string) =>
      (await categories.findOneBy({ libelle })) ??
      categories.save(
        categories.create({
          libelle,
          icon: '🧪',
          image_bandeau_url: '/uploads/e2e.jpg',
        }),
      );

    const [superAdmin, admin, redacteur, citoyen] = await Promise.all(
      ['super_admin', 'admin', 'redacteur', 'utilisateur'].map(ensureRole),
    );
    await ensureUser('e2e-superadmin@test.local', superAdmin, true);
    await ensureUser('e2e-admin@test.local', admin, true);
    await ensureUser('e2e-redacteur@test.local', redacteur, true);
    await ensureUser('e2e-auteur@test.local', citoyen, true);
    await ensureUser('e2e-tiers@test.local', citoyen, false);

    categorieId = (await ensureCategorie('E2E-CAT-A')).id;
    otherCategorieId = (await ensureCategorie('E2E-CAT-B')).id;

    cookies.super_admin = await login('e2e-superadmin@test.local', PASSWORD);
    cookies.admin = await login('e2e-admin@test.local', PASSWORD);
    cookies.redacteur = await login('e2e-redacteur@test.local', PASSWORD);
    cookies.auteur = await login('e2e-auteur@test.local', PASSWORD);
    cookies.tiers = await login('e2e-tiers@test.local', PASSWORD);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('pagination', () => {
    beforeAll(async () => {
      for (let i = 1; i <= 25; i++) {
        await createArticle('admin', {
          titre: `E2E-PAGE-${String(i).padStart(2, '0')}`,
          contenu: '<p>contenu</p>',
          categorieId: i <= 20 ? categorieId : otherCategorieId,
          statut: 'publie',
        });
      }
    });

    it('renvoie une enveloppe { data, meta } avec 20 éléments par défaut', async () => {
      const res = await api('get', '/article/published?q=E2E-PAGE').expect(200);
      expect(res.body.data).toHaveLength(20);
      expect(res.body.meta).toMatchObject({
        page: 1,
        limit: 20,
        total: 25,
        totalPages: 2,
        hasNextPage: true,
      });
    });

    it('sert la dernière page, partielle, sans page suivante', async () => {
      const res = await api(
        'get',
        '/article/published?q=E2E-PAGE&limit=10&page=3',
      ).expect(200);
      expect(res.body.data).toHaveLength(5);
      expect(res.body.meta.hasNextPage).toBe(false);
    });

    it("ne duplique ni n'oublie aucun article d'une page à l'autre", async () => {
      const ids: number[] = [];
      for (const page of [1, 2, 3]) {
        const res = await api(
          'get',
          `/article/published?q=E2E-PAGE&limit=10&page=${page}`,
        ).expect(200);
        ids.push(...res.body.data.map((a: { id: number }) => a.id));
      }
      expect(ids).toHaveLength(25);
      expect(new Set(ids).size).toBe(25);
    });

    it('filtre par catégorie côté serveur', async () => {
      const res = await api(
        'get',
        `/article/published?q=E2E-PAGE&categorieId=${otherCategorieId}`,
      ).expect(200);
      expect(res.body.meta.total).toBe(5);
    });

    it('cherche dans le titre sans interpréter % comme un joker', async () => {
      const res = await api('get', '/article/published?q=%25').expect(200);
      expect(res.body.meta.total).toBe(0);
    });

    it.each(['limit=1000', 'limit=0', 'page=0', 'page=abc'])(
      'rejette ?%s avec une 400',
      async (qs) => {
        await api('get', `/article/published?${qs}`).expect(400);
      },
    );

    it('pagine la liste admin et filtre par statut', async () => {
      const res = await api(
        'get',
        '/article/admin/all?statut=publie&limit=5',
        'admin',
      ).expect(200);
      expect(res.body.data).toHaveLength(5);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(25);
    });
  });

  describe('visibilité des articles non publiés', () => {
    let pendingId: number;

    beforeAll(async () => {
      pendingId = (
        await createArticle('auteur', {
          titre: 'E2E-ATTENTE',
          contenu: '<p>x</p>',
          categorieId,
        })
      ).id;
    });

    it('est introuvable pour un visiteur anonyme', async () => {
      await api('get', `/article/${pendingId}`).expect(404);
    });

    it('est introuvable pour un autre citoyen (tiers)', async () => {
      await api('get', `/article/${pendingId}`, 'tiers').expect(404);
    });

    it.each(['auteur', 'redacteur', 'admin', 'super_admin'] as const)(
      'est visible par %s',
      async (who) => {
        const res = await api('get', `/article/${pendingId}`, who).expect(200);
        expect(res.body.statut).toBe('en_attente');
      },
    );

    it('ne figure pas dans la liste publique', async () => {
      const res = await api('get', '/article/published?q=E2E-ATTENTE').expect(
        200,
      );
      expect(res.body.meta.total).toBe(0);
    });

    it('répond 400 (et non 500) à un id non numérique', async () => {
      await api('get', '/article/abc').expect(400);
    });
  });

  describe('publication directe', () => {
    it('est réservée aux admins : un rédacteur est ramené à en_attente', async () => {
      const article = await createArticle('redacteur', {
        titre: 'E2E-REDAC',
        contenu: '<p>x</p>',
        categorieId,
        statut: 'publie',
      });
      const res = await api(
        'get',
        `/article/${article.id}`,
        'redacteur',
      ).expect(200);
      expect(res.body.statut).toBe('en_attente');
    });
  });

  describe('modification et publication', () => {
    let id: number;

    beforeEach(async () => {
      id = (
        await createArticle('auteur', {
          titre: 'E2E-EDIT',
          contenu: '<p>v1</p>',
          categorieId,
        })
      ).id;
    });

    it("interdit à un autre citoyen (tiers) de modifier l'article", async () => {
      await api('patch', `/article/${id}`, 'tiers')
        .send({ titre: 'Piraté' })
        .expect(403);
    });

    it('interdit toute modification anonyme', async () => {
      await api('patch', `/article/${id}`)
        .send({ titre: 'Piraté' })
        .expect(401);
    });

    it("ignore statut=publie envoyé par l'auteur : pas d'auto-publication", async () => {
      const res = await api('patch', `/article/${id}`, 'auteur')
        .send({ titre: 'E2E-EDIT-2', statut: 'publie' })
        .expect(200);
      expect(res.body.mode).toBe('direct');
      expect(res.body.article).toMatchObject({
        titre: 'E2E-EDIT-2',
        statut: 'en_attente',
      });
    });

    it('permet à l’auteur de changer la catégorie', async () => {
      const res = await api('patch', `/article/${id}`, 'auteur')
        .send({ categorieId: otherCategorieId })
        .expect(200);
      expect(res.body.article.categorie.id).toBe(otherCategorieId);
    });

    it('refuse une catégorie inexistante avec une 400', async () => {
      await api('patch', `/article/${id}`, 'auteur')
        .send({ categorieId: 999999 })
        .expect(400);
    });

    it('refuse de publier via PATCH /:id, même pour un admin', async () => {
      await api('patch', `/article/${id}`, 'admin')
        .send({ statut: 'publie' })
        .expect(400);
    });

    it('publie via /publish (admin), puis verrouille l’édition pour l’auteur', async () => {
      await api('patch', `/article/${id}/publish`, 'redacteur').expect(403);
      await api('patch', `/article/${id}/publish`, 'admin').expect(200);
      await api('get', `/article/${id}`).expect(200);
      await api('patch', `/article/${id}`, 'auteur')
        .send({ titre: 'Trop tard' })
        .expect(403);
    });
  });

  describe('assainissement du HTML', () => {
    it('retire script, handlers et liens javascript: à la création', async () => {
      const { id } = await createArticle('auteur', {
        titre: 'E2E-XSS',
        categorieId,
        contenu:
          '<p>ok</p><script>alert(1)</script><img src="/uploads/a.jpg" onerror="alert(2)"><a href="javascript:alert(3)">x</a>',
      });
      const res = await api('get', `/article/${id}`, 'auteur').expect(200);
      expect(res.body.contenu).not.toMatch(/script|onerror|javascript/i);
      expect(res.body.contenu).toContain('<p>ok</p>');
    });

    it('refuse un contenu qui est vide une fois nettoyé', async () => {
      await api('post', '/article', 'auteur')
        .send({ titre: 'T', contenu: '<script>alert(1)</script>', categorieId })
        .expect(400);
    });

    it('refuse un titre contenant des balises, mais garde le & intact', async () => {
      await api('post', '/article', 'auteur')
        .send({ titre: 'E2E <b>gras</b>', contenu: '<p>x</p>', categorieId })
        .expect(400);
      const { id } = await createArticle('auteur', {
        titre: 'E2E-Fish & Chips',
        contenu: '<p>x</p>',
        categorieId,
      });
      const res = await api('get', `/article/${id}`, 'auteur').expect(200);
      expect(res.body.titre).toBe('E2E-Fish & Chips');
    });

    it('conserve le souligné de l’éditeur', async () => {
      const { id } = await createArticle('auteur', {
        titre: 'E2E-UNDERLINE',
        contenu: '<p><u>souligné</u></p>',
        categorieId,
      });
      const res = await api('get', `/article/${id}`, 'auteur').expect(200);
      expect(res.body.contenu).toBe('<p><u>souligné</u></p>');
    });

    it('refuse une URL source ou image non http(s)', async () => {
      await api('post', '/article', 'auteur')
        .send({
          titre: 'T',
          contenu: '<p>x</p>',
          categorieId,
          source_link: 'javascript:alert(1)',
        })
        .expect(400);
      await api('post', '/article', 'auteur')
        .send({
          titre: 'T',
          contenu: '<p>x</p>',
          categorieId,
          image_couverture: 'javascript:alert(1)',
        })
        .expect(400);
    });
  });

  describe('utilisateurs', () => {
    it("pagine, et n'expose ni mot de passe ni token_auth", async () => {
      const res = await api('get', '/users/all?limit=2', 'admin').expect(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBeGreaterThanOrEqual(4);
      for (const user of res.body.data) {
        expect(user).not.toHaveProperty('password');
        expect(user).not.toHaveProperty('token_auth');
      }
    });

    it('cherche par email', async () => {
      const res = await api(
        'get',
        '/users/all?q=e2e-redacteur',
        'admin',
      ).expect(200);
      expect(res.body.data.map((u: { email: string }) => u.email)).toEqual([
        'e2e-redacteur@test.local',
      ]);
    });

    it('est interdit à un simple citoyen', async () => {
      await api('get', '/users/all', 'auteur').expect(403);
    });
  });

  describe('révisions d’un article publié', () => {
    let id: number;

    beforeAll(async () => {
      id = (
        await createArticle('admin', {
          titre: 'E2E-REVISION',
          contenu: '<p>version en ligne</p>',
          categorieId,
          statut: 'publie',
        })
      ).id;
    });

    it('une correction du staff laisse l’article en ligne inchangé', async () => {
      const res = await api('patch', `/article/${id}`, 'redacteur')
        .send({
          titre: 'E2E-REVISION corrigé',
          contenu: '<p>version corrigée</p>',
        })
        .expect(200);

      expect(res.body.mode).toBe('revision');
      expect(res.body.revision).toMatchObject({
        titre: 'E2E-REVISION corrigé',
      });
      // le public voit toujours l'original
      const live = await api('get', `/article/${id}`).expect(200);
      expect(live.body.titre).toBe('E2E-REVISION');
      expect(live.body.contenu).toBe('<p>version en ligne</p>');
    });

    it('une seconde correction met à jour la même révision', async () => {
      await api('patch', `/article/${id}`, 'redacteur')
        .send({ contenu: '<p>version corrigée, bis</p>' })
        .expect(200);
      const rev = await api(
        'get',
        `/article/${id}/revision`,
        'redacteur',
      ).expect(200);
      expect(rev.body.contenu).toBe('<p>version corrigée, bis</p>');
      expect(rev.body.author.name).toContain('redacteur');
    });

    it('la révision est invisible du citoyen et de l’anonyme', async () => {
      await api('get', `/article/${id}/revision`).expect(401);
      await api('get', `/article/${id}/revision`, 'auteur').expect(403);
    });

    it('un rédacteur ne peut pas appliquer la révision', async () => {
      await api('patch', `/article/${id}/revision/apply`, 'redacteur').expect(
        403,
      );
    });

    it('un admin l’applique : le public voit la correction, le rédacteur est crédité', async () => {
      const res = await api(
        'patch',
        `/article/${id}/revision/apply`,
        'admin',
      ).expect(200);
      expect(res.body.titre).toBe('E2E-REVISION corrigé');

      const live = await api('get', `/article/${id}`).expect(200);
      expect(live.body.contenu).toBe('<p>version corrigée, bis</p>');
      expect(live.body.credits.map((c: { role: string }) => c.role)).toContain(
        'Éditeur',
      );

      await api('get', `/article/${id}/revision`, 'admin').expect(404);
      await api('patch', `/article/${id}/revision/apply`, 'admin').expect(404);
    });

    it('un rédacteur peut abandonner sa révision', async () => {
      await api('patch', `/article/${id}`, 'redacteur')
        .send({ titre: 'E2E-ABANDON' })
        .expect(200);
      await api('delete', `/article/${id}/revision`, 'redacteur').expect(200);
      await api('get', `/article/${id}/revision`, 'admin').expect(404);
      const live = await api('get', `/article/${id}`).expect(200);
      expect(live.body.titre).toBe('E2E-REVISION corrigé');
    });

    it('l’historique, réservé aux admins, retrace tout, daté, avec l’auteur de chaque action', async () => {
      await api('get', `/article/${id}/history`, 'redacteur').expect(403);
      await api('get', `/article/${id}/history`, 'auteur').expect(403);
      await api('get', `/article/${id}/history`).expect(401);

      const res = await api('get', `/article/${id}/history`, 'admin').expect(
        200,
      );
      const actions = res.body.data
        .map((h: { action: string }) => h.action)
        .reverse();
      expect(actions).toEqual([
        'cree',
        'revision_enregistree',
        'revision_enregistree',
        'revision_appliquee',
        'revision_enregistree',
        'revision_abandonnee',
      ]);
      expect(res.body.data[0].created_at).toBeTruthy();
      expect(res.body.data[0].user.name).toBeTruthy();
      expect(JSON.stringify(res.body)).not.toMatch(/password|token_auth/);
    });
  });

  describe('programmation de la publication', () => {
    const inHours = (h: number) =>
      new Date(Date.now() + h * 3600_000).toISOString();

    it('un article programmé n’est visible ni du public ni de l’anonyme avant sa date', async () => {
      const { id } = await createArticle('admin', {
        titre: 'E2E-PLANIFIE',
        contenu: '<p>demain</p>',
        categorieId,
        statut: 'publie',
        scheduled_at: inHours(24),
      });

      await api('get', `/article/${id}`).expect(404);
      const list = await api('get', '/article/published?q=E2E-PLANIFIE').expect(
        200,
      );
      expect(list.body.meta.total).toBe(0);
      await api('get', `/article/${id}`, 'admin').expect(200);

      const stats = await api(
        'get',
        '/article/admin/stats',
        'redacteur',
      ).expect(200);
      expect(stats.body.planifie).toBeGreaterThanOrEqual(1);
    });

    it('refuse une date passée, au-delà de 7 jours, ou demandée par un citoyen', async () => {
      const base = { titre: 'E2E-DATE', contenu: '<p>x</p>', categorieId };
      await api('post', '/article', 'admin')
        .send({ ...base, scheduled_at: inHours(-1) })
        .expect(400);
      await api('post', '/article', 'admin')
        .send({ ...base, scheduled_at: inHours(24 * 8) })
        .expect(400);
      await api('post', '/article', 'auteur')
        .send({ ...base, scheduled_at: inHours(24) })
        .expect(403);
    });

    it('ne publie jamais dans le passé : une date dépassée devient « maintenant »', async () => {
      const scheduled = new Date(Date.now() + 3000);
      const { id } = await createArticle('redacteur', {
        titre: 'E2E-ANTIDATE',
        contenu: '<p>x</p>',
        categorieId,
        scheduled_at: scheduled.toISOString(),
      });

      // la validation arrive après la date visée
      await new Promise((resolve) => setTimeout(resolve, 3500));
      const res = await api('patch', `/article/${id}/publish`, 'admin').expect(
        200,
      );

      expect(new Date(res.body.published_at).getTime()).toBeGreaterThan(
        scheduled.getTime(),
      );
      expect(res.body.scheduled_at).toBeNull();
      await api('get', `/article/${id}`).expect(200);

      const hist = await api('get', `/article/${id}/history`, 'admin').expect(
        200,
      );
      const published = hist.body.data.find(
        (h: { action: string }) => h.action === 'publie',
      );
      expect(published.details.date_depassee).toBe(true);
    });
  });

  describe('suppression, refus et historique du citoyen', () => {
    it('seul un admin supprime ; la suppression est logique et tracée', async () => {
      const { id } = await createArticle('auteur', {
        titre: 'E2E-SUPPR',
        contenu: '<p>x</p>',
        categorieId,
      });

      await api('delete', `/article/${id}`).expect(401);
      await api('delete', `/article/${id}`, 'auteur').expect(403);
      await api('delete', `/article/${id}`, 'redacteur').expect(403);
      await api('delete', `/article/${id}`, 'admin').expect(200);
      await api('get', `/article/${id}`, 'admin').expect(410);
      await api('delete', `/article/${id}`, 'admin').expect(410);

      const hist = await api('get', `/article/${id}/history`, 'admin').expect(
        200,
      );
      expect(hist.body.data[0].action).toBe('supprime');
    });

    it('le citoyen voit ses contributions : titre, date et statut, rien d’autre', async () => {
      const res = await api('get', '/article/mine?limit=100', 'auteur').expect(
        200,
      );
      const byTitle = Object.fromEntries(
        res.body.data.map((a: { titre: string; statut: string }) => [
          a.titre,
          a.statut,
        ]),
      );

      expect(byTitle['E2E-SUPPR']).toBe('refuse_ou_supprime');
      expect(byTitle['E2E-ATTENTE']).toBe('en_attente');
      for (const item of res.body.data) {
        expect(Object.keys(item).sort()).toEqual([
          'date',
          'id',
          'statut',
          'titre',
        ]);
      }
    });

    it('un citoyen ne voit pas les contributions des autres', async () => {
      const res = await api(
        'get',
        '/article/mine?limit=100',
        'tiers',
      ).expect(200);
      expect(
        res.body.data.map((a: { titre: string }) => a.titre),
      ).not.toContain('E2E-ATTENTE');
      await api('get', '/article/mine').expect(401);
    });

    it('un article publié puis approuvé apparaît « approuvé »', async () => {
      const { id } = await createArticle('auteur', {
        titre: 'E2E-APPROUVE',
        contenu: '<p>x</p>',
        categorieId,
      });
      await api('patch', `/article/${id}/publish`, 'admin').expect(200);
      const res = await api('get', '/article/mine?limit=100', 'auteur').expect(
        200,
      );
      expect(
        res.body.data.find((a: { id: number }) => a.id === id).statut,
      ).toBe('approuve');
    });

    it('un admin peut dépublier ; un rédacteur non', async () => {
      const { id } = await createArticle('admin', {
        titre: 'E2E-DEPUB',
        contenu: '<p>x</p>',
        categorieId,
        statut: 'publie',
      });
      await api('patch', `/article/${id}/unpublish`, 'redacteur').expect(403);
      await api('patch', `/article/${id}/unpublish`, 'admin').expect(200);
      await api('get', `/article/${id}`).expect(404);
    });
  });

  describe('anonymat', () => {
    it('masque l’auteur au public et au rédacteur, le révèle aux admins', async () => {
      const { id } = await createArticle('auteur', {
        titre: 'E2E-ANONYME',
        contenu: '<p>x</p>',
        categorieId,
        is_anonymous: true,
      });
      await api('patch', `/article/${id}/publish`, 'admin').expect(200);

      const asPublic = await api('get', `/article/${id}`).expect(200);
      expect(asPublic.body.credits).toEqual([
        { role: 'Auteur', name: 'Citoyen Anonyme' },
      ]);

      const asEditor = await api('get', `/article/${id}`, 'redacteur').expect(
        200,
      );
      expect(asEditor.body.credits[0].name).toBe('Citoyen Anonyme');

      const asAdmin = await api('get', `/article/${id}`, 'admin').expect(200);
      expect(asAdmin.body.credits[0]).toMatchObject({
        name: 'E2E utilisateur',
        anonymous: true,
      });

      const asSuperAdmin = await api(
        'get',
        `/article/${id}`,
        'super_admin',
      ).expect(200);
      expect(asSuperAdmin.body.credits[0]).toMatchObject({
        name: 'E2E utilisateur',
        anonymous: true,
      });

      const list = await api(
        'get',
        '/article/admin/all?q=E2E-ANONYME',
        'redacteur',
      ).expect(200);
      expect(JSON.stringify(list.body)).not.toContain('E2E utilisateur');
    });

    it('un admin retire le nom d’un auteur identifié sans supprimer l’article', async () => {
      const { id } = await createArticle('auteur', {
        titre: 'E2E-RGPD',
        contenu: '<p>x</p>',
        categorieId,
      });
      await api('patch', `/article/${id}/publish`, 'admin').expect(200);
      expect(
        (await api('get', `/article/${id}`).expect(200)).body.credits[0].name,
      ).toBe('E2E utilisateur');

      await api('patch', `/article/${id}/anonymize`, 'redacteur').expect(403);
      await api('patch', `/article/${id}/anonymize`, 'admin').expect(200);

      const after = await api('get', `/article/${id}`).expect(200);
      expect(after.body.credits).toEqual([
        { role: 'Auteur', name: 'Citoyen Anonyme' },
      ]);
      await api('patch', `/article/${id}/anonymize`, 'admin').expect(409);
    });
  });

  describe('vérification d’un compte citoyen', () => {
    const password = 'E2e-Passw0rd!-Long-2026';
    const random2 = () => String(Math.floor(10 + Math.random() * 90));
    let userId: number;

    beforeAll(async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          username: 'e2e-nouveau',
          email: 'e2e-nouveau@test.local',
          password,
          confirmPassword: password,
        })
        .expect((res) => {
          if (![201, 409].includes(res.status))
            throw new Error(`register: ${res.status}`);
        });
      cookies.nouveau = await login('e2e-nouveau@test.local', password);
      const found = await api('get', '/users/all?q=e2e-nouveau', 'admin').expect(
        200,
      );
      userId = found.body.data[0].id;
      await api('patch', `/users/${userId}/verification`, 'admin')
        .send({ verified: false })
        .expect(200);
    });

    const article = () => ({
      titre: 'E2E-NOUVEAU',
      contenu: '<p>x</p>',
      categorieId,
    });

    it('un citoyen fraîchement inscrit ne peut pas proposer d’article', async () => {
      await api('post', '/article', 'nouveau').send(article()).expect(403);
    });

    it('seuls les admins vérifient un compte', async () => {
      await api('patch', `/users/${userId}/verification`, 'redacteur')
        .send({ verified: true })
        .expect(403);
      await api('patch', `/users/${userId}/verification`, 'nouveau')
        .send({ verified: true })
        .expect(403);
      await api('patch', `/users/${userId}/verification`, 'admin')
        .send({ verified: 'oui' })
        .expect(400);
    });

    it('une fois vérifié par un admin, il peut proposer (en attente de modération)', async () => {
      await api('patch', `/users/${userId}/verification`, 'admin')
        .send({ verified: true })
        .expect(200);
      const res = await api('post', '/article', 'nouveau')
        .send(article())
        .expect(201);
      expect(res.body.statut).toBe('en_attente');
    });

    it('changer de numéro de téléphone annule la vérification', async () => {
      await api('patch', '/profile/me', 'nouveau')
        .send({ tel: `+33 6 12 34 ${random2()} ${random2()}` })
        .expect(200);
      await api('post', '/article', 'nouveau').send(article()).expect(403);
    });
  });

  describe('graines de développement', () => {
    it('le seed est rejouable sans erreur', async () => {
      const tables = app.get(TableSeedService);
      const admins = app.get(AdminSeedService);
      await expect(
        (async () => {
          await tables.seed();
          await admins.seed();
          await tables.seed();
          await admins.seed();
        })(),
      ).resolves.toBeUndefined();
    });
  });

  it('répond 404 (JSON propre) sur une route inconnue', async () => {
    const res = await api('get', '/route-inexistante').expect(404);
    expect(res.body).toHaveProperty('statusCode', 404);
  });
});
