import { Journal } from '../../tenant/entities/journal.entity';
import { Entity, Column, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CustomBaseEntity } from '../../common/base/base.entity';

@Entity('alerts')
export class Alert extends CustomBaseEntity {
  @Index('IDX_alerts_journal')
  @Column({ name: 'journal_id', type: 'int' })
  journalId!: number;

  @ManyToOne(() => Journal, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'journal_id',
    foreignKeyConstraintName: 'FK_alerts_journal',
  })
  journal!: Journal;

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
