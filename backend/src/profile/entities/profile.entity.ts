import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { CustomBaseEntity } from '../../common/base/base.entity';
import { Users } from '../../users/entities/user.entity';

/**
 * Entité représentant les données d'identité et les informations publiques d'un utilisateur.
 */
@Entity('profile')
export class Profile extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 100, nullable: true })
  firstname!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastname!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  tel!: string | null;

  @Column({ type: 'varchar', length: 250, nullable: true })
  bio!: string | null;

  @Column({ type: 'varchar', length: 50, default: 'default_01' })
  avatar_ref!: string;

  @OneToOne(() => Users, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: Users;
}
