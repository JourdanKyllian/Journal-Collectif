import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import cookieParser from 'cookie-parser';
import type { Application } from 'express';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

/**
 * Configuration HTTP partagée entre `main.ts` et les tests e2e :
 * les tests exercent ainsi exactement les mêmes pipes, versions et filtres que la production.
 */
export function configureApp(app: INestApplication): void {
  // Derrière un reverse proxy (Render), `req.ip` doit être l'IP du client et non celle du proxy.
  // Nombre de sauts de confiance : 1 pour un accès direct à Render (mobile) ; 2 si le trafic web
  // passe aussi par le proxy Vercel, sinon tous les visiteurs web partagent l'IP de Vercel.
  const hops = Number(process.env.TRUST_PROXY_HOPS ?? 1);
  (app.getHttpAdapter().getInstance() as Application).set(
    'trust proxy',
    Number.isInteger(hops) && hops >= 0 ? hops : 1,
  );

  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new GlobalExceptionFilter());
}
