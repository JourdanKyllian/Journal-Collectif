import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet'; // <-- 1. L'import de Helmet

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- 🛡️ SÉCURITÉ ---

  // Protection des en-têtes HTTP
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
      // On assouplit légèrement la CSP pour autoriser l'interface de Swagger
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
    // Remplace ces URLs par celles de ton futur Frontend (ex: localhost:4200 pour Angular, 5173 pour Vite, etc.)
    origin: ['http://localhost:4200', 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:3000/api'], 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Très important si tu utilises des cookies ou des sessions plus tard
  });

  // --- ⚙️ CONFIGURATION GLOBALE ---

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // --- 📖 SWAGGER ---

  const config = new DocumentBuilder()
    .setTitle('Journal API')
    .setDescription('Documentation de l\'API du projet Journal du Collectif Chalonnais')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // --- 🚀 DÉMARRAGE ---

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Serveur lancé sur : http://localhost:3000/api/v1`);
  console.log(`📖 Documentation API sur : http://localhost:3000/api-docs`);
}
bootstrap();