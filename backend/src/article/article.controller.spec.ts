import { Test, TestingModule } from '@nestjs/testing';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { Users } from '../users/entities/user.entity';
import { Category } from '../category/entities/category.entity';
import { AuteurArticle } from '../auteur-article/entities/auteur-article.entity/auteur-article.entity';

describe('ArticleController', () => {
  let controller: ArticleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticleController],
      providers: [
        ArticleService,
        // On fournit des mocks vides pour satisfaire les dépendances du service
        { provide: getRepositoryToken(Article), useValue: {} },
        { provide: getRepositoryToken(Users), useValue: {} },
        { provide: getRepositoryToken(Category), useValue: {} },
        { provide: getRepositoryToken(AuteurArticle), useValue: {} },
      ],
    }).compile();

    controller = module.get<ArticleController>(ArticleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});