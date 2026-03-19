export class FavorisCategorieEntity {}
import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  OneToMany
} from 'typeorm';
import { Users } from '../../../users/entities/user.entity';
import { Category } from '../../../category/entities/category.entity';

@Entity('favoris_categorie')
export class FavorisCategorie {
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @PrimaryColumn({ name: 'category_id' })
  categoryId: number;

  @Column({ type: 'boolean', default: true })
  wants_notifications: boolean;

  @CreateDateColumn()
  created_at: Date;

  // --- RELATIONS ---

  @ManyToOne(() => Users, (user) => user.favorisCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: Users;

  @ManyToOne(() => Category, (category) => category.favorisCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => FavorisCategorie, (fc) => fc.category)
  favorisCategories: FavorisCategorie[];
}