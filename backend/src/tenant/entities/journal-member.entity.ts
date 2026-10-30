import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../../roles/entities/roles.entity';
import { Users } from '../../users/entities/user.entity';
import { Journal } from './journal.entity';

/** Rôle d'un utilisateur dans un journal. Un compte est global, ses habilitations sont par journal. */
@Entity('journal_member')
@Index('UQ_journal_member_user_journal', ['userId', 'journalId'], {
  unique: true,
})
export class JournalMember {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @ManyToOne(() => Users, (user) => user.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'FK_journal_member_user',
  })
  user!: Users;

  @Index('IDX_journal_member_journal')
  @Column({ name: 'journal_id', type: 'int' })
  journalId!: number;

  @ManyToOne(() => Journal, (journal) => journal.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({
    name: 'journal_id',
    foreignKeyConstraintName: 'FK_journal_member_journal',
  })
  journal!: Journal;

  @Column({ name: 'role_id', type: 'int' })
  roleId!: number;

  @ManyToOne(() => Role, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'role_id',
    foreignKeyConstraintName: 'FK_journal_member_role',
  })
  role!: Role;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
