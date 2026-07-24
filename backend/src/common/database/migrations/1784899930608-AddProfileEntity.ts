import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProfileEntity1784899930608 implements MigrationInterface {
    name = 'AddProfileEntity1784899930608'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "profile" ("id" SERIAL NOT NULL, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "firstname" character varying(100), "lastname" character varying(100), "tel" character varying(20), "bio" character varying(250), "avatar_ref" character varying(50) NOT NULL DEFAULT 'default_01', "user_id" integer, CONSTRAINT "REL_d752442f45f258a8bdefeebb2f" UNIQUE ("user_id"), CONSTRAINT "PK_3dd8bfc97e4a77c70971591bdcb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastname"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firstname"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "tel"`);
        await queryRunner.query(`ALTER TABLE "image_article" ADD "is_delete" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "image_article" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "image_article" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "profile" ADD CONSTRAINT "FK_d752442f45f258a8bdefeebb2f2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "profile" DROP CONSTRAINT "FK_d752442f45f258a8bdefeebb2f2"`);
        await queryRunner.query(`ALTER TABLE "image_article" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "image_article" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "image_article" DROP COLUMN "is_delete"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "tel" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "firstname" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastname" character varying(100)`);
        await queryRunner.query(`DROP TABLE "profile"`);
    }

}
