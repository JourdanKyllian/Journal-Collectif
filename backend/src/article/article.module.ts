import { Module } from '@nestjs/common';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuteurArticle } from 'src/auteur-article/entities/auteur-article.entity/auteur-article.entity';
import { Article } from './entities/article.entity';
import { Categorie } from 'src/categorie/entities/categorie.entity';
import { Users } from 'src/users/entities/user.entity';
import { ArticleRevision } from './entities/article-revision.entity';
import { ArticleHistory } from './entities/article-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Article,
      Users,
      Categorie,
      AuteurArticle,
      ArticleRevision,
      ArticleHistory,
    ]),
  ],
  controllers: [ArticleController],
  providers: [ArticleService],
})
export class ArticleModule {}
