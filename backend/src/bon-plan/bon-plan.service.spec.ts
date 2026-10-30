import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BonPlanService } from './bon-plan.service';
import { BonPlan } from './entities/bon-plan.entity';
import { ParticipationConcours } from './entities/participation-concours.entity';
import { TenantContext } from '../tenant/tenant.context';

describe('BonPlanService', () => {
  let service: BonPlanService;

  const mockTenant = {
    journalId: 1,
  };

  const mockDeal = {
    id: 1,
    journalId: 1,
    titre: 'Place de concert offerte',
    description: 'Tirage au sort exclusif',
    categorie: 'concours' as const,
    partenaire: 'Théâtre Municipal',
    valeur: 'Jeu Concours',
    codePromo: null,
    lienUrl: null,
    image: null,
    dateDebut: null,
    dateFin: new Date(Date.now() + 86400000), // Demain
    estExclusif: true,
    statut: 'actif' as const,
    conditions: null,
    participations: [] as ParticipationConcours[],
    is_delete: false,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null as unknown as Date,
    journal: null as unknown as BonPlan['journal'],
  };

  const mockBonPlanRepo = {
    create: jest
      .fn()
      .mockImplementation((dto: object) => ({ id: 1, ...dto }) as BonPlan),
    save: jest
      .fn()
      .mockImplementation((entity: BonPlan) => Promise.resolve(entity)),
    find: jest.fn().mockResolvedValue([mockDeal]),
    findOne: jest.fn().mockResolvedValue(mockDeal),
    softRemove: jest.fn().mockResolvedValue(mockDeal),
  };

  const mockParticipationRepo = {
    create: jest
      .fn()
      .mockImplementation(
        (dto: object) => ({ id: 1, ...dto }) as ParticipationConcours,
      ),
    save: jest
      .fn()
      .mockImplementation((entity: ParticipationConcours) =>
        Promise.resolve(entity),
      ),
    find: jest.fn().mockResolvedValue([
      {
        id: 10,
        nom: 'Jean Dupont',
        email: 'jean@example.com',
        estGagnant: false,
      },
      {
        id: 11,
        nom: 'Marie Martin',
        email: 'marie@example.com',
        estGagnant: false,
      },
    ] as ParticipationConcours[]),
    findOne: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BonPlanService,
        {
          provide: getRepositoryToken(BonPlan),
          useValue: mockBonPlanRepo,
        },
        {
          provide: getRepositoryToken(ParticipationConcours),
          useValue: mockParticipationRepo,
        },
        {
          provide: TenantContext,
          useValue: mockTenant,
        },
      ],
    }).compile();

    service = module.get<BonPlanService>(BonPlanService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a deal for the current journal', async () => {
    const result = await service.create({
      titre: 'Réduction 20%',
      description: 'Sur toute la boutique',
      categorie: 'code_promo',
      partenaire: 'Boutique Bio',
      valeur: '-20%',
      dateFin: new Date(Date.now() + 86400000).toISOString(),
    });

    expect(result.titre).toBe('Réduction 20%');
    expect(result.journalId).toBe(1);
    expect(mockBonPlanRepo.save).toHaveBeenCalled();
  });

  it('should allow participation in a contest', async () => {
    const participation = await service.participer(1, {
      nom: 'Alice Doe',
      email: 'alice@example.com',
      telephone: '0612345678',
    });

    expect(participation.email).toBe('alice@example.com');
    expect(mockParticipationRepo.save).toHaveBeenCalled();
  });

  it('should draw winners randomly for a contest', async () => {
    const winners = await service.tirerGagnants(1, 1);
    expect(winners).toHaveLength(1);
    expect(winners[0].estGagnant).toBe(true);
    expect(mockParticipationRepo.save).toHaveBeenCalled();
  });
});
