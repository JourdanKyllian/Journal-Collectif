import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Versioning (v1, v2...)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Active la validation globale des DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Configuration de Swagger
  const config = new DocumentBuilder()
    .setTitle('Journal API')
    .setDescription('Documentation de l\'API du projet Journal du Collectif Chalonnais')
    .setVersion('1.0')
    .addBearerAuth() // Ajoute le bouton "Authorize" pour tes tokens JWT
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // (http://localhost:3000/api)

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Serveur lancé sur : http://localhost:3000`);
  console.log(`📖 Documentation API sur : http://localhost:3000/api`);
}
bootstrap();
