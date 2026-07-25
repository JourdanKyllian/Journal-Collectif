import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

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
  @Transform(({ value }: { value: string | undefined | null }) => {
    if (!value || value.trim() === '') return null;

    // Convertir les "00" initiaux en "+"
    let strValue = value.trim();
    if (strValue.startsWith('00')) strValue = '+' + strValue.slice(2);

    const isIntl = strValue.startsWith('+');
    const digits = strValue.replace(/\D/g, ''); // On ne garde que les chiffres

    // 1. Format Français standard (ex: 06 12 34 56 78)
    if (!isIntl && digits.length === 10 && digits.startsWith('0')) {
      return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
    }

    // 2. Format Français international (ex: +33 6 12 34 56 78)
    if (isIntl && digits.startsWith('33') && digits.length === 11) {
      const prefix = digits.substring(0, 2); // 33
      const firstDigit = digits.substring(2, 3); // 6
      const rest = digits.substring(3); // 12345678
      return `+${prefix} ${firstDigit} ${rest.replace(/(\d{2})(?=\d)/g, '$1 ').trim()}`;
    }

    // 3. Autres formats internationaux (on groupe par 3 pour la lisibilité)
    if (isIntl) {
      return `+${digits.replace(/(\d{3})(?=\d)/g, '$1 ').trim()}`;
    }

    return value; // Laisse passer pour que le Regex bloque si c'est invalide
  })
  @IsString()
  @Matches(/^\+?[0-9 ]{8,25}$/, {
    message:
      'Numéro invalide. Renseignez un numéro local (10 chiffres) ou international (+XX).',
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
