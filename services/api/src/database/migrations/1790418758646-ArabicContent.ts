import { MigrationInterface, QueryRunner } from "typeorm";

export class ArabicContent1790418758646 implements MigrationInterface {
    name = 'ArabicContent1790418758646'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cities" ADD "nameAr" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "countries" ADD "nameAr" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "sites" ADD "nameAr" character varying(160)`);
        await queryRunner.query(`ALTER TABLE "sites" ADD "descriptionAr" text`);
        await queryRunner.query(`ALTER TABLE "tour_packages" ADD "titleAr" character varying(160)`);
        await queryRunner.query(`ALTER TABLE "tour_packages" ADD "descriptionAr" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tour_packages" DROP COLUMN "descriptionAr"`);
        await queryRunner.query(`ALTER TABLE "tour_packages" DROP COLUMN "titleAr"`);
        await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "descriptionAr"`);
        await queryRunner.query(`ALTER TABLE "sites" DROP COLUMN "nameAr"`);
        await queryRunner.query(`ALTER TABLE "countries" DROP COLUMN "nameAr"`);
        await queryRunner.query(`ALTER TABLE "cities" DROP COLUMN "nameAr"`);
    }

}
