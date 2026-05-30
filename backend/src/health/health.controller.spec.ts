import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { DataSource } from 'typeorm';
import { ServiceUnavailableException } from '@nestjs/common';

describe('HealthController', () => {
  let controller: HealthController;

  // Simulation de TypeORM (PostgreSQL)
  const mockDataSource = {
    query: jest.fn(),
  };

  // Simulation du client Redis
  const mockRedis = {
    ping: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedis,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Simuler une bonne connexion
  it('devrait retourner le statut "healthy" en JSON natif', async () => {
    // Les services répondent bien
    mockDataSource.query.mockResolvedValue([{ '?column?': 1 }]);
    mockRedis.ping.mockResolvedValue('PONG');

    const result = await controller.checkHealth();

    expect(result.status).toBe('healthy');
    expect(result.database).toBe('connected');
    expect(result.cache).toBe('connected');
    expect(result).toHaveProperty('timestamp');
  });

  // Simuler une erreur PostgreSQL
  it('devrait jeter une erreur 503 (ServiceUnavailable) si PostgreSQL crash', async () => {
    // PostgreSQL échoue, Redis fonctionne
    mockDataSource.query.mockRejectedValue(new Error('Connection timeout'));
    mockRedis.ping.mockResolvedValue('PONG');

    // On attend que le contrôleur lève l'exception native NestJS
    await expect(controller.checkHealth()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  // Simuler une erreur Redis
  it('devrait jeter une erreur 503 (ServiceUnavailable) si Redis crash', async () => {
    // PostgreSQL fonctionne, Redis échoue
    mockDataSource.query.mockResolvedValue([{ '?column?': 1 }]);
    mockRedis.ping.mockRejectedValue(new Error('Redis timeout'));

    await expect(controller.checkHealth()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
