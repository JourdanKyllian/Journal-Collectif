import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsBoolean,
  IsOptional,
  IsIn,
  MaxLength,
} from 'class-validator';
import type { ParkingType, AffluenceMediane } from '../entities/parking.entity';

export class CreateParkingDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name!: string;

  @IsString()
  @IsIn(['Souterrain', 'Surface', 'Gare', 'Enclos'])
  type!: ParkingType;

  @IsInt()
  @Min(1)
  total!: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  available?: number;

  @IsBoolean()
  @IsOptional()
  hasSensors?: boolean;

  @IsString()
  @IsIn(['calme', 'moderee', 'forte', 'saturee'])
  @IsOptional()
  affluenceMediane?: AffluenceMediane;

  @IsInt()
  @Min(0)
  @IsOptional()
  evSpots?: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  freeGracePeriod?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  distance?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  statusNote?: string;

  @IsString()
  @IsOptional()
  googleMapsUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
