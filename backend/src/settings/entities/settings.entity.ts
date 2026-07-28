import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('settings')
export class Setting {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100, default: 'Collectif Chalonnais' })
  nom_journal!: string;

  @Column({ type: 'varchar', length: 50, default: 'Journal Associatif' })
  type_journal!: string;

  @Column({ type: 'varchar', length: 255, default: 'contact@collectif-chalonnais.fr' })
  email_contact!: string;

  @Column({ type: 'varchar', length: 20, default: '03 26 26 08 30' })
  tel_contact!: string;

  @Column({
    type: 'text',
    default:
      'Le journal indépendant de chalons-en-champagne et sa périphérie, pour rester connectés à la vie locale en temps réel.',
  })
  description_footer!: string;
}
