import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BonPlan } from './entities/bon-plan.entity';
import { ParticipationConcours } from './entities/participation-concours.entity';
import { BonPlanService } from './bon-plan.service';
import { BonPlanController } from './bon-plan.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BonPlan, ParticipationConcours])],
  controllers: [BonPlanController],
  providers: [BonPlanService],
  exports: [BonPlanService],
})
export class BonPlanModule {}
