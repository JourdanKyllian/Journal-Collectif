import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './entities/alert.entity';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
  ) {}

  create(createAlertDto: CreateAlertDto) {
    const alert = this.alertRepository.create(createAlertDto);
    return this.alertRepository.save(alert);
  }

  // Récupère les alertes actives triées par la plus récente
  findAll() {
    return this.alertRepository.find({ order: { created_at: 'DESC' } });
  }

  // Mise à jour partielle d'une alerte existante
  async update(id: number, updateAlertDto: UpdateAlertDto) {
    const alert = await this.alertRepository.preload({
      id: id,
      ...updateAlertDto,
    });

    if (!alert) {
      throw new NotFoundException(`Alerte avec l'ID ${id} introuvable`);
    }

    return this.alertRepository.save(alert);
  }

  // Soft delete pour historiser l'alerte sans la détruire
  async remove(id: number) {
    const alert = await this.alertRepository.findOneBy({ id });
    if (!alert) throw new NotFoundException('Alerte non trouvée');
    return this.alertRepository.softRemove(alert);
  }
}
