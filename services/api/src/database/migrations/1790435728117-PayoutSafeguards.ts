import { MigrationInterface, QueryRunner } from "typeorm";

export class PayoutSafeguards1790435728117 implements MigrationInterface {
    name = 'PayoutSafeguards1790435728117'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payout_runs" ADD "exportCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "payout_runs" ADD "lastExportedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('BOOKING_CONFIRMED', 'NEW_BOOKING', 'BOOKING_CANCELLED', 'TOUR_STARTED', 'TOUR_COMPLETED', 'REVIEW_REMINDER', 'SOS_RAISED', 'SOS_ACKNOWLEDGED', 'GUIDE_APPROVED', 'GUIDE_REJECTED', 'DISPUTE_OPENED', 'DISPUTE_RESOLVED', 'IDENTITY_VERIFIED', 'IDENTITY_NEEDS_ACTION', 'PAYOUT_SENT', 'PAYOUT_ACCOUNT_CHANGED')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_b0e2ee79417e309910262908d5c" FOREIGN KEY ("payoutId") REFERENCES "payouts"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "notifications" WHERE "type" = 'PAYOUT_ACCOUNT_CHANGED'`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_b0e2ee79417e309910262908d5c"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('BOOKING_CONFIRMED', 'NEW_BOOKING', 'BOOKING_CANCELLED', 'TOUR_STARTED', 'TOUR_COMPLETED', 'REVIEW_REMINDER', 'SOS_RAISED', 'SOS_ACKNOWLEDGED', 'GUIDE_APPROVED', 'GUIDE_REJECTED', 'DISPUTE_OPENED', 'DISPUTE_RESOLVED', 'IDENTITY_VERIFIED', 'IDENTITY_NEEDS_ACTION', 'PAYOUT_SENT')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`);
        await queryRunner.query(`ALTER TABLE "payout_runs" DROP COLUMN "lastExportedAt"`);
        await queryRunner.query(`ALTER TABLE "payout_runs" DROP COLUMN "exportCount"`);
    }

}
