import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  GoneException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article, ArticleStatus } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { Users } from '../users/entities/user.entity';
import { Categorie } from '../categorie/entities/categorie.entity';
import { AuteurArticle } from '../auteur-article/entities/auteur-article.entity/auteur-article.entity';

/**
 * Service gérant la logique métier des articles.
 * Assure la gestion des permissions, la validation des profils auteurs et intègre les règles SEO (HTTP 410).
 */
@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Categorie)
    private readonly categoryRepository: Repository<Categorie>,
    @InjectRepository(AuteurArticle)
    private readonly auteurArticleRepository: Repository<AuteurArticle>,
  ) {}

  /**
   * Crée un nouvel article et l'associe à son auteur.
   *
   * @param createArticleDto - Les données de création de l'article.
   * @param userId - L'identifiant de l'utilisateur créant l'article.
   * @param userRole - Le rôle de l'utilisateur.
   * @returns {Promise<Article>} L'article sauvegardé en base de données.
   * @throws {ForbiddenException} Si l'utilisateur n'est pas authentifié ou si son profil est incomplet.
   * @throws {NotFoundException} Si la catégorie spécifiée n'existe pas.
   */
  async create(
    createArticleDto: CreateArticleDto,
    userId: number,
    userRole: string,
  ) {
    if (!userId) throw new ForbiddenException('Authentification invalide.');

    // Chargement de la relation 'profile' pour lire le prénom et le nom
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (
      !user ||
      !user.is_phone_verified ||
      !user.profile?.firstname ||
      !user.profile?.lastname
    ) {
      throw new ForbiddenException(
        'Profil incomplet (téléphone vérifié, nom et prénom requis).',
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

  /**
   * Récupère un article par son identifiant avec ses relations.
   * Valide le statut de l'article pour appliquer la stratégie SEO.
   *
   * @param id - L'identifiant de l'article.
   * @returns {Promise<Article>} L'article demandé.
   * @throws {NotFoundException} Si l'article n'a jamais existé.
   * @throws {GoneException} Si l'article a été supprimé logiquement (Soft Delete).
   */
  async findOne(id: number) {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['category', 'auteursArticles', 'auteursArticles.user'],
      withDeleted: true,
    });

    if (!article) throw new NotFoundException('Article introuvable');

    if (article.is_delete || article.deleted_at) {
      throw new GoneException(
        `L'article #${id} a été retiré de la plateforme.`,
      );
    }

    return article;
  }

  /**
   * Met à jour un article existant.
   * Vérifie les permissions de modification et gère les transitions de statut sécurisées.
   *
   * @param id - L'identifiant de l'article à modifier.
   * @param updateArticleDto - Les données à mettre à jour.
   * @param userId - L'identifiant de l'utilisateur effectuant la requête.
   * @param userRole - Le rôle de l'utilisateur.
   * @returns {Promise<Article>} L'article mis à jour.
   * @throws {ForbiddenException} Si l'utilisateur n'a pas les droits nécessaires de modification.
   */
  async update(
    id: number,
    updateArticleDto: UpdateArticleDto,
    userId: number,
    userRole: string,
  ) {
    const article = await this.findOne(id);

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

  /**
   * Force la publication immédiate d'un article.
   *
   * @param id - L'identifiant de l'article à publier.
   * @returns {Promise<Article>} L'article publié avec sa date de publication mise à jour.
   */
  async publishArticle(id: number) {
    const article = await this.findOne(id);

    article.statut = ArticleStatus.PUBLIE;
    article.published_at = new Date();
    return this.articleRepository.save(article);
  }

  /**
   * Récupère tous les articles ayant le statut PUBLIE.
   *
   * @returns {Promise<Article[]>} La liste des articles publiés triés par date de publication (décroissante).
   */
  findAllPublished() {
    return this.articleRepository.find({
      where: { statut: ArticleStatus.PUBLIE },
      relations: ['category', 'auteursArticles', 'auteursArticles.user'],
      order: { published_at: 'DESC' },
    });
  }

  /**
   * Récupère l'intégralité des articles pour les interfaces d'administration.
   *
   * @returns {Promise<Article[]>} La liste complète des articles triés par date de création (décroissante).
   */
  findAllAdmin() {
    return this.articleRepository.find({
      relations: ['category', 'auteursArticles', 'auteursArticles.user'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Supprime logiquement un article (Soft Delete).
   * Restreint l'action aux auteurs de l'article ou au personnel d'administration.
   *
   * @param id - L'identifiant de l'article à supprimer.
   * @param userId - L'identifiant de l'utilisateur effectuant la suppression.
   * @param userRole - Le rôle de l'utilisateur.
   * @returns {Promise<{ message: string; article: Article }>} Un objet contenant un message de confirmation et l'entité supprimée.
   * @throws {ForbiddenException} Si l'utilisateur n'a pas les droits nécessaires.
   */
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
