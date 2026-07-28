import { Entity, Column } from 'typeorm';
import { CustomBaseEntity } from '../../common/base/base.entity';

@Entity('settings')
export class Setting extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 100 })
  nom_journal!: string;

  @Column({ type: 'varchar', length: 50 })
  type_journal!: string;

  @Column({ type: 'varchar', length: 100 })
  nom_ville!: string;

  @Column({ type: 'varchar', length: 255 })
  email_contact!: string;

  @Column({ type: 'varchar', length: 20 })
  tel_contact!: string;

  @Column({ type: 'text' })
  description_footer!: string;
}
