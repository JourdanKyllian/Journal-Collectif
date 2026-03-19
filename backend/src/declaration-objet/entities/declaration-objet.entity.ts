import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { CustomBaseEntity } from 'src/common/base/base.entity';

@Entity('declaration_objet')
export class DeclarationObjet extends CustomBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  type_declaration: string;

  @Column({ type: 'varchar', length: 255 })
  name_object: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lieu_presume: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_url: string;

  // --- RELATIONS ---

  @ManyToOne(() => Users, (user) => user.declarations)
  @JoinColumn({ name: 'user_id' })
  user: Users;
}