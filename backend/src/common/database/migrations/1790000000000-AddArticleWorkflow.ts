import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Workflow éditorial : programmation de publication, révisions d'articles publiés
 * et historique d'audit.
 */
export class AddArticleWorkflow1790000000000 implements MigrationInterface {
  name = 'AddArticleWorkflow1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "article" ADD "scheduled_at" TIMESTAMP WITH TIME ZONE`,
    );

    await queryRunner.query(`
      CREATE TABLE "article_revision" (
        "id" SERIAL NOT NULL,
        "article_id" integer NOT NULL,
        "author_id" integer,
        "titre" character varying(255) NOT NULL,
        "contenu" text NOT NULL,
        "image_couverture" character varying(255),
        "source_link" character varying(255),
        "categorie_id" integer,
        "status" character varying(20) NOT NULL DEFAULT 'en_cours',
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "applied_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_article_revision" PRIMARY KEY ("id"),
        CONSTRAINT "FK_article_revision_article" FOREIGN KEY ("article_id")
          REFERENCES "article"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_article_revision_author" FOREIGN KEY ("author_id")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_article_revision_open" ON "article_revision" ("article_id") WHERE "status" = 'en_cours'`,
    );

    await queryRunner.query(`
      CREATE TABLE "article_history" (
        "id" SERIAL NOT NULL,
        "article_id" integer NOT NULL,
        "user_id" integer,
        "action" character varying(40) NOT NULL,
        "details" jsonb,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_article_history" PRIMARY KEY ("id"),
        CONSTRAINT "FK_article_history_article" FOREIGN KEY ("article_id")
          REFERENCES "article"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_article_history_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_article_history_article" ON "article_history" ("article_id", "created_at" DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_article_history_article"`);
    await queryRunner.query(`DROP TABLE "article_history"`);
    await queryRunner.query(`DROP INDEX "UQ_article_revision_open"`);
    await queryRunner.query(`DROP TABLE "article_revision"`);
    await queryRunner.query(`ALTER TABLE "article" DROP COLUMN "scheduled_at"`);
  }
}
