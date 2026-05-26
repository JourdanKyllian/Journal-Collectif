import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  /**
   * Email de l'utilisateur
   * @IsEmail()
   * @IsNotEmpty()
   */
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /**
   * Mot de passe de l'utilisateur
   * @IsString()
   * @IsNotEmpty()
   */
  @IsString()
  @IsNotEmpty()
  password: string;
}