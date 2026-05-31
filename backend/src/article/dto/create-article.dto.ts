import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsInt,
  IsDateString,
} from 'class-validator';

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty({ message: 'Le titre est obligatoire' })
  @MaxLength(255, { message: 'Le titre ne doit pas dépasser 255 caractères' })
  titre!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le contenu est obligatoire' })
  contenu!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  image_couverture?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  source_link?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  statut?: string; // ex: 'brouillon' ou 'publie'

  @IsDateString(
    {},
    { message: 'La date de publication doit être une date valide' },
  )
  @IsOptional()
  published_at?: Date;

  @IsInt({ message: "L'ID de la catégorie doit être un nombre entier" })
  @IsNotEmpty({ message: "L'article doit appartenir à une catégorie" })
  categoryId!: number;
}
