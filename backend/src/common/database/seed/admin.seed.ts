import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Users } from '../../../users/entities/user.entity';
import { Role } from '../../../roles/entities/roles.entity';

@Injectable()
export class AdminSeedService {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(Users)
    private readonly usersRepository: Repository<Users>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
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

      this.logger.log('Création des comptes de test...');

      // 1. Compte ADMIN (Complet, tous les droits)
      const adminExists = await this.usersRepository.findOne({
        where: { email: 'admin@journal.fr' },
      });
      if (!adminExists) {
        await this.usersRepository.save(
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

      // 2. Compte VISITEUR INCOMPLET (Idéal pour tester les pop-ups "Complétez votre profil")
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

      // 3. Compte VISITEUR COMPLET (Auteur autorisé à écrire)
      const auteurExists = await this.usersRepository.findOne({
        where: { email: 'auteur@journal.fr' },
      });
      if (!auteurExists) {
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
    } catch (error) {
      this.logger.error(
        `Erreur lors du seed :`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
