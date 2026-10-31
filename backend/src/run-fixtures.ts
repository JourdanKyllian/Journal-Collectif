import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script d'exécution automatique des fixtures de développement SQL.
 * Utilise la configuration de connexion PostgreSQL courante de NestJS (Docker, Local, etc.).
 */
async function runFixtures() {
  console.log('--- CHARGEMENT DES FIXTURES DE DÉVELOPPEMENT ---');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const dataSource = app.get(DataSource);
    const sqlPath = path.resolve(__dirname, '../fixtures-dev.sql');

    if (!fs.existsSync(sqlPath)) {
      throw new Error(`Le fichier SQL de fixtures n'existe pas : ${sqlPath}`);
    }

    const sql = fs.readFileSync(sqlPath, 'utf-8');
    await dataSource.query(sql);

    console.log('✅ Jeu complet de fixtures injecté avec succès !');
  } catch (error) {
    console.error('❌ Échec de l’injection des fixtures :', error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

runFixtures().catch((err) => {
  console.error('Erreur inattendue :', err);
  process.exit(1);
});

