import { Article } from '@/article/entities/article.entity';
import { CustomBaseEntity } from '@/common/base/base.entity';
import { FavorisCategorie } from '@/favoris-categorie/entities/favoris-categorie.entity/favoris-categorie.entity';
import {
  Entity,
  Column,
  OneToMany,
} from 'typeorm';


@Entity('category')
export class Category extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 100 })
  libelle!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 10, nullable: false })
  icon!: string;

  // Le bandeau permanent
  @Column({ type: 'varchar', length: 255,nullable: false })
  image_bandeau_url!: string;

  // --- RELATIONS ---
  
  @OneToMany(() => Article, (article) => article.category)
  articles!: Article[];

  @OneToMany(() => FavorisCategorie, (fc) => fc.category)
  favorisCategories!: FavorisCategorie[];
}