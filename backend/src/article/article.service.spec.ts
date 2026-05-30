import { Test, TestingModule } from '@nestjs/testing';
import { ArticleService } from './article.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Article, ArticleStatus } from './entities/article.entity';
import { Users } from '../users/entities/user.entity';
import { Category } from '../categorie/entities/categorie.entity';
import { AuteurArticle } from '../auteur-article/entities/auteur-article.entity/auteur-article.entity';
import { ForbiddenException } from '@nestjs/common';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Extrait le type attendu par ton service
type CreateDto = Parameters<ArticleService['create']>[0];

describe('ArticleService', () => {
  let service: ArticleService;

  // Fonctions renvoient des Promesses contenant "quelque chose" (unknown)
  const mockUserRepository = {
    findOne: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };

  const mockCategoryRepository = {
    findOne: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  };

  const mockArticleRepository = {
    // Utilise unknown pour les arguments
    create: jest.fn().mockImplementation((dto: unknown) => dto),
    save: jest
      .fn()
      .mockImplementation((article: unknown) =>
        Promise.resolve({ id: 99, ...(article as object) }),
      ),
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
          provide: getRepositoryToken(Category),
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

  // Profil incomplet
  it('devrait rejeter la création si le profil est incomplet', async () => {
    mockUserRepository.findOne.mockResolvedValue({
      id: 2,
      is_phone_verified: false,
    });

    // Utilise 'as unknown as CreateDto' pour bluffer ESLint proprement
    const dto = { titre: 'Titre', categoryId: 1 } as unknown as CreateDto;

    await expect(service.create(dto, 2, 'journaliste')).rejects.toThrow(
      ForbiddenException,
    );
  });

  // Journaliste fraudeur
  it('devrait forcer le statut "en_attente" si un journaliste tente de publier en direct', async () => {
    mockUserRepository.findOne.mockResolvedValue({
      id: 2,
      is_phone_verified: true,
      firstname: 'K',
      lastname: 'L',
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

  // Choix de l'Admin (Brouillon)
  it("devrait respecter le choix de l'Admin s'il décide de sauvegarder un simple BROUILLON", async () => {
    mockUserRepository.findOne.mockResolvedValue({
      id: 1,
      is_phone_verified: true,
      firstname: 'Admin',
      lastname: 'Boss',
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

  // Choix de l'Admin (Publication directe)
  it("devrait respecter le choix de l'Admin s'il décide de PUBLIER directement", async () => {
    mockUserRepository.findOne.mockResolvedValue({
      id: 1,
      is_phone_verified: true,
      firstname: 'Admin',
      lastname: 'Boss',
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
