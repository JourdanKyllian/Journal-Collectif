import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddParkingAndBonPlan1793000000000 implements MigrationInterface {
  name = 'AddParkingAndBonPlan1793000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Table parking
    await queryRunner.query(`
      CREATE TABLE "parking" (
        "id" SERIAL NOT NULL,
        "journal_id" integer NOT NULL,
        "name" character varying(150) NOT NULL,
        "type" character varying(30) NOT NULL DEFAULT 'Surface',
        "total" integer NOT NULL DEFAULT 100,
        "available" integer NOT NULL DEFAULT 0,
        "has_sensors" boolean NOT NULL DEFAULT false,
        "affluence_mediane" character varying(20) DEFAULT 'moderee',
        "ev_spots" integer NOT NULL DEFAULT 0,
        "free_grace_period" character varying(100) NOT NULL DEFAULT 'Payant',
        "distance" character varying(100) NOT NULL DEFAULT 'À proximité',
        "address" character varying(255),
        "status_note" character varying(255),
        "google_maps_url" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "is_delete" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_parking_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_parking_journal" ON "parking" ("journal_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "parking"
      ADD CONSTRAINT "FK_parking_journal"
      FOREIGN KEY ("journal_id") REFERENCES "journal"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    // 2. Table bon_plan
    await queryRunner.query(`
      CREATE TABLE "bon_plan" (
        "id" SERIAL NOT NULL,
        "journal_id" integer NOT NULL,
        "titre" character varying(150) NOT NULL,
        "description" text NOT NULL,
        "categorie" character varying(30) NOT NULL DEFAULT 'code_promo',
        "partenaire" character varying(100) NOT NULL,
        "valeur" character varying(50) NOT NULL,
        "code_promo" character varying(50),
        "lien_url" text,
        "image" text,
        "date_debut" TIMESTAMP WITH TIME ZONE,
        "date_fin" TIMESTAMP WITH TIME ZONE NOT NULL,
        "est_exclusif" boolean NOT NULL DEFAULT false,
        "statut" character varying(20) NOT NULL DEFAULT 'actif',
        "conditions" text,
        "is_delete" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_bon_plan_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bon_plan_journal" ON "bon_plan" ("journal_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "bon_plan"
      ADD CONSTRAINT "FK_bon_plan_journal"
      FOREIGN KEY ("journal_id") REFERENCES "journal"("id")
      ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    // 3. Table participation_concours
    await queryRunner.query(`
      CREATE TABLE "participation_concours" (
        "id" SERIAL NOT NULL,
        "bon_plan_id" integer NOT NULL,
        "user_id" integer,
        "nom" character varying(100) NOT NULL,
        "email" character varying(150) NOT NULL,
        "telephone" character varying(20),
        "est_gagnant" boolean NOT NULL DEFAULT false,
        "is_delete" boolean NOT NULL DEFAULT false,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_participation_concours_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_participation_bon_plan" ON "participation_concours" ("bon_plan_id")
    `);

    await queryRunner.query(`
      ALTER TABLE "participation_concours"
      ADD CONSTRAINT "FK_participation_bon_plan"
      FOREIGN KEY ("bon_plan_id") REFERENCES "bon_plan"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "participation_concours"
      ADD CONSTRAINT "FK_participation_user"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "participation_concours"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bon_plan"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "parking"`);
  }
}
