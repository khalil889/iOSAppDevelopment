import { MigrationInterface, QueryRunner } from "typeorm";

export class UniquePaymentProviderRef1790237282666 implements MigrationInterface {
    name = 'UniquePaymentProviderRef1790237282666'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3eacf55927f0998798174cff98" ON "payments" ("provider", "providerRef") WHERE "providerRef" IS NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_3eacf55927f0998798174cff98"`);
    }

}
