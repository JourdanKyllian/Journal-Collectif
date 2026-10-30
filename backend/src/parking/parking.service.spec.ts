import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ParkingService } from './parking.service';
import { Parking } from './entities/parking.entity';
import { TenantContext } from '../tenant/tenant.context';

describe('ParkingService', () => {
  let service: ParkingService;

  const mockTenant = {
    journalId: 1,
  };

  const mockParking = {
    id: 1,
    journalId: 1,
    name: 'Parking Hôtel de Ville',
    type: 'Souterrain' as const,
    total: 200,
    available: 120,
    hasSensors: true,
    affluenceMediane: null,
    evSpots: 6,
    freeGracePeriod: '30 min gratuites',
    distance: '250 m',
    address: 'Place de la Mairie',
    statusNote: null,
    googleMapsUrl: null,
    isActive: true,
    is_delete: false,
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null as unknown as Date,
    journal: null as unknown as Parking['journal'],
  };

  const mockRepo = {
    create: jest
      .fn()
      .mockImplementation((dto: object) => ({ id: 1, ...dto }) as Parking),
    save: jest
      .fn()
      .mockImplementation((entity: Parking) => Promise.resolve(entity)),
    find: jest.fn().mockResolvedValue([mockParking]),
    findOne: jest.fn().mockResolvedValue(mockParking),
    softRemove: jest.fn().mockResolvedValue(mockParking),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParkingService,
        {
          provide: getRepositoryToken(Parking),
          useValue: mockRepo,
        },
        {
          provide: TenantContext,
          useValue: mockTenant,
        },
      ],
    }).compile();

    service = module.get<ParkingService>(ParkingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a parking for the current journal', async () => {
    const result = await service.create({
      name: 'Parking Gare',
      type: 'Gare',
      total: 150,
      hasSensors: true,
      available: 50,
    });
    expect(result.name).toBe('Parking Gare');
    expect(result.journalId).toBe(1);
    expect(mockRepo.save).toHaveBeenCalled();
  });

  it('should return all active parkings', async () => {
    const result = await service.findAll(false);
    expect(result).toHaveLength(1);
    expect(mockRepo.find).toHaveBeenCalledWith({
      where: { journalId: 1, is_delete: false, isActive: true },
      order: { id: 'ASC' },
    });
  });

  it('should update median affluence for non-equipped parking', async () => {
    const nonEquipped = {
      ...mockParking,
      hasSensors: false,
      affluenceMediane: 'moderee' as const,
    };
    mockRepo.findOne.mockResolvedValueOnce(nonEquipped);

    const result = await service.updateAffluence(1, 'forte');
    expect(result.affluenceMediane).toBe('forte');
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
