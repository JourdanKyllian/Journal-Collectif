import { PartialType } from '@nestjs/mapped-types';
import { CreateCategorieDto as CreateCategorieDto } from './create-categorie.dto';

export class UpdateCategorieDto extends PartialType(CreateCategorieDto) {}
