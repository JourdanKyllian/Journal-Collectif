import {
  Controller,
  Get,
  Inject,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly dataSource: DataSource,
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  @Get()
  async checkHealth() {
    const health = {
      status: 'healthy',
      database: 'connected',
      cache: 'connected',
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
    };

    // Vérifie PostgreSQL (critique pour l'application)
    try {
      await this.dataSource.query('SELECT 1');
    } catch (error) {
      this.logger.error(
        'Échec de la connexion PostgreSQL lors du HealthCheck',
        error instanceof Error ? error.stack : error,
      );

      throw new ServiceUnavailableException({
        ...health,
        status: 'unhealthy',
        database: 'disconnected',
      });
    }

    // Vérifie Redis (optionnel / non bloquant sur les environnements sans cache managé)
    try {
      await this.redis.ping();
    } catch {
      this.logger.warn(
        'Redis non disponible, ignoré pour le healthcheck en production.',
      );
      health.cache = 'disconnected (optional)';
    }

    this.logger.log('HealthCheck exécuté avec succès');

    return health;
  }
}
