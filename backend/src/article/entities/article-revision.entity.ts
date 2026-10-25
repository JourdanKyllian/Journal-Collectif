import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { Article } from './article.entity';

export enum RevisionStatus {
  EN_COURS = 'en_cours',
  APPLIQUEE = 'appliquee',
  ABANDONNEE = 'abandonnee',
}

/**
 * Correction proposée sur un article déjà publié. L'article publié reste en ligne,
 * inchangé, jusqu'à ce qu'un admin applique la révision. Une seule révision `en_cours` par article.
 */
@Entity('article_revision')
@Index('UQ_article_revision_open', ['articleId'], {
  unique: true,
  where: `"status" = 'en_cours'`,
})
export class ArticleRevision {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'article_id', type: 'int' })
  articleId!: number;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'article_id',
    foreignKeyConstraintName: 'FK_article_revision_article',
  })
  article!: Article;

  @Column({ name: 'author_id', type: 'int', nullable: true })
  authorId!: number | null;

  @ManyToOne(() => Users, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({
    name: 'author_id',
    foreignKeyConstraintName: 'FK_article_revision_author',
  })
  author!: Users | null;

  @Column({ type: 'varchar', length: 255 })
  titre!: string;

  @Column({ type: 'text' })
  contenu!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_couverture!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  source_link!: string | null;

  @Column({ name: 'categorie_id', type: 'int', nullable: true })
  categorieId!: number | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: RevisionStatus.EN_COURS,
  })
  status!: RevisionStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  applied_at!: Date | null;
}
