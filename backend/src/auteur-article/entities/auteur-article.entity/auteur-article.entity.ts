import { Entity, Column, CreateDateColumn, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Users } from '../../../users/entities/user.entity';
import { Article } from '../../../article/entities/article.entity';

@Entity('auteur_article')
export class AuteurArticle {
  // On définit les deux colonnes comme PrimaryColumn
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @PrimaryColumn({ name: 'article_id' })
  articleId: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  role_contribution: string;

  @CreateDateColumn()
  created_at: Date;

  // Relation vers l'Utilisateur
  @ManyToOne(() => Users, (user) => user.auteursArticles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  // Relation vers l'Article
  @ManyToOne(() => Article, (article) => article.auteursArticles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;
}