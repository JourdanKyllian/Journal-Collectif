import { PartialType } from '@nestjs/mapped-types';
import { CreateVueStatistiqueDto } from './create-vue-statistique.dto';

export class UpdateVueStatistiqueDto extends PartialType(CreateVueStatistiqueDto) {}
