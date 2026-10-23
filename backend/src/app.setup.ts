import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

/**
 * Configuration HTTP partagée entre `main.ts` et les tests e2e :
 * les tests exercent ainsi exactement les mêmes pipes, versions et filtres que la production.
 */
export function configureApp(app: INestApplication): void {
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
}
