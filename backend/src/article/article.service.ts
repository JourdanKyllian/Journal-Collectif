import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOptionsWhere,
  ILike,
  In,
  IsNull,
  LessThanOrEqual,
  MoreThan,
  Repository,
} from 'typeorm';
import { Article, ArticleStatus } from './entities/article.entity';
import {
  ArticleHistory,
  ArticleHistoryAction,
} from './entities/article-history.entity';
import {
  ArticleRevision,
  RevisionStatus,
} from './entities/article-revision.entity';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import {
  AdminArticleListQueryDto,
  ArticleListQueryDto,
} from './dto/article-list-query.dto';
import { AuteurArticle } from '../auteur-article/entities/auteur-article.entity/auteur-article.entity';
import { Users } from '../users/entities/user.entity';
import { Categorie } from '../categorie/entities/categorie.entity';
import {
  buildPaginated,
  escapeLike,
  PaginationQueryDto,
  toSkipTake,
} from '../common/pagination/pagination';
import { sanitizeArticleHtml } from '../common/security/sanitize-article-html';

const STAFF_ROLES = ['super_admin', 'admin', 'redacteur'];
const ADMIN_ROLES = ['super_admin', 'admin'];
const AUTHOR_ROLES = ['Auteur', 'Auteur Anonyme'];
const EDITABLE_STATUSES = [ArticleStatus.BROUILLON, ArticleStatus.EN_ATTENTE];
const MAX_SCHEDULE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

const ARTICLE_RELATIONS = [
  'categorie',
  'auteursArticles',
  'auteursArticles.user',
  'auteursArticles.user.profile',
];

/** Utilisateur identifié qui effectue une action ou consulte un article. */
export interface Viewer {
  userId: number;
  role: string;
}

const isAdmin = (role?: string): boolean =>
  ADMIN_ROLES.includes(role?.toLowerCase() ?? '');

const isStaff = (role?: string): boolean =>
  STAFF_ROLES.includes(role?.toLowerCase() ?? '');

/** Champs suivis dans l'historique et les révisions. */
interface Tracked {
  titre?: string;
  contenu?: string;
  image_couverture?: string | null;
  source_link?: string | null;
  categorieId?: number | null;
  statut?: ArticleStatus;
  scheduled_at?: string | null;
}

const toIso = (value: Date | string | null | undefined): string | null =>
  value ? new Date(value).toISOString() : null;

function snapshotOfArticle(article: Article): Tracked {
  return {
    titre: article.titre,
    contenu: article.contenu,
    image_couverture: article.image_couverture ?? null,
    source_link: article.source_link ?? null,
    categorieId: article.categorie?.id ?? null,
    statut: article.statut,
    scheduled_at: toIso(article.scheduled_at),
  };
}

function snapshotOfRevision(revision: ArticleRevision): Tracked {
  return {
    titre: revision.titre,
    contenu: revision.contenu,
    image_couverture: revision.image_couverture ?? null,
    source_link: revision.source_link ?? null,
    categorieId: revision.categorieId ?? null,
  };
}

/** Compare deux instantanés et ne garde que les champs qui ont changé. */
function diffTracked(before: Tracked, after: Tracked) {
  const avant: Record<string, unknown> = {};
  const apres: Record<string, unknown> = {};
  for (const key of Object.keys(after) as (keyof Tracked)[]) {
    if (before[key] !== after[key]) {
      avant[key] = before[key] ?? null;
      apres[key] = after[key] ?? null;
    }
  }
  return { champs: Object.keys(apres), avant, apres };
}

function displayName(user: Users | null | undefined): string {
  const profile = user?.profile;
  const name = `${profile?.firstname ?? ''} ${profile?.lastname ?? ''}`.trim();
  return name || user?.email || 'Utilisateur';
}

/**
 * Formate les crédits d'un article. L'identité d'un auteur anonyme n'est révélée
 * qu'aux admins (`reveal`) ; le public ne voit jamais que « Citoyen Anonyme ».
 */
