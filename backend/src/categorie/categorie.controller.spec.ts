import { Test, TestingModule } from '@nestjs/testing';
import { CategoryController } from './categorie.controller';
import { CategoryService } from './categorie.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from './entities/categorie.entity';

describe('CategoryController', () => {
  let controller: CategoryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: {}, // Mock vide suffisant pour le test "toBeDefined"
        },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
