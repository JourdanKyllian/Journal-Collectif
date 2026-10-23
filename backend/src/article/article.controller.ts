import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ArticleService, Viewer } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import {
  AdminArticleListQueryDto,
  ArticleListQueryDto,
} from './dto/article-list-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/pagination/pagination';

/** Requête d'une route protégée : `user` est renseigné par `JwtAuthGuard`. */
interface RequestWithUser extends Request {
  user: Viewer;
}

/** Requête d'une route publique : `user` n'est renseigné que si un token valide est présenté. */
interface RequestWithOptionalUser {
  user?: Viewer | null;
}

const viewerOf = (req: RequestWithUser): Viewer => ({
  userId: req.user.userId,
  role: req.user.role,
});

/**
 * Points d'accès des articles. Les droits sont détaillés dans `ArticleService` :
 * le contrôleur ne fait que filtrer par rôle, le service applique les règles métier.
 */
@ApiTags('Articles')
@ApiBearerAuth()
@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  /** Propose un article. Citoyen → en attente ; admin → publication directe possible. */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateArticleDto, @Req() req: RequestWithUser) {
    return this.articleService.create(dto, req.user.userId, req.user.role);
  }

  /** Historique des contributions du citoyen connecté (titre, date, statut). */
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  findMine(@Query() query: PaginationQueryDto, @Req() req: RequestWithUser) {
    return this.articleService.findMine(req.user.userId, query);
  }

  /** Articles publiés, paginés (public). */
  @Get('published')
  findAll(@Query() query: ArticleListQueryDto) {
    return this.articleService.findAllPublished(query);
  }

  /** Tous les articles pour le dashboard (staff). */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'redacteur')
  findAllAdmin(
    @Query() query: AdminArticleListQueryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.articleService.findAllAdmin(query, req.user.role);
  }

  /** Compteurs par statut pour le dashboard (staff). */
  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'redacteur')
  stats() {
    return this.articleService.adminStats();
  }

  /** Un article. Non publié : visible de son auteur et du staff uniquement. */
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithOptionalUser,
  ) {
    return this.articleService.findOne(id, req.user ?? undefined);
  }

  /**
   * Modifie un article. Citoyen : ses articles non publiés. Staff : modification directe
   * si non publié, sinon création/mise à jour d'une révision.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateArticleDto,
    @Req() req: RequestWithUser,
  ) {
    return this.articleService.update(id, dto, req.user.userId, req.user.role);
  }

  /** Publie un article (admins). Une date programmée dépassée n'est jamais antidatée. */
  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  publish(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.articleService.publishArticle(id, viewerOf(req));
  }

  /** Retire un article de la publication (admins). */
  @Patch(':id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  unpublish(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.articleService.unpublishArticle(id, viewerOf(req));
  }

  /** Retire le nom de l'auteur sans supprimer l'article (admins, demande RGPD). */
  @Patch(':id/anonymize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  anonymize(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.articleService.anonymize(id, viewerOf(req));
  }

  /** Révision en cours d'un article publié (staff). */
  @Get(':id/revision')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'redacteur')
  getRevision(@Param('id', ParseIntPipe) id: number) {
    return this.articleService.getRevision(id);
  }

  /** Applique la révision à l'article en ligne (admins). */
  @Patch(':id/revision/apply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  applyRevision(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.articleService.applyRevision(id, viewerOf(req));
  }

  /** Abandonne la révision en cours (staff). */
  @Delete(':id/revision')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'redacteur')
  abandonRevision(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.articleService.abandonRevision(id, viewerOf(req));
  }

  /** Historique daté des actions sur un article (admins). */
  @Get(':id/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  history(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: PaginationQueryDto,
  ) {
    return this.articleService.getHistory(id, query);
  }

  /** Supprime (ou refuse) un article : réservé aux admins. */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return this.articleService.remove(id, viewerOf(req));
  }
}
