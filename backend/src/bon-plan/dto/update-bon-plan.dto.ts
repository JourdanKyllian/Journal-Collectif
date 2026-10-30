import { PartialType } from '@nestjs/mapped-types';
import { CreateBonPlanDto } from './create-bon-plan.dto';

export class UpdateBonPlanDto extends PartialType(CreateBonPlanDto) {}
