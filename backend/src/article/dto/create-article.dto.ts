import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  IsDateString,
  IsEnum,
  IsBoolean,
  IsUrl,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArticleStatus } from '../entities/article.entity';

export class CreateArticleDto {
  @ApiProperty({ example: 'Mon article', description: "Titre de l'article" })
  @IsString()
  @IsNotEmpty({ message: 'Le titre est obligatoire' })
  @MaxLength(255)
  @Matches(/^[^<>]*$/, {
    message: 'Le titre ne peut pas contenir de balises HTML',
  })
  titre!: string;

  @ApiProperty({ example: '<p>Contenu...</p>', description: 'HTML généré' })
  @IsString()
  @IsNotEmpty({ message: 'Le contenu est obligatoire' })
  contenu!: string;

  @ApiPropertyOptional({ example: '/uploads/3f2a.jpg' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  @Matches(/^(https?:\/\/|\/uploads\/)/, {
    message: "L'image doit être une URL http(s) ou un fichier téléversé",
  })
  image_couverture?: string;

  @ApiPropertyOptional({ example: 'https://...' })
  @IsOptional()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'Le lien source doit être une URL http(s) valide' },
  )
  @MaxLength(255)
  source_link?: string;

  @ApiPropertyOptional({ enum: ArticleStatus })
  @IsEnum(ArticleStatus, { message: 'Statut invalide' })
  @IsOptional()
  statut?: ArticleStatus;

  @ApiPropertyOptional({
    description:
      'Publication programmée (staff uniquement, 7 jours maximum). null pour annuler.',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  scheduled_at?: string | null;

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
