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
import { CategorieService } from './categorie.service';
import { CreateCategorieDto } from './dto/create-categorie.dto';
import { UpdateCategorieDto } from './dto/update-categorie.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

/**
 * Contrôleur gérant les points d'accès liés aux catégories.
 * Fournit les routes pour la création, la lecture, la mise à jour et la suppression (Soft Delete) des catégories.
 */
@ApiTags('Categories')
@ApiBearerAuth()
@Controller('categorie')
export class CategorieController {
  constructor(private readonly categorieService: CategorieService) {}

  /**
   * Récupère la liste de toutes les catégories.
   * Accessible publiquement.
   */
  @Get()
  findAll() {
    return this.categorieService.findAll();
  }

  /**
   * Récupère les détails d'une catégorie spécifique.
   * Accessible publiquement.
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categorieService.findOne(+id);
  }

  /**
   * Crée une nouvelle catégorie.
   * Réservé aux administrateurs.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  create(@Body() createCategorieDto: CreateCategorieDto) {
    return this.categorieService.create(createCategorieDto);
  }

  /**
   * Met à jour une catégorie existante.
   * Réservé aux administrateurs.
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  update(
    @Param('id') id: string,
    @Body() updateCategorieDto: UpdateCategorieDto,
  ) {
    return this.categorieService.update(+id, updateCategorieDto);
  }

  /**
   * Supprime une catégorie existante de manière logique (Soft Delete).
   * Réservé aux administrateurs.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'admin')
  remove(@Param('id') id: string) {
    return this.categorieService.remove(+id);
  }
}
