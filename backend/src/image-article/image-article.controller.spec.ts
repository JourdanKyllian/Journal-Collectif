import { Test, TestingModule } from '@nestjs/testing';
import { ImageArticleController } from './image-article.controller';
import { ImageArticleService } from './image-article.service';

describe('ImageArticleController', () => {
  let controller: ImageArticleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImageArticleController],
      providers: [ImageArticleService],
    }).compile();

    controller = module.get<ImageArticleController>(ImageArticleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
