import { Test, TestingModule } from '@nestjs/testing';
import { ImageArticleService } from './image-article.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ImageArticle } from './entities/image-article.entity';
import { GoneException, NotFoundException } from '@nestjs/common';
import { CreateImageArticleDto } from './dto/create-image-article.dto';

describe('ImageArticleService - Gestion des erreurs & Stratégie SEO', () => {
  let service: ImageArticleService;

  const mockImageRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
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

  describe('create', () => {
    it('devrait créer et sauvegarder une nouvelle image', async () => {
      const dto: CreateImageArticleDto = {
        url_image: '/uploads/photo.jpg',
        legend: 'Photo d’illustration',
      };

      const expectedEntity = { id: 1, ...dto };

      mockImageRepository.create.mockReturnValue(dto);
      mockImageRepository.save.mockResolvedValue(expectedEntity);

      const result = await service.create(dto);

      expect(mockImageRepository.create).toHaveBeenCalledWith(dto);
      expect(mockImageRepository.save).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedEntity);
    });
  });

  describe('findOne', () => {
    it("devrait retourner une 404 (NotFound) si l'image n'a jamais existé", async () => {
      mockImageRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it("devrait retourner une 410 (Gone) si l'image a été supprimée (Soft Delete)", async () => {
      mockImageRepository.findOne.mockResolvedValue({
        id: 1,
        url_image: '/images/old.jpg',
        is_delete: true,
        deleted_at: new Date(),
      });

      await expect(service.findOne(1)).rejects.toThrow(GoneException);
    });

    it('devrait retourner l’image si elle existe et n’est pas supprimée', async () => {
      const validImage = {
        id: 1,
        url_image: '/images/valid.jpg',
        is_delete: false,
        deleted_at: null,
      };

      mockImageRepository.findOne.mockResolvedValue(validImage);

      const result = await service.findOne(1);
      expect(result).toEqual(validImage);
    });
  });

  describe('remove', () => {
    it('devrait effectuer un soft delete sur l’image existante', async () => {
      const validImage = {
        id: 1,
        url_image: '/images/valid.jpg',
        is_delete: false,
        deleted_at: null,
      };

      mockImageRepository.findOne.mockResolvedValue(validImage);
      mockImageRepository.softRemove.mockResolvedValue({
        ...validImage,
        is_delete: true,
      });

      await service.remove(1);

      expect(mockImageRepository.softRemove).toHaveBeenCalledWith(validImage);
    });
  });

  describe('compressAgingImages', () => {
    it('devrait identifier et compresser les images de plus de 2 ans', async () => {
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
});
