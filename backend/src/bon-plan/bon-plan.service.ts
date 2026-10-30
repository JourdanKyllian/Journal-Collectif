import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BonPlan } from './entities/bon-plan.entity';
import { ParticipationConcours } from './entities/participation-concours.entity';
import { CreateBonPlanDto } from './dto/create-bon-plan.dto';
import { UpdateBonPlanDto } from './dto/update-bon-plan.dto';
import { ParticiperConcoursDto } from './dto/participer-concours.dto';
import { TenantContext } from '../tenant/tenant.context';

@Injectable()
export class BonPlanService {
  constructor(
    @InjectRepository(BonPlan)
    private readonly bonPlanRepo: Repository<BonPlan>,
    @InjectRepository(ParticipationConcours)
    private readonly participationRepo: Repository<ParticipationConcours>,
    private readonly tenant: TenantContext,
  ) {}

  async create(dto: CreateBonPlanDto): Promise<BonPlan> {
    const now = new Date();
    const dateFin = new Date(dto.dateFin);
    const dateDebut = dto.dateDebut ? new Date(dto.dateDebut) : null;

    let computedStatut = dto.statut || 'actif';
    if (computedStatut !== 'en_attente') {
      if (dateFin < now) {
        computedStatut = 'expire';
      } else if (dateDebut && dateDebut > now) {
        computedStatut = 'programme';
      } else {
        computedStatut = 'actif';
      }
    }

    const bonPlan = this.bonPlanRepo.create({
      ...dto,
      journalId: this.tenant.journalId,
      dateDebut,
      dateFin,
      statut: computedStatut,
    });

    return this.bonPlanRepo.save(bonPlan);
  }

  async findAll(includeAll = false): Promise<BonPlan[]> {
    const where: Record<string, unknown> = {
      journalId: this.tenant.journalId,
      is_delete: false,
    };
    if (!includeAll) {
      where.statut = 'actif';
    }

    const deals = await this.bonPlanRepo.find({
      where,
      order: { dateFin: 'ASC', id: 'DESC' },
    });

    // Actualisation dynamique des statuts selon l'heure courante
    const now = new Date();
    for (const deal of deals) {
      if (deal.statut === 'actif' && deal.dateFin < now) {
        deal.statut = 'expire';
        await this.bonPlanRepo.save(deal);
      } else if (
        deal.statut === 'programme' &&
        deal.dateDebut &&
        deal.dateDebut <= now &&
        deal.dateFin > now
      ) {
        deal.statut = 'actif';
        await this.bonPlanRepo.save(deal);
      }
    }

    return deals;
  }

  async findOne(id: number): Promise<BonPlan> {
    const deal = await this.bonPlanRepo.findOne({
      where: { id, journalId: this.tenant.journalId, is_delete: false },
      relations: ['participations'],
    });
    if (!deal) {
      throw new NotFoundException(`Bon plan #${id} introuvable`);
    }
    return deal;
  }

  async update(id: number, dto: UpdateBonPlanDto): Promise<BonPlan> {
    const deal = await this.findOne(id);
    Object.assign(deal, dto);
    if (dto.dateDebut) deal.dateDebut = new Date(dto.dateDebut);
    if (dto.dateFin) deal.dateFin = new Date(dto.dateFin);

    return this.bonPlanRepo.save(deal);
  }

  async toggleStatut(id: number): Promise<BonPlan> {
    const deal = await this.findOne(id);
    deal.statut = deal.statut === 'actif' ? 'expire' : 'actif';
    return this.bonPlanRepo.save(deal);
  }

  async remove(id: number): Promise<void> {
    const deal = await this.findOne(id);
    deal.is_delete = true;
    await this.bonPlanRepo.softRemove(deal);
  }

  // --- JEUX CONCOURS ---

  async participer(
    dealId: number,
    dto: ParticiperConcoursDto,
    userId?: number,
  ): Promise<ParticipationConcours> {
    const deal = await this.findOne(dealId);
    if (deal.categorie !== 'concours') {
      throw new BadRequestException('Cette offre n’est pas un jeu concours.');
    }
    if (deal.statut !== 'actif') {
      throw new BadRequestException(
        'Ce jeu concours est clos ou pas encore ouvert.',
      );
    }

    // Vérifier les doublons d'email sur ce même concours
    const existing = await this.participationRepo.findOne({
      where: { bonPlanId: deal.id, email: dto.email.trim().toLowerCase() },
    });
    if (existing) {
      throw new BadRequestException(
        'Vous avez déjà participé à ce tirage au sort !',
      );
    }

    const participation = this.participationRepo.create({
      bonPlanId: deal.id,
      userId: userId || null,
      nom: dto.nom.trim(),
      email: dto.email.trim().toLowerCase(),
      telephone: dto.telephone?.trim() || null,
    });

    return this.participationRepo.save(participation);
  }

  async getParticipations(dealId: number): Promise<ParticipationConcours[]> {
    const deal = await this.findOne(dealId);
    return this.participationRepo.find({
      where: { bonPlanId: deal.id },
      order: { created_at: 'DESC' },
    });
  }

  async tirerGagnants(
    dealId: number,
    count: number,
  ): Promise<ParticipationConcours[]> {
    const deal = await this.findOne(dealId);
    const nonGagnants = await this.participationRepo.find({
      where: { bonPlanId: deal.id, estGagnant: false },
    });

    if (nonGagnants.length === 0) {
      throw new BadRequestException(
        'Aucun participant éligible pour le tirage au sort.',
      );
    }

    // Mélange aléatoire (Fisher-Yates)
    const shuffled = [...nonGagnants].sort(() => Math.random() - 0.5);
    const winners = shuffled.slice(0, Math.min(count, shuffled.length));

    for (const w of winners) {
      w.estGagnant = true;
      await this.participationRepo.save(w);
    }

    return winners;
  }
}
