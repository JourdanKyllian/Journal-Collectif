import { IsEmail, IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';

export class CreateUserDto {
  /**
   * Le nom de famille obligatoire
   * @example Dupont
   */
  @IsString()
  @IsNotEmpty()
  lastname: string;

  /**
   * Le prénom obligatoire
   * @example Jean
   */
  @IsString()
  @IsNotEmpty()
  firstname: string;

  /**
   * L'adresse email professionnelle
   * @example jean.dupont@journal.fr
   */
  @IsEmail()
  email: string;

  /**
   * Le mot de passe temporaire
   * @example adminPass123
   */
  @IsString()
  @MinLength(14)
  password: string;

  // ===========================
  // Champs facultatifs à la création
  // ===========================

  /**
   * Le numéro de téléphone (Facultatif)
   * @example 0601020304
   */
  @IsOptional()
  @IsString()
  tel?: string;
}