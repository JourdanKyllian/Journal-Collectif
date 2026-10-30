import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { JournalStatut } from '../tenant.constants';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CommuneDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  @Transform(trim)
  nom!: string;

  @ApiProperty({ example: '06030', description: 'Code INSEE (5 caractères)' })
  @Matches(/^(\d{5}|2[AB]\d{3})$/, { message: 'Code INSEE invalide' })
  code_insee!: string;

  @ApiProperty({ example: '06000' })
  @Matches(/^\d{5}$/, { message: 'Le code postal doit comporter 5 chiffres' })
  code_postal!: string;
}

export class InitialSuperAdminDto {
  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(trim)
  firstname!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(trim)
  lastname!: string;

  @ApiPropertyOptional({
    description:
      'Mot de passe provisoire. Absent : il est généré et renvoyé une seule fois.',
  })
  @IsOptional()
  @IsString()
  @MinLength(14)
  @MaxLength(100)
  password?: string;
}

export class ProvisionJournalDto {
  @ApiProperty({ example: 'journal-de-grasse' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug invalide : minuscules, chiffres et tirets uniquement',
  })
  @MinLength(3)
  @MaxLength(63)
  slug!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(trim)
  nom_journal!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @Transform(trim)
  type_journal?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Transform(trim)
  nom_ville!: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email_contact?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  tel_contact?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description_footer?: string;

  @ApiProperty({ type: [CommuneDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CommuneDto)
  communes!: CommuneDto[];

  @ValidateNested()
  @Type(() => InitialSuperAdminDto)
  super_admin!: InitialSuperAdminDto;
}

export class UpdateJournalStatutDto {
  @ApiProperty({ enum: [JournalStatut.ACTIF, JournalStatut.MAINTENANCE] })
  @IsEnum([JournalStatut.ACTIF, JournalStatut.MAINTENANCE], {
    message: 'Statut autorisé : actif ou maintenance',
  })
  statut!: JournalStatut.ACTIF | JournalStatut.MAINTENANCE;
}
