import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';

@Entity('role')
export class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50 })
  libelle!: string;

  // --- RELATIONS ---

  @OneToMany(() => Users, (user) => user.role)
  users!: Users[];
}