import { PartialType } from '@nestjs/mapped-types';
import { CreateDeclarationObjetDto } from './create-declaration-objet.dto';

export class UpdateDeclarationObjetDto extends PartialType(
  CreateDeclarationObjetDto,
) {}
