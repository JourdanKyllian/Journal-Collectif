import {
  IsString,
  IsNotEmpty,
  IsIn,
  IsOptional,
  IsBoolean,
  IsDateString,
  MaxLength,
} from 'class-validator';
import type { DealCategory, DealStatut } from '../entities/bon-plan.entity';

export class CreateBonPlanDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  titre!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsIn(['billetterie', 'concours', 'code_promo', 'restauration'])
  categorie!: DealCategory;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  partenaire!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  valeur!: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  codePromo?: string;

  @IsString()
  @IsOptional()
  lienUrl?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsDateString()
  @IsOptional()
  dateDebut?: string;

  @IsDateString()
  @IsNotEmpty()
  dateFin!: string;

  @IsBoolean()
  @IsOptional()
  estExclusif?: boolean;

  @IsString()
  @IsIn(['actif', 'programme', 'expire', 'en_attente'])
  @IsOptional()
  statut?: DealStatut;

  @IsString()
  @IsOptional()
  conditions?: string;
}
