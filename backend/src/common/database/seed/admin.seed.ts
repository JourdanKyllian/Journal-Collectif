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

  async seed(): Promise<void> {
    try {
      const adminRole = await this.roleRepository.findOne({
        where: { libelle: 'Admin' },
      });
      const userRole = await this.roleRepository.findOne({
        where: { libelle: 'utilisateur' },
      });

      if (!adminRole || !userRole) {
        throw new Error(
          "Les rôles n'existent pas ! Lancez d'abord le TableSeedService.",
        );
      }

      this.logger.log('Vérification et création des comptes de test...');

      // 1. Compte ADMIN
      let adminUser = await this.usersRepository.findOne({
        where: { email: 'admin@journal.fr' },
      });
      if (!adminUser) {
        adminUser = await this.usersRepository.save(
          this.usersRepository.create({
            email: 'admin@journal.fr',
            password: await bcrypt.hash('admin123', 10),
            role: adminRole,
            is_phone_verified: true,
            profile: {
              firstname: 'Super',
              lastname: 'Admin',
              tel: '0600000000',
              avatar_ref: 'default_admin',
              bio: 'Directeur de la publication du Collectif Chalonnais.',
            },
          }),
        );
        this.logger.log(`Admin créé : admin@journal.fr`);
      }

      // 2. Compte VISITEUR INCOMPLET
      const userIncompletExists = await this.usersRepository.findOne({
        where: { email: 'jean@exemple.fr' },
      });
      if (!userIncompletExists) {
        await this.usersRepository.save(
          this.usersRepository.create({
            email: 'jean@exemple.fr',
            password: await bcrypt.hash('user123', 10),
            role: userRole,
            is_phone_verified: false,
            profile: {
              firstname: null,
              lastname: null,
              tel: null,
              avatar_ref: 'default_01',
            },
          }),
        );
        this.logger.log(`Visiteur Incomplet créé : jean@exemple.fr`);
      }

      // 3. Compte VISITEUR COMPLET (Auteur)
      const auteurUser = await this.usersRepository.findOne({
        where: { email: 'auteur@journal.fr' },
      });
      if (!auteurUser) {
        await this.usersRepository.save(
          this.usersRepository.create({
            email: 'auteur@journal.fr',
            password: await bcrypt.hash('auteur123', 10),
            role: userRole,
            is_phone_verified: true,
            profile: {
              firstname: 'Marc',
              lastname: 'Lumière',
              tel: '0611223344',
              avatar_ref: 'default_03',
              bio: 'Photographe amateur. Je parcours la ville pour documenter la vie locale.',
            },
          }),
        );
        this.logger.log(`Auteur Complet créé : auteur@journal.fr`);
      }

      // 4. Création des 4 Catégories avec TOUS les champs requis
      this.logger.log('Vérification et création des catégories...');
      const categoriesData = [
        {
          libelle: 'Actualités',
          description: "Toute l'actualité brûlante de la région.",
          icon: '📰',
          image_bandeau_url: 'https://fakeimg.pl/800x400/282828/eae0d0/?text=Actualites',
        },
        {
          libelle: 'Culture',
          description: 'Actualités culturelles de la ville et ses environs.',
          icon: '🎭',
          image_bandeau_url: 'https://fakeimg.pl/800x400/282828/eae0d0/?text=Culture',
        },
        {
          libelle: 'Environnement',
          description: 'Écologie, nature et développement durable.',
          icon: '🌱',
          image_bandeau_url: 'https://fakeimg.pl/800x400/282828/eae0d0/?text=Environnement',
        },
        {
          libelle: 'Vie Locale',
          description: 'Ce qui se passe près de chez vous au quotidien.',
          icon: '🏘️',
          image_bandeau_url: 'https://fakeimg.pl/800x400/282828/eae0d0/?text=Vie+Locale',
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

      // 5. Création des 3 Articles d'exemple
      this.logger.log("Vérification et création des articles d'exemple...");
      const sampleArticles = [
        {
          titre: 'Lancement du nouveau marché bio au centre-ville',
          contenu:
            "Le centre-ville s'anime avec l'arrivée d'un nouveau marché bio tous les samedis matin. Producteurs locaux et habitants se sont réunis en nombre pour cette première édition.",
          categorie: createdCategories[3], // Vie Locale
        },
        {
          titre: 'Exposition de peintures modernes à la bibliothèque',
          contenu:
            'Une rétrospective exceptionnelle des œuvres de peintres de la région est à découvrir gratuitement tout au long du mois dans le grand hall de la bibliothèque municipale.',
          categorie: createdCategories[1], // Culture
        },
        {
          titre: "Nouveau plan vélo : les pistes cyclables s'agrandissent",
          contenu:
            'La municipalité annonce la création de 5 kilomètres de pistes cyclables supplémentaires pour encourager les mobilités douces et sécuriser les déplacements urbains.',
          categorie: createdCategories[2], // Environnement
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