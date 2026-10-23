import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { configureApp } from './app.setup';
import * as express from 'express';
import { join } from 'path';
import * as fs from 'fs';

// Import des outils de base de données
import { DataSource } from 'typeorm';
import { TableSeedService } from './common/database/seed/table.seed';
import { AdminSeedService } from './common/database/seed/admin.seed';

/**
 * Initialise et démarre l'application backend NestJS.
 *
 * Configure la sécurité (Helmet, CORS), le journaliseur (Pino),
 * le versionnage de l'API (URI), la validation globale des données,
 * le filtre global d'exceptions, et génère la documentation Swagger.
 * Exécute également les migrations et le seeding automatiquement.
 *
 * @async
 * @returns {Promise<void>} Une promesse qui se résout lorsque l'application est en écoute.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // On récupère le logger tout de suite pour l'utiliser dans le bootstrap
  const logger = app.get(Logger);
  app.useLogger(logger);
  // exposition du dossier des uploads
  const uploadDir = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadDir));

  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
          scriptSrc: [`'self'`, `https:`, `'unsafe-inline'`],
        },
      },
    }),
  );

  app.enableCors({
    origin: function (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) {
      const allowedOrigins = [
        'http://localhost',
        'http://localhost:4200',
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:3000/api',
        'https://journal-collectif.vercel.app',
      ];
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  configureApp(app);

  const config = new DocumentBuilder()
    .setTitle('Journal API')
    .setDescription(
      "Documentation de l'API du projet Journal du Collectif Chalonnais",
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // --- 1. EXÉCUTION DES MIGRATIONS TYPEORM ---
  try {
    logger.log('Initialisation et vérification des migrations...');
    const dataSource = app.get(DataSource);
    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }
    await dataSource.runMigrations();
    logger.log('✅ Migrations exécutées et à jour.');
  } catch (error) {
    logger.error('❌ Erreur critique lors des migrations :', error);
  }

  // --- 2. SEEDING (uniquement sur demande explicite : RUN_SEED=true) ---
  // Le seed crée des comptes aux mots de passe connus : il ne doit jamais partir tout seul.
  if (process.env.RUN_SEED === 'true') {
    try {
      logger.log('RUN_SEED=true : exécution du seeding...');
      await app.get(TableSeedService).seed();
      await app.get(AdminSeedService).seed();
      logger.log('✅ Seeding terminé avec succès.');
    } catch (error) {
      logger.error('❌ Erreur lors du seeding :', error);
    }
  } else {
    logger.log('Seeding ignoré (définir RUN_SEED=true pour l’exécuter).');
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Serveur lancé sur : http://localhost:${port}/api/v1`);
  logger.log(`📄 Documentation API sur : http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('Erreur fatale lors du démarrage :', err);
});
