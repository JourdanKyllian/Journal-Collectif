import { 
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany
} from 'typeorm';
import { Category } from '../../category/entities/category.entity';
import { ImageArticle } from '../../image-article/entities/image-article.entity';
import { VueStatistique } from '../../vue-statistique/entities/vue-statistique.entity';
import { AuteurArticle } from '../../auteur-article/entities/auteur-article.entity/auteur-article.entity';
import { CustomBaseEntity } from 'src/common/base/base.entity';

@Entity('article')
export class Article extends CustomBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  titre: string;

  @Column({ type: 'text' })
  contenu: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_couverture: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  source_link: string;

  @Column({ type: 'varchar', length: 50, default: 'brouillon' })
  statut: string;

  @Column({ type: 'datetime', nullable: true })
  published_at: Date;

  // --- RELATIONS ---

  @ManyToOne(() => Category, (category) => category.articles)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => ImageArticle, (image) => image.article)
  images: ImageArticle[];

  @OneToMany(() => VueStatistique, (vue) => vue.article)
  vues: VueStatistique[];

  @OneToMany(() => AuteurArticle, (auteur) => auteur.article)
  auteursArticles: AuteurArticle[];
}