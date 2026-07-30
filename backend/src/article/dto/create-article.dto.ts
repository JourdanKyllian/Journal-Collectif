import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  IsDateString,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArticleStatus } from '../entities/article.entity';

export class CreateArticleDto {
  @ApiProperty({ example: 'Mon article', description: "Titre de l'article" })
  @IsString()
  @IsNotEmpty({ message: 'Le titre est obligatoire' })
  @MaxLength(255)
  titre!: string;

  @ApiProperty({ example: '<p>Contenu...</p>', description: 'HTML généré' })
  @IsString()
  @IsNotEmpty({ message: 'Le contenu est obligatoire' })
  contenu!: string;

  @ApiPropertyOptional({ example: 'https://...' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  image_couverture?: string;

  @ApiPropertyOptional({ example: 'https://...' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  source_link?: string;

  @ApiPropertyOptional({ enum: ArticleStatus })
  @IsEnum(ArticleStatus, { message: 'Statut invalide' })
  @IsOptional()
  statut?: ArticleStatus;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  published_at?: Date;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  categorieId!: number;

  /**
   * Spécifie si l'utilisateur souhaite rester anonyme (RGPD).
   */
  @ApiPropertyOptional({ example: true, description: 'Anonymat RGPD' })
  @IsBoolean()
  @IsOptional()
  is_anonymous?: boolean;
}
