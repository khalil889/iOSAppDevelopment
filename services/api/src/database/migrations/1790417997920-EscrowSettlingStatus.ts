import { MigrationInterface, QueryRunner } from "typeorm";

export class EscrowSettlingStatus1790417997920 implements MigrationInterface {
    name = 'EscrowSettlingStatus1790417997920'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."payments_escrowstatus_enum" RENAME TO "payments_escrowstatus_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."payments_escrowstatus_enum" AS ENUM('PENDING', 'HELD', 'RELEASED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'DISPUTED', 'FAILED', 'SETTLING')`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "escrowStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "escrowStatus" TYPE "public"."payments_escrowstatus_enum" USING "escrowStatus"::"text"::"public"."payments_escrowstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "escrowStatus" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."payments_escrowstatus_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "payments" SET "escrowStatus" = 'HELD' WHERE "escrowStatus" = 'SETTLING'`);
        await queryRunner.query(`CREATE TYPE "public"."payments_escrowstatus_enum_old" AS ENUM('PENDING', 'HELD', 'RELEASED', 'REFUNDED', 'PARTIALLY_REFUNDED', 'DISPUTED', 'FAILED')`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "escrowStatus" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "escrowStatus" TYPE "public"."payments_escrowstatus_enum_old" USING "escrowStatus"::"text"::"public"."payments_escrowstatus_enum_old"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "escrowStatus" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."payments_escrowstatus_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."payments_escrowstatus_enum_old" RENAME TO "payments_escrowstatus_enum"`);
    }

}
