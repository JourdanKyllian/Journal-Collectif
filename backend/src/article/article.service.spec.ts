import { Test, TestingModule } from '@nestjs/testing';
import { ArticleService } from './article.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Article, ArticleStatus } from './entities/article.entity';
import { Users } from '../users/entities/user.entity';
import { Category } from '../categorie/entities/categorie.entity';
import { AuteurArticle } from '../auteur-article/entities/auteur-article.entity/auteur-article.entity';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('ArticleService', () => {
  let service: ArticleService;
  
  // On définit nos Mocks de manière plus précise
  const mockUserRepository = { findOne: jest.fn() };
  const mockCategoryRepository = { findOne: jest.fn() };
  const mockArticleRepository = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(article => Promise.resolve({ id: 99, ...article })),
  };
  const mockAuteurRepository = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockResolvedValue({}),
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

  // --- TEST 1 : ÉCHEC (Profil incomplet) ---
  it('devrait rejeter la création si le profil est incomplet', async () => {
    mockUserRepository.findOne.mockResolvedValue({ id: 2, is_phone_verified: false });

    await expect(service.create({ titre: 'Titre', categoryId: 1 } as any, 2, 'journaliste'))
      .rejects
      .toThrow(ForbiddenException);
  });

  // --- TEST 2 : SÉCURITÉ STATUT (Journaliste fraudeur) ---
  it('devrait forcer le statut "en_attente" si un journaliste tente de publier en direct', async () => {
    // 1. On simule un profil complet
    mockUserRepository.findOne.mockResolvedValue({ id: 2, is_phone_verified: true, firstname: 'K', lastname: 'L' });
    // 2. On simule une catégorie existante
    mockCategoryRepository.findOne.mockResolvedValue({ id: 1, libelle: 'Tech' });

    const result = await service.create(
      { titre: 'Scoop', categoryId: 1, statut: ArticleStatus.PUBLIE } as any, 
      2, 
      'journaliste'
    );

    // Vérification : Le statut doit être EN_ATTENTE malgré le DTO
    expect(result.statut).toBe(ArticleStatus.EN_ATTENTE);
    expect(result.published_at).toBeNull();
  });

  // --- TEST 3 : SUCCÈS ADMIN ---
  it('devrait autoriser la publication directe pour un Admin', async () => {
    mockUserRepository.findOne.mockResolvedValue({ id: 1, is_phone_verified: true, firstname: 'Admin', lastname: 'Boss' });
    mockCategoryRepository.findOne.mockResolvedValue({ id: 1, libelle: 'Tech' });

    const result = await service.create(
      { titre: 'Admin Post', categoryId: 1, statut: ArticleStatus.PUBLIE } as any, 
      1, 
      'Admin'
    );

    expect(result.statut).toBe(ArticleStatus.PUBLIE);
    expect(result.published_at).toBeDefined(); // La date doit être remplie
  });
});