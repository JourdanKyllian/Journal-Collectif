import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Article } from '../../article/entities/article.entity';
import { Users } from '../../users/entities/user.entity';

@Entity('vue_statistique')
export class VueStatistique {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  session_anonyme: string;

  @CreateDateColumn()
  occured_at: Date;

  @ManyToOne(() => Article, (article) => article.vues, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;

  @ManyToOne(() => Users, (user) => user.vues, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: Users;
}