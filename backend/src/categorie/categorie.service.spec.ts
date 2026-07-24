/**
 * Suite de tests unitaires pour le service CategoryService.
 * Valide le cycle de vie des catégories (création, gestion des doublons, suppression)
 * et la conformité de la stratégie de réponses HTTP (404, 410) pour l'optimisation SEO.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './categorie.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './entities/categorie.entity';
import {
  ConflictException,
  NotFoundException,
  GoneException,
} from '@nestjs/common';
import {
  describe,
  it,
  expect,
  jest,
  beforeEach,
  afterEach,
} from '@jest/globals';

/**
 * Type générique unifié représentant une fonction simulée par Jest.
 */
type MockFunction = jest.Mock<(...args: any[]) => any>;

/**
 * Interface des méthodes du repository TypeORM simulées pour les tests.
 */
type MockRepository = {
  find: MockFunction;
  findOne: MockFunction;
  create: MockFunction;
  save: MockFunction;
  softRemove: MockFunction;
};

/**
 * Extraction des types DTO depuis la signature des méthodes du service.
 */
type CreateDto = Parameters<CategoryService['create']>[0];
type UpdateDto = Parameters<CategoryService['update']>[1];

describe('CategoryService', () => {
  let service: CategoryService;
  let repository: MockRepository;

  const mockCategoryRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn().mockImplementation((dto: unknown) => dto),
    save: jest
      .fn()
      .mockImplementation((categorie: unknown) =>
        Promise.resolve({ id: 99, ...(categorie as object) }),
      ),
    softRemove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    repository = module.get(getRepositoryToken(Category));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('devrait créer une nouvelle catégorie', async () => {
      const dto = {
        libelle: 'Technologie',
        description: 'Actu tech',
      } as unknown as CreateDto;

      repository.findOne.mockResolvedValue(null);

      const result = await service.create(dto);

      expect(result).toHaveProperty('id');
      expect(result.libelle).toBe('Technologie');
      expect(repository.save).toHaveBeenCalled();
    });

    it('devrait rejeter la création si le libellé existe déjà', async () => {
      const dto = { libelle: 'Politique' } as unknown as CreateDto;

      repository.findOne.mockResolvedValue({ id: 1, libelle: 'Politique' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('devrait retourner toutes les catégories', async () => {
      repository.find.mockResolvedValue([
        { id: 1, libelle: 'Politique' },
        { id: 2, libelle: 'Tech' },
      ]);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].libelle).toBe('Politique');
    });
  });

  describe('findOne - Stratégie SEO HTTP 410', () => {
    it("devrait lever une NotFoundException (404) si la catégorie n'existe pas", async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('devrait lever une GoneException (410) si la catégorie a été supprimée', async () => {
      repository.findOne.mockResolvedValue({
        id: 1,
        libelle: 'Ancienne catégorie',
        is_delete: true,
        deleted_at: new Date(),
      });

      await expect(service.findOne(1)).rejects.toThrow(GoneException);
    });

    it("devrait retourner la catégorie si elle existe et n'est pas supprimée", async () => {
      const validCategory = {
        id: 1,
        libelle: 'Active',
        is_delete: false,
        deleted_at: null,
      };
      repository.findOne.mockResolvedValue(validCategory);

      const result = await service.findOne(1);

      expect(result).toEqual(validCategory);
    });
  });

  describe('update', () => {
    it('devrait mettre à jour une catégorie existante', async () => {
      const validCategory = { id: 1, libelle: 'Tech' };
      const updateDto = { libelle: 'Nouvelle Tech' } as unknown as UpdateDto;

      repository.findOne.mockResolvedValue(validCategory);

      await service.update(1, updateDto);

      expect(repository.save).toHaveBeenCalledWith({
        id: 1,
        libelle: 'Nouvelle Tech',
      });
    });
  });

  describe('remove', () => {
    it('devrait supprimer logiquement (Soft Delete) une catégorie', async () => {
      const validCategory = { id: 1, libelle: 'Tech' };

      repository.findOne.mockResolvedValue(validCategory);
      repository.softRemove.mockResolvedValue(validCategory);

      await service.remove(1);

      expect(repository.softRemove).toHaveBeenCalledWith(validCategory);
    });
  });
});
