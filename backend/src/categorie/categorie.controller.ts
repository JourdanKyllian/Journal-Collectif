import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './categorie.service';
import { CreateCategoryDto } from './dto/create-categorie.dto';
import { UpdateCategoryDto } from './dto/update-categorie.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

/**
 * Contrôleur gérant les points d'accès liés aux catégories.
 * Fournit les routes pour la création, la lecture, la mise à jour et la suppression des catégories.
 * Les routes de modification nécessitent une authentification JWT et des privilèges spécifiques.
 */
@ApiTags('Categories')
@ApiBearerAuth()
@Controller('category')
export class CategoryController {
  /**
   * Initialise le CategoryController.
   *
   * @param {CategoryService} categoryService - Le service gérant la logique métier des catégories.
   */
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * Récupère la liste de toutes les catégories.
   * Cette route est accessible publiquement.
   *
   * @returns {Promise<any[]>} Une liste de catégories.
   */
  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  /**
   * Récupère les détails d'une catégorie spécifique.
   * Cette route est accessible publiquement.
   *
   * @param {string} id - L'identifiant unique de la catégorie.
   * @returns {Promise<any>} Les informations de la catégorie demandée.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(+id);
  }

  /**
   * Crée une nouvelle catégorie.
   * Réservé aux utilisateurs ayant le rôle 'Admin' ou 'moderateur'.
   *
   * @param {CreateCategoryDto} createCategoryDto - L'objet de transfert de données contenant les détails de la catégorie à créer.
   * @returns {Promise<any>} La catégorie nouvellement créée.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'moderateur')
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  /**
   * Met à jour une catégorie existante.
   * Réservé aux utilisateurs ayant le rôle 'Admin' ou 'moderateur'.
   *
   * @param {string} id - L'identifiant unique de la catégorie à modifier.
   * @param {UpdateCategoryDto} updateCategoryDto - L'objet de transfert de données contenant les champs à mettre à jour.
   * @returns {Promise<any>} La catégorie mise à jour.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'moderateur')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(+id, updateCategoryDto);
  }

  /**
   * Supprime une catégorie existante.
   * Réservé aux utilisateurs ayant le rôle 'Admin' ou 'moderateur'.
   *
   * @param {string} id - L'identifiant unique de la catégorie à supprimer.
   * @returns {Promise<any>} Le résultat de l'opération de suppression.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Admin', 'moderateur')
  remove(@Param('id') id: string) {
    return this.categoryService.remove(+id);
  }
}
