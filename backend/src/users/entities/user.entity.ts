import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Role } from '../../role/entities/role.entity';
import { DeclarationObjet } from '../../declaration-objet/entities/declaration-objet.entity';
import { VueStatistique } from '../../vue-statistique/entities/vue-statistique.entity';
import { AuteurArticle } from '../../auteur-article/entities/auteur-article.entity/auteur-article.entity';
import { FavorisCategorie } from '../../favoris-categorie/entities/favoris-categorie.entity/favoris-categorie.entity';

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  lastname: string;

  @Column({ type: 'varchar', length: 100 })
  firstname: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string; // C'est ici qu'on stockera le mot de passe hashé (bcrypt)

  @Column({ type: 'varchar', length: 20, nullable: true })
  tel: string;

  @Column({ type: 'boolean', default: false })
  is_phone_verified: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  token_auth: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  token_notification: string;

  @Column({ type: 'boolean', default: false })
  is_delete: boolean;

  // --- TIMESTAMPS AUTOMATIQUES ---
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn() // Gère le Soft Delete automatiquement
  deleted_at: Date;

  // --- RELATIONS ---

  // Un utilisateur possède un seul rôle principal (ex: Admin, Lecteur)
  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  // Un utilisateur peut déclarer plusieurs objets perdus
  @OneToMany(() => DeclarationObjet, (declaration) => declaration.user)
  declarations: DeclarationObjet[];

  // Un utilisateur génère plusieurs statistiques de vues
  @OneToMany(() => VueStatistique, (vue) => vue.user)
  vues: VueStatistique[];

  // Un utilisateur peut être co-auteur de plusieurs articles
  @OneToMany(() => AuteurArticle, (auteur) => auteur.user)
  auteursArticles: AuteurArticle[];

  // Un utilisateur peut avoir plusieurs catégories en favoris
  @OneToMany(() => FavorisCategorie, (fc) => fc.user)
  favorisCategories: FavorisCategorie[];
}