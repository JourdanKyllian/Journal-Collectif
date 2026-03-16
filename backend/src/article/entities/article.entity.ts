import { 
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
    OneToMany
} from 'typeorm';
import { Category } from '../../category/entities/category.entity';
import { ImageArticle } from '../../image-article/entities/image-article.entity';
import { VueStatistique } from '../../vue-statistique/entities/vue-statistique.entity';
import { AuteurArticle } from '../../auteur-article/entities/auteur-article.entity/auteur-article.entity';

@Entity('article')
export class Article {
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

  @Column({ type: 'boolean', default: false })
  is_delete: boolean;

  @Column({ type: 'datetime', nullable: true })
  published_at: Date;

  // --- TIMESTAMPS AUTOMATIQUES ---
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn() // Gère le Soft Delete automatiquement
  deleted_at: Date;

  // --- RELATIONS ---

  // Un article appartient à une seule catégorie
  @ManyToOne(() => Category, (category) => category.articles)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  // Un article peut avoir plusieurs images dans sa galerie
  @OneToMany(() => ImageArticle, (image) => image.article)
  images: ImageArticle[];

  // Un article possède plusieurs statistiques de vues
  @OneToMany(() => VueStatistique, (vue) => vue.article)
  vues: VueStatistique[];

  // Un article peut avoir plusieurs co-auteurs
  @OneToMany(() => AuteurArticle, (auteur) => auteur.article)
  auteursArticles: AuteurArticle[];
}