import { MigrationInterface, QueryRunner } from "typeorm";

export class SosAcknowledgement1790264408393 implements MigrationInterface {
    name = 'SosAcknowledgement1790264408393'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sos_alerts" ADD "acknowledgedById" uuid`);
        await queryRunner.query(`ALTER TABLE "sos_alerts" ADD "resolutionNote" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "sos_alerts" DROP COLUMN "resolutionNote"`);
        await queryRunner.query(`ALTER TABLE "sos_alerts" DROP COLUMN "acknowledgedById"`);
    }

}
