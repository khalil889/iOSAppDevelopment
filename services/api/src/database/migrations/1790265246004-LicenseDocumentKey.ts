import { MigrationInterface, QueryRunner } from "typeorm";

export class LicenseDocumentKey1790265246004 implements MigrationInterface {
    name = 'LicenseDocumentKey1790265246004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "guides" ADD "licenseDocumentKey" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "guides" DROP COLUMN "licenseDocumentKey"`);
    }

}
