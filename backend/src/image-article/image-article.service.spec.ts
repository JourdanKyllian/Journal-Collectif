import { Test, TestingModule } from '@nestjs/testing';
import { ImageArticleService } from './image-article.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ImageArticle } from './entities/image-article.entity';
import { GoneException, NotFoundException } from '@nestjs/common';

describe('ImageArticleService - Gestion des erreurs & Stratégie SEO', () => {
  let service: ImageArticleService;

  const mockImageRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    softRemove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageArticleService,
        {
          provide: getRepositoryToken(ImageArticle),
          useValue: mockImageRepository,
        },
      ],
    }).compile();

    service = module.get<ImageArticleService>(ImageArticleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // --- RÈGLE 1 : Erreur 404 classique ---
  it("devrait retourner une 404 (NotFound) si l'image n'a jamais existé", async () => {
    mockImageRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  // --- RÈGLE 2 : Erreur 410 SEO ---
  it("devrait retourner une 410 (Gone) si l'image a été supprimée (Soft Delete)", async () => {
    mockImageRepository.findOne.mockResolvedValue({
      id: 1,
      url_image: '/images/old.jpg',
      is_delete: true,
      deleted_at: new Date(),
    });

    await expect(service.findOne(1)).rejects.toThrow(GoneException);
  });

  // --- RÈGLE 3 : Stratégie de Compression (Garder le SEO après 2 ans) ---
  it('devrait identifier et compresser les images de plus de 2 ans au lieu de les supprimer', async () => {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    mockImageRepository.find.mockResolvedValue([
      { id: 2, url_image: '/images/heavy1.jpg', created_at: twoYearsAgo },
      { id: 3, url_image: '/images/heavy2.jpg', created_at: twoYearsAgo },
    ]);

    const result = await service.compressAgingImages();

    expect(mockImageRepository.find).toHaveBeenCalled();
    expect(result.compressedCount).toBe(2);
    expect(result.message).toContain('compressées avec succès');
  });
});