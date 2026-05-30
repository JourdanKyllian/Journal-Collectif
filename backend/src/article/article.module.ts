import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuteurArticle } from 'src/auteur-article/entities/auteur-article.entity/auteur-article.entity';
import { Article } from './entities/article.entity';
import { Category } from 'src/categorie/entities/categorie.entity';
import { Users } from 'src/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Article, Users, Category, AuteurArticle]),
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
