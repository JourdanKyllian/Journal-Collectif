import {
  Entity,
  Column,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { CustomBaseEntity } from '../../common/base/base.entity';
import { Journal } from '../../tenant/entities/journal.entity';
import { ParticipationConcours } from './participation-concours.entity';

export type DealCategory =
  'billetterie' | 'concours' | 'code_promo' | 'restauration';
export type DealStatut = 'actif' | 'programme' | 'expire' | 'en_attente';

@Entity('bon_plan')
export class BonPlan extends CustomBaseEntity {
  @Index('IDX_bon_plan_journal')
  @Column({ name: 'journal_id', type: 'int' })
  journalId!: number;

  @ManyToOne(() => Journal, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'journal_id',
    foreignKeyConstraintName: 'FK_bon_plan_journal',
  })
  journal!: Journal;

  @Column({ type: 'varchar', length: 150 })
  titre!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 30, default: 'code_promo' })
  categorie!: DealCategory;

  @Column({ type: 'varchar', length: 100 })
  partenaire!: string;

  @Column({ type: 'varchar', length: 50 })
  valeur!: string; // Ex: "-20%", "1 Offert", "Jeu Concours"

  @Column({ name: 'code_promo', type: 'varchar', length: 50, nullable: true })
  codePromo!: string | null;

  @Column({ name: 'lien_url', type: 'text', nullable: true })
  lienUrl!: string | null;

  @Column({ type: 'text', nullable: true })
  image!: string | null;

  @Column({
    name: 'date_debut',
    type: 'timestamp with time zone',
    nullable: true,
  })
  dateDebut!: Date | null;

  @Column({ name: 'date_fin', type: 'timestamp with time zone' })
  dateFin!: Date;

  @Column({ name: 'est_exclusif', type: 'boolean', default: false })
  estExclusif!: boolean;

  @Column({ type: 'varchar', length: 20, default: 'actif' })
  statut!: DealStatut;

  @Column({ type: 'text', nullable: true })
  conditions!: string | null;

  @OneToMany(() => ParticipationConcours, (p) => p.bonPlan)
  participations!: ParticipationConcours[];
}
