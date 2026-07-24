import { Article } from 'src/article/entities/article.entity';
import { CustomBaseEntity } from 'src/common/base/base.entity';
import { FavorisCategorie } from 'src/favoris-categorie/entities/favoris-categorie.entity/favoris-categorie.entity';
import { Entity, Column, OneToMany } from 'typeorm';

@Entity('categorie')
export class Categorie extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 100 })
  libelle!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'varchar', length: 10, nullable: false })
  icon!: string;

  // Le bandeau permanent
  @Column({ type: 'varchar', length: 255, nullable: false })
  image_bandeau_url!: string;

  // --- RELATIONS ---

  @OneToMany(() => Article, (article) => article.categorie)
  articles!: Article[];

  @OneToMany(() => FavorisCategorie, (fc) => fc.categorie)
  favorisCategories!: FavorisCategorie[];
}
