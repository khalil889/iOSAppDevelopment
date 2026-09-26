import { MigrationInterface, QueryRunner } from "typeorm";

export class GuideAvailability1790264798022 implements MigrationInterface {
    name = 'GuideAvailability1790264798022'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "guide_weekly_hours" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "guideId" uuid NOT NULL, "weekday" smallint NOT NULL, "startMinute" smallint NOT NULL, "endMinute" smallint NOT NULL, CONSTRAINT "CHK_feb108b8b4294f696df2a1401d" CHECK ("startMinute" >= 0 AND "endMinute" <= 1440 AND "startMinute" < "endMinute"), CONSTRAINT "CHK_eeb59cebdd95e60b241cc3e5c1" CHECK ("weekday" BETWEEN 0 AND 6), CONSTRAINT "PK_5165839d12cd4bd1b6da14ff64b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_446da5948e53ebdb51c98445cf" ON "guide_weekly_hours" ("guideId") `);
        await queryRunner.query(`CREATE TABLE "guide_time_off" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "guideId" uuid NOT NULL, "startDate" date NOT NULL, "endDate" date NOT NULL, "reason" character varying(200), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_7f152228f951fae716e1dae0db" CHECK ("endDate" >= "startDate"), CONSTRAINT "PK_8a83d613fd8be023cf6707b2f6f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_37cc0147c677d6dd12d02eccab" ON "guide_time_off" ("guideId") `);
        await queryRunner.query(`ALTER TABLE "guide_weekly_hours" ADD CONSTRAINT "FK_446da5948e53ebdb51c98445cf7" FOREIGN KEY ("guideId") REFERENCES "guides"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "guide_time_off" ADD CONSTRAINT "FK_37cc0147c677d6dd12d02eccab0" FOREIGN KEY ("guideId") REFERENCES "guides"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "guide_time_off" DROP CONSTRAINT "FK_37cc0147c677d6dd12d02eccab0"`);
        await queryRunner.query(`ALTER TABLE "guide_weekly_hours" DROP CONSTRAINT "FK_446da5948e53ebdb51c98445cf7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_37cc0147c677d6dd12d02eccab"`);
        await queryRunner.query(`DROP TABLE "guide_time_off"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_446da5948e53ebdb51c98445cf"`);
        await queryRunner.query(`DROP TABLE "guide_weekly_hours"`);
    }

}
