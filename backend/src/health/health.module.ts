import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import Redis from 'ioredis';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          // Empêche ioredis de saturer les logs et de crasher si le service est absent
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          retryStrategy: () => null, // Désactive les essais en boucle
        });
      },
    },
  ],
})
export class HealthModule {}
