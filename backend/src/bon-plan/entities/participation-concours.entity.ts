import { Entity, Column, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CustomBaseEntity } from '../../common/base/base.entity';
import { BonPlan } from './bon-plan.entity';
import { Users } from '../../users/entities/user.entity';

@Entity('participation_concours')
export class ParticipationConcours extends CustomBaseEntity {
  @Index('IDX_participation_bon_plan')
  @Column({ name: 'bon_plan_id', type: 'int' })
  bonPlanId!: number;

  @ManyToOne(() => BonPlan, (b) => b.participations, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'bon_plan_id',
    foreignKeyConstraintName: 'FK_participation_bon_plan',
  })
  bonPlan!: BonPlan;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId!: number | null;

  @ManyToOne(() => Users, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'FK_participation_user',
  })
  user!: Users | null;

  @Column({ type: 'varchar', length: 100 })
  nom!: string;

  @Column({ type: 'varchar', length: 150 })
  email!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telephone!: string | null;

  @Column({ name: 'est_gagnant', type: 'boolean', default: false })
  estGagnant!: boolean;
}
