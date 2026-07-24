import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsStrongPasswordCustom } from '../../common/decorators/is-strong-password.decorator';

export class UpdateSecurityDto {
  @IsString()
  @IsNotEmpty({
    message:
      'Le mot de passe actuel est requis pour toute modification de sécurité.',
  })
  currentPassword!: string;

  @IsOptional()
  @IsEmail(
    {},
    { message: 'Le format de la nouvelle adresse email est invalide.' },
  )
  newEmail?: string;

  @IsOptional()
  @IsString()
  @IsStrongPasswordCustom()
  newPassword?: string;
}
