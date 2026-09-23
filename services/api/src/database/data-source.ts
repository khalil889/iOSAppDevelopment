import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { DataSource, DataSourceOptions } from 'typeorm';
import { ENTITIES } from './entities';

dotenv.config({ path: join(__dirname, '../../.env') });
dotenv.config({ path: join(__dirname, '../../../../.env') });

export const buildDataSourceOptions = (url?: string): DataSourceOptions => ({
  type: 'postgres',
  url: url ?? process.env.DATABASE_URL ?? 'postgres://tourguide:tourguide@localhost:5432/tourguide',
  entities: ENTITIES,
  migrations: [join(__dirname, 'migrations/*.{ts,js}')],
  synchronize: false,
});

export default new DataSource(buildDataSourceOptions());
