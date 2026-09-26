import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { Public } from './common/decorators/public.decorator';

@Public()
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(private readonly db: DataSource) {}

  /** Liveness: the process is up. No dependencies, so a DB blip doesn't restart pods. */
  @Get('live')
  live() {
    return { status: 'ok' };
  }

  /** Readiness: can serve traffic (database reachable, no pending migrations). */
  @Get()
  async ready() {
    try {
      await this.db.query('SELECT 1');
      const pending = await this.db.showMigrations();
      if (pending) throw new Error('pending migrations');
      return { status: 'ok' };
    } catch (e) {
      throw new ServiceUnavailableException({ status: 'unavailable', reason: (e as Error).message });
    }
  }
}
