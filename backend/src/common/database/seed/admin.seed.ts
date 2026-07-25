import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Users } from '../../../users/entities/user.entity';
import { Role } from '../../../roles/entities/roles.entity';
import { Categorie } from '../../../categorie/entities/categorie.entity';
import {
  Article,
  ArticleStatus,
} from '../../../article/entities/article.entity';

/**
 * Service chargé de peupler la base de données avec des comptes de test
 * et des articles initiaux.
 */
@Injectable()
export class AdminSeedService {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Categorie)
    private readonly categorieRepository: Repository<Categorie>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  /**
   * Exécute le processus d'insertion ou de mise à jour des données initiales.
   */
  async seed(): Promise<void> {
    try {
      const superAdminRole = await this.roleRepository.findOne({
        where: { libelle: 'super_admin' },
      });
      const adminRole = await this.roleRepository.findOne({
        where: { libelle: 'admin' },
      });
      const redacteurRole = await this.roleRepository.findOne({
        where: { libelle: 'redacteur' },
      });
      const userRole = await this.roleRepository.findOne({
        where: { libelle: 'utilisateur' },
      });

      if (!superAdminRole || !adminRole || !redacteurRole || !userRole) {
        throw new Error(
          "Les rôles n'existent pas ! Lancez d'abord le TableSeedService.",
        );
      }

      this.logger.log('Vérification et création des comptes de test...');

      // 1. Compte SUPER ADMIN
      let superAdminUser = await this.usersRepository.findOne({
        where: { email: 'superadmin@journal.fr' },
      });
      if (!superAdminUser) {
        superAdminUser = this.usersRepository.create({
          email: 'superadmin@journal.fr',
        });
      }
      superAdminUser.password = await bcrypt.hash('superadmin123', 10);
      superAdminUser.role = superAdminRole;
      superAdminUser.is_phone_verified = true;
      superAdminUser.profile = Object.assign(superAdminUser.profile || {}, {
        firstname: 'Directeur',
        lastname: 'Publication',
        tel: '+33 6 00 00 00 01',
        avatar_ref: 'default_02',
        bio: 'Gérant du Collectif Chalonnais et Super Administrateur.',
      });
      await this.usersRepository.save(superAdminUser);
      this.logger.log(`Super Admin configuré : superadmin@journal.fr`);

      // 2. Compte ADMIN
      let adminUser = await this.usersRepository.findOne({
        where: { email: 'admin@journal.fr' },
      });
      if (!adminUser) {
        adminUser = this.usersRepository.create({ email: 'admin@journal.fr' });
      }
      adminUser.password = await bcrypt.hash('admin123', 10);
      adminUser.role = adminRole;
      adminUser.is_phone_verified = true;
      adminUser.profile = Object.assign(adminUser.profile || {}, {
        firstname: 'Modérateur',
        lastname: 'Chef',
        tel: '+33 6 00 00 00 02',
        avatar_ref: 'default_03',
        bio: 'Administrateur de la plateforme et modérateur.',
      });
      await this.usersRepository.save(adminUser);
      this.logger.log(`Admin configuré : admin@journal.fr`);

      // 3. Compte RÉDACTEUR
      let redacteurUser = await this.usersRepository.findOne({
        where: { email: 'redacteur@journal.fr' },
      });
      if (!redacteurUser) {
        redacteurUser = this.usersRepository.create({
          email: 'redacteur@journal.fr',
        });
      }
      redacteurUser.password = await bcrypt.hash('redacteur123', 10);
      redacteurUser.role = redacteurRole;
      redacteurUser.is_phone_verified = true;
      redacteurUser.profile = Object.assign(redacteurUser.profile || {}, {
        firstname: 'Plume',
        lastname: 'Alerte',
        tel: '+41 78 123 45 67',
        avatar_ref: 'default_04',
        bio: 'Rédacteur officiel pour le journal municipal.',
      });
      await this.usersRepository.save(redacteurUser);
      this.logger.log(`Rédacteur configuré : redacteur@journal.fr`);

      // 4. Compte VISITEUR INCOMPLET
      let userIncomplet = await this.usersRepository.findOne({
        where: { email: 'visiteur.incomplet@exemple.fr' },
      });
      if (!userIncomplet) {
        userIncomplet = this.usersRepository.create({
          email: 'visiteur.incomplet@exemple.fr',
        });
      }
      userIncomplet.password = await bcrypt.hash('user123', 10);
      userIncomplet.role = userRole;
      userIncomplet.is_phone_verified = false;
      userIncomplet.profile = Object.assign(userIncomplet.profile || {}, {
        firstname: null,
        lastname: null,
        tel: null,
        avatar_ref: 'default_01',
      });
      await this.usersRepository.save(userIncomplet);

      // 5. Compte VISITEUR COMPLET
      let visiteurComplet = await this.usersRepository.findOne({
        where: { email: 'visiteur.complet@exemple.fr' },
      });
      if (!visiteurComplet) {
        visiteurComplet = this.usersRepository.create({
          email: 'visiteur.complet@exemple.fr',
        });
      }
      visiteurComplet.password = await bcrypt.hash('user123', 10);
      visiteurComplet.role = userRole;
      visiteurComplet.is_phone_verified = true;
      visiteurComplet.profile = Object.assign(visiteurComplet.profile || {}, {
        firstname: 'Citoyen',
        lastname: 'Engagé',
        tel: '06 11 22 33 44',
        avatar_ref: 'default_01',
        bio: 'Lecteur régulier et participant de la commune.',
      });
      await this.usersRepository.save(visiteurComplet);

      // --- CRÉATION DES CATÉGORIES ET ARTICLES ---
      this.logger.log('Vérification et création des catégories...');
      const categoriesData = [
        {
          libelle: 'Actualités',
          description: "Toute l'actualité brûlante de la région.",
          icon: '📰',
          image_bandeau_url:
            'https://fakeimg.pl/800x400/282828/eae0d0/?text=Actualites',
        },
        {
          libelle: 'Culture',
          description: 'Actualités culturelles de la ville et ses environs.',
          icon: '🎭',
          image_bandeau_url:
            'https://fakeimg.pl/800x400/282828/eae0d0/?text=Culture',
        },
        {
          libelle: 'Environnement',
          description: 'Écologie, nature et développement durable.',
          icon: '🌱',
          image_bandeau_url:
            'https://fakeimg.pl/800x400/282828/eae0d0/?text=Environnement',
        },
        {
          libelle: 'Vie Locale',
          description: 'Ce qui se passe près de chez vous au quotidien.',
          icon: '🏘️',
          image_bandeau_url:
            'https://fakeimg.pl/800x400/282828/eae0d0/?text=Vie+Locale',
        },
      ];

      const createdCategories: Categorie[] = [];

      for (const catData of categoriesData) {
        let cat = await this.categorieRepository.findOne({
          where: { libelle: catData.libelle },
        });
        if (!cat) {
          cat = await this.categorieRepository.save(
            this.categorieRepository.create(catData),
          );
          this.logger.log(`Catégorie créée : ${catData.libelle}`);
        }
        createdCategories.push(cat);
      }

      this.logger.log("Vérification et création des articles d'exemple...");
      const sampleArticles = [
        {
          titre: 'Lancement du nouveau marché bio au centre-ville',
          contenu:
            "Le centre-ville s'anime avec l'arrivée d'un nouveau marché bio tous les samedis matin. Producteurs locaux et habitants se sont réunis en nombre pour cette première édition.",
          categorie: createdCategories[3],
        },
        {
          titre: 'Exposition de peintures modernes à la bibliothèque',
          contenu:
            'Une rétrospective exceptionnelle des œuvres de peintres de la région est à découvrir gratuitement tout au long du mois dans le grand hall de la bibliothèque municipale.',
          categorie: createdCategories[1],
        },
        {
          titre: "Nouveau plan vélo : les pistes cyclables s'agrandissent",
          contenu:
            'La municipalité annonce la création de 5 kilomètres de pistes cyclables supplémentaires pour encourager les mobilités douces et sécuriser les déplacements urbains.',
          categorie: createdCategories[2],
        },
      ];

      for (const artData of sampleArticles) {
        const articleExists = await this.articleRepository.findOne({
          where: { titre: artData.titre },
        });
        if (!articleExists) {
          await this.articleRepository.save(
            this.articleRepository.create({
              titre: artData.titre,
              contenu: artData.contenu,
              categorie: artData.categorie,
              statut: ArticleStatus.PUBLIE,
            }),
          );
          this.logger.log(`Article créé : "${artData.titre}"`);
        }
      }
    } catch (error) {
      this.logger.error(
        `Erreur lors du seed :`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
