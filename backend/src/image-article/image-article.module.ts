import { Module } from '@nestjs/common';
import { ImageArticleService } from './image-article.service';
import { ImageArticleController } from './image-article.controller';

@Module({
  controllers: [ImageArticleController],
  providers: [ImageArticleService],
})
export class ImageArticleModule {}
