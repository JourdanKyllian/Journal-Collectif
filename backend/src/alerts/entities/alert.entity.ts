import { Entity, Column } from 'typeorm';
import { CustomBaseEntity } from '../../common/base/base.entity';

@Entity('alerts')
export class Alert extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 20 })
  type!: string; // 'urgent', 'info', 'event'

  @Column({ type: 'varchar', length: 100 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'date', nullable: true })
  startDate!: string | null;

  @Column({ type: 'date', nullable: true })
  endDate!: string | null;
}
