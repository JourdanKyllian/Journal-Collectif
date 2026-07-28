import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNomVilleToSettings1785233698881 implements MigrationInterface {
  name = 'AddNomVilleToSettings1785233698881';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "nom_ville" character varying(100) NOT NULL DEFAULT 'Châlons'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "nom_journal" SET DEFAULT 'Collectif Chalonnais'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "type_journal" SET DEFAULT 'Journal Associatif'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "email_contact" SET DEFAULT 'contact@collectif-chalonnais.fr'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "description_footer" SET DEFAULT 'Le journal indépendant de chalons-en-champagne et sa périphérie, pour rester connectés à la vie locale en temps réel.'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "description_footer" SET DEFAULT 'Le journal officiel et indépendant de la commune, pour rester connectés à la vie locale en temps réel.'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "email_contact" SET DEFAULT 'contact@chalonnais.fr'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "type_journal" SET DEFAULT 'Journal Municipal'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "nom_journal" SET DEFAULT 'Collectif Chalonnais 06'`,
    );
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "nom_ville"`);
  }
}
