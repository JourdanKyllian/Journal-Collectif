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
  // Instancie le Logger en lui donnant le nom du contrôleur pour tracer d'où vient le log
  private readonly logger = new Logger(HealthController.name);

  constructor(
    // Injection de TypeORM pour interroger PostgreSQL
    private readonly dataSource: DataSource,
    // Injection du client Redis via le token défini
    @Inject('REDIS_CLIENT') private readonly redis: Redis,
  ) {}

  @Get()
  async checkHealth() {
    const health = {
      status: 'healthy',
      database: 'connected',
      cache: 'connected',
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
    // Si tout passe, on retourne l'objet
    return health;
  }
}
