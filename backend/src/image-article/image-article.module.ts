import { Module } from '@nestjs/common';
import { ImageArticleService } from './image-article.service';
import { ImageArticleController } from './image-article.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImageArticle } from './entities/image-article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ImageArticle])],
  controllers: [ImageArticleController],
  providers: [ImageArticleService],
})
export class ImageArticleModule {}
