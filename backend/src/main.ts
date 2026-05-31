import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  // BufferLogs en true permet à Pino de capturer les logs de démarrage de NestJS
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Confier les clés du camion à Pino
  app.useLogger(app.get(Logger));

  // --- SÉCURITÉ ---

  // Protection des en-têtes HTTP
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

  // CORS : Autoriser ton Frontend
  app.enableCors({
    origin: [
      'http://localhost:4200',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3000/api',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // --- CONFIGURATION GLOBALE ---

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // --- SWAGGER ---

  const config = new DocumentBuilder()
    .setTitle('Journal API')
    .setDescription(
      "Documentation de l'API du projet Journal du Collectif Chalonnais",
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // --- DÉMARRAGE ---

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  // Vrai Logger au lieu de console.log pour formater en JSON
  const logger = app.get(Logger);
  logger.log(`Serveur lancé sur : http://localhost:${port}/api/v1`);
  logger.log(`Documentation API sur : http://localhost:${port}/api-docs`);
}

bootstrap().catch((err) => {
  // Garder un console.error en dernier recours en cas de crash fatal avant l'init
  console.error('Erreur fatale lors du démarrage :', err);
});
