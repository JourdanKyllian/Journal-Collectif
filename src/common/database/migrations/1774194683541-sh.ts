import { MigrationInterface, QueryRunner } from "typeorm";

export class Sh1774194683541 implements MigrationInterface {
    name = 'Sh1774194683541'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`declaration_objet\` DROP FOREIGN KEY \`FK_fa23c683df53e3f2dbd33d3370e\``);
        await queryRunner.query(`ALTER TABLE \`declaration_objet\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`declaration_objet\` CHANGE \`lieu_presume\` \`lieu_presume\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`declaration_objet\` CHANGE \`image_url\` \`image_url\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`declaration_objet\` CHANGE \`user_id\` \`user_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`auteur_article\` CHANGE \`role_contribution\` \`role_contribution\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_a2cecd1a3531c0b041e29ba46e1\``);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`lastname\` \`lastname\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`firstname\` \`firstname\` varchar(100) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`tel\` \`tel\` varchar(20) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`token_auth\` \`token_auth\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`token_notification\` \`token_notification\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`role_id\` \`role_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`category\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`category\` CHANGE \`description\` \`description\` text NULL`);
        await queryRunner.query(`ALTER TABLE \`image_article\` DROP FOREIGN KEY \`FK_9b1dc91da0a7bb0a2e109a501b3\``);
        await queryRunner.query(`ALTER TABLE \`image_article\` CHANGE \`article_id\` \`article_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`article\` DROP FOREIGN KEY \`FK_cdd234ef147c8552a8abd42bd29\``);
        await queryRunner.query(`ALTER TABLE \`article\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL`);
        await queryRunner.query(`ALTER TABLE \`article\` CHANGE \`image_couverture\` \`image_couverture\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`article\` CHANGE \`source_link\` \`source_link\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`article\` DROP COLUMN \`statut\``);
        await queryRunner.query(`ALTER TABLE \`article\` ADD \`statut\` enum ('brouillon', 'en_attente', 'publie', 'corbeille') NOT NULL DEFAULT 'brouillon'`);
        await queryRunner.query(`ALTER TABLE \`article\` CHANGE \`published_at\` \`published_at\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`article\` CHANGE \`category_id\` \`category_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`vue_statistique\` DROP FOREIGN KEY \`FK_927515d747571dec8fac9740056\``);
        await queryRunner.query(`ALTER TABLE \`vue_statistique\` DROP FOREIGN KEY \`FK_9a8c0b8326fa0073f83133bac73\``);
        await queryRunner.query(`ALTER TABLE \`vue_statistique\` CHANGE \`session_anonyme\` \`session_anonyme\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`vue_statistique\` CHANGE \`article_id\` \`article_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`vue_statistique\` CHANGE \`user_id\` \`user_id\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`declaration_objet\` ADD CONSTRAINT \`FK_fa23c683df53e3f2dbd33d3370e\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_a2cecd1a3531c0b041e29ba46e1\` FOREIGN KEY (\`role_id\`) REFERENCES \`role\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
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
        await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_a2cecd1a3531c0b041e29ba46e1\``);
        await queryRunner.query(`ALTER TABLE \`declaration_objet\` DROP FOREIGN KEY \`FK_fa23c683df53e3f2dbd33d3370e\``);
        await queryRunner.query(`ALTER TABLE \`vue_statistique\` CHANGE \`user_id\` \`user_id\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`vue_statistique\` CHANGE \`article_id\` \`article_id\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`vue_statistique\` CHANGE \`session_anonyme\` \`session_anonyme\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`vue_statistique\` ADD CONSTRAINT \`FK_9a8c0b8326fa0073f83133bac73\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`vue_statistique\` ADD CONSTRAINT \`FK_927515d747571dec8fac9740056\` FOREIGN KEY (\`article_id\`) REFERENCES \`article\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`article\` CHANGE \`category_id\` \`category_id\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`article\` CHANGE \`published_at\` \`published_at\` datetime NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`article\` DROP COLUMN \`statut\``);
        await queryRunner.query(`ALTER TABLE \`article\` ADD \`statut\` varchar(50) NOT NULL DEFAULT ''brouillon''`);
        await queryRunner.query(`ALTER TABLE \`article\` CHANGE \`source_link\` \`source_link\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`article\` CHANGE \`image_couverture\` \`image_couverture\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`article\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`article\` ADD CONSTRAINT \`FK_cdd234ef147c8552a8abd42bd29\` FOREIGN KEY (\`category_id\`) REFERENCES \`category\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`image_article\` CHANGE \`article_id\` \`article_id\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`image_article\` ADD CONSTRAINT \`FK_9b1dc91da0a7bb0a2e109a501b3\` FOREIGN KEY (\`article_id\`) REFERENCES \`article\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`category\` CHANGE \`description\` \`description\` text NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`category\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`role_id\` \`role_id\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`token_notification\` \`token_notification\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`token_auth\` \`token_auth\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`tel\` \`tel\` varchar(20) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`firstname\` \`firstname\` varchar(100) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`lastname\` \`lastname\` varchar(100) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD CONSTRAINT \`FK_a2cecd1a3531c0b041e29ba46e1\` FOREIGN KEY (\`role_id\`) REFERENCES \`role\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`auteur_article\` CHANGE \`role_contribution\` \`role_contribution\` varchar(100) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`declaration_objet\` CHANGE \`user_id\` \`user_id\` int NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`declaration_objet\` CHANGE \`image_url\` \`image_url\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`declaration_objet\` CHANGE \`lieu_presume\` \`lieu_presume\` varchar(255) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`declaration_objet\` CHANGE \`deleted_at\` \`deleted_at\` datetime(6) NULL DEFAULT 'NULL'`);
        await queryRunner.query(`ALTER TABLE \`declaration_objet\` ADD CONSTRAINT \`FK_fa23c683df53e3f2dbd33d3370e\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
