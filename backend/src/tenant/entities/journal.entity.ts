import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { JournalStatut } from '../tenant.constants';
import { Commune } from './commune.entity';
import { JournalMember } from './journal-member.entity';

/** Un journal = un tenant : ses articles, catégories, alertes, réglages et son équipe. */
@Entity('journal')
export class Journal {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index('UQ_journal_slug', { unique: true })
  @Column({ type: 'varchar', length: 63 })
  slug!: string;

  @Column({ type: 'varchar', length: 100 })
  nom_journal!: string;

  @Column({ type: 'varchar', length: 50, default: 'Journal' })
  type_journal!: string;

  @Column({ type: 'varchar', length: 100 })
  nom_ville!: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  email_contact!: string;

  @Column({ type: 'varchar', length: 20, default: '' })
  tel_contact!: string;

  @Column({ type: 'text', default: '' })
  description_footer!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: JournalStatut.EN_CONFIGURATION,
  })
  statut!: JournalStatut;

  @ManyToMany(() => Commune, (commune) => commune.journaux)
  @JoinTable({
    name: 'journal_commune',
    joinColumn: { name: 'journal_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'commune_id', referencedColumnName: 'id' },
  })
  communes!: Commune[];

  @OneToMany(() => JournalMember, (member) => member.journal)
  members!: JournalMember[];

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}
