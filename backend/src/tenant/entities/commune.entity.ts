import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Journal } from './journal.entity';

@Entity('commune')
export class Commune {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  nom!: string;

  @Index('UQ_commune_code_insee', { unique: true })
  @Column({ type: 'varchar', length: 5 })
  code_insee!: string;

  @Index('IDX_commune_code_postal')
  @Column({ type: 'varchar', length: 5 })
  code_postal!: string;

  @ManyToMany(() => Journal, (journal) => journal.communes)
  journaux!: Journal[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
