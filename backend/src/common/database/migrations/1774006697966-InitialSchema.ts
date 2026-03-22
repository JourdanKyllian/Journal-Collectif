import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1774006697966 implements MigrationInterface {
    name = 'InitialSchema1774006697966'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`role\` (\`id\` int NOT NULL AUTO_INCREMENT, \`libelle\` varchar(50) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`declaration_objet\` (\`id\` int NOT NULL AUTO_INCREMENT, \`is_delete\` tinyint NOT NULL DEFAULT 0, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`type_declaration\` varchar(50) NOT NULL, \`name_object\` varchar(255) NOT NULL, \`description\` text NULL, \`lieu_presume\` varchar(255) NULL, \`image_url\` varchar(255) NULL, \`user_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`auteur_article\` (\`user_id\` int NOT NULL, \`article_id\` int NOT NULL, \`role_contribution\` varchar(100) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`user_id\`, \`article_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`is_delete\` tinyint NOT NULL DEFAULT 0, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`lastname\` varchar(100) NOT NULL, \`firstname\` varchar(100) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`tel\` varchar(20) NULL, \`is_phone_verified\` tinyint NOT NULL DEFAULT 0, \`token_auth\` varchar(255) NULL, \`token_notification\` varchar(255) NULL, \`role_id\` int NULL, UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`favoris_categorie\` (\`user_id\` int NOT NULL, \`category_id\` int NOT NULL, \`wants_notifications\` tinyint NOT NULL DEFAULT 1, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`user_id\`, \`category_id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`category\` (\`id\` int NOT NULL AUTO_INCREMENT, \`is_delete\` tinyint NOT NULL DEFAULT 0, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`libelle\` varchar(100) NOT NULL, \`description\` text NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`image_article\` (\`id\` int NOT NULL AUTO_INCREMENT, \`url_image\` varchar(255) NOT NULL, \`legend\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`article_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`article\` (\`id\` int NOT NULL AUTO_INCREMENT, \`is_delete\` tinyint NOT NULL DEFAULT 0, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deleted_at\` datetime(6) NULL, \`titre\` varchar(255) NOT NULL, \`contenu\` text NOT NULL, \`image_couverture\` varchar(255) NULL, \`source_link\` varchar(255) NULL, \`statut\` varchar(50) NOT NULL DEFAULT 'brouillon', \`published_at\` datetime NULL, \`category_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`vue_statistique\` (\`id\` int NOT NULL AUTO_INCREMENT, \`session_anonyme\` varchar(255) NULL, \`occured_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`article_id\` int NULL, \`user_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`declaration_objet\` ADD CONSTRAINT \`FK_fa23c683df53e3f2dbd33d3370e\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`auteur_article\` ADD CONSTRAINT \`FK_2588026124b2b67d08e9ac70ce4\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`auteur_article\` ADD CONSTRAINT \`FK_34c8a3df9a057d4031985b9e6e2\` FOREIGN KEY (\`article_id\`) REFERENCES \`article\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_a2cecd1a3531c0b041e29ba46e1\` FOREIGN KEY (\`role_id\`) REFERENCES \`role\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`favoris_categorie\` ADD CONSTRAINT \`FK_92e92b1eabd4bdb5d6fc203b69f\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`favoris_categorie\` ADD CONSTRAINT \`FK_bb461f09e7eb7e66ec8f1acbdcd\` FOREIGN KEY (\`category_id\`) REFERENCES \`category\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`image_article\` ADD CONSTRAINT \`FK_9b1dc91da0a7bb0a2e109a501b3\` FOREIGN KEY (\`article_id\`) REFERENCES \`article\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`article\` ADD CONSTRAINT \`FK_cdd234ef147c8552a8abd42bd29\` FOREIGN KEY (\`category_id\`) REFERENCES \`category\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`vue_statistique\` ADD CONSTRAINT \`FK_927515d747571dec8fac9740056\` FOREIGN KEY (\`article_id\`) REFERENCES \`article\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`vue_statistique\` ADD CONSTRAINT \`FK_9a8c0b8326fa0073f83133bac73\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`vue_statistique\` DROP FOREIGN KEY \`FK_9a8c0b8326fa0073f83133bac73\``);
        await queryRunner.query(`ALTER TABLE \`vue_statistique\` DROP FOREIGN KEY \`FK_927515d747571dec8fac9740056\``);
        await queryRunner.query(`ALTER TABLE \`article\` DROP FOREIGN KEY \`FK_cdd234ef147c8552a8abd42bd29\``);
        await queryRunner.query(`ALTER TABLE \`image_article\` DROP FOREIGN KEY \`FK_9b1dc91da0a7bb0a2e109a501b3\``);
        await queryRunner.query(`ALTER TABLE \`favoris_categorie\` DROP FOREIGN KEY \`FK_bb461f09e7eb7e66ec8f1acbdcd\``);
        await queryRunner.query(`ALTER TABLE \`favoris_categorie\` DROP FOREIGN KEY \`FK_92e92b1eabd4bdb5d6fc203b69f\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_a2cecd1a3531c0b041e29ba46e1\``);
        await queryRunner.query(`ALTER TABLE \`auteur_article\` DROP FOREIGN KEY \`FK_34c8a3df9a057d4031985b9e6e2\``);
        await queryRunner.query(`ALTER TABLE \`auteur_article\` DROP FOREIGN KEY \`FK_2588026124b2b67d08e9ac70ce4\``);
        await queryRunner.query(`ALTER TABLE \`declaration_objet\` DROP FOREIGN KEY \`FK_fa23c683df53e3f2dbd33d3370e\``);
        await queryRunner.query(`DROP TABLE \`vue_statistique\``);
        await queryRunner.query(`DROP TABLE \`article\``);
        await queryRunner.query(`DROP TABLE \`image_article\``);
        await queryRunner.query(`DROP TABLE \`category\``);
        await queryRunner.query(`DROP TABLE \`favoris_categorie\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
        await queryRunner.query(`DROP TABLE \`auteur_article\``);
        await queryRunner.query(`DROP TABLE \`declaration_objet\``);
        await queryRunner.query(`DROP TABLE \`role\``);
    }

}
