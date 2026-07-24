export class FavorisCategorieEntity {}
import {
  Entity,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  PrimaryColumn,
  OneToMany,
} from 'typeorm';
import { Users } from '../../../users/entities/user.entity';
import { Categorie } from '../../../categorie/entities/categorie.entity';

@Entity('favoris_categorie')
export class FavorisCategorie {
  @PrimaryColumn({ name: 'user_id' })
  userId!: number;

  @PrimaryColumn({ name: 'categorie_id' })
  categorieId!: number;

  @Column({ type: 'boolean', default: true })
  wants_notifications!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  // --- RELATIONS ---

  @ManyToOne(() => Users, (user) => user.favorisCategories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user!: Users;

  @ManyToOne(() => Categorie, (categorie) => categorie.favorisCategories, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categorie_id' })
  categorie!: Categorie;

  @OneToMany(() => FavorisCategorie, (fc) => fc.categorie)
  favorisCategories!: FavorisCategorie[];
}
