import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

/**
 * Initialise et démarre l'application backend NestJS.
 *
 * Configure la sécurité (Helmet, CORS), le journaliseur (Pino),
 * le versionnage de l'API (URI), la validation globale des données,
 * le filtre global d'exceptions, et génère la documentation Swagger.
 *
 * @async
 * @returns {Promise<void>} Une promesse qui se résout lorsque l'application est en écoute.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.use(cookieParser());

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

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());

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

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  const logger = app.get(Logger);
  logger.log(`Serveur lancé sur : http://localhost:${port}/api/v1`);
  logger.log(`Documentation API sur : http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('Erreur fatale lors du démarrage :', err);
});
