import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnableExtensions1758600000000 implements MigrationInterface {
  name = 'EnableExtensions1758600000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query('CREATE EXTENSION IF NOT EXISTS postgis');
    await q.query('CREATE EXTENSION IF NOT EXISTS citext');
    await q.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');
    await q.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  }

  public async down(): Promise<void> {
    // Extensions may be shared with other schemas; leave them installed.
  }
}
