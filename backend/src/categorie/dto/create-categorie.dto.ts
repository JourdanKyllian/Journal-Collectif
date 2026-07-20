import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Libellé de la catégorie', example: 'Culture' })
  @IsString()
  @IsNotEmpty({ message: 'Le libellé de la catégorie est obligatoire' })
  @MaxLength(100, { message: 'Le libellé ne doit pas dépasser 100 caractères' })
  libelle!: string;

  @ApiProperty({ description: 'Description détaillée', example: 'Actualités culturelles de la ville' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Icône (Emoji ou classe CSS)', example: '🎭' })
  @IsString()
  @IsNotEmpty({ message: 'L\'icône est obligatoire' })
  @MaxLength(10)
  icon!: string;

  @ApiProperty({ description: 'URL du bandeau de la catégorie', example: 'https://cdn.example.com/bandeau.jpg' })
  @IsString()
  @IsNotEmpty({ message: 'L\'image de bandeau est obligatoire' })
  image_bandeau_url!: string;
}