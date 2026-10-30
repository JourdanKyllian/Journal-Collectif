import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Parking, AffluenceMediane } from './entities/parking.entity';
import { CreateParkingDto } from './dto/create-parking.dto';
import { UpdateParkingDto } from './dto/update-parking.dto';
import { TenantContext } from '../tenant/tenant.context';

@Injectable()
export class ParkingService {
  constructor(
    @InjectRepository(Parking)
    private readonly parkingRepo: Repository<Parking>,
    private readonly tenant: TenantContext,
  ) {}

  async create(dto: CreateParkingDto): Promise<Parking> {
    const parking = this.parkingRepo.create({
      ...dto,
      journalId: this.tenant.journalId,
      available: dto.hasSensors ? (dto.available ?? dto.total) : 0,
      affluenceMediane: dto.hasSensors
        ? null
        : (dto.affluenceMediane ?? 'moderee'),
    });
    return this.parkingRepo.save(parking);
  }

  async findAll(includeInactive = false): Promise<Parking[]> {
    const where: Record<string, unknown> = {
      journalId: this.tenant.journalId,
      is_delete: false,
    };
    if (!includeInactive) {
      where.isActive = true;
    }
    return this.parkingRepo.find({
      where,
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Parking> {
    const parking = await this.parkingRepo.findOne({
      where: { id, journalId: this.tenant.journalId, is_delete: false },
    });
    if (!parking) {
      throw new NotFoundException(`Parking #${id} introuvable`);
    }
    return parking;
  }

  async update(id: number, dto: UpdateParkingDto): Promise<Parking> {
    const parking = await this.findOne(id);
    Object.assign(parking, dto);
    if (dto.hasSensors !== undefined && !dto.hasSensors) {
      parking.available = 0;
      if (!parking.affluenceMediane) parking.affluenceMediane = 'moderee';
    }
    return this.parkingRepo.save(parking);
  }

  async updateAffluence(
    id: number,
    affluence: AffluenceMediane,
  ): Promise<Parking> {
    const parking = await this.findOne(id);
    parking.affluenceMediane = affluence;
    return this.parkingRepo.save(parking);
  }

  async remove(id: number): Promise<void> {
    const parking = await this.findOne(id);
    parking.is_delete = true;
    await this.parkingRepo.softRemove(parking);
  }
}
