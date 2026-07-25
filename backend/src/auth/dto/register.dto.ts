import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsStrongPasswordCustom } from 'src/common/decorators/is-strong-password.decorator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPasswordCustom()
  password!: string;

  @IsOptional()
  @IsString()
  lastname?: string;

  @IsOptional()
  @IsString()
  firstname?: string;

  @IsOptional()
  @Transform(({ value }: { value: string | undefined | null }) => {
    if (!value || value.trim() === '') return null;
    
    let strValue = value.trim();
    if (strValue.startsWith('00')) strValue = '+' + strValue.slice(2);
    
    const isIntl = strValue.startsWith('+');
    const digits = strValue.replace(/\D/g, '');

    if (!isIntl && digits.length === 10 && digits.startsWith('0')) {
      return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
    }
    if (isIntl && digits.startsWith('33') && digits.length === 11) {
      return `+33 ${digits.substring(2, 3)} ${digits.substring(3).replace(/(\d{2})(?=\d)/g, '$1 ').trim()}`;
    }
    if (isIntl) return `+${digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim()}`;
    
    return value;
  })
  @IsString()
  @Matches(/^\+?[0-9 ]{8,25}$/, {
    message: 'Numéro invalide. Renseignez un numéro local (10 chiffres) ou international (+XX).',
  })
  @MaxLength(25)
  tel?: string;
}
