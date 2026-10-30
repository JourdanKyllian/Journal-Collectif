import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ArticleService } from './article.service';
import { Article, ArticleStatus } from './entities/article.entity';
import { ArticleHistory } from './entities/article-history.entity';
import { ArticleRevision } from './entities/article-revision.entity';
import { Users } from '../users/entities/user.entity';
import { Categorie } from '../categorie/entities/categorie.entity';
import { AuteurArticle } from '../auteur-article/entities/auteur-article.entity/auteur-article.entity';
import { TenantContext } from '../tenant/tenant.context';

type CreateDto = Parameters<ArticleService['create']>[0];
type Fn = (...args: unknown[]) => Promise<unknown>;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

describe('ArticleService', () => {
  let service: ArticleService;

  const articles = {
    create: jest.fn().mockImplementation((dto: unknown) => dto),
    save: jest
      .fn()
      .mockImplementation((a: unknown) =>
        Promise.resolve({ id: 99, ...(a as object) }),
      ),
    findOne: jest.fn<Fn>(),
    findAndCount: jest.fn<Fn>(),
    count: jest.fn<Fn>(),
    update: jest.fn<Fn>(),
    softDelete: jest.fn<Fn>(),
  };
  const auteurs = {
    create: jest.fn().mockImplementation((dto: unknown) => dto),
    save: jest.fn<Fn>().mockResolvedValue({}),
    findOne: jest.fn<Fn>(),
    update: jest.fn<Fn>(),
  };
  const users = { findOne: jest.fn<Fn>() };
  const categories = { findOne: jest.fn<Fn>() };
  const revisions = {
    create: jest.fn().mockImplementation((dto: unknown) => dto),
    save: jest
      .fn()
      .mockImplementation((r: unknown) =>
        Promise.resolve({ id: 7, ...(r as object) }),
      ),
    findOne: jest.fn<Fn>(),
  };
  const history = {
    create: jest.fn().mockImplementation((dto: unknown) => dto),
    save: jest.fn<Fn>().mockResolvedValue({}),
    findAndCount: jest.fn<Fn>(),
  };

  const loggedActions = () =>
    history.create.mock.calls.map(
      (call) => (call[0] as { action: string }).action,
    );

  const stored = (overrides: object = {}) => ({
    id: 5,
    titre: 'Original',
    contenu: '<p>v1</p>',
    image_couverture: null,
    source_link: null,
    statut: ArticleStatus.EN_ATTENTE,
    published_at: null,
    scheduled_at: null,
    is_delete: false,
    deleted_at: null,
    categorie: { id: 1 },
    auteursArticles: [{ userId: 7, role_contribution: 'Auteur' }],
    ...overrides,
  });

  const verifiedUser = {
    id: 7,
    is_phone_verified: true,
    profile: { firstname: 'Jean', lastname: 'Dupont' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: TenantContext, useValue: { journalId: 1 } },
        ArticleService,
        { provide: getRepositoryToken(Article), useValue: articles },
        { provide: getRepositoryToken(AuteurArticle), useValue: auteurs },
        { provide: getRepositoryToken(Users), useValue: users },
        { provide: getRepositoryToken(Categorie), useValue: categories },
        { provide: getRepositoryToken(ArticleRevision), useValue: revisions },
        { provide: getRepositoryToken(ArticleHistory), useValue: history },
      ],
    }).compile();

    service = module.get(ArticleService);
    categories.findOne.mockResolvedValue({ id: 1, libelle: 'Tech' });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const dto = (extra: object = {}) =>
      ({
        titre: 'T',
        contenu: '<p>x</p>',
        categorieId: 1,
        ...extra,
      }) as CreateDto;

    it('refuse un citoyen dont le compte n’est pas vérifié', async () => {
      users.findOne.mockResolvedValue({ id: 2, is_phone_verified: false });
      await expect(service.create(dto(), 2, 'utilisateur')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('n’exige pas la vérification du téléphone pour le staff', async () => {
      users.findOne.mockResolvedValue({ id: 3, is_phone_verified: false });
      const result = await service.create(dto(), 3, 'redacteur');
      expect(result.statut).toBe(ArticleStatus.BROUILLON);
    });

    it('place un citoyen en attente, même s’il demande la publication', async () => {
      users.findOne.mockResolvedValue(verifiedUser);
      const result = await service.create(
        dto({ statut: ArticleStatus.PUBLIE }),
        7,
        'utilisateur',
      );
      expect(result.statut).toBe(ArticleStatus.EN_ATTENTE);
      expect(result.published_at).toBeNull();
    });

    it('ramène à « en attente » la publication directe d’un rédacteur', async () => {
      users.findOne.mockResolvedValue(verifiedUser);
      const result = await service.create(
        dto({ statut: ArticleStatus.PUBLIE }),
        7,
        'redacteur',
      );
      expect(result.statut).toBe(ArticleStatus.EN_ATTENTE);
    });

    it.each(['admin', 'super_admin'])(
      'laisse %s publier directement',
      async (role) => {
        users.findOne.mockResolvedValue(verifiedUser);
        const result = await service.create(
          dto({ statut: ArticleStatus.PUBLIE }),
          7,
          role,
        );
        expect(result.statut).toBe(ArticleStatus.PUBLIE);
        expect(result.published_at).toBeInstanceOf(Date);
      },
    );

    it('assainit le HTML du contenu', async () => {
      users.findOne.mockResolvedValue(verifiedUser);
      const result = await service.create(
        dto({
          contenu:
            '<p>ok</p><script>x()</script><img src="/uploads/a.jpg" onerror="x()">',
        }),
        7,
        'utilisateur',
      );
      expect(result.contenu).toBe('<p>ok</p><img src="/uploads/a.jpg">');
    });

    it('rejette un contenu vide une fois nettoyé', async () => {
      users.findOne.mockResolvedValue(verifiedUser);
      await expect(
        service.create(
          dto({ contenu: '<script>x()</script>' }),
          7,
          'utilisateur',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejette une catégorie inexistante', async () => {
      users.findOne.mockResolvedValue(verifiedUser);
      categories.findOne.mockResolvedValue(null);
      await expect(service.create(dto(), 7, 'utilisateur')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('trace la création et crédite l’auteur anonyme sous « Citoyen Anonyme »', async () => {
      users.findOne.mockResolvedValue(verifiedUser);
      const result = await service.create(
        dto({ is_anonymous: true }),
        7,
        'utilisateur',
      );
      expect(result.credits).toEqual([
        { role: 'Auteur', name: 'Citoyen Anonyme' },
      ]);
      expect(auteurs.create).toHaveBeenCalledWith(
        expect.objectContaining({ role_contribution: 'Auteur Anonyme' }),
      );
      expect(loggedActions()).toEqual(['cree']);
    });

    describe('programmation', () => {
      it('est réservée au staff', async () => {
        users.findOne.mockResolvedValue(verifiedUser);
        const when = new Date(Date.now() + DAY).toISOString();
        await expect(
          service.create(dto({ scheduled_at: when }), 7, 'utilisateur'),
        ).rejects.toThrow(ForbiddenException);
      });

      it.each([
        ['dans le passé', () => new Date(Date.now() - HOUR).toISOString()],
        [
          'au-delà de 7 jours',
          () => new Date(Date.now() + 8 * DAY).toISOString(),
        ],
        ['invalide', () => 'pas-une-date'],
      ])('refuse une date %s', async (_label, make) => {
        users.findOne.mockResolvedValue(verifiedUser);
        await expect(
          service.create(dto({ scheduled_at: make() }), 7, 'admin'),
        ).rejects.toThrow(BadRequestException);
      });

      it('pose la date programmée comme date de publication d’un article publié par un admin', async () => {
        users.findOne.mockResolvedValue(verifiedUser);
        const when = new Date(Date.now() + 2 * DAY);
        const result = await service.create(
          dto({
            statut: ArticleStatus.PUBLIE,
            scheduled_at: when.toISOString(),
          }),
          7,
          'admin',
        );
        expect((result.published_at as Date).getTime()).toBe(when.getTime());
        expect(result.scheduled_at).toBeNull();
      });

      it('conserve la date sur un brouillon sans publier', async () => {
        users.findOne.mockResolvedValue(verifiedUser);
        const when = new Date(Date.now() + 2 * DAY);
        const result = await service.create(
          dto({ scheduled_at: when.toISOString() }),
          7,
          'redacteur',
        );
        expect(result.published_at).toBeNull();
        expect((result.scheduled_at as Date).getTime()).toBe(when.getTime());
      });
    });
  });

  describe('update', () => {
    it('refuse à un citoyen de modifier l’article d’un autre', async () => {
      articles.findOne.mockResolvedValue(stored());
      await expect(
        service.update(5, { titre: 'Piraté' }, 8, 'utilisateur'),
      ).rejects.toThrow(ForbiddenException);
      expect(articles.save).not.toHaveBeenCalled();
    });

    it('refuse à l’auteur de modifier son article une fois publié', async () => {
      articles.findOne.mockResolvedValue(
        stored({ statut: ArticleStatus.PUBLIE }),
      );
      await expect(
        service.update(5, { titre: 'Retouche' }, 7, 'utilisateur'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('laisse l’auteur modifier son article en attente, sans changer le statut', async () => {
      articles.findOne
        .mockResolvedValueOnce(stored())
        .mockResolvedValueOnce(stored({ titre: 'Nouveau' }));

      const result = await service.update(
        5,
        { titre: 'Nouveau', statut: ArticleStatus.PUBLIE },
        7,
        'utilisateur',
      );

      const saved = articles.save.mock.calls[0][0] as {
        statut: ArticleStatus;
        titre: string;
      };
      expect(saved.statut).toBe(ArticleStatus.EN_ATTENTE);
      expect(saved.titre).toBe('Nouveau');
      expect(result.mode).toBe('direct');
      expect(loggedActions()).toEqual(['modifie']);
    });

    it('interdit à un citoyen de programmer une publication', async () => {
      articles.findOne.mockResolvedValue(stored());
      await expect(
        service.update(
          5,
          {
            scheduled_at: new Date(Date.now() + DAY).toISOString(),
          },
          7,
          'utilisateur',
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('interdit de publier via update, même pour un admin', async () => {
      articles.findOne.mockResolvedValue(stored());
      await expect(
        service.update(5, { statut: ArticleStatus.PUBLIE }, 1, 'admin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('interdit d’envoyer à la corbeille via update', async () => {
      articles.findOne.mockResolvedValue(stored());
      await expect(
        service.update(5, { statut: ArticleStatus.CORBEILLE }, 1, 'admin'),
      ).rejects.toThrow(BadRequestException);
    });

    it('renvoie 410 pour un article supprimé', async () => {
      articles.findOne.mockResolvedValue(stored({ is_delete: true }));
      await expect(
        service.update(5, { titre: 'x' }, 1, 'admin'),
      ).rejects.toThrow(GoneException);
    });

    it('modifie directement un article non publié pour le staff et le crédite « Éditeur »', async () => {
      articles.findOne
        .mockResolvedValueOnce(stored())
        .mockResolvedValueOnce(stored());
      auteurs.findOne.mockResolvedValue(null);

      await service.update(5, { titre: 'Corrigé' }, 1, 'redacteur');

      const saved = articles.save.mock.calls[0][0] as object;
      expect(saved).not.toHaveProperty('auteursArticles');
      expect(auteurs.create).toHaveBeenCalledWith(
        expect.objectContaining({ role_contribution: 'Éditeur' }),
      );
    });

    describe('article publié (révision)', () => {
      const published = () => stored({ statut: ArticleStatus.PUBLIE });

      it('crée une révision sans toucher à l’article en ligne', async () => {
        articles.findOne
          .mockResolvedValueOnce(published())
          .mockResolvedValueOnce(published());
        revisions.findOne.mockResolvedValue(null);

        const result = await service.update(
          5,
          { titre: 'Titre corrigé' },
          3,
          'redacteur',
        );

        expect(articles.save).not.toHaveBeenCalled();
        expect(result.mode).toBe('revision');
        expect(result.revision).toMatchObject({
          articleId: 5,
          titre: 'Titre corrigé',
          contenu: '<p>v1</p>',
          authorId: 3,
        });
        expect(loggedActions()).toEqual(['revision_enregistree']);
      });

      it('met à jour la révision en cours plutôt que d’en créer une seconde', async () => {
        articles.findOne
          .mockResolvedValueOnce(published())
          .mockResolvedValueOnce(published());
        revisions.findOne.mockResolvedValue({
          id: 7,
          articleId: 5,
          titre: 'Original',
          contenu: '<p>v1</p>',
          image_couverture: null,
          source_link: null,
          categorieId: 1,
        });

        await service.update(5, { contenu: '<p>v2</p>' }, 3, 'redacteur');

        expect(revisions.create).not.toHaveBeenCalled();
        expect(revisions.save).toHaveBeenCalledWith(
          expect.objectContaining({ id: 7, contenu: '<p>v2</p>' }),
        );
      });

      it('refuse de changer le statut ou de programmer un article publié', async () => {
        articles.findOne.mockResolvedValue(published());
        await expect(
          service.update(5, { statut: ArticleStatus.BROUILLON }, 1, 'admin'),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.update(
            5,
            {
              scheduled_at: new Date(Date.now() + DAY).toISOString(),
            },
            1,
            'admin',
          ),
        ).rejects.toThrow(BadRequestException);
      });
    });
  });

  describe('applyRevision', () => {
    const revision = {
      id: 7,
      articleId: 5,
      authorId: 3,
      titre: 'Titre corrigé',
      contenu: '<p>v2</p>',
      image_couverture: null,
      source_link: null,
      categorieId: 1,
    };

    it('remplace l’article en ligne, crédite l’éditeur et clôt la révision', async () => {
      articles.findOne
        .mockResolvedValueOnce(stored({ statut: ArticleStatus.PUBLIE }))
        .mockResolvedValueOnce(stored({ statut: ArticleStatus.PUBLIE }));
      revisions.findOne.mockResolvedValue({ ...revision });
      auteurs.findOne.mockResolvedValue(null);

      await service.applyRevision(5, { userId: 1, role: 'admin' });

      expect(articles.save).toHaveBeenCalledWith(
        expect.objectContaining({
          titre: 'Titre corrigé',
          contenu: '<p>v2</p>',
        }),
      );
      expect(revisions.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'appliquee' }),
      );
      expect(auteurs.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 3, role_contribution: 'Éditeur' }),
      );
      expect(loggedActions()).toEqual(['revision_appliquee']);
    });

    it('est réservée aux admins', async () => {
      await expect(
        service.applyRevision(5, { userId: 3, role: 'redacteur' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('renvoie 404 sans révision en cours', async () => {
      articles.findOne.mockResolvedValue(
        stored({ statut: ArticleStatus.PUBLIE }),
      );
      revisions.findOne.mockResolvedValue(null);
      await expect(
        service.applyRevision(5, { userId: 1, role: 'admin' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('publishArticle - jamais antidaté', () => {
    const admin = { userId: 1, role: 'admin' };

    it('publie maintenant sans date programmée', async () => {
      articles.findOne
        .mockResolvedValueOnce(stored())
        .mockResolvedValueOnce(stored());
      const before = Date.now();

      await service.publishArticle(5, admin);

      const saved = articles.save.mock.calls[0][0] as {
        published_at: Date;
        statut: ArticleStatus;
      };
      expect(saved.statut).toBe(ArticleStatus.PUBLIE);
      expect(saved.published_at.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('respecte une date programmée encore à venir', async () => {
      const when = new Date(Date.now() + 2 * DAY);
      articles.findOne
        .mockResolvedValueOnce(stored({ scheduled_at: when }))
        .mockResolvedValueOnce(stored());

      await service.publishArticle(5, admin);

      const saved = articles.save.mock.calls[0][0] as {
        published_at: Date;
        scheduled_at: unknown;
      };
      expect(saved.published_at.getTime()).toBe(when.getTime());
      expect(saved.scheduled_at).toBeNull();
    });

    it('ne reprend pas une date déjà dépassée : publié maintenant, et la trace le dit', async () => {
      const yesterday = new Date(Date.now() - DAY);
      articles.findOne
        .mockResolvedValueOnce(stored({ scheduled_at: yesterday }))
        .mockResolvedValueOnce(stored());
      const before = Date.now();

      await service.publishArticle(5, admin);

      const saved = articles.save.mock.calls[0][0] as { published_at: Date };
      expect(saved.published_at.getTime()).toBeGreaterThanOrEqual(before);
      expect(history.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'publie',
          details: expect.objectContaining({ date_depassee: true }),
        }),
      );
    });

    it('refuse de republier un article déjà publié', async () => {
      articles.findOne.mockResolvedValue(
        stored({ statut: ArticleStatus.PUBLIE }),
      );
      await expect(service.publishArticle(5, admin)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('remove / unpublish / anonymize - droits', () => {
    it.each(['redacteur', 'utilisateur'])(
      '%s ne peut pas supprimer',
      async (role) => {
        await expect(service.remove(5, { userId: 3, role })).rejects.toThrow(
          ForbiddenException,
        );
      },
    );

    it('un admin supprime : corbeille, drapeau et suppression logique, tracés', async () => {
      articles.findOne.mockResolvedValue(
        stored({ statut: ArticleStatus.PUBLIE }),
      );

      await service.remove(5, { userId: 1, role: 'admin' });

      expect(articles.update).toHaveBeenCalledWith(5, {
        statut: ArticleStatus.CORBEILLE,
        is_delete: true,
      });
      expect(articles.softDelete).toHaveBeenCalledWith(5);
      expect(loggedActions()).toEqual(['supprime']);
    });

    it('un admin ne peut pas supprimer deux fois (410)', async () => {
      articles.findOne.mockResolvedValue(stored({ is_delete: true }));
      await expect(
        service.remove(5, { userId: 1, role: 'admin' }),
      ).rejects.toThrow(GoneException);
    });

    it('dépublier est réservé aux admins', async () => {
      await expect(
        service.unpublishArticle(5, { userId: 3, role: 'redacteur' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('anonymiser bascule l’auteur en « Auteur Anonyme »', async () => {
      articles.findOne
        .mockResolvedValueOnce(stored())
        .mockResolvedValueOnce(stored());

      await service.anonymize(5, { userId: 1, role: 'admin' });

      expect(auteurs.update).toHaveBeenCalledWith(
        { articleId: 5, role_contribution: 'Auteur' },
        { role_contribution: 'Auteur Anonyme' },
      );
      expect(loggedActions()).toEqual(['anonymise']);
    });
  });

  describe('findOne - visibilité', () => {
    const pending = () => stored();

    it('cache un article en attente au public et aux autres citoyens (404)', async () => {
      articles.findOne.mockResolvedValue(pending());
      await expect(service.findOne(5)).rejects.toThrow(NotFoundException);
      await expect(
        service.findOne(5, { userId: 8, role: 'utilisateur' }),
      ).rejects.toThrow(NotFoundException);
    });

    it.each([
      ['son auteur', { userId: 7, role: 'utilisateur' }],
      ['un rédacteur', { userId: 1, role: 'redacteur' }],
      ['un admin', { userId: 1, role: 'admin' }],
    ])('montre un article en attente à %s', async (_label, viewer) => {
      articles.findOne.mockResolvedValue(pending());
      await expect(service.findOne(5, viewer)).resolves.toMatchObject({
        id: 5,
      });
    });

    it('cache un article publié dont la date n’est pas atteinte', async () => {
      articles.findOne.mockResolvedValue(
        stored({
          statut: ArticleStatus.PUBLIE,
          published_at: new Date(Date.now() + DAY),
        }),
      );
      await expect(service.findOne(5)).rejects.toThrow(NotFoundException);
    });

    it('montre un article publié, y compris sans date (anciennes données)', async () => {
      articles.findOne.mockResolvedValue(
        stored({ statut: ArticleStatus.PUBLIE }),
      );
      await expect(service.findOne(5)).resolves.toMatchObject({ id: 5 });
    });

    it('renvoie 410 pour un article supprimé et 404 pour un inconnu', async () => {
      articles.findOne.mockResolvedValueOnce(stored({ is_delete: true }));
      await expect(service.findOne(5)).rejects.toThrow(GoneException);
      articles.findOne.mockResolvedValueOnce(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('anonymat', () => {
    const anonymous = () =>
      stored({
        statut: ArticleStatus.PUBLIE,
        auteursArticles: [
          {
            userId: 7,
            role_contribution: 'Auteur Anonyme',
            user: { profile: { firstname: 'Jean', lastname: 'Dupont' } },
          },
        ],
      });

    it('masque l’identité au public et au rédacteur', async () => {
      articles.findOne.mockResolvedValue(anonymous());
      const asPublic = await service.findOne(5);
      expect(asPublic.credits).toEqual([
        { role: 'Auteur', name: 'Citoyen Anonyme' },
      ]);

      const asEditor = await service.findOne(5, {
        userId: 1,
        role: 'redacteur',
      });
      expect(asEditor.credits[0].name).toBe('Citoyen Anonyme');
    });

    it('révèle l’identité aux admins, en la signalant comme anonyme', async () => {
      articles.findOne.mockResolvedValue(anonymous());
      const result = await service.findOne(5, { userId: 1, role: 'admin' });
      expect(result.credits).toEqual([
        { role: 'Auteur', name: 'Jean Dupont', anonymous: true },
      ]);
    });
  });

  describe('listes', () => {
    const query = { page: 2, limit: 10 };

    it('articles publiés : pagine, et accepte les dates absentes ou atteintes', async () => {
      articles.findAndCount.mockResolvedValue([
        [{ id: 1, auteursArticles: [] }],
        25,
      ]);

      const result = await service.findAllPublished(query);

      const options = articles.findAndCount.mock.calls[0][0] as {
        skip: number;
        take: number;
        where: unknown[];
      };
      expect(options).toMatchObject({ skip: 10, take: 10 });
      expect(options.where).toHaveLength(2);
      expect(result.meta).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
      });
    });

    it('échappe les jokers SQL de la recherche', async () => {
      articles.findAndCount.mockResolvedValue([[], 0]);
      await service.findAllPublished({ ...query, q: '100%' });
      const options = articles.findAndCount.mock.calls[0][0] as {
        where: Array<{ titre: { _value: string } }>;
      };
      expect(options.where[0].titre._value).toBe('%100\\%%');
    });

    it('historique d’un citoyen : titre, date et statut, supprimé = « refusé ou supprimé »', async () => {
      const created = new Date('2026-01-01');
      articles.findAndCount.mockResolvedValue([
        [
          {
            id: 1,
            titre: 'A',
            statut: ArticleStatus.PUBLIE,
            published_at: new Date('2026-02-01'),
            created_at: created,
            deleted_at: null,
            contenu: 'secret',
          },
          {
            id: 2,
            titre: 'B',
            statut: ArticleStatus.EN_ATTENTE,
            published_at: null,
            created_at: created,
            deleted_at: null,
          },
          {
            id: 3,
            titre: 'C',
            statut: ArticleStatus.CORBEILLE,
            published_at: null,
            created_at: created,
            deleted_at: new Date(),
          },
        ],
        3,
      ]);

      const result = await service.findMine(7, { page: 1, limit: 20 });

      expect(result.data.map((a) => a.statut)).toEqual([
        'approuve',
        'en_attente',
        'refuse_ou_supprime',
      ]);
      expect(Object.keys(result.data[0]).sort()).toEqual([
        'date',
        'id',
        'statut',
        'titre',
      ]);
    });

    it('statistiques : compteurs par statut', async () => {
      articles.count
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(1);
      await expect(service.adminStats()).resolves.toEqual({
        brouillon: 2,
        en_attente: 3,
        publie: 10,
        planifie: 1,
        total: 16,
      });
    });

    it('historique d’audit : ne renvoie ni mot de passe ni e-mail brut inutile', async () => {
      articles.findOne.mockResolvedValue(stored());
      history.findAndCount.mockResolvedValue([
        [
          {
            id: 1,
            action: 'cree',
            details: null,
            created_at: new Date(),
            userId: 1,
            user: {
              id: 1,
              password: 'hash',
              profile: { firstname: 'A', lastname: 'B' },
            },
          },
        ],
        1,
      ]);

      const result = await service.getHistory(5, { page: 1, limit: 20 });

      expect(result.data[0].user).toEqual({ id: 1, name: 'A B' });
      expect(JSON.stringify(result)).not.toContain('hash');
    });
  });
});
