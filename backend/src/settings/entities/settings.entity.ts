import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, default: 'Collectif Chalonnais 06' })
  nom_journal!: string;

  @Column({ type: 'varchar', length: 50, default: 'Journal Municipal' })
  type_journal!: string;

  @Column({ type: 'varchar', length: 255, default: 'contact@chalonnais.fr' })
  email_contact!: string;

  @Column({ type: 'varchar', length: 20, default: '03 26 26 08 30' })
  tel_contact!: string;

  @Column({ type: 'text', default: 'Le journal officiel et indépendant de la commune, pour rester connectés à la vie locale en temps réel.' })
  description_footer!: string;
}
