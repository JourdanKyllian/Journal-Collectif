import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  GoneException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article, ArticleStatus } from './entities/article.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { AuteurArticle } from '../auteur-article/entities/auteur-article.entity/auteur-article.entity';
import { Users } from '../users/entities/user.entity';
import { Categorie } from '../categorie/entities/categorie.entity';

/**
 * Service gérant le cycle de vie complet des articles,
 * la traçabilité des auteurs/éditeurs, et le respect de l'anonymat (RGPD).
 */
@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(AuteurArticle)
    private readonly auteurRepository: Repository<AuteurArticle>,
    @InjectRepository(Users)
    private readonly userRepository: Repository<Users>,
    @InjectRepository(Categorie)
    private readonly categorieRepository: Repository<Categorie>,
  ) {}

  /**
   * Crée un nouvel article et enregistre l'auteur initial.
   */
  async create(dto: CreateArticleDto, userId: number, userRole: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable.');
    }

    if (!user.is_phone_verified) {
      throw new ForbiddenException(
        'Votre profil et numéro de téléphone doivent être vérifiés pour publier.',
      );
    }

    const normalizedRole = userRole?.toLowerCase();
    // CORRECTION ICI : Nettoyage des vieux rôles
    const isStaff = ['super_admin', 'admin', 'redacteur'].includes(
      normalizedRole,
    );

    let statutFinal = ArticleStatus.BROUILLON;
    if (!isStaff) {
      statutFinal = ArticleStatus.EN_ATTENTE;
    } else if (dto.statut) {
      statutFinal = dto.statut;
    }

    const publishedAt =
      statutFinal === ArticleStatus.PUBLIE ? new Date() : null;

    const newArticle = this.articleRepository.create({
      titre: dto.titre,
      contenu: dto.contenu,
      image_couverture: dto.image_couverture,
      source_link: dto.source_link,
      statut: statutFinal,
      published_at: publishedAt,
      categorie: { id: dto.categorieId } as Categorie,
    });

    const savedArticle = await this.articleRepository.save(newArticle);

    const roleContribution = dto.is_anonymous ? 'Auteur Anonyme' : 'Auteur';

    await this.auteurRepository.save(
      this.auteurRepository.create({
        userId: userId,
        articleId: savedArticle.id,
        role_contribution: roleContribution,
      }),
    );

    const authorName =
      dto.is_anonymous || !user.profile
        ? 'Citoyen Anonyme'
        : user.profile.firstname && user.profile.lastname
          ? `${user.profile.firstname} ${user.profile.lastname}`
          : user.profile.firstname || 'Utilisateur';

    return {
      ...savedArticle,
      credits: [{ role: 'Auteur', name: authorName }],
    };
  }

  /**
   * Met à jour un article et trace les modifications par un administrateur.
   */
  async update(
    id: number,
    dto: UpdateArticleDto,
    userId: number,
    userRole: string,
  ) {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) throw new NotFoundException('Article introuvable.');

    Object.assign(article, dto);
    await this.articleRepository.save(article);

    const normalizedRole = userRole?.toLowerCase();
    // CORRECTION ICI
    const isStaff = ['super_admin', 'admin', 'redacteur'].includes(
      normalizedRole,
    );

    if (isStaff) {
      const existingPivot = await this.auteurRepository.findOne({
        where: { articleId: id, userId },
      });
      if (!existingPivot) {
        await this.auteurRepository.save(
          this.auteurRepository.create({
            articleId: id,
            userId,
            role_contribution: 'Éditeur',
          }),
        );
      }
    }

    return this.findOne(id);
  }

  /**
   * Valide et publie publiquement un article en attente.
   */
  async publishArticle(id: number) {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) throw new NotFoundException('Article introuvable.');

    article.statut = ArticleStatus.PUBLIE;
    article.published_at = new Date();
    await this.articleRepository.save(article);

    return this.findOne(id);
  }

  /**
   * Récupère tous les articles publiés (Formatés pour le public).
   */
  async findAllPublished() {
    const articles = await this.articleRepository.find({
      where: { statut: ArticleStatus.PUBLIE, is_delete: false },
      relations: [
        'categorie',
        'auteursArticles',
        'auteursArticles.user',
        'auteursArticles.user.profile',
      ],
      order: { published_at: 'DESC' },
    });

    return articles.map((article) => this.formatArticleCredits(article));
  }

  /**
   * Récupère tous les articles sans restriction (Pour le Dashboard Admin).
   */
  async findAllAdmin() {
    const articles = await this.articleRepository.find({
      where: { is_delete: false },
      relations: [
        'categorie',
        'auteursArticles',
        'auteursArticles.user',
        'auteursArticles.user.profile',
      ],
      order: { created_at: 'DESC' },
    });

    return articles.map((article) => this.formatArticleCredits(article));
  }

  /**
   * Récupère un article spécifique (Formaté avec ses crédits épurés).
   */
  async findOne(id: number) {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: [
        'categorie',
        'auteursArticles',
        'auteursArticles.user',
        'auteursArticles.user.profile',
      ],
      withDeleted: true,
    });

    if (!article) throw new NotFoundException('Article introuvable.');
    if (article.is_delete || article.deleted_at)
      throw new GoneException('Article supprimé.');

    return this.formatArticleCredits(article);
  }

  /**
   * Effectue un Soft Delete sur l'article.
   */
  async remove(id: number, userId: number, userRole: string) {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) throw new NotFoundException('Article introuvable.');

    const normalizedRole = userRole?.toLowerCase();
    // CORRECTION ICI
    const isStaff = ['super_admin', 'admin', 'redacteur'].includes(
      normalizedRole,
    );
    if (!isStaff) throw new ForbiddenException('Non autorisé.');

    return this.articleRepository.softRemove(article);
  }

  /**
   * Formate les relations d'un article pour extraire les auteurs/éditeurs.
   * Masque intégralement les données personnelles si l'anonymat est requis (RGPD).
   */
  private formatArticleCredits(article: Article) {
    let credits: Array<{ role: string; name: string }> = [];

    if (article.auteursArticles && article.auteursArticles.length > 0) {
      credits = article.auteursArticles.map((pivot) => {
        if (pivot.role_contribution === 'Auteur Anonyme') {
          return { role: 'Auteur', name: 'Citoyen Anonyme' };
        }

        const profile = pivot.user?.profile;
        const name =
          profile?.firstname && profile?.lastname
            ? `${profile.firstname} ${profile.lastname}`
            : profile?.firstname || 'Utilisateur';

        return { role: pivot.role_contribution || 'Auteur', name };
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { auteursArticles, ...rest } = article;
    return { ...rest, credits };
  }
}
