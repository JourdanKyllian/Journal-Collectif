import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-categorie.dto';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
