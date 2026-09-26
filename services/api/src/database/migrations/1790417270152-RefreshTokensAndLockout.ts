import { MigrationInterface, QueryRunner } from "typeorm";

export class RefreshTokensAndLockout1790417270152 implements MigrationInterface {
    name = 'RefreshTokensAndLockout1790417270152'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "auth_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "familyId" uuid NOT NULL, "tokenHash" character(64) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "revokedAt" TIMESTAMP WITH TIME ZONE, "replacedById" uuid, "userAgent" character varying(200), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_641507381f32580e8479efc36cd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_925b24d7fc2f9324ce972aee02" ON "auth_sessions" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_455cc3f3c163f061072887306e" ON "auth_sessions" ("familyId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_124a43dd73c87052e1a6193e3b" ON "auth_sessions" ("tokenHash") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "failedLoginCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lockedUntil" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "auth_sessions" ADD CONSTRAINT "FK_925b24d7fc2f9324ce972aee025" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "auth_sessions" DROP CONSTRAINT "FK_925b24d7fc2f9324ce972aee025"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lockedUntil"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "failedLoginCount"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_124a43dd73c87052e1a6193e3b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_455cc3f3c163f061072887306e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_925b24d7fc2f9324ce972aee02"`);
        await queryRunner.query(`DROP TABLE "auth_sessions"`);
    }

}
