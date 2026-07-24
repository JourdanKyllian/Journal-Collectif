/**
 * Suite de tests unitaires pour le contrôleur CategoryController.
 * Vérifie l'instanciation correcte du contrôleur et la résolution de ses dépendances (CategoryService et Repository).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './categorie.controller';
import { CategoryService } from './categorie.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './entities/categorie.entity';

describe('CategoryController', () => {
  let controller: CategoryController;

  beforeEach(async () => {
    // Configuration du module de test avec les dépendances minimales requises.
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        CategoryService,
        {
          // Bouchon (mock) basique du repository suffisant pour l'initialisation du service sous-jacent.
          provide: getRepositoryToken(Category),
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
  });

  it('devrait être défini', () => {
    // Valide que l'injection de dépendances de NestJS a correctement construit le contrôleur.
    expect(controller).toBeDefined();
  });
});
