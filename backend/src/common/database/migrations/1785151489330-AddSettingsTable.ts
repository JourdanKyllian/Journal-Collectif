import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSettingsTable1785151489330 implements MigrationInterface {
    name = 'AddSettingsTable1785151489330'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "favoris_categorie" DROP CONSTRAINT "FK_bb461f09e7eb7e66ec8f1acbdcd"`);
        await queryRunner.query(`ALTER TABLE "article" DROP CONSTRAINT "FK_cdd234ef147c8552a8abd42bd29"`);
        await queryRunner.query(`ALTER TABLE "favoris_categorie" RENAME COLUMN "category_id" TO "categorie_id"`);
        await queryRunner.query(`ALTER TABLE "favoris_categorie" RENAME CONSTRAINT "PK_eced567ae62fc80d8caa9259cde" TO "PK_18add9a3ba9dcfad0f6867c3e80"`);
        await queryRunner.query(`ALTER TABLE "article" RENAME COLUMN "category_id" TO "categorie_id"`);
        await queryRunner.query(`CREATE TABLE "categorie" ("id" SERIAL NOT NULL, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "libelle" character varying(100) NOT NULL, "description" text, "icon" character varying(10) NOT NULL, "image_bandeau_url" character varying(255) NOT NULL, CONSTRAINT "PK_a761331f20634c53bf660312062" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "settings" ("id" SERIAL NOT NULL, "nom_journal" character varying(100) NOT NULL DEFAULT 'Collectif Chalonnais 06', "type_journal" character varying(50) NOT NULL DEFAULT 'Journal Municipal', "email_contact" character varying(255) NOT NULL DEFAULT 'contact@chalonnais.fr', "tel_contact" character varying(20) NOT NULL DEFAULT '03 26 26 08 30', "description_footer" text NOT NULL DEFAULT 'Le journal officiel et indépendant de la commune, pour rester connectés à la vie locale en temps réel.', CONSTRAINT "PK_0669fe20e252eb692bf4d344975" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "favoris_categorie" ADD CONSTRAINT "FK_9c49d7a2363c83791e2db309f64" FOREIGN KEY ("categorie_id") REFERENCES "categorie"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "article" ADD CONSTRAINT "FK_115bb330eb4250fa89ee1578e37" FOREIGN KEY ("categorie_id") REFERENCES "categorie"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "article" DROP CONSTRAINT "FK_115bb330eb4250fa89ee1578e37"`);
        await queryRunner.query(`ALTER TABLE "favoris_categorie" DROP CONSTRAINT "FK_9c49d7a2363c83791e2db309f64"`);
        await queryRunner.query(`DROP TABLE "settings"`);
        await queryRunner.query(`DROP TABLE "categorie"`);
        await queryRunner.query(`ALTER TABLE "article" RENAME COLUMN "categorie_id" TO "category_id"`);
        await queryRunner.query(`ALTER TABLE "favoris_categorie" RENAME CONSTRAINT "PK_18add9a3ba9dcfad0f6867c3e80" TO "PK_eced567ae62fc80d8caa9259cde"`);
        await queryRunner.query(`ALTER TABLE "favoris_categorie" RENAME COLUMN "categorie_id" TO "category_id"`);
        await queryRunner.query(`ALTER TABLE "article" ADD CONSTRAINT "FK_cdd234ef147c8552a8abd42bd29" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "favoris_categorie" ADD CONSTRAINT "FK_bb461f09e7eb7e66ec8f1acbdcd" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
