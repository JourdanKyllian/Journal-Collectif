import {
  ConflictException,
  Injectable,
  NotFoundException,
  GoneException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categorie } from './entities/categorie.entity';
import { CreateCategorieDto } from './dto/create-categorie.dto';
import { UpdateCategorieDto } from './dto/update-categorie.dto';

/**
 * Service de gestion des catégories.
 * Implémente la validation centralisée et la stratégie de réponses SEO (HTTP 410).
 */
@Injectable()
export class CategorieService {
  constructor(
    @InjectRepository(Categorie)
    private readonly categorieRepository: Repository<Categorie>,
  ) {}

  /**
   * Crée une nouvelle catégorie.
   *
   * @param createCategorieDto - Payload de création de la catégorie.
   * @returns L'entité sauvegardée en base.
   * @throws {ConflictException} En cas de doublon sur le libellé (inclut les entités supprimées logiquement).
   */
  async create(createCategorieDto: CreateCategorieDto): Promise<Categorie> {
    const existing = await this.categorieRepository.findOne({
      where: { libelle: createCategorieDto.libelle },
      withDeleted: true,
    });

    if (existing) {
      throw new ConflictException(
        `La catégorie "${createCategorieDto.libelle}" existe déjà.`,
      );
    }

    const newCategorie = this.categorieRepository.create(createCategorieDto);
    return this.categorieRepository.save(newCategorie);
  }

  /**
   * Récupère la liste des catégories actives.
   * Exclut automatiquement les entités supprimées logiquement.
   *
   * @returns Liste des catégories triées par date de création décroissante.
   */
  findAll(): Promise<Categorie[]> {
    return this.categorieRepository.find({
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
  async findOne(id: number): Promise<Categorie> {
    const categorie = await this.categorieRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!categorie) {
      throw new NotFoundException('Catégorie introuvable.');
    }

    if (categorie.is_delete || categorie.deleted_at) {
      throw new GoneException(
        `La catégorie #${id} a été retirée définitivement.`,
      );
    }

    return categorie;
  }

  /**
   * Met à jour partiellement ou totalement une catégorie.
   *
   * @param id - Identifiant de la catégorie.
   * @param updateCategorieDto - Payload de mise à jour.
   * @returns L'entité mise à jour.
   */
  async update(
    id: number,
    updateCategorieDto: UpdateCategorieDto,
  ): Promise<Categorie> {
    const categorie = await this.findOne(id);

    Object.assign(categorie, updateCategorieDto);
    return this.categorieRepository.save(categorie);
  }

  /**
   * Effectue une suppression logique (Soft Delete).
   * Maintient l'intégrité référentielle en base de données.
   *
   * @param id - Identifiant de la catégorie.
   * @returns Objet de confirmation contenant l'entité altérée.
   */
  async remove(id: number): Promise<{ message: string; categorie: Categorie }> {
    const categorie = await this.findOne(id);
    const removedCategorie = await this.categorieRepository.softRemove(categorie);

    return {
      message: `La catégorie #${id} a été supprimée avec succès.`,
      categorie: removedCategorie,
    };
  }
}
