import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAlerteTable1785242210143 implements MigrationInterface {
  name = 'UpdateAlerteTable1785242210143';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "alerts" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "is_delete" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD "is_delete" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "alerts" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "nom_journal" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "type_journal" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "nom_ville" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "email_contact" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "tel_contact" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "description_footer" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "description_footer" SET DEFAULT 'Le journal indépendant de chalons-en-champagne et sa périphérie, pour rester connectés à la vie locale en temps réel.'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "tel_contact" SET DEFAULT '03 26 26 08 30'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "email_contact" SET DEFAULT 'contact@collectif-chalonnais.fr'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "nom_ville" SET DEFAULT 'Châlons'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "type_journal" SET DEFAULT 'Journal Associatif'`,
    );
    await queryRunner.query(
      `ALTER TABLE "settings" ALTER COLUMN "nom_journal" SET DEFAULT 'Collectif Chalonnais'`,
    );
    await queryRunner.query(`ALTER TABLE "alerts" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "alerts" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "alerts" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "alerts" DROP COLUMN "is_delete"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "settings" DROP COLUMN "is_delete"`);
    await queryRunner.query(
      `ALTER TABLE "alerts" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`,
    );
  }
}
