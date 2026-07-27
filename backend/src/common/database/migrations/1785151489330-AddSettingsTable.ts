import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSettingsTable1785151489330 implements MigrationInterface {
  name = 'AddSettingsTable1785151489330';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // On crée UNIQUEMENT la table settings
    await queryRunner.query(
      `CREATE TABLE "settings" ("id" SERIAL NOT NULL, "nom_journal" character varying(100) NOT NULL DEFAULT 'Collectif Chalonnais 06', "type_journal" character varying(50) NOT NULL DEFAULT 'Journal Municipal', "email_contact" character varying(255) NOT NULL DEFAULT 'contact@chalonnais.fr', "tel_contact" character varying(20) NOT NULL DEFAULT '03 26 26 08 30', "description_footer" text NOT NULL DEFAULT 'Le journal officiel et indépendant de la commune, pour rester connectés à la vie locale en temps réel.', CONSTRAINT "PK_settings" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "settings"`);
  }
}
