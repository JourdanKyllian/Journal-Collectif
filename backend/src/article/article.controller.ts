import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ArticleService } from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

/**
 * Interface représentant la requête HTTP étendue avec les données de l'utilisateur authentifié.
 */
interface RequestWithUser extends Request {
  user: {
    userId: number;
    role: string;
  };
}

/**
 * Contrôleur gérant les points d'accès liés aux articles.
 * Fournit les routes pour la création, la modification, la publication et la récupération des articles.
 * Les routes protégées nécessitent une authentification JWT.
 */
@ApiTags('Articles')
@ApiBearerAuth()
@Controller('article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  /**
   * Crée ou propose un nouvel article.
   * Nécessite l'authentification de l'utilisateur.
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() createArticleDto: CreateArticleDto,
    @Req() req: RequestWithUser,
  ) {
    return this.articleService.create(
      createArticleDto,
      req.user.userId,
      req.user.role,
    );
  }

  /**
   * Met à jour un article existant (brouillon ou correction).
   * Nécessite l'authentification de l'utilisateur.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @Req() req: RequestWithUser,
  ) {
    return this.articleService.update(
      +id,
      updateArticleDto,
      req.user.userId,
      req.user.role,
    );
  }

  /**
   * Valide et publie un article manuellement.
   * Réservé aux utilisateurs ayant le rôle 'super_admin' ou 'admin'.
   */
  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin') // CORRECTION ICI
  publish(@Param('id') id: string) {
    return this.articleService.publishArticle(+id);
  }

  /**
   * Récupère tous les articles publiés accessibles publiquement.
   * Ne nécessite pas d'authentification.
   */
  @Get('published')
  findAll() {
    return this.articleService.findAllPublished();
  }

  /**
   * Récupère l'intégralité des articles (brouillons, en attente, publiés) pour le Dashboard.
   * Nécessite l'authentification et des droits d'administration ou de rédaction.
   */
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin', 'redacteur') // CORRECTION ICI
  findAllAdmin() {
    return this.articleService.findAllAdmin();
  }

  /**
   * Récupère les détails d'un article spécifique.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articleService.findOne(+id);
  }

  /**
   * Supprime un article de manière logique (Soft Delete).
   * Seul l'auteur, un Admin ou un modérateur peut effectuer cette action.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.articleService.remove(+id, req.user.userId, req.user.role);
  }
}
