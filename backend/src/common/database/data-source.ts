import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Options de configuration pour la source de données TypeORM.
 * Permet de basculer dynamiquement entre une URL de connexion centralisée (Production / Supabase)
 * et des paramètres individuels (Développement local / Docker).
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  ...(process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'db',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      }),

  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],

  synchronize: false,
  logging: true,
};

/**
 * Instance principale de la source de données instanciée pour l'application NestJS.
 */
const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
