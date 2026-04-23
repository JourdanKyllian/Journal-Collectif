import { Test, TestingModule } from '@nestjs/testing';
import { CategoryService } from './categorie.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './entities/categorie.entity';
import { ConflictException } from '@nestjs/common';

describe('CategoryService', () => {
  let service: CategoryService;
  let repository: any;

  // 1. On prépare le Mock du repository
  const mockCategoryRepository = {
    findOne: jest.fn(),
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn().mockImplementation(cat => Promise.resolve({ id: Date.now(), ...cat })),
    find: jest.fn().mockResolvedValue([
      { id: 1, libelle: 'Politique' },
      { id: 2, libelle: 'Sport' },
    ]),
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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- TEST : CRÉATION ---
  it('devrait créer une nouvelle catégorie', async () => {
    const dto = { libelle: 'Technologie', description: 'Actu tech' };
    
    // On simule que la catégorie n'existe pas encore (findOne renvoie null)
    repository.findOne.mockResolvedValue(null);

    const result = await service.create(dto as any);

    expect(result).toHaveProperty('id');
    expect(result.libelle).toBe('Technologie');
    expect(repository.save).toHaveBeenCalled();
  });

  // --- TEST : DOUBLON ---
  it('devrait rejeter la création si le libellé existe déjà', async () => {
    const dto = { libelle: 'Politique' };
    
    // On simule que findOne trouve déjà une catégorie
    repository.findOne.mockResolvedValue({ id: 1, libelle: 'Politique' });

    // Selon ton code actuel, vérifie si tu as une ConflictException 
    // Si tu n'as pas géré l'erreur dans ton service, ce test échouera (ce qui est une bonne chose !)
    await expect(service.create(dto as any))
      .rejects
      .toThrow(ConflictException);
  });

  // --- TEST : LISTE ---
  it('devrait retourner toutes les catégories', async () => {
    const result = await service.findAll();
    expect(result).toHaveLength(2);
    expect(result[0].libelle).toBe('Politique');
  });
});