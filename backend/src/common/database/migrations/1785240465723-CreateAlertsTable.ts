import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAlertsTable1785240465723 implements MigrationInterface {
  name = 'CreateAlertsTable1785240465723';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "alerts" ("id" SERIAL NOT NULL, "type" character varying(20) NOT NULL, "title" character varying(100) NOT NULL, "message" text NOT NULL, "startDate" date, "endDate" date, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_60f895662df096bfcdfab7f4b96" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "alerts"`);
  }
}
