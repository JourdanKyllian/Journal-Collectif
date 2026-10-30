import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import type { AffluenceMediane } from '../entities/parking.entity';

export class UpdateAffluenceDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['calme', 'moderee', 'forte', 'saturee'])
  affluenceMediane!: AffluenceMediane;
}
