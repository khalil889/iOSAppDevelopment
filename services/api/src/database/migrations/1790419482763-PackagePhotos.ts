import { MigrationInterface, QueryRunner } from "typeorm";

export class PackagePhotos1790419482763 implements MigrationInterface {
    name = 'PackagePhotos1790419482763'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tour_packages" ADD "photoKeys" text array NOT NULL DEFAULT '{}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tour_packages" DROP COLUMN "photoKeys"`);
    }

}
