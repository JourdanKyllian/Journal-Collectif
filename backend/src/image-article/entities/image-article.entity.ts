import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Article } from '../../article/entities/article.entity';
import { CustomBaseEntity } from '../../common/base/base.entity';

@Entity('image_article')
export class ImageArticle extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  url_image!: string;

  @Column({ type: 'varchar', length: 255 })
  legend!: string;

  // --- RELATIONS ---

  @ManyToOne(() => Article, (article) => article.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'article_id' })
  article!: Article;
}