import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { DataSource } from 'typeorm';
import { ServiceUnavailableException } from '@nestjs/common';
import {
  beforeEach,
  describe,
  it,
  expect,
  afterEach,
  jest,
} from '@jest/globals';

describe('HealthController', () => {
  let controller: HealthController;

  // Simulation typée de TypeORM (PostgreSQL)
  const mockDataSource = {
    query: jest.fn<() => Promise<Record<string, number>[]>>(),
  };

  // Simulation typée du client Redis
  const mockRedis = {
    ping: jest.fn<() => Promise<string>>(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      // On injecte les mocks directement ici
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

  it('devrait retourner le statut "healthy" en JSON natif', async () => {
    mockDataSource.query.mockResolvedValue([{ '?column?': 1 }]);
    mockRedis.ping.mockResolvedValue('PONG');

    const result = await controller.checkHealth();

    expect(result.status).toBe('healthy');
    expect(result.database).toBe('connected');
    expect(result.cache).toBe('connected');
    expect(result).toHaveProperty('timestamp');
  });

  it('devrait jeter une erreur 503 (ServiceUnavailable) si PostgreSQL crash', async () => {
    mockDataSource.query.mockRejectedValue(new Error('Connection timeout'));
    mockRedis.ping.mockResolvedValue('PONG');

    await expect(controller.checkHealth()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('devrait jeter une erreur 503 (ServiceUnavailable) si Redis crash', async () => {
    mockDataSource.query.mockResolvedValue([{ '?column?': 1 }]);
    mockRedis.ping.mockRejectedValue(new Error('Redis timeout'));

    await expect(controller.checkHealth()).rejects.toThrow(
      ServiceUnavailableException,
    );
  });
});
