import { Test, TestingModule } from '@nestjs/testing';
import { ImageArticleService } from './image-article.service';

describe('ImageArticleService', () => {
  let service: ImageArticleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageArticleService],
    }).compile();

    service = module.get<ImageArticleService>(ImageArticleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
