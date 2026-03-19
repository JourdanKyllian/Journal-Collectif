import {
  Entity,
  Column,
  OneToMany
} from 'typeorm';
import { Article } from '../../article/entities/article.entity';
import { FavorisCategorie } from '../../favoris-categorie/entities/favoris-categorie.entity/favoris-categorie.entity';
import { CustomBaseEntity } from 'src/common/base/base.entity';

@Entity('category')
export class Category extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 100 })
  libelle: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // --- RELATIONS ---
  
  @OneToMany(() => Article, (article) => article.category)
  articles: Article[];

  @OneToMany(() => FavorisCategorie, (fc) => fc.category)
  favorisCategories: FavorisCategorie[];
}