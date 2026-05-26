import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TableSeedService } from './common/database/seed/table.seed';
import { AdminSeedService } from './common/database/seed/admin.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // On récupère tes deux services
  const tableSeedService = app.get(TableSeedService);
  const adminSeedService = app.get(AdminSeedService);

  console.log('🌱 --- DÉBUT DU SEEDING --- 🌱');

  try {
    // 1. On lance le service des tables (Rôles)
    await tableSeedService.seed();
    
    // 2. On lance le service de l'Admin
    await adminSeedService.seed();

    console.log('--- SEEDING TERMINÉ AVEC SUCCÈS ---');
  } catch (error) {
    console.error('ERREUR LORS DU SEEDING :', error);
  } finally {
    await app.close();
  }
}

bootstrap();