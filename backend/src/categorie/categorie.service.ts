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
 * Service gérant la logique métier des catégories.
 * Intègre les règles strictes de référencement (SEO) via les codes HTTP.
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
   * @param {CreateCategoryDto} createCategoryDto - Données de création.
   * @returns {Promise<Category>} L'entité créée.
   * @throws {ConflictException} Si le libellé existe déjà.
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
   * Récupère toutes les catégories actives.
   *
   * @returns {Promise<Category[]>} Liste des catégories.
   */
  findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Récupère une catégorie par son identifiant.
   *
   * @param {number} id - L'identifiant de la catégorie.
   * @returns {Promise<Category>} L'entité correspondante.
   * @throws {NotFoundException} Si la catégorie n'a jamais existé.
   * @throws {GoneException} Si la catégorie a été supprimée (Soft Delete).
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
   * Met à jour une catégorie existante.
   *
   * @param {number} id - L'identifiant de la catégorie.
   * @param {UpdateCategoryDto} updateCategoryDto - Données de mise à jour.
   * @returns {Promise<Category>} La catégorie mise à jour.
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
   * Effectue une suppression logique (Soft Delete) de la catégorie.
   *
   * @param {number} id - L'identifiant de la catégorie à supprimer.
   * @returns {Promise<{ message: string; category: Category }>} Confirmation de suppression.
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
