import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TableSeedService } from './common/database/seed/table.seed';
import { AdminSeedService } from './common/database/seed/admin.seed';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // Récupère tes deux services
  const tableSeedService = app.get(TableSeedService);
  const adminSeedService = app.get(AdminSeedService);

  console.log('🌱 --- DÉBUT DU SEEDING --- 🌱');

  try {
    // Lance le service des tables (Rôles)
    await tableSeedService.seed();

    // Lance le service de l'Admin
    await adminSeedService.seed();

    console.log('--- SEEDING TERMINÉ AVEC SUCCÈS ---');
  } catch (error) {
    console.error('ERREUR LORS DU SEEDING :', error);
  } finally {
    await app.close();
  }
}

bootstrap().catch((err) => {
  console.error('Erreur lors du démarrage :', err);
});
