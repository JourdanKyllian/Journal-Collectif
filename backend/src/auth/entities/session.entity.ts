import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';

/** Une session = un appareil connecté. Révocable individuellement. */
@Entity('session')
export class Session {
  /** Généré par l'application (UUID v4) : il fait partie du refresh token. */
  @PrimaryColumn('uuid')
  id!: string;

  @Index('IDX_session_user')
  @Column({ name: 'user_id', type: 'int' })
  userId!: number;

  @ManyToOne(() => Users, (user) => user.sessions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', foreignKeyConstraintName: 'FK_session_user' })
  user!: Users;

  /** SHA-256 hexadécimal du secret courant. */
  @Column({ name: 'refresh_token_hash', type: 'char', length: 64 })
  refreshTokenHash!: string;

  /** Secret précédent, accepté pendant la fenêtre de grâce suivant la rotation. */
  @Column({
    name: 'previous_refresh_token_hash',
    type: 'char',
    length: 64,
    nullable: true,
  })
  previousRefreshTokenHash!: string | null;

  @Column({ name: 'rotated_at', type: 'timestamptz', nullable: true })
  rotatedAt!: Date | null;

  /** Identifiant d'installation fourni par l'app mobile (`X-Device-Id`). */
  @Column({
    name: 'device_identifier',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  deviceIdentifier!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent!: string | null;

  /** Donnée personnelle (RGPD) : supprimée avec la session. */
  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'last_used_at', type: 'timestamptz' })
  lastUsedAt!: Date;

  @Index('IDX_session_expires')
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt!: Date | null;
}
