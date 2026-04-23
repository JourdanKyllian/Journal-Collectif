import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { isValidPassword } from '../validators/password.validator';

export function IsStrongPasswordCustom(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPasswordCustom',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        // Fonction qui dit "Vrai" ou "Faux"
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;
          
          const erreurs = isValidPassword(value);
          return erreurs.length === 0; // Valide SEULEMENT si le tableau d'erreurs est vide
        },
        
        // Fonction qui génère le message d'erreur dynamique
        defaultMessage(args: ValidationArguments) {
          const erreurs = isValidPassword(args.value);
          // Retourne le tableau d'erreurs avec une belle phrase lisible pour le front-end
          return `Le mot de passe doit : ${erreurs.join(', ')}.`;
        },
      },
    });
  };
}