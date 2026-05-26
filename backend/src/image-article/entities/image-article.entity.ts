import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Article } from '../../article/entities/article.entity';

@Entity('image_article')
export class ImageArticle {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  url_image!: string;

  @Column({ type: 'varchar', length: 255 })
  legend!: string;

  @CreateDateColumn()
  created_at!: Date;

  // --- RELATIONS ---

  @ManyToOne(() => Article, (article) => article.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article!: Article;
}