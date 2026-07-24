/**
 * Suite de tests unitaires pour le contrôleur CategoryController.
 * Vérifie l'instanciation correcte du contrôleur et la résolution de ses dépendances (CategoryService et Repository).
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CategorieController } from './categorie.controller';
import { CategorieService } from './categorie.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Categorie } from './entities/categorie.entity';

describe('CategoryController', () => {
  let controller: CategorieController;

  beforeEach(async () => {
    // Configuration du module de test avec les dépendances minimales requises.
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategorieController],
      providers: [
        CategorieService,
        {
          // Bouchon (mock) basique du repository suffisant pour l'initialisation du service sous-jacent.
          provide: getRepositoryToken(Categorie),
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<CategorieController>(CategorieController);
  });

  it('devrait être défini', () => {
    // Valide que l'injection de dépendances de NestJS a correctement construit le contrôleur.
    expect(controller).toBeDefined();
  });
});
