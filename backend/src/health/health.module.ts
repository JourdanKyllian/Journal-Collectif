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
        // En local, ça pointera sur localhost.
        // Sur Docker, process.env.REDIS_HOST prendra la valeur "redis"
        return new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          // Ne bloque pas le démarrage si Redis est absent
          maxRetriesPerRequest: 1,
        });
      },
    },
  ],
})
export class HealthModule {}
