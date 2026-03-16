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
      // 1. Vérification et création du rôle Admin
      let adminRole = await this.roleRepository.findOne({ where: { libelle: 'Admin' } });
      
      if (!adminRole) {
        this.logger.log('Création du rôle Admin initial...');
        adminRole = this.roleRepository.create({ libelle: 'Admin' });
        await this.roleRepository.save(adminRole);
      }

      // 2. Vérification et création de l'utilisateur
      const userCount = await this.usersRepository.count();

      if (userCount > 0) {
        this.logger.log('Des utilisateurs existent déjà. Annulation du Seed.');
        return;
      }

      this.logger.log('Création de l\'utilisateur admin initial...');

      const adminEmail = 'admin@journal.fr';
      const hashedPassword = await bcrypt.hash('admin123', 10);

      // On utilise notre nouvelle structure d'entité Users
      const adminUser = this.usersRepository.create({
        lastname: 'Admin',
        firstname: 'Super',
        email: adminEmail,
        password: hashedPassword, // Le nom du champ est "password" dans notre entité
        role: adminRole, // On lie l'entité Role complète, pas juste un texte !
        is_phone_verified: true,
      });

      await this.usersRepository.save(adminUser);
      this.logger.log(`✅ Utilisateur Admin créé avec succès : ${adminEmail}`);
      
    } catch (error) {
      this.logger.error(`❌ Erreur lors du seed : ${error.message}`, error.stack);
      throw error;
    }
  }
}