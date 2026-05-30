import {
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';

export abstract class CustomBaseEntity {
  // Base d'entités users, articles, categories et declaration_objet
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'boolean', default: false })
  is_delete: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn() // Gère le Soft Delete automatiquement
  deleted_at: Date;
}
