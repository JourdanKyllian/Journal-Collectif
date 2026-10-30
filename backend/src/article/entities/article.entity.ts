import { Journal } from '../../tenant/entities/journal.entity';
import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Categorie } from '../../categorie/entities/categorie.entity';
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
  @Index('IDX_article_journal')
  @Column({ name: 'journal_id', type: 'int' })
  journalId!: number;

  @ManyToOne(() => Journal, { onDelete: 'RESTRICT' })
  @JoinColumn({
    name: 'journal_id',
    foreignKeyConstraintName: 'FK_article_journal',
  })
  journal!: Journal;

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
    default: ArticleStatus.BROUILLON,
  })
  statut!: ArticleStatus;

  @Column({ type: 'timestamp', nullable: true })
  published_at!: Date | null;

  /** Date de publication souhaitée (programmation, 7 jours max). Jamais antidatée à la validation. */
  @Column({ type: 'timestamptz', nullable: true })
  scheduled_at!: Date | null;

  // --- RELATIONS ---

  @ManyToOne(() => Categorie, (categorie) => categorie.articles)
  @JoinColumn({ name: 'categorie_id' })
  categorie!: Categorie;

  @OneToMany(() => ImageArticle, (image) => image.article)
  images!: ImageArticle[];

  @OneToMany(() => VueStatistique, (vue) => vue.article)
  vues!: VueStatistique[];

  @OneToMany(() => AuteurArticle, (auteur) => auteur.article)
  auteursArticles!: AuteurArticle[];
}
