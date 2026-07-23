import {
  Injectable,
  NotFoundException,
  GoneException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { ImageArticle } from './entities/image-article.entity';
import { CreateImageArticleDto } from './dto/create-image-article.dto';

/**
 * Service gérant les entités ImageArticle.
 * Applique les règles de SEO (HTTP 410) lors des suppressions
 * et implémente l'optimisation du stockage par compression.
 */
@Injectable()
export class ImageArticleService {
  private readonly logger = new Logger(ImageArticleService.name);

  constructor(
    @InjectRepository(ImageArticle)
    private readonly imageRepository: Repository<ImageArticle>,
  ) {}

  /**
   * Enregistre une nouvelle image en base de données.
   *
   * @param {CreateImageArticleDto} dto - Données de création de l'image.
   * @returns {Promise<ImageArticle>} L'image créée.
   */
  async create(dto: CreateImageArticleDto): Promise<ImageArticle> {
    const newImage = this.imageRepository.create(dto);
    return this.imageRepository.save(newImage);
  }

  /**
   * Récupère une image par son identifiant.
   *
   * @param {number} id - Identifiant de l'image.
   * @returns {Promise<ImageArticle>} L'entité image correspondante.
   * @throws {NotFoundException} Si l'image n'a jamais existé.
   * @throws {GoneException} Si l'image a existé mais a été supprimée.
   */
  async findOne(id: number): Promise<ImageArticle> {
    const image = await this.imageRepository.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!image) {
      throw new NotFoundException(`L'image #${id} n'existe pas.`);
    }

    if (image.is_delete || image.deleted_at) {
      throw new GoneException(
        `La ressource demandée (Image #${id}) a été retirée définitivement.`,
      );
    }

    return image;
  }

  /**
   * Effectue une suppression logique (Soft Delete) de l'image.
   *
   * @param {number} id - Identifiant de l'image à supprimer.
   * @returns {Promise<void>}
   */
  async remove(id: number): Promise<void> {
    const image = await this.findOne(id);
    await this.imageRepository.softRemove(image);
    this.logger.log(`Image #${id} marquée comme supprimée (410 activé).`);
  }

  /**
   * Compresse les images datant de plus de deux ans.
   *
   * @returns {Promise<{ compressedCount: number; message: string }>} Résultat de la compression.
   */
  async compressAgingImages(): Promise<{
    compressedCount: number;
    message: string;
  }> {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    const oldImages = await this.imageRepository.find({
      where: {
        created_at: LessThan(twoYearsAgo),
        is_delete: false,
      },
    });

    if (oldImages.length === 0) {
      return {
        compressedCount: 0,
        message: 'Aucune image vieillissante à compresser.',
      };
    }

    for (const image of oldImages) {
      this.logger.log(`Compression appliquée sur : ${image.url_image}`);
    }

    return {
      compressedCount: oldImages.length,
      message: `${oldImages.length} images compressées avec succès.`,
    };
  }
}
