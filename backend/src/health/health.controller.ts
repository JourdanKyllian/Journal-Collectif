import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';

@Controller('health')
export class HealthController {
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
      throw new ServiceUnavailableException({
        ...health,
        status: 'unhealthy',
        cache: 'disconnected',
      });
    }

    // Si tout passe, on retourne l'objet
    return health;
  }
}