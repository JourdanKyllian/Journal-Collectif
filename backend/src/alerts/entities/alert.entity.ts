import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn()
  id!: number;

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

  @CreateDateColumn()
  createdAt!: Date;
}
