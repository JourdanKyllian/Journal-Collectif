import { Test, TestingModule } from '@nestjs/testing';
import { ArticleController } from './article.controller';
import { ArticleService } from './article.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { Users } from '../users/entities/user.entity';
import { Categorie } from '../categorie/entities/categorie.entity';
import { AuteurArticle } from '../auteur-article/entities/auteur-article.entity/auteur-article.entity';
import { ArticleRevision } from './entities/article-revision.entity';
import { ArticleHistory } from './entities/article-history.entity';
import { TenantContext } from '../tenant/tenant.context';

describe('ArticleController', () => {
  let controller: ArticleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArticleController],
      providers: [
        { provide: TenantContext, useValue: { journalId: 1 } },
        ArticleService,
        // On fournit des mocks vides pour satisfaire les dépendances du service
        { provide: getRepositoryToken(Article), useValue: {} },
        { provide: getRepositoryToken(Users), useValue: {} },
        { provide: getRepositoryToken(Categorie), useValue: {} },
        { provide: getRepositoryToken(AuteurArticle), useValue: {} },
        { provide: getRepositoryToken(ArticleRevision), useValue: {} },
        { provide: getRepositoryToken(ArticleHistory), useValue: {} },
      ],
    }).compile();

    controller = module.get<ArticleController>(ArticleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
