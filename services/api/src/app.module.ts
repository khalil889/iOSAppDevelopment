import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AnalyticsModule } from './analytics/analytics.module';
import { PayoutsModule } from './payouts/payouts.module';
import { DomainErrorFilter } from './common/errors/domain-error.filter';
import { HttpErrorFilter } from './common/errors/http-error.filter';
import { LocalizeInterceptor } from './common/i18n/localize.interceptor';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { AdminModule } from './admin/admin.module';
import { AssistantModule } from './assistant/assistant.module';
import { AuthModule } from './auth/auth.module';
import { AvailabilityModule } from './availability/availability.module';
import { BookingsModule } from './bookings/bookings.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RequestContextMiddleware } from './common/request-context.middleware';
import { RolesGuard } from './common/guards/roles.guard';
import configuration from './config/configuration';
import { buildDataSourceOptions } from './database/data-source';
import { DisputesModule } from './disputes/disputes.module';
import { GeoModule } from './geo/geo.module';
import { GuidesModule } from './guides/guides.module';
import { HealthController } from './health.controller';
import { NotificationsModule } from './notifications/notifications.module';
import { PackagesModule } from './packages/packages.module';
import { PaymentsModule } from './payments/payments.module';
import { ProvidersModule } from './providers/providers.module';
import { ReviewsModule } from './reviews/reviews.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: [join(__dirname, '../.env'), join(__dirname, '../../../.env')],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...buildDataSourceOptions(config.get<string>('databaseUrl')),
        migrationsRun: config.get<boolean>('runMigrations'),
      }),
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: { expiresIn: config.get<number>('jwt.accessTtlSeconds'), algorithm: 'HS256' },
        verifyOptions: { algorithms: ['HS256'] },
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    ScheduleModule.forRoot(),
    ProvidersModule,
    NotificationsModule,
    UsersModule,
    AuthModule,
    GeoModule,
    GuidesModule,
    PackagesModule,
    AvailabilityModule,
    PaymentsModule,
    BookingsModule,
    ReviewsModule,
    DisputesModule,
    AssistantModule,
    AdminModule,
    PayoutsModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: HttpErrorFilter },
    { provide: APP_FILTER, useClass: DomainErrorFilter },
    { provide: APP_INTERCEPTOR, useClass: LocalizeInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('{*path}');
  }
}
