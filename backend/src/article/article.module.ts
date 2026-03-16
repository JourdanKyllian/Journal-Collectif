import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuteurArticle } from 'src/auteur-article/entities/auteur-article.entity/auteur-article.entity';
import { Article } from './entities/article.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Article, AuteurArticle])],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
