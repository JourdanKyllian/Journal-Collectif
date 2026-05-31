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
  // Le Logger de NestJS sera automatiquement converti en JSON par Pino
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
      uptime: Math.floor(process.uptime()), // Temps en secondes depuis le démarrage
      version: process.env.npm_package_version || '1.0.0', // Récupère la version du package.json
      timestamp: new Date().toISOString(),
    };

    // Vérifie PostgreSQL
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

    // Vérifie Redis
    try {
      await this.redis.ping();
    } catch (error) {
      this.logger.error(
        'Échec de la connexion Redis lors du HealthCheck',
        error instanceof Error ? error.stack : error,
      );

      throw new ServiceUnavailableException({
        ...health,
        status: 'unhealthy',
        cache: 'disconnected',
      });
    }

    this.logger.log('HealthCheck exécuté avec succès');

    return health;
  }
}
