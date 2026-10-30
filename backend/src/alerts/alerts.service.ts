import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './entities/alert.entity';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { TenantContext } from '../tenant/tenant.context';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
    private readonly tenant: TenantContext,
  ) {}

  create(createAlertDto: CreateAlertDto) {
    const alert = this.alertRepository.create({
      ...createAlertDto,
      journalId: this.tenant.journalId,
    });
    return this.alertRepository.save(alert);
  }

  // Récupère les alertes actives triées par la plus récente
  findAll() {
    return this.alertRepository.find({
      where: { journalId: this.tenant.journalId },
      order: { created_at: 'DESC' },
    });
  }

  // Mise à jour partielle d'une alerte existante
  async update(id: number, updateAlertDto: UpdateAlertDto) {
    const alert = await this.alertRepository.findOneBy({
      id,
      journalId: this.tenant.journalId,
    });
    if (!alert) {
      throw new NotFoundException(`Alerte avec l'ID ${id} introuvable`);
    }

    Object.assign(alert, updateAlertDto);
    return this.alertRepository.save(alert);
  }

  // Soft delete pour historiser l'alerte sans la détruire
  async remove(id: number) {
    const alert = await this.alertRepository.findOneBy({
      id,
      journalId: this.tenant.journalId,
    });
    if (!alert) throw new NotFoundException('Alerte non trouvée');
    return this.alertRepository.softRemove(alert);
  }
}
