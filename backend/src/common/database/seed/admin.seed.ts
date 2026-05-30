import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Users } from '../../../users/entities/user.entity';
import { Role } from '../../../role/entities/role.entity';

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
      // Vérification et création du rôle Admin

      const adminRole = await this.roleRepository.findOne({
        where: { libelle: 'Admin' },
      });
      if (!adminRole) {
        throw new Error(
          "Le rôle Admin n'existe pas ! Lancez d'abord le TableSeedService.",
        );
      }

      // Cherche un compte lié au rôle Admin
      const adminExists = await this.usersRepository.findOne({
        where: {
          role: { id: adminRole.id },
        },
      });

      if (adminExists) {
        this.logger.log(
          'Un compte Administrateur existe déjà en base. Annulation du Seed.',
        );
        return;
      }

      // Création d'admin si aucun n'a été trouvé
      this.logger.log("Création de l'utilisateur admin initial...");

      const adminEmail = 'admin@journal.fr';
      const hashedPassword = await bcrypt.hash('admin123', 10);

      const adminUser = this.usersRepository.create({
        lastname: 'Admin',
        firstname: 'Super',
        email: adminEmail,
        password: hashedPassword,
        role: adminRole,
        is_phone_verified: true,
      });

      await this.usersRepository.save(adminUser);
      this.logger.log(`Utilisateur Admin créé avec succès : ${adminEmail}`);
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Erreur lors du seed : ${error.message}`,
          error.stack,
        );
      } else {
        this.logger.error(`Erreur inconnue lors du seed : ${String(error)}`);
      }
      throw error;
    }
  }
}
