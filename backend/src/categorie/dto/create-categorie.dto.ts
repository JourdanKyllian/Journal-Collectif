import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Le libellé de la catégorie est obligatoire' })
  @MaxLength(100, { message: 'Le libellé ne doit pas dépasser 100 caractères' })
  libelle!: string;

  @IsString()
  @IsOptional()
  description?: string;
}
