import { Test, TestingModule } from '@nestjs/testing';
import { ArticleService } from './article.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Article, ArticleStatus } from './entities/article.entity';
import { Users } from '../users/entities/user.entity';
import { Categorie } from '../categorie/entities/categorie.entity';
import { AuteurArticle } from '../auteur-article/entities/auteur-article.entity/auteur-article.entity';
import {
  ForbiddenException,
  GoneException,
  NotFoundException,
} from '@nestjs/common';
import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';

type CreateDto = Parameters<ArticleService['create']>[0];

describe('ArticleService - Gestion du contenu et règles SEO', () => {
  let service: ArticleService;

  const mockUserRepository = {
    findOne: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };

  const mockCategoryRepository = {
    findOne: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };

  const mockArticleRepository = {
    create: jest.fn().mockImplementation((dto: unknown) => dto),
    save: jest
      .fn()
      .mockImplementation((article: unknown) =>
        Promise.resolve({ id: 99, ...(article as object) }),
      ),
    findOne: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    find: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
    softRemove: jest.fn(),
  };

  const mockAuteurRepository = {
    create: jest.fn().mockImplementation((dto: unknown) => dto),
    save: jest.fn().mockImplementation(() => Promise.resolve({})),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: getRepositoryToken(Article),
          useValue: mockArticleRepository,
        },
        {
          provide: getRepositoryToken(Categorie),
          useValue: mockCategoryRepository,
        },
        {
          provide: getRepositoryToken(AuteurArticle),
          useValue: mockAuteurRepository,
        },
        { provide: getRepositoryToken(Users), useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('devrait rejeter la création si le profil est incomplet', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 2,
        is_phone_verified: false,
      });

      const dto = { titre: 'Titre', categoryId: 1 } as unknown as CreateDto;

      await expect(service.create(dto, 2, 'journaliste')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('devrait forcer le statut "en_attente" si un journaliste tente de publier en direct', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 2,
        is_phone_verified: true,
        profile: { firstname: 'K', lastname: 'L' },
      });

      mockCategoryRepository.findOne.mockResolvedValue({
        id: 1,
        libelle: 'Tech',
      });

      const dto = {
        titre: 'Scoop',
        categoryId: 1,
        statut: ArticleStatus.PUBLIE,
      } as unknown as CreateDto;

      const result = await service.create(dto, 2, 'journaliste');

      expect(result.statut).toBe(ArticleStatus.EN_ATTENTE);
      expect(result.published_at).toBeNull();
    });

    it("devrait respecter le choix de l'Admin s'il décide de sauvegarder un simple BROUILLON", async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        is_phone_verified: true,
        profile: { firstname: 'Admin', lastname: 'Boss' },
      });

      mockCategoryRepository.findOne.mockResolvedValue({
        id: 1,
        libelle: 'Tech',
      });

      const dto = {
        titre: 'Article pas fini',
        categoryId: 1,
        statut: ArticleStatus.BROUILLON,
      } as unknown as CreateDto;

      const result = await service.create(dto, 1, 'Admin');

      expect(result.statut).toBe(ArticleStatus.BROUILLON);
      expect(result.published_at).toBeNull();
    });

    it("devrait respecter le choix de l'Admin s'il décide de PUBLIER directement", async () => {
      mockUserRepository.findOne.mockResolvedValue({
        id: 1,
        is_phone_verified: true,
        profile: { firstname: 'Admin', lastname: 'Boss' },
      });

      mockCategoryRepository.findOne.mockResolvedValue({
        id: 1,
        libelle: 'Tech',
      });

      const dto = {
        titre: 'Annonce importante',
        categoryId: 1,
        statut: ArticleStatus.PUBLIE,
      } as unknown as CreateDto;

      const result = await service.create(dto, 1, 'Admin');

      expect(result.statut).toBe(ArticleStatus.PUBLIE);
      expect(result.published_at).toBeDefined();
    });
  });

  describe('findOne - Stratégie SEO HTTP 410', () => {
    it("devrait lever une NotFoundException (404) si l'article n'a jamais existé", async () => {
      mockArticleRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it("devrait lever une GoneException (410) si l'article a été supprimé (Soft Delete)", async () => {
      mockArticleRepository.findOne.mockResolvedValue({
        id: 1,
        titre: 'Article archivé',
        is_delete: true,
        deleted_at: new Date(),
      });

      await expect(service.findOne(1)).rejects.toThrow(GoneException);
    });

    it("devrait retourner l'article s'il existe et n'est pas supprimé", async () => {
      const validArticle = {
        id: 1,
        titre: 'Article valide',
        is_delete: false,
        deleted_at: null,
      };

      mockArticleRepository.findOne.mockResolvedValue(validArticle);

      const result = await service.findOne(1);

      expect(result).toEqual(validArticle);
    });
  });
});
