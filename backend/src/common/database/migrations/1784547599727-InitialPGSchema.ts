import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialPGSchema1784547599727 implements MigrationInterface {
    name = 'InitialPGSchema1784547599727'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "role" ("id" SERIAL NOT NULL, "libelle" character varying(50) NOT NULL, CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "declaration_objet" ("id" SERIAL NOT NULL, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "type_declaration" character varying(50) NOT NULL, "name_object" character varying(255) NOT NULL, "description" text NOT NULL, "lieu_presume" character varying(255), "image_url" character varying(255), "user_id" integer, CONSTRAINT "PK_e61a659ccea063e7a584d802a81" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "auteur_article" ("user_id" integer NOT NULL, "article_id" integer NOT NULL, "role_contribution" character varying(100), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_35ecd7e1910e1adca654153a4ea" PRIMARY KEY ("user_id", "article_id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "lastname" character varying(100), "firstname" character varying(100), "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "tel" character varying(20), "is_phone_verified" boolean NOT NULL DEFAULT false, "token_auth" character varying(255), "token_notification" character varying(255), "role_id" integer, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "favoris_categorie" ("user_id" integer NOT NULL, "category_id" integer NOT NULL, "wants_notifications" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_eced567ae62fc80d8caa9259cde" PRIMARY KEY ("user_id", "category_id"))`);
        await queryRunner.query(`CREATE TABLE "category" ("id" SERIAL NOT NULL, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "libelle" character varying(100) NOT NULL, "description" text, "icon" character varying(10) NOT NULL, "image_bandeau_url" character varying(255) NOT NULL, CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "image_article" ("id" SERIAL NOT NULL, "url_image" character varying(255) NOT NULL, "legend" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "article_id" integer, CONSTRAINT "PK_6ab057143620cf637e0c7a0ee72" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."article_statut_enum" AS ENUM('brouillon', 'en_attente', 'publie', 'corbeille')`);
        await queryRunner.query(`CREATE TABLE "article" ("id" SERIAL NOT NULL, "is_delete" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "titre" character varying(255) NOT NULL, "contenu" text NOT NULL, "image_couverture" character varying(255), "source_link" character varying(255), "statut" "public"."article_statut_enum" NOT NULL DEFAULT 'brouillon', "published_at" TIMESTAMP, "category_id" integer, CONSTRAINT "PK_40808690eb7b915046558c0f81b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "vue_statistique" ("id" SERIAL NOT NULL, "session_anonyme" character varying(255), "occured_at" TIMESTAMP NOT NULL DEFAULT now(), "article_id" integer, "user_id" integer, CONSTRAINT "PK_ea426fb6f58ebb1b52295a8b40d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "declaration_objet" ADD CONSTRAINT "FK_fa23c683df53e3f2dbd33d3370e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auteur_article" ADD CONSTRAINT "FK_2588026124b2b67d08e9ac70ce4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "auteur_article" ADD CONSTRAINT "FK_34c8a3df9a057d4031985b9e6e2" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "favoris_categorie" ADD CONSTRAINT "FK_92e92b1eabd4bdb5d6fc203b69f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "favoris_categorie" ADD CONSTRAINT "FK_bb461f09e7eb7e66ec8f1acbdcd" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "image_article" ADD CONSTRAINT "FK_9b1dc91da0a7bb0a2e109a501b3" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "article" ADD CONSTRAINT "FK_cdd234ef147c8552a8abd42bd29" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vue_statistique" ADD CONSTRAINT "FK_927515d747571dec8fac9740056" FOREIGN KEY ("article_id") REFERENCES "article"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "vue_statistique" ADD CONSTRAINT "FK_9a8c0b8326fa0073f83133bac73" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vue_statistique" DROP CONSTRAINT "FK_9a8c0b8326fa0073f83133bac73"`);
        await queryRunner.query(`ALTER TABLE "vue_statistique" DROP CONSTRAINT "FK_927515d747571dec8fac9740056"`);
        await queryRunner.query(`ALTER TABLE "article" DROP CONSTRAINT "FK_cdd234ef147c8552a8abd42bd29"`);
        await queryRunner.query(`ALTER TABLE "image_article" DROP CONSTRAINT "FK_9b1dc91da0a7bb0a2e109a501b3"`);
        await queryRunner.query(`ALTER TABLE "favoris_categorie" DROP CONSTRAINT "FK_bb461f09e7eb7e66ec8f1acbdcd"`);
        await queryRunner.query(`ALTER TABLE "favoris_categorie" DROP CONSTRAINT "FK_92e92b1eabd4bdb5d6fc203b69f"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1"`);
        await queryRunner.query(`ALTER TABLE "auteur_article" DROP CONSTRAINT "FK_34c8a3df9a057d4031985b9e6e2"`);
        await queryRunner.query(`ALTER TABLE "auteur_article" DROP CONSTRAINT "FK_2588026124b2b67d08e9ac70ce4"`);
        await queryRunner.query(`ALTER TABLE "declaration_objet" DROP CONSTRAINT "FK_fa23c683df53e3f2dbd33d3370e"`);
        await queryRunner.query(`DROP TABLE "vue_statistique"`);
        await queryRunner.query(`DROP TABLE "article"`);
        await queryRunner.query(`DROP TYPE "public"."article_statut_enum"`);
        await queryRunner.query(`DROP TABLE "image_article"`);
        await queryRunner.query(`DROP TABLE "category"`);
        await queryRunner.query(`DROP TABLE "favoris_categorie"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "auteur_article"`);
        await queryRunner.query(`DROP TABLE "declaration_objet"`);
        await queryRunner.query(`DROP TABLE "role"`);
    }

}
