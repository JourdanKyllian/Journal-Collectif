import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article, ArticleStatus } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Users } from '../users/entities/user.entity';
import { Category } from '../categorie/entities/categorie.entity';
import { AuteurArticle } from '../auteur-article/entities/auteur-article.entity/auteur-article.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(AuteurArticle)
    private readonly auteurArticleRepository: Repository<AuteurArticle>,
  ) {}

  async create(
    createArticleDto: CreateArticleDto,
    userId: number,
    userRole: string,
  ) {
    if (!userId) throw new ForbiddenException('Authentification invalide.');

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user || !user.is_phone_verified || !user.firstname || !user.lastname) {
      throw new ForbiddenException(
        'Profil incomplet (téléphone, nom, prénom requis).',
      );
    }

    const category = await this.categoryRepository.findOne({
      where: { id: createArticleDto.categoryId },
    });
    if (!category) throw new NotFoundException('Catégorie introuvable');

    let statutFinal =
      (createArticleDto.statut as ArticleStatus) || ArticleStatus.BROUILLON;

    if (['utilisateur', 'journaliste'].includes(userRole)) {
      if (statutFinal === ArticleStatus.PUBLIE) {
        statutFinal = ArticleStatus.EN_ATTENTE;
      }
    }

    const newArticle = this.articleRepository.create({
      ...createArticleDto,
      statut: statutFinal,
      category: category,
      published_at: statutFinal === ArticleStatus.PUBLIE ? new Date() : null,
    });

    const savedArticle = await this.articleRepository.save(newArticle);

    await this.auteurArticleRepository.save(
      this.auteurArticleRepository.create({
        article: savedArticle,
        user: user,
      }),
    );

    return savedArticle;
  }

  async update(
    id: number,
    updateArticleDto: UpdateArticleDto,
    userId: number,
    userRole: string,
  ) {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['auteursArticles', 'auteursArticles.user'],
    });

    if (!article) throw new NotFoundException('Article introuvable');

    const isAuthor = article.auteursArticles.some((a) => a.user.id === userId);
    const isManagement = ['Admin', 'moderateur'].includes(userRole);

    if (!isAuthor && !isManagement) {
      throw new ForbiddenException('Modification interdite.');
    }

    if (updateArticleDto.statut && !isManagement) {
      if (updateArticleDto.statut === ArticleStatus.PUBLIE) {
        updateArticleDto.statut = ArticleStatus.EN_ATTENTE;
      }
    }

    if (
      (updateArticleDto.statut as ArticleStatus) === ArticleStatus.PUBLIE &&
      article.statut !== ArticleStatus.PUBLIE
    ) {
      article.published_at = new Date();
    }

    Object.assign(article, updateArticleDto);
    return this.articleRepository.save(article);
  }

  async publishArticle(id: number) {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) throw new NotFoundException('Article introuvable');

    article.statut = ArticleStatus.PUBLIE;
    article.published_at = new Date();
    return this.articleRepository.save(article);
  }

  findAllPublished() {
    return this.articleRepository.find({
      where: { statut: ArticleStatus.PUBLIE },
      relations: ['category', 'auteursArticles', 'auteursArticles.user'],
      order: { published_at: 'DESC' },
    });
  }

  findAllAdmin() {
    return this.articleRepository.find({
      relations: ['category', 'auteursArticles', 'auteursArticles.user'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: number) {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['category', 'auteursArticles', 'auteursArticles.user'],
    });

    if (!article) throw new NotFoundException('Article introuvable');
    return article;
  }

  async remove(id: number, userId: number, userRole: string) {
    const article = await this.findOne(id);

    const isAuthor = article.auteursArticles.some((a) => a.user.id === userId);
    const isManagement = ['Admin', 'moderateur'].includes(userRole);

    if (!isAuthor && !isManagement) {
      throw new ForbiddenException('Suppression interdite.');
    }

    const removedArticle = await this.articleRepository.softRemove(article);
    return {
      message: `L'article #${id} a été supprimé avec succès.`,
      article: removedArticle,
    };
  }
}
