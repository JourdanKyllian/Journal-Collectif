import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  /**
   * L'adresse email pour la connexion
   * @example lecteur@gmail.com
   */
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * Le mot de passe (minimum 14 caractères imposé par le RGPD)
   * @example motdepasse123!
   */
  @IsString()
  @MinLength(14)
  password: string;
  
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