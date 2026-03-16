import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { Article } from '../../article/entities/article.entity';
import { FavorisCategorie } from '../../favoris-categorie/entities/favoris-categorie.entity/favoris-categorie.entity';

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  libelle: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'boolean', default: false })
  is_delete: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn() // Gère le soft delete automatiquement
  deleted_at: Date;

  // --- RELATIONS ---
  
  // Une catégorie peut avoir plusieurs articles
  @OneToMany(() => Article, (article) => article.category)
  articles: Article[];

  // Une catégorie peut être mise en favori par plusieurs utilisateurs
  @OneToMany(() => FavorisCategorie, (fc) => fc.category)
  favorisCategories: FavorisCategorie[];
}