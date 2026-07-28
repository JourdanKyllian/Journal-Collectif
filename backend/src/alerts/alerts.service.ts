import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './entities/alert.entity';
import { CreateAlertDto } from './dto/create-alert.dto';

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

  // Récupère les alertes triées par la plus récente
  findAll() {
    return this.alertRepository.find({ order: { createdAt: 'DESC' } });
  }

  async remove(id: number) {
    const alert = await this.alertRepository.findOneBy({ id });
    if (!alert) throw new NotFoundException('Alerte non trouvée');
    return this.alertRepository.remove(alert);
  }
}
