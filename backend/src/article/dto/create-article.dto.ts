import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArticleStatus } from '../entities/article.entity';

export class CreateArticleDto {
  @ApiProperty({ 
    example: 'Mon super article de test', 
    description: 'Le titre de l\'article' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Le titre est obligatoire' })
  @MaxLength(255, { message: 'Le titre ne doit pas dépasser 255 caractères' })
  titre!: string;

  @ApiProperty({ 
    example: 'Le contenu de mon article pour voir si tout fonctionne bien.', 
    description: 'Contenu principal' 
  })
  @IsString()
  @IsNotEmpty({ message: 'Le contenu est obligatoire' })
  contenu!: string;

  @ApiPropertyOptional({ 
    example: 'https://cdn.example.com/image.jpg' 
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  image_couverture?: string;

  @ApiPropertyOptional({ 
    example: 'https://example.com' 
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  source_link?: string;

  @ApiPropertyOptional({ 
    enum: ArticleStatus, 
    default: ArticleStatus.BROUILLON,
    description: 'Le statut de l\'article'
  })
  @IsEnum(ArticleStatus, { message: 'Statut invalide' })
  @IsOptional()
  statut?: ArticleStatus;

  @ApiPropertyOptional({ 
    description: 'Géré automatiquement par le backend lors de la publication', 
    example: '2026-07-21T10:00:00Z' 
  })
  @IsDateString(
    {},
    { message: 'La date de publication doit être une date valide' },
  )
  @IsOptional()
  published_at?: Date;

  @ApiProperty({ 
    example: 1, 
    description: 'ID de la catégorie parente' 
  })
  @IsInt({ message: "L'ID de la catégorie doit être un nombre entier" })
  @IsNotEmpty({ message: "L'article doit appartenir à une catégorie" })
  categoryId!: number;
}