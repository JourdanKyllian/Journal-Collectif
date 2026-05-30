import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { CustomBaseEntity } from '../../common/base/base.entity';

@Entity('declaration_objet')
export class DeclarationObjet extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 50 })
  type_declaration!: string;

  @Column({ type: 'varchar', length: 255 })
  name_object!: string;

  @Column({ type: 'text', nullable: false })
  description!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  lieu_presume!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_url!: string | null;

  // --- RELATIONS ---

  @ManyToOne(() => Users, (user) => user.declarations)
  @JoinColumn({ name: 'user_id' })
  user!: Users;
}