function formatArticle(article: Article, reveal: boolean) {
  const credits: Array<{ role: string; name: string; anonymous?: boolean }> = (
    article.auteursArticles ?? []
  ).map((pivot) => {
    const profile = pivot.user?.profile;
    const realName =
      profile?.firstname && profile?.lastname
        ? `${profile.firstname} ${profile.lastname}`
        : profile?.firstname || 'Utilisateur';

    if (pivot.role_contribution === 'Auteur Anonyme') {
      return reveal
        ? { role: 'Auteur', name: realName, anonymous: true }
        : { role: 'Auteur', name: 'Citoyen Anonyme' };
    }
    return { role: pivot.role_contribution || 'Auteur', name: realName };
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { auteursArticles, ...rest } = article;
  return { ...rest, credits };
}

export type FormattedArticle = ReturnType<typeof formatArticle>;

export type UpdateResult =
  | { mode: 'direct'; article: FormattedArticle; revision: null }
  | { mode: 'revision'; article: FormattedArticle; revision: ArticleRevision };

/** Statut présenté à l'auteur : refuser et supprimer ne font qu'un. */
const CITIZEN_STATUS: Record<ArticleStatus, string> = {
  [ArticleStatus.BROUILLON]: 'brouillon',
  [ArticleStatus.EN_ATTENTE]: 'en_attente',
  [ArticleStatus.PUBLIE]: 'approuve',
  [ArticleStatus.CORBEILLE]: 'refuse_ou_supprime',
};

/**
 * Cycle de vie des articles : soumission, modération, correction d'articles publiés
 * (révisions), programmation, suppression, anonymat (RGPD) et historique d'audit.
 *
 * Règles métier :
 * - Un article publié appartient à la rédaction : son auteur ne peut plus le modifier.
 * - Corriger un article publié crée une révision ; l'article en ligne reste inchangé
 *   jusqu'à ce qu'un admin l'applique.
 * - Seuls les admins publient, dépublient et suppriment. Refuser = supprimer.
 * - Une date programmée n'est jamais antidatée à la validation.
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
    @InjectRepository(ArticleRevision)
    private readonly revisionRepository: Repository<ArticleRevision>,
    @InjectRepository(ArticleHistory)
    private readonly historyRepository: Repository<ArticleHistory>,
  ) {}

  // ---------------------------------------------------------------------------
  // Création
  // ---------------------------------------------------------------------------

  async create(dto: CreateArticleDto, userId: number, userRole: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    // Les comptes du staff sont créés par un admin : ils sont de confiance par construction.
    const staff = isStaff(userRole);
    if (!staff && !user.is_phone_verified) {
      throw new ForbiddenException(
        'Votre profil et numéro de téléphone doivent être vérifiés pour publier.',
      );
    }

    const categorie = await this.categorieRepository.findOne({
      where: { id: dto.categorieId },
    });
    if (!categorie) {
      throw new BadRequestException("Cette catégorie n'existe pas.");
    }

    const scheduled = this.parseSchedule(dto.scheduled_at);
    if (scheduled && !staff) {
      throw new ForbiddenException(
        'Seule la rédaction peut programmer une publication.',
      );
    }

    // Seuls les admins publient directement ; un rédacteur soumet à validation.
    let statutFinal = ArticleStatus.BROUILLON;
    if (!staff) {
      statutFinal = ArticleStatus.EN_ATTENTE;
    } else if (dto.statut) {
      statutFinal =
        dto.statut === ArticleStatus.PUBLIE && !isAdmin(userRole)
          ? ArticleStatus.EN_ATTENTE
          : dto.statut;
    }

    const publiee = statutFinal === ArticleStatus.PUBLIE;
    const newArticle = this.articleRepository.create({
      titre: dto.titre,
      contenu: this.cleanContent(dto.contenu),
      image_couverture: dto.image_couverture,
      source_link: dto.source_link,
      statut: statutFinal,
      published_at: publiee ? (scheduled ?? new Date()) : null,
      scheduled_at: publiee ? null : (scheduled ?? null),
      categorie,
    });

    const savedArticle = await this.articleRepository.save(newArticle);

    await this.auteurRepository.save(
      this.auteurRepository.create({
        userId,
        articleId: savedArticle.id,
        role_contribution: dto.is_anonymous ? 'Auteur Anonyme' : 'Auteur',
      }),
    );

    await this.log(savedArticle.id, userId, 'cree', {
      statut: statutFinal,
      published_at: toIso(savedArticle.published_at),
      scheduled_at: toIso(savedArticle.scheduled_at),
    });

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

  // ---------------------------------------------------------------------------
  // Modification
  // ---------------------------------------------------------------------------

  /**
   * - Citoyen : uniquement ses propres articles non publiés (brouillon / en attente).
   * - Staff : article non publié → modification directe ; article publié → révision.
   * - Publier, dépublier et supprimer passent par leurs routes dédiées (admins).
   */
  async update(
    id: number,
    dto: UpdateArticleDto,
    userId: number,
    userRole: string,
  ): Promise<UpdateResult> {
    const viewer: Viewer = { userId, role: userRole };
    const article = await this.loadForWrite(id);
    const staff = isStaff(userRole);

    if (!staff) {
      this.assertAuthor(article, userId);
      if (!EDITABLE_STATUSES.includes(article.statut)) {
        throw new ForbiddenException(
          'Un article publié appartient à la rédaction : demandez-lui une correction.',
        );
      }
      if (dto.scheduled_at !== undefined) {
        throw new ForbiddenException(
          'Seule la rédaction peut programmer une publication.',
        );
      }
    }

    // Un citoyen ne décide jamais du statut : son champ est ignoré.
    const statut = staff ? dto.statut : undefined;

    if (statut === ArticleStatus.PUBLIE) {
      throw new BadRequestException(
        'Utilisez la route de publication pour publier un article.',
      );
    }
    if (statut === ArticleStatus.CORBEILLE) {
      throw new BadRequestException(
        'Seule la suppression par un admin envoie un article à la corbeille.',
      );
    }

    if (staff && article.statut === ArticleStatus.PUBLIE) {
      if (statut !== undefined) {
        throw new BadRequestException(
          'Pour retirer un article publié, utilisez la route de dépublication.',
        );
      }
      if (dto.scheduled_at !== undefined) {
        throw new BadRequestException(
          'Un article déjà publié ne peut plus être programmé.',
        );
      }
      return this.saveRevision(article, dto, viewer);
    }

    return this.editDirectly(article, dto, statut, viewer);
  }

  private async editDirectly(
    article: Article,
    dto: UpdateArticleDto,
    statut: ArticleStatus | undefined,
    viewer: Viewer,
  ): Promise<UpdateResult> {
    const staff = isStaff(viewer.role);
    const before = snapshotOfArticle(article);

    if (dto.categorieId !== undefined) {
      article.categorie = await this.requireCategorie(dto.categorieId);
    }
    if (dto.titre !== undefined) article.titre = dto.titre;
    if (dto.contenu !== undefined) {
      article.contenu = this.cleanContent(dto.contenu);
    }
    if (dto.image_couverture !== undefined) {
      article.image_couverture = dto.image_couverture;
    }
    if (dto.source_link !== undefined) article.source_link = dto.source_link;
    if (statut !== undefined) article.statut = statut;

    const scheduled = staff ? this.parseSchedule(dto.scheduled_at) : undefined;
    if (scheduled !== undefined) article.scheduled_at = scheduled;

    const diff = diffTracked(before, snapshotOfArticle(article));

    // `auteursArticles` n'a été chargé que pour le contrôle d'accès : on ne le persiste pas.
    const { auteursArticles, ...toSave } = article;
    void auteursArticles;
    await this.articleRepository.save(toSave as Article);

    if (diff.champs.length > 0) {
      await this.log(article.id, viewer.userId, 'modifie', diff);
    }
    if (staff) await this.ensureEditor(article.id, viewer.userId);

    return {
      mode: 'direct',
      article: await this.loadFormatted(article.id, viewer),
      revision: null,
    };
  }

  /** Correction d'un article publié : l'article en ligne n'est pas touché. */
  private async saveRevision(
    article: Article,
    dto: UpdateArticleDto,
    viewer: Viewer,
  ): Promise<UpdateResult> {
    let revision = await this.revisionRepository.findOne({
      where: { articleId: article.id, status: RevisionStatus.EN_COURS },
    });
    const isNew = !revision;
    const before: Tracked = revision
      ? snapshotOfRevision(revision)
      : snapshotOfArticle(article);

    if (!revision) {
      revision = this.revisionRepository.create({
        articleId: article.id,
        titre: article.titre,
        contenu: article.contenu,
        image_couverture: article.image_couverture ?? null,
        source_link: article.source_link ?? null,
        categorieId: article.categorie?.id ?? null,
        status: RevisionStatus.EN_COURS,
      });
    }

    if (dto.categorieId !== undefined) {
      await this.requireCategorie(dto.categorieId);
      revision.categorieId = dto.categorieId;
    }
    if (dto.titre !== undefined) revision.titre = dto.titre;
    if (dto.contenu !== undefined) {
      revision.contenu = this.cleanContent(dto.contenu);
    }
    if (dto.image_couverture !== undefined) {
      revision.image_couverture = dto.image_couverture;
    }
    if (dto.source_link !== undefined) revision.source_link = dto.source_link;
    revision.authorId = viewer.userId;

    const saved = await this.revisionRepository.save(revision);
    const diff = diffTracked(before, snapshotOfRevision(saved));

    if (isNew || diff.champs.length > 0) {
      await this.log(article.id, viewer.userId, 'revision_enregistree', {
        revision_id: saved.id,
        ...diff,
      });
    }

    return {
      mode: 'revision',
      article: await this.loadFormatted(article.id, viewer),
      revision: saved,
    };
  }

  // ---------------------------------------------------------------------------
  // Révisions
  // ---------------------------------------------------------------------------

  async getRevision(id: number) {
    await this.loadForWrite(id);
    const revision = await this.revisionRepository.findOne({
      where: { articleId: id, status: RevisionStatus.EN_COURS },
      relations: ['author', 'author.profile'],
    });
    if (!revision) {
      throw new NotFoundException('Aucune révision en cours pour cet article.');
    }

    const { author, authorId, ...rest } = revision;
    return {
      ...rest,
      author: author ? { id: authorId, name: displayName(author) } : null,
    };
  }

  /** Remplace l'article en ligne par sa révision (admins). */
  async applyRevision(id: number, viewer: Viewer) {
    if (!isAdmin(viewer.role)) throw new ForbiddenException('Non autorisé.');

    const article = await this.loadForWrite(id);
    const revision = await this.revisionRepository.findOne({
      where: { articleId: id, status: RevisionStatus.EN_COURS },
    });
    if (!revision) {
      throw new NotFoundException('Aucune révision en cours pour cet article.');
    }

    const before = snapshotOfArticle(article);

    article.titre = revision.titre;
    article.contenu = revision.contenu;
    article.image_couverture = revision.image_couverture;
    article.source_link = revision.source_link;
    if (revision.categorieId) {
      const categorie = await this.categorieRepository.findOne({
        where: { id: revision.categorieId },
      });
      if (categorie) article.categorie = categorie;
    }

    const diff = diffTracked(before, snapshotOfArticle(article));

    const { auteursArticles, ...toSave } = article;
    void auteursArticles;
    await this.articleRepository.save(toSave as Article);

    if (revision.authorId) {
      await this.ensureEditor(id, revision.authorId);
    }

    // Marquée en dernier : en cas d'échec avant, l'application peut être rejouée sans effet de bord.
    revision.status = RevisionStatus.APPLIQUEE;
    revision.applied_at = new Date();
    await this.revisionRepository.save(revision);

    await this.log(id, viewer.userId, 'revision_appliquee', {
      revision_id: revision.id,
      redigee_par: revision.authorId,
      ...diff,
    });

    return this.loadFormatted(id, viewer);
  }

  async abandonRevision(id: number, viewer: Viewer) {
    await this.loadForWrite(id);
    const revision = await this.revisionRepository.findOne({
      where: { articleId: id, status: RevisionStatus.EN_COURS },
    });
    if (!revision) {
      throw new NotFoundException('Aucune révision en cours pour cet article.');
    }

    revision.status = RevisionStatus.ABANDONNEE;
    await this.revisionRepository.save(revision);
    await this.log(id, viewer.userId, 'revision_abandonnee', {
      revision_id: revision.id,
    });

    return { message: 'Révision abandonnée.' };
  }

  // ---------------------------------------------------------------------------
  // Publication, dépublication, suppression, anonymat
  // ---------------------------------------------------------------------------

  /**
   * Publie un article. Si une date a été programmée, elle est respectée tant qu'elle est
   * dans le futur ; une date déjà dépassée n'est jamais appliquée : l'article est publié
   * maintenant, avec la date du jour.
   */
  async publishArticle(id: number, viewer: Viewer) {
    const article = await this.loadForWrite(id);
    if (article.statut === ArticleStatus.PUBLIE) {
      throw new ConflictException('Cet article est déjà publié.');
    }

    const now = new Date();
    const requested = article.scheduled_at
      ? new Date(article.scheduled_at)
      : null;
    const dateDepassee = !!requested && requested.getTime() <= now.getTime();

    article.statut = ArticleStatus.PUBLIE;
    article.published_at = requested && !dateDepassee ? requested : now;
    article.scheduled_at = null;

    const { auteursArticles, ...toSave } = article;
    void auteursArticles;
    await this.articleRepository.save(toSave as Article);

    await this.log(id, viewer.userId, 'publie', {
      published_at: toIso(article.published_at),
      programme_pour: toIso(requested),
      date_depassee: dateDepassee,
    });

    return this.loadFormatted(id, viewer);
  }

  async unpublishArticle(id: number, viewer: Viewer) {
    if (!isAdmin(viewer.role)) throw new ForbiddenException('Non autorisé.');

    const article = await this.loadForWrite(id);
    if (article.statut !== ArticleStatus.PUBLIE) {
      throw new ConflictException("Cet article n'est pas publié.");
    }

    article.statut = ArticleStatus.BROUILLON;
    article.published_at = null;

    const { auteursArticles, ...toSave } = article;
    void auteursArticles;
    await this.articleRepository.save(toSave as Article);
    await this.log(id, viewer.userId, 'depublie');

    return this.loadFormatted(id, viewer);
  }

  /**
   * Suppression logique, réservée aux admins. Refuser un article revient à le supprimer.
   * L'article reste visible dans l'historique de son auteur (« refusé ou supprimé »).
   */
  async remove(id: number, viewer: Viewer) {
    if (!isAdmin(viewer.role)) throw new ForbiddenException('Non autorisé.');

    const article = await this.loadForWrite(id);

    await this.articleRepository.update(id, {
      statut: ArticleStatus.CORBEILLE,
      is_delete: true,
    });
    await this.articleRepository.softDelete(id);
    await this.log(id, viewer.userId, 'supprime', {
      statut_precedent: article.statut,
    });

    return { message: `L'article #${id} a été supprimé.` };
  }

  /**
   * Retire le nom de l'auteur (demande RGPD) sans supprimer l'article :
   * le contenu reste la propriété du journal, seule l'attribution disparaît.
   */
  async anonymize(id: number, viewer: Viewer) {
    if (!isAdmin(viewer.role)) throw new ForbiddenException('Non autorisé.');

    const article = await this.loadForWrite(id);
    const authors = (article.auteursArticles ?? []).filter(
      (pivot) => pivot.role_contribution === 'Auteur',
    );
    if (authors.length === 0) {
      throw new ConflictException(
        "Cet article n'a aucun auteur identifié à anonymiser.",
      );
    }

    await this.auteurRepository.update(
      { articleId: id, role_contribution: 'Auteur' },
      { role_contribution: 'Auteur Anonyme' },
    );
    await this.log(id, viewer.userId, 'anonymise', {
      auteurs: authors.map((pivot) => pivot.userId),
    });

    return this.loadFormatted(id, viewer);
  }

  // ---------------------------------------------------------------------------
  // Lectures
  // ---------------------------------------------------------------------------

  /** Articles publiés et dont la date est atteinte (public), paginés. */
  async findAllPublished(query: ArticleListQueryDto) {
    const base: FindOptionsWhere<Article> = {
      statut: ArticleStatus.PUBLIE,
      is_delete: false,
    };
    if (query.categorieId) base.categorie = { id: query.categorieId };
    if (query.q) base.titre = ILike(`%${escapeLike(query.q)}%`);

    // Une date absente (anciennes données) équivaut à « déjà publié ».
    const where: FindOptionsWhere<Article>[] = [
      { ...base, published_at: LessThanOrEqual(new Date()) },
      { ...base, published_at: IsNull() },
    ];

    const [articles, total] = await this.articleRepository.findAndCount({
      where,
      relations: ARTICLE_RELATIONS,
      order: {
        published_at: { direction: 'DESC', nulls: 'LAST' },
        id: 'DESC',
      },
      ...toSkipTake(query),
    });

    return buildPaginated(
      articles.map((article) => formatArticle(article, false)),
      total,
      query,
    );
  }

  /** Tous les articles, tous statuts (dashboard), paginés. */
  async findAllAdmin(query: AdminArticleListQueryDto, userRole: string) {
    const where: FindOptionsWhere<Article> = { is_delete: false };
    if (query.statut) where.statut = query.statut;
    if (query.categorieId) where.categorie = { id: query.categorieId };
    if (query.q) where.titre = ILike(`%${escapeLike(query.q)}%`);

    const [articles, total] = await this.articleRepository.findAndCount({
      where,
      relations: ARTICLE_RELATIONS,
      order: { created_at: 'DESC', id: 'DESC' },
      ...toSkipTake(query),
    });

    const reveal = isAdmin(userRole);
    return buildPaginated(
      articles.map((article) => formatArticle(article, reveal)),
      total,
      query,
    );
  }

  /** Compteurs du dashboard. `planifie` = publié avec une date encore à venir. */
  async adminStats() {
    const now = new Date();
    const live = { is_delete: false, statut: ArticleStatus.PUBLIE };

    const [brouillon, enAttente, publie, planifie] = await Promise.all([
      this.articleRepository.count({
        where: { is_delete: false, statut: ArticleStatus.BROUILLON },
      }),
      this.articleRepository.count({
        where: { is_delete: false, statut: ArticleStatus.EN_ATTENTE },
      }),
      this.articleRepository.count({
        where: [
          { ...live, published_at: LessThanOrEqual(now) },
          { ...live, published_at: IsNull() },
        ],
      }),
      this.articleRepository.count({
        where: { ...live, published_at: MoreThan(now) },
      }),
    ]);

    return {
      brouillon,
      en_attente: enAttente,
      publie,
      planifie,
      total: brouillon + enAttente + publie + planifie,
    };
  }

  /**
   * Un article. Tant qu'il n'est pas publié (ou que sa date n'est pas atteinte), il n'existe
   * que pour son auteur et le staff ; pour les autres : 404, sans révéler son existence.
   */
  async findOne(id: number, viewer?: Viewer) {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ARTICLE_RELATIONS,
      withDeleted: true,
    });

    if (!article) throw new NotFoundException('Article introuvable.');
    if (article.is_delete || article.deleted_at) {
      throw new GoneException('Article supprimé.');
    }

    if (!this.isPubliclyVisible(article)) {
      const isAuthor = article.auteursArticles?.some(
        (pivot) => viewer && pivot.userId === viewer.userId,
      );
      if (!viewer || (!isStaff(viewer.role) && !isAuthor)) {
        throw new NotFoundException('Article introuvable.');
      }
    }

    return formatArticle(article, isAdmin(viewer?.role));
  }

  /** Historique des contributions d'un citoyen : titre, date et statut uniquement. */
  async findMine(userId: number, query: PaginationQueryDto) {
    const [articles, total] = await this.articleRepository.findAndCount({
      where: {
        auteursArticles: { userId, role_contribution: In(AUTHOR_ROLES) },
      },
      withDeleted: true,
      order: { created_at: 'DESC', id: 'DESC' },
      ...toSkipTake(query),
    });

    return buildPaginated(
      articles.map((article) => ({
        id: article.id,
        titre: article.titre,
        date: article.published_at ?? article.created_at,
        statut: article.deleted_at
          ? CITIZEN_STATUS[ArticleStatus.CORBEILLE]
          : CITIZEN_STATUS[article.statut],
      })),
      total,
      query,
    );
  }

  /** Historique d'audit d'un article (admins). */
  async getHistory(id: number, query: PaginationQueryDto) {
    await this.loadForWrite(id, true);

    const [rows, total] = await this.historyRepository.findAndCount({
      where: { articleId: id },
      relations: ['user', 'user.profile'],
      order: { created_at: 'DESC', id: 'DESC' },
      ...toSkipTake(query),
    });

    return buildPaginated(
      rows.map((row) => ({
        id: row.id,
        action: row.action,
        details: row.details,
        created_at: row.created_at,
        user: row.user ? { id: row.userId, name: displayName(row.user) } : null,
      })),
      total,
      query,
    );
  }

  // ---------------------------------------------------------------------------
  // Utilitaires
  // ---------------------------------------------------------------------------

  /** Charge un article pour une écriture : 404 s'il n'existe pas, 410 s'il est supprimé. */
  private async loadForWrite(
    id: number,
    allowDeleted = false,
  ): Promise<Article> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ['categorie', 'auteursArticles'],
      withDeleted: true,
    });
    if (!article) throw new NotFoundException('Article introuvable.');
    if (
      !allowDeleted &&
      (article.is_delete ||
        article.deleted_at ||
        article.statut === ArticleStatus.CORBEILLE)
    ) {
      throw new GoneException('Article supprimé.');
    }
    return article;
  }

  /** Relecture après écriture : l'appelant a déjà été autorisé. */
  private async loadFormatted(id: number, viewer: Viewer) {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: ARTICLE_RELATIONS,
    });
    if (!article) throw new NotFoundException('Article introuvable.');
    return formatArticle(article, isAdmin(viewer.role));
  }

  private isPubliclyVisible(article: Article): boolean {
    return (
      article.statut === ArticleStatus.PUBLIE &&
      (!article.published_at ||
        new Date(article.published_at).getTime() <= Date.now())
    );
  }

  private assertAuthor(article: Article, userId: number): void {
    const isAuthor = article.auteursArticles?.some(
      (pivot) =>
        pivot.userId === userId &&
        AUTHOR_ROLES.includes(pivot.role_contribution ?? ''),
    );
    if (!isAuthor) throw new ForbiddenException('Non autorisé.');
  }

  private async requireCategorie(id: number): Promise<Categorie> {
    const categorie = await this.categorieRepository.findOne({ where: { id } });
    if (!categorie) {
      throw new BadRequestException("Cette catégorie n'existe pas.");
    }
    return categorie;
  }

  /** Le staff qui corrige un article est crédité « Éditeur » (une seule fois). */
  private async ensureEditor(articleId: number, userId: number): Promise<void> {
    const existing = await this.auteurRepository.findOne({
      where: { articleId, userId },
    });
    if (existing) return;
    await this.auteurRepository.save(
      this.auteurRepository.create({
        articleId,
        userId,
        role_contribution: 'Éditeur',
      }),
    );
  }

  /** Assainit le HTML et refuse un contenu vide une fois nettoyé (ex. uniquement un `<script>`). */
  private cleanContent(html: string): string {
    const clean = sanitizeArticleHtml(html ?? '');
    if (!clean.trim()) {
      throw new BadRequestException('Le contenu est vide ou invalide.');
    }
    return clean;
  }

  /**
   * Valide une date de programmation : dans le futur et dans les 7 jours.
   * `undefined` = non fourni, `null` = annulation de la programmation.
   */
  private parseSchedule(
    value: string | null | undefined,
  ): Date | null | undefined {
    if (value === undefined || value === null) return value;

    const date = new Date(value);
    const now = Date.now();
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Date de programmation invalide.');
    }
    if (date.getTime() <= now) {
      throw new BadRequestException(
        'La date de programmation doit être dans le futur.',
      );
    }
    if (date.getTime() > now + MAX_SCHEDULE_DAYS * DAY_MS) {
      throw new BadRequestException(
        `La programmation est limitée à ${MAX_SCHEDULE_DAYS} jours.`,
      );
    }
    return date;
  }

  private async log(
    articleId: number,
    userId: number | null,
    action: ArticleHistoryAction,
    details?: Record<string, unknown>,
  ): Promise<void> {
    await this.historyRepository.save(
      this.historyRepository.create({
        articleId,
        userId,
        action,
        details: details ?? null,
      }),
    );
  }
}
