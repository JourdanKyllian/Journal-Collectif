import { IsString, IsOptional, MaxLength } from 'class-validator';

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
  @MaxLength(255)
  email_contact?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  tel_contact?: string;

  @IsOptional()
  @IsString()
  description_footer?: string;
}
