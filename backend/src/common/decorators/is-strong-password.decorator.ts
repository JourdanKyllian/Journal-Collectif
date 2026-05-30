import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { isValidPassword } from '../validators/password.validator';

export function IsStrongPasswordCustom(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPasswordCustom',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        validate(value: unknown, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          const erreurs = isValidPassword(value);
          return erreurs.length === 0;
        },

        defaultMessage(args: ValidationArguments) {
          // 2. On précise que la valeur reçue est bien une string
          const erreurs = isValidPassword(args.value as string);
          return `Le mot de passe doit : ${erreurs.join(', ')}.`;
        },
      },
    });
  };
}
