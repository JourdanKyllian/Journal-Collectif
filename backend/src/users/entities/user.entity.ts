import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany
} from 'typeorm';
import { Role } from '../../role/entities/role.entity';
import { DeclarationObjet } from '../../declaration-objet/entities/declaration-objet.entity';
import { VueStatistique } from '../../vue-statistique/entities/vue-statistique.entity';
import { AuteurArticle } from '../../auteur-article/entities/auteur-article.entity/auteur-article.entity';
import { FavorisCategorie } from '../../favoris-categorie/entities/favoris-categorie.entity/favoris-categorie.entity';
import { CustomBaseEntity } from 'src/common/base/base.entity';

@Entity('users')
export class Users extends CustomBaseEntity{
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  lastname: string;

  @Column({ type: 'varchar', length: 100 })
  firstname: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  tel: string;

  @Column({ type: 'boolean', default: false })
  is_phone_verified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  token_auth: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  token_notification: string;

  // --- RELATIONS ---

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @OneToMany(() => DeclarationObjet, (declaration) => declaration.user)
  declarations: DeclarationObjet[];

  @OneToMany(() => VueStatistique, (vue) => vue.user)
  vues: VueStatistique[];

  @OneToMany(() => AuteurArticle, (auteur) => auteur.user)
  auteursArticles: AuteurArticle[];

  @OneToMany(() => FavorisCategorie, (fc) => fc.user)
  favorisCategories: FavorisCategorie[];
}