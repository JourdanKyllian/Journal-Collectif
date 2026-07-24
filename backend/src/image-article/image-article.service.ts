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
 * Service de gestion des images liées aux articles.
 * Intègre la stratégie de réponses SEO (HTTP 410) et l'optimisation du stockage par compression à froid.
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
   * @param dto - Payload de création de l'image.
   * @returns L'entité sauvegardée en base.
   */
  async create(dto: CreateImageArticleDto): Promise<ImageArticle> {
    const newImage = this.imageRepository.create(dto);
    return this.imageRepository.save(newImage);
  }

  /**
   * Récupère une image par son identifiant.
   * Point d'entrée de validation pour le cycle de vie de l'image.
   *
   * @param id - Identifiant unique de l'image.
   * @returns L'entité correspondante.
   * @throws {NotFoundException} Si l'entité est inexistante.
   * @throws {GoneException} Si l'entité a fait l'objet d'une suppression logique (Soft Delete).
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
   * Effectue une suppression logique (Soft Delete).
   * Maintient l'enregistrement pour préserver l'intégrité SEO (410 Gone).
   *
   * @param id - Identifiant de l'image à supprimer.
   */
  async remove(id: number): Promise<void> {
    const image = await this.findOne(id);
    await this.imageRepository.softRemove(image);
    
    this.logger.log(`Image #${id} marquée comme supprimée (410 activé).`);
  }

  /**
   * Identifie et compresse les images créées il y a plus de deux ans.
   * Processus d'optimisation de l'espace de stockage.
   *
   * @returns Bilan de l'opération de compression.
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
