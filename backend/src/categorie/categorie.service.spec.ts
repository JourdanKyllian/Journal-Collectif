import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './categorie.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './entities/categorie.entity';
import { ConflictException } from '@nestjs/common';

// Crée un type propre pour ton faux repository
type MockRepository = {
  find: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

// Récupère le vrai type du DTO pour tes tests
type CreateDto = Parameters<CategoryService['create']>[0];

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

    // Force le typage ici pour que TypeScript comprenne
    repository = module.get(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- TEST : CRÉATION ---
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

  // --- TEST : DOUBLON ---
  it('devrait rejeter la création si le libellé existe déjà', async () => {
    const dto = { libelle: 'Politique' } as unknown as CreateDto;

    repository.findOne.mockResolvedValue({ id: 1, libelle: 'Politique' });

    await expect(service.create(dto)).rejects.toThrow(ConflictException);
  });

  // --- TEST : LISTE ---
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
