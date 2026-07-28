import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { formatInternationalPhone } from '../../common/validators/phone.validator';

export class UpdateSettingDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nom_journal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  type_journal?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nom_ville?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  email_contact?: string;

  @IsOptional()
  @Transform(({ value }) => formatInternationalPhone(value as string))
  @IsString()
  @Matches(/^\+[0-9 \-()]{8,25}$/, {
    message: 'Le numéro public doit être au format international valide.',
  })
  @MaxLength(20)
  tel_contact?: string;

  @IsOptional()
  @IsString()
  description_footer?: string;
}
