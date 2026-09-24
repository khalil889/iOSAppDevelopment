import { MigrationInterface, QueryRunner } from "typeorm";

export class Notifications1790265888156 implements MigrationInterface {
    name = 'Notifications1790265888156'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "device_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "token" character varying(512) NOT NULL, "platform" character varying(16) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastSeenAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_84700be257607cfb1f9dc2e52c3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_511957e3e8443429dc3fb00120" ON "device_tokens" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_977e24c520c49436d08e5eeea8" ON "device_tokens" ("token") `);
        await queryRunner.query(`CREATE TYPE "public"."notifications_type_enum" AS ENUM('BOOKING_CONFIRMED', 'NEW_BOOKING', 'BOOKING_CANCELLED', 'TOUR_STARTED', 'TOUR_COMPLETED', 'REVIEW_REMINDER', 'SOS_RAISED', 'SOS_ACKNOWLEDGED', 'GUIDE_APPROVED', 'GUIDE_REJECTED', 'DISPUTE_OPENED', 'DISPUTE_RESOLVED')`);
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "type" "public"."notifications_type_enum" NOT NULL, "title" character varying(160) NOT NULL, "body" text NOT NULL, "data" jsonb NOT NULL DEFAULT '{}', "readAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_21e65af2f4f242d4c85a92aff4" ON "notifications" ("userId", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "device_tokens" ADD CONSTRAINT "FK_511957e3e8443429dc3fb00120c" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`);
        await queryRunner.query(`ALTER TABLE "device_tokens" DROP CONSTRAINT "FK_511957e3e8443429dc3fb00120c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_21e65af2f4f242d4c85a92aff4"`);
        await queryRunner.query(`DROP TABLE "notifications"`);
        await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_977e24c520c49436d08e5eeea8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_511957e3e8443429dc3fb00120"`);
        await queryRunner.query(`DROP TABLE "device_tokens"`);
    }

}
