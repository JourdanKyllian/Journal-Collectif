import { 
    Entity,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany
} from 'typeorm';
import { Category } from '../../categorie/entities/categorie.entity';
import { ImageArticle } from '../../image-article/entities/image-article.entity';
import { VueStatistique } from '../../vue-statistique/entities/vue-statistique.entity';
import { AuteurArticle } from '../../auteur-article/entities/auteur-article.entity/auteur-article.entity';
import { CustomBaseEntity } from 'src/common/base/base.entity';

export enum ArticleStatus {
  BROUILLON = 'brouillon',
  EN_ATTENTE = 'en_attente', 
  PUBLIE = 'publie',
  CORBEILLE = 'corbeille',
}

@Entity('article')
export class Article extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  titre!: string;

  @Column({ type: 'text' })
  contenu!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image_couverture!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  source_link!: string | null;

  @Column({ 
    type: 'enum', 
    enum: ArticleStatus, 
    default: ArticleStatus.BROUILLON 
  })
  statut!: ArticleStatus;

  @Column({ type: 'datetime', nullable: true })
  published_at!: Date | null;

  // --- RELATIONS ---

  @ManyToOne(() => Category, (category) => category.articles)
  @JoinColumn({ name: 'category_id' })
  category!: Category;

  @OneToMany(() => ImageArticle, (image) => image.article)
  images!: ImageArticle[];

  @OneToMany(() => VueStatistique, (vue) => vue.article)
  vues!: VueStatistique[];

  @OneToMany(() => AuteurArticle, (auteur) => auteur.article)
  auteursArticles!: AuteurArticle[];
}