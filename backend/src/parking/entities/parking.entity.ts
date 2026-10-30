import { Entity, Column, Index, JoinColumn, ManyToOne } from 'typeorm';
import { CustomBaseEntity } from '../../common/base/base.entity';
import { Journal } from '../../tenant/entities/journal.entity';

export type ParkingType = 'Souterrain' | 'Surface' | 'Gare' | 'Enclos';
export type AffluenceMediane = 'calme' | 'moderee' | 'forte' | 'saturee';

@Entity('parking')
export class Parking extends CustomBaseEntity {
  @Index('IDX_parking_journal')
  @Column({ name: 'journal_id', type: 'int' })
  journalId!: number;

  @ManyToOne(() => Journal, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'journal_id',
    foreignKeyConstraintName: 'FK_parking_journal',
  })
  journal!: Journal;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Column({ type: 'varchar', length: 30, default: 'Surface' })
  type!: ParkingType;

  @Column({ type: 'int', default: 100 })
  total!: number;

  @Column({ type: 'int', default: 0 })
  available!: number;

  @Column({ name: 'has_sensors', type: 'boolean', default: false })
  hasSensors!: boolean;

  @Column({
    name: 'affluence_mediane',
    type: 'varchar',
    length: 20,
    nullable: true,
    default: 'moderee',
  })
  affluenceMediane!: AffluenceMediane | null;

  @Column({ name: 'ev_spots', type: 'int', default: 0 })
  evSpots!: number;

  @Column({
    name: 'free_grace_period',
    type: 'varchar',
    length: 100,
    default: 'Payant',
  })
  freeGracePeriod!: string;

  @Column({ type: 'varchar', length: 100, default: 'À proximité' })
  distance!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address!: string | null;

  @Column({ name: 'status_note', type: 'varchar', length: 255, nullable: true })
  statusNote!: string | null;

  @Column({ name: 'google_maps_url', type: 'text', nullable: true })
  googleMapsUrl!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
