import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../../role/entities/role.entity';

@Injectable()
export class TableSeedService {
  private readonly logger = new Logger(TableSeedService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async seed(): Promise<void> {
    this.logger.log('Création des rôles...');
    const rolesToCreate = ['Admin', 'utilisateur', 'journaliste', 'moderateur'];

    for (const libelle of rolesToCreate) {
      const roleExists = await this.roleRepository.findOne({ where: { libelle } });
      if (!roleExists) {
        await this.roleRepository.save(this.roleRepository.create({ libelle }));
        this.logger.log(`Rôle ajouté : ${libelle}`);
      } else {
        this.logger.log(`Rôle déjà existant : ${libelle}`);
      }
    }
  }
}