import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { formatInternationalPhone } from '../../common/validators/phone.validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastname?: string;

  @IsOptional()
  @Transform(({ value }) => formatInternationalPhone(value as string))
  @IsString()
  @Matches(/^\+[0-9 ]{8,25}$/, {
    message:
      'Le numéro doit être au format international valide (ex: +33 6 12 34 56 78).',
  })
  @MaxLength(25)
  tel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  avatar_ref?: string;
}
