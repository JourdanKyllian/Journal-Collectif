import { MigrationInterface, QueryRunner } from 'typeorm';

/** Tables qui reçoivent un `journal_id` : (table, nom court utilisé dans les index et contraintes). */
const TENANT_TABLES = [
  ['article', 'article'],
  ['categorie', 'categorie'],
  ['alerts', 'alerts'],
  ['declaration_objet', 'declaration_objet'],
] as const;

/**
 * Multi-tenant : journaux, communes, adhésions (rôle par journal) et `journal_id` sur les contenus.
 *
 * Rétrocompatible : un journal historique `actif` est créé à partir de `settings`, tout le contenu
 * existant lui est rattaché, et les rôles actuels des comptes deviennent des adhésions à ce journal.
 * La table `settings` n'est plus lue mais conservée (suppression dans une migration ultérieure).
 */
export class AddMultiTenant1792000000000 implements MigrationInterface {
  name = 'AddMultiTenant1792000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- 1. Nouvelles tables -------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "commune" (
        "id" SERIAL NOT NULL,
        "nom" character varying(150) NOT NULL,
        "code_insee" character varying(5) NOT NULL,
        "code_postal" character varying(5) NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bc512eb8412b43c9dc6e2c9e683" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_commune_code_insee" ON "commune" ("code_insee")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_commune_code_postal" ON "commune" ("code_postal")`,
    );

    await queryRunner.query(`
      CREATE TABLE "journal" (
        "id" SERIAL NOT NULL,
        "slug" character varying(63) NOT NULL,
        "nom_journal" character varying(100) NOT NULL,
        "type_journal" character varying(50) NOT NULL DEFAULT 'Journal',
        "nom_ville" character varying(100) NOT NULL,
        "email_contact" character varying(255) NOT NULL DEFAULT '',
        "tel_contact" character varying(20) NOT NULL DEFAULT '',
        "description_footer" text NOT NULL DEFAULT '',
        "statut" character varying(20) NOT NULL DEFAULT 'en_configuration',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_396f862c229742e29f888b1abce" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_journal_slug" ON "journal" ("slug")`,
    );

    await queryRunner.query(`
      CREATE TABLE "journal_commune" (
        "journal_id" integer NOT NULL,
        "commune_id" integer NOT NULL,
        CONSTRAINT "PK_78063b990ce5b814d0d9a86507a" PRIMARY KEY ("journal_id", "commune_id")
      )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_f1de7167fea4206978bedef31e" ON "journal_commune" ("journal_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_85ed53f3ae45cfdaaea59435e1" ON "journal_commune" ("commune_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_commune" ADD CONSTRAINT "FK_f1de7167fea4206978bedef31ef"
         FOREIGN KEY ("journal_id") REFERENCES "journal"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_commune" ADD CONSTRAINT "FK_85ed53f3ae45cfdaaea59435e13"
         FOREIGN KEY ("commune_id") REFERENCES "commune"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );

    await queryRunner.query(`
      CREATE TABLE "journal_member" (
        "id" SERIAL NOT NULL,
        "user_id" integer NOT NULL,
        "journal_id" integer NOT NULL,
        "role_id" integer NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_e1dab0a189d631714886701efb5" PRIMARY KEY ("id")
      )`);
    await queryRunner.query(
      `CREATE INDEX "IDX_journal_member_journal" ON "journal_member" ("journal_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_journal_member_user_journal" ON "journal_member" ("user_id", "journal_id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_member" ADD CONSTRAINT "FK_journal_member_user"
         FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_member" ADD CONSTRAINT "FK_journal_member_journal"
         FOREIGN KEY ("journal_id") REFERENCES "journal"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "journal_member" ADD CONSTRAINT "FK_journal_member_role"
         FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );

    // --- 2. Niveau plateforme sur les comptes -----------------------------------------------
    await queryRunner.query(
      `ALTER TABLE "users" ADD "is_platform_admin" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "must_change_password" boolean NOT NULL DEFAULT false`,
    );

    // --- 3. Journal historique, créé depuis les réglages actuels ---------------------------
    const slug =
      process.env.DEFAULT_JOURNAL_SLUG?.trim() || 'collectif-chalonnais';
    // La ligne de réglages peut ne pas exister (aucune migration ne la crée) : valeurs de repli explicites.
    const [{ id: journalId }] = (await queryRunner.query(
      `INSERT INTO "journal"
         ("slug", "nom_journal", "type_journal", "nom_ville", "email_contact",
          "tel_contact", "description_footer", "statut")
       SELECT $1,
              COALESCE(s."nom_journal", 'Collectif Chalonnais'),
              COALESCE(s."type_journal", 'Journal'),
              COALESCE(s."nom_ville", 'Châlons'),
              COALESCE(s."email_contact", ''),
              COALESCE(s."tel_contact", ''),
              COALESCE(s."description_footer", ''),
              'actif'
       FROM (SELECT 1) AS one
       LEFT JOIN "settings" s ON s."id" = 1
       RETURNING "id"`,
      [slug],
    )) as Array<{ id: number }>;

    // --- 4. Rattachement des contenus existants : nullable → rempli → NOT NULL ---------------
    for (const [table, short] of TENANT_TABLES) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD "journal_id" integer`,
      );
      await queryRunner.query(`UPDATE "${table}" SET "journal_id" = $1`, [
        journalId,
      ]);
      await queryRunner.query(
        `ALTER TABLE "${table}" ALTER COLUMN "journal_id" SET NOT NULL`,
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_${short}_journal" ON "${table}" ("journal_id")`,
      );
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD CONSTRAINT "FK_${short}_journal"
           FOREIGN KEY ("journal_id") REFERENCES "journal"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
      );
    }

    // --- 5. Les rôles actuels deviennent des adhésions au journal historique ---------------
    await queryRunner.query(
      `INSERT INTO "journal_member" ("user_id", "journal_id", "role_id")
       SELECT "id", $1, "role_id" FROM "users" WHERE "role_id" IS NOT NULL
       ON CONFLICT ("user_id", "journal_id") DO NOTHING`,
      [journalId],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [table, short] of [...TENANT_TABLES].reverse()) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP CONSTRAINT "FK_${short}_journal"`,
      );
      await queryRunner.query(`DROP INDEX "IDX_${short}_journal"`);
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN "journal_id"`,
      );
    }
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "must_change_password"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "is_platform_admin"`,
    );
    await queryRunner.query(`DROP TABLE "journal_member"`);
    await queryRunner.query(`DROP TABLE "journal_commune"`);
    await queryRunner.query(`DROP TABLE "journal"`);
    await queryRunner.query(`DROP TABLE "commune"`);
  }
}
