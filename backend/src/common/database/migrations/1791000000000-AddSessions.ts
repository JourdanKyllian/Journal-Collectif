import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Sessions multi-appareils : remplace `users.token_auth` (un seul refresh token par utilisateur).
 * Les refresh tokens existants deviennent invalides : chacun doit se reconnecter une fois.
 */
export class AddSessions1791000000000 implements MigrationInterface {
  name = 'AddSessions1791000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "session" (
        "id" uuid NOT NULL,
        "user_id" integer NOT NULL,
        "refresh_token_hash" character(64) NOT NULL,
        "previous_refresh_token_hash" character(64),
        "rotated_at" TIMESTAMP WITH TIME ZONE,
        "device_identifier" character varying(100),
        "user_agent" character varying(255),
        "ip_address" character varying(45),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "last_used_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
        "revoked_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_session" PRIMARY KEY ("id"),
        CONSTRAINT "FK_session_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_session_user" ON "session" ("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_session_expires" ON "session" ("expires_at")`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "token_auth"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "token_auth" character varying(255)`,
    );
    await queryRunner.query(`DROP INDEX "IDX_session_expires"`);
    await queryRunner.query(`DROP INDEX "IDX_session_user"`);
    await queryRunner.query(`DROP TABLE "session"`);
  }
}
