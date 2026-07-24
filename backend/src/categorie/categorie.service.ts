import {
  ConflictException,
  Injectable,
  NotFoundException,
  GoneException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/categorie.entity';
import { CreateCategoryDto } from './dto/create-categorie.dto';
import { UpdateCategoryDto } from './dto/update-categorie.dto';

/**
 * Service de gestion des catégories.
 * Implémente la validation centralisée et la stratégie de réponses SEO (HTTP 410).
 */
@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Crée une nouvelle catégorie.
   *
   * @param createCategoryDto - Payload de création de la catégorie.
   * @returns L'entité sauvegardée en base.
   * @throws {ConflictException} En cas de doublon sur le libellé (inclut les entités supprimées logiquement).
   */
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const existing = await this.categoryRepository.findOne({
      where: { libelle: createCategoryDto.libelle },
      withDeleted: true,
    });

    if (existing) {
      throw new ConflictException(
        `La catégorie "${createCategoryDto.libelle}" existe déjà.`,
      );
    }

    const newCategory = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(newCategory);
  }

  /**
   * Récupère la liste des catégories actives.
   * Exclut automatiquement les entités supprimées logiquement.
   *
   * @returns Liste des catégories triées par date de création décroissante.
   */
  findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Récupère une catégorie par son identifiant.
   * Point d'entrée de validation pour les opérations de mutation (update, remove).
   *
   * @param id - Identifiant unique de la catégorie.
   * @returns L'entité correspondante.
   * @throws {NotFoundException} Si l'entité est inexistante.
   * @throws {GoneException} Si l'entité a fait l'objet d'une suppression logique (Soft Delete).
   */
  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!category) {
      throw new NotFoundException('Catégorie introuvable.');
    }

    if (category.is_delete || category.deleted_at) {
      throw new GoneException(
        `La catégorie #${id} a été retirée définitivement.`,
      );
    }

    return category;
  }

  /**
   * Met à jour partiellement ou totalement une catégorie.
   *
   * @param id - Identifiant de la catégorie.
   * @param updateCategoryDto - Payload de mise à jour.
   * @returns L'entité mise à jour.
   */
  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id);

    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  /**
   * Effectue une suppression logique (Soft Delete).
   * Maintient l'intégrité référentielle en base de données.
   *
   * @param id - Identifiant de la catégorie.
   * @returns Objet de confirmation contenant l'entité altérée.
   */
  async remove(id: number): Promise<{ message: string; category: Category }> {
    const category = await this.findOne(id);
    const removedCategory = await this.categoryRepository.softRemove(category);

    return {
      message: `La catégorie #${id} a été supprimée avec succès.`,
      category: removedCategory,
    };
  }
}
