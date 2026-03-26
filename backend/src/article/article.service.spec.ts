import { Test, TestingModule } from '@nestjs/testing';
import { ArticleService } from './article.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Article } from './entities/article.entity';
import { Users } from '../users/entities/user.entity';
import { Category } from '../category/entities/category.entity';
import { AuteurArticle } from '../auteur-article/entities/auteur-article.entity/auteur-article.entity';
import { ForbiddenException } from '@nestjs/common';

describe('ArticleService', () => {
  let service: ArticleService;
  let userRepository: any;

  beforeEach(async () => {
    // On crée des "Mocks" (fausses versions) des repositories pour ne pas toucher à la vraie DB
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        { provide: getRepositoryToken(Article), useValue: {} },
        { provide: getRepositoryToken(Category), useValue: {} },
        { provide: getRepositoryToken(AuteurArticle), useValue: {} },
        {
          provide: getRepositoryToken(Users),
          useValue: { findOne: jest.fn() }, // On va simuler le findOne
        },
      ],
    }).compile();

    service = module.get<ArticleService>(ArticleService);
    userRepository = module.get(getRepositoryToken(Users));
  });

  it('devrait rejeter la création si le profil est incomplet (is_phone_verified = false)', async () => {
    // On simule un utilisateur qui n'a pas vérifié son téléphone
    userRepository.findOne.mockResolvedValue({
      id: 2,
      is_phone_verified: false,
      firstname: 'Jean',
      lastname: 'Dupont',
    });

    const dto: any = { titre: 'Test', contenu: '...', categoryId: 1 };

    // On s'attend à ce que le service lève une ForbiddenException
    await expect(service.create(dto, 2, 'journaliste'))
      .rejects
      .toThrow(ForbiddenException);
  });
});
