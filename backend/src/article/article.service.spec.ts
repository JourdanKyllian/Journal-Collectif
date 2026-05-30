import { Test, TestingModule } from '@nestjs/testing';
import { ArticleService } from './article.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Article, ArticleStatus } from './entities/article.entity';
import { Users } from '../users/entities/user.entity';
import { Category } from '../categorie/entities/categorie.entity';
import { AuteurArticle } from '../auteur-article/entities/auteur-article.entity/auteur-article.entity';
import { ForbiddenException } from '@nestjs/common';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';

describe('ArticleService', () => {
  let service: ArticleService;
  
  const mockUserRepository = { findOne: jest.fn() as any };
  const mockCategoryRepository = { findOne: jest.fn() as any };
  
  const mockArticleRepository = {
    create: jest.fn().mockImplementation((dto: any) => dto),
    save: jest.fn().mockImplementation((article: any) => Promise.resolve({ id: 99, ...(article as object) })),
  };
  
  const mockAuteurRepository = {
    create: jest.fn().mockImplementation((dto: any) => dto),
    save: jest.fn().mockImplementation(async () => ({})), 
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        { provide: getRepositoryToken(Article), useValue: mockArticleRepository },
        { provide: getRepositoryToken(Category), useValue: mockCategoryRepository },
        { provide: getRepositoryToken(AuteurArticle), useValue: mockAuteurRepository },
        { provide: getRepositoryToken(Users), useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
  });

  // Profil incomplet
  it('devrait rejeter la création si le profil est incomplet', async () => {
    mockUserRepository.findOne.mockResolvedValue({ id: 2, is_phone_verified: false });

    await expect(service.create({ titre: 'Titre', categoryId: 1 } as any, 2, 'journaliste'))
      .rejects
      .toThrow(ForbiddenException);
  });

  // Journaliste fraudeur
  it('devrait forcer le statut "en_attente" si un journaliste tente de publier en direct', async () => {
    // Simule un profil complet
    mockUserRepository.findOne.mockResolvedValue({ id: 2, is_phone_verified: true, firstname: 'K', lastname: 'L' });
    // Simule une catégorie existante
    mockCategoryRepository.findOne.mockResolvedValue({ id: 1, libelle: 'Tech' });

    const result = await service.create(
      { titre: 'Scoop', categoryId: 1, statut: ArticleStatus.PUBLIE } as any, 
      2, 
      'journaliste'
    );

    // Le statut doit être EN_ATTENTE malgré le DTO
    expect(result.statut).toBe(ArticleStatus.EN_ATTENTE);
    expect(result.published_at).toBeNull();
  });

  // Choix de l'Admin (Brouillon)
  it('devrait respecter le choix de l\'Admin s\'il décide de sauvegarder un simple BROUILLON', async () => {
    mockUserRepository.findOne.mockResolvedValue({ id: 1, is_phone_verified: true, firstname: 'Admin', lastname: 'Boss' });
    mockCategoryRepository.findOne.mockResolvedValue({ id: 1, libelle: 'Tech' });

    const result = await service.create(
      { titre: 'Article pas fini', categoryId: 1, statut: ArticleStatus.BROUILLON } as any, 
      1, 
      'Admin'
    );

    // L'article reste bien en brouillon, aucune date de publication n'est générée
    expect(result.statut).toBe(ArticleStatus.BROUILLON);
    expect(result.published_at).toBeNull();
  });

  // Choix de l'Admin (Publication directe)
  it('devrait respecter le choix de l\'Admin s\'il décide de PUBLIER directement', async () => {
    mockUserRepository.findOne.mockResolvedValue({ id: 1, is_phone_verified: true, firstname: 'Admin', lastname: 'Boss' });
    mockCategoryRepository.findOne.mockResolvedValue({ id: 1, libelle: 'Tech' });

    const result = await service.create(
      { titre: 'Annonce importante', categoryId: 1, statut: ArticleStatus.PUBLIE } as any, 
      1, 
      'Admin'
    );

    // L'article est publié sur le champ avec une date générée
    expect(result.statut).toBe(ArticleStatus.PUBLIE);
    expect(result.published_at).toBeDefined();
  });
});