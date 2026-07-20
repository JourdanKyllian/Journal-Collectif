import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
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
 *
 * @interface RequestWithUser
 * @extends {Request}
 * @property {Object} user - Les données de l'utilisateur authentifié extraites du JWT.
 * @property {number} user.userId - L'identifiant unique de l'utilisateur.
 * @property {string} user.role - Le rôle de l'utilisateur (ex: 'Admin', 'user').
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
  /**
   * Initialise le ArticleController.
   *
   * @param {ArticleService} articleService - Le service gérant la logique métier des articles.
   */
  constructor(private readonly articleService: ArticleService) {}

  /**
   * Crée ou propose un nouvel article.
   * Nécessite l'authentification de l'utilisateur.
   *
   * @param {CreateArticleDto} createArticleDto - L'objet de transfert de données contenant les détails de l'article.
   * @param {RequestWithUser} req - La requête HTTP contenant le contexte de l'utilisateur authentifié.
   * @returns {Promise<any>} L'article nouvellement créé.
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
   *
   * @param {string} id - L'identifiant unique de l'article à mettre à jour.
   * @param {UpdateArticleDto} updateArticleDto - L'objet de transfert de données contenant les champs à mettre à jour.
   * @param {RequestWithUser} req - La requête HTTP contenant le contexte de l'utilisateur authentifié.
   * @returns {Promise<any>} L'article mis à jour.
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
   * Valide et publie un article.
   * Réservé aux utilisateurs ayant le rôle 'Admin' ou 'moderateur'.
   *
   * @param {string} id - L'identifiant unique de l'article à publier.
   * @returns {Promise<any>} L'article publié.
   */
  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'moderateur')
  publish(@Param('id') id: string) {
    return this.articleService.publishArticle(+id);
  }

  /**
   * Récupère tous les articles publiés accessibles publiquement.
   * Ne nécessite pas d'authentification.
   *
   * @returns {Promise<any[]>} Une liste d'articles publiés.
   */
  @Get('published')
  findAll() {
    return this.articleService.findAllPublished();
  }
}