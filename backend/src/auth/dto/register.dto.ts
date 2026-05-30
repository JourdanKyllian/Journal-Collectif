import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsStrongPasswordCustom } from 'src/common/decorators/is-strong-password.decorator';

export class RegisterDto {
  /**
   * L'adresse email pour la connexion
   * @example lecteur@gmail.com
   */
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  /**
   * Le mot de passe (minimum 14 caractères imposé par le RGPD)
   * @example motdepasse123!
   */
  @IsString()
  @IsNotEmpty()
  @IsStrongPasswordCustom()
  password!: string;

  // ===========================
  // Champs facultatifs à l'inscription
  // ===========================

  /**
   * Le nom de famille
   * @example Dupont
   */
  @IsOptional()
  @IsString()
  lastname?: string;

  /**
   * Le prénom
   * @example Jean
   */
  @IsOptional()
  @IsString()
  firstname?: string;

  /**
   * Le tel
   * @example 06 00 00 00 00
   */
  @IsOptional()
  @IsString()
  tel?: string;
}
