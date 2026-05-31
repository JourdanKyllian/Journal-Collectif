import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

// Charge les variables d'environnement
dotenv.config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,

  // Utilise des chemins qui fonctionnent à la fois en TS (dev) et JS (dist)
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],

  synchronize: false, // Toujours false en production !
  logging: true,
};

// Instance pour NestJS
const dataSource = new DataSource(dataSourceOptions);

// Instance pour la CLI TypeORM (Migrations, etc.)
export default dataSource;
