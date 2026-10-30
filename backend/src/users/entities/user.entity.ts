import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Role } from '../../roles/entities/roles.entity';
import { DeclarationObjet } from '../../declaration-objet/entities/declaration-objet.entity';
import { VueStatistique } from '../../vue-statistique/entities/vue-statistique.entity';
import { AuteurArticle } from '../../auteur-article/entities/auteur-article.entity/auteur-article.entity';
import { FavorisCategorie } from '../../favoris-categorie/entities/favoris-categorie.entity/favoris-categorie.entity';
import { CustomBaseEntity } from '../../common/base/base.entity';
import { Profile } from '../../profile/entities/profile.entity';
import { Session } from '../../auth/entities/session.entity';
import { JournalMember } from '../../tenant/entities/journal-member.entity';

/**
 * Entité gérant le périmètre d'authentification et les habilitations de l'utilisateur.
 */
@Entity('users')
export class Users extends CustomBaseEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password!: string;

  @Column({ type: 'boolean', default: false })
  is_phone_verified!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  token_notification!: string | null;

  /** Opérateur de la plateforme : seul habilité à provisionner de nouveaux journaux. */
  @Column({ type: 'boolean', default: false })
  is_platform_admin!: boolean;

  /** Compte créé avec un mot de passe provisoire : tout est bloqué tant qu'il n'est pas changé. */
  @Column({ type: 'boolean', default: false })
  must_change_password!: boolean;

  // --- RELATIONS ---

  @OneToMany(() => Session, (session) => session.user)
  sessions!: Session[];

  @OneToMany(() => JournalMember, (member) => member.user)
  memberships!: JournalMember[];

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role!: Role;

  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  profile!: Profile;

  @OneToMany(() => DeclarationObjet, (declaration) => declaration.user)
  declarations!: DeclarationObjet[];

  @OneToMany(() => VueStatistique, (vue) => vue.user)
  vues!: VueStatistique[];

  @OneToMany(() => AuteurArticle, (auteur) => auteur.user)
  auteursArticles!: AuteurArticle[];

  @OneToMany(() => FavorisCategorie, (fc) => fc.user)
  favorisCategories!: FavorisCategorie[];
}
