import { MigrationInterface, QueryRunner } from "typeorm";

export class PayoutsIdentityNotifications1790420047041 implements MigrationInterface {
    name = 'PayoutsIdentityNotifications1790420047041'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "payout_accounts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "guideId" uuid NOT NULL, "holderName" character varying(120) NOT NULL, "ibanSealed" text NOT NULL, "ibanMasked" character varying(16) NOT NULL, "bankName" character varying(80), CONSTRAINT "UQ_687aad5c20dba5c43f86c5cc66d" UNIQUE ("guideId"), CONSTRAINT "REL_687aad5c20dba5c43f86c5cc66" UNIQUE ("guideId"), CONSTRAINT "PK_79642d5304997f09e3dfc6084d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payout_runs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "currency" character(3) NOT NULL, "createdById" uuid NOT NULL, "totalMinor" integer NOT NULL, "payoutCount" integer NOT NULL, CONSTRAINT "PK_477d8f03c7a51ac672867547ffb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payouts_status_enum" AS ENUM('PENDING', 'PAID', 'FAILED')`);
        await queryRunner.query(`CREATE TABLE "payouts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "runId" uuid NOT NULL, "guideId" uuid NOT NULL, "amountMinor" integer NOT NULL, "currency" character(3) NOT NULL, "paymentCount" integer NOT NULL, "status" "public"."payouts_status_enum" NOT NULL DEFAULT 'PENDING', "holderName" character varying(120) NOT NULL, "ibanSealed" text NOT NULL, "ibanMasked" character varying(16) NOT NULL, "note" character varying(200), "paidAt" TIMESTAMP WITH TIME ZONE, "settledById" uuid, CONSTRAINT "PK_76855dc4f0a6c18c72eea302e87" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b8f698087d99a372647ccb17a8" ON "payouts" ("runId") `);
        await queryRunner.query(`CREATE INDEX "IDX_1aa39bf8e51108f68435629043" ON "payouts" ("guideId", "createdAt") `);
        await queryRunner.query(`CREATE TYPE "public"."guides_identitystatus_enum" AS ENUM('NOT_STARTED', 'PENDING', 'APPROVED', 'RETRY', 'REJECTED')`);
        await queryRunner.query(`ALTER TABLE "guides" ADD "identityStatus" "public"."guides_identitystatus_enum" NOT NULL DEFAULT 'NOT_STARTED'`);
        await queryRunner.query(`ALTER TABLE "guides" ADD "identityApplicantId" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "guides" ADD "identityCheckedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "guides" ADD "identityReview" jsonb`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "payoutId" uuid`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum" RENAME TO "notifications_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('BOOKING_CONFIRMED', 'NEW_BOOKING', 'BOOKING_CANCELLED', 'TOUR_STARTED', 'TOUR_COMPLETED', 'REVIEW_REMINDER', 'SOS_RAISED', 'SOS_ACKNOWLEDGED', 'GUIDE_APPROVED', 'GUIDE_REJECTED', 'DISPUTE_OPENED', 'DISPUTE_RESOLVED', 'IDENTITY_VERIFIED', 'IDENTITY_NEEDS_ACTION', 'PAYOUT_SENT')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum" USING "type"::"text"::"public"."notifications_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_b0e2ee79417e309910262908d5" ON "payments" ("payoutId") `);
        await queryRunner.query(`ALTER TABLE "payout_accounts" ADD CONSTRAINT "FK_687aad5c20dba5c43f86c5cc66d" FOREIGN KEY ("guideId") REFERENCES "guides"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payouts" ADD CONSTRAINT "FK_b8f698087d99a372647ccb17a86" FOREIGN KEY ("runId") REFERENCES "payout_runs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payouts" ADD CONSTRAINT "FK_b213f7f6e5511c53a54331bbc2d" FOREIGN KEY ("guideId") REFERENCES "guides"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payouts" DROP CONSTRAINT "FK_b213f7f6e5511c53a54331bbc2d"`);
        await queryRunner.query(`ALTER TABLE "payouts" DROP CONSTRAINT "FK_b8f698087d99a372647ccb17a86"`);
        await queryRunner.query(`ALTER TABLE "payout_accounts" DROP CONSTRAINT "FK_687aad5c20dba5c43f86c5cc66d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b0e2ee79417e309910262908d5"`);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum_old" AS ENUM('BOOKING_CONFIRMED', 'NEW_BOOKING', 'BOOKING_CANCELLED', 'TOUR_STARTED', 'TOUR_COMPLETED', 'REVIEW_REMINDER', 'SOS_RAISED', 'SOS_ACKNOWLEDGED', 'GUIDE_APPROVED', 'GUIDE_REJECTED', 'DISPUTE_OPENED', 'DISPUTE_RESOLVED')`);
        await queryRunner.query(`ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "public"."notifications_type_enum_old" USING "type"::"text"::"public"."notifications_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."notifications_type_enum_old" RENAME TO "notifications_type_enum"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "payoutId"`);
        await queryRunner.query(`ALTER TABLE "guides" DROP COLUMN "identityReview"`);
        await queryRunner.query(`ALTER TABLE "guides" DROP COLUMN "identityCheckedAt"`);
        await queryRunner.query(`ALTER TABLE "guides" DROP COLUMN "identityApplicantId"`);
        await queryRunner.query(`ALTER TABLE "guides" DROP COLUMN "identityStatus"`);
        await queryRunner.query(`DROP TYPE "public"."guides_identitystatus_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1aa39bf8e51108f68435629043"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b8f698087d99a372647ccb17a8"`);
        await queryRunner.query(`DROP TABLE "payouts"`);
        await queryRunner.query(`DROP TYPE "public"."payouts_status_enum"`);
        await queryRunner.query(`DROP TABLE "payout_runs"`);
        await queryRunner.query(`DROP TABLE "payout_accounts"`);
    }

}
