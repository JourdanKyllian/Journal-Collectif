import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { Article } from './article.entity';

export type ArticleHistoryAction =
  | 'cree'
  | 'modifie'
  | 'publie'
  | 'depublie'
  | 'programme'
  | 'supprime'
  | 'anonymise'
  | 'revision_enregistree'
  | 'revision_appliquee'
  | 'revision_abandonnee';

/** Journal d'audit daté de chaque action sur un article. Lisible uniquement par les admins. */
@Entity('article_history')
export class ArticleHistory {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'article_id', type: 'int' })
  articleId!: number;

  @ManyToOne(() => Article, { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'article_id',
    foreignKeyConstraintName: 'FK_article_history_article',
  })
  article!: Article;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId!: number | null;

  @ManyToOne(() => Users, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'FK_article_history_user',
  })
  user!: Users | null;

  @Column({ type: 'varchar', length: 40 })
  action!: ArticleHistoryAction;

  @Column({ type: 'jsonb', nullable: true })
  details!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
