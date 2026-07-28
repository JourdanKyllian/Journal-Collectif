import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPasswordCustom } from '../../common/decorators/is-strong-password.decorator';

export class RegisterDto {
  @IsEmail({}, { message: "Le format de l'email est invalide" })
  @IsNotEmpty({ message: "L'email est obligatoire" })
  email!: string;

  @IsString()
  @IsNotEmpty({ message: "Le nom d'utilisateur est obligatoire" })
  username!: string;

  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est obligatoire' })
  @IsStrongPasswordCustom()
  password!: string;

  @IsString()
  @IsNotEmpty({ message: 'La confirmation du mot de passe est obligatoire' })
  confirmPassword!: string;
}
