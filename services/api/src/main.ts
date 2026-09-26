import 'reflect-metadata';
import { ConsoleLogger, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { DomainErrorFilter } from './common/errors/domain-error.filter';
import { productionConfigProblems } from './config/assert-production';
import configuration from './config/configuration';

async function bootstrap() {
  const cfg = configuration();
  const problems = productionConfigProblems(cfg);
  if (problems.length) {
    // Fail fast before opening a port with unsafe settings.
    console.error(`Refusing to start in production:\n - ${problems.join('\n - ')}`);
    process.exit(1);
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    logger: new ConsoleLogger({ json: cfg.logFormat === 'json', colors: cfg.logFormat !== 'json' }),
  });
  const config = app.get(ConfigService);

  if (config.get<boolean>('trustProxy')) app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  // JSON bodies are small; file uploads go straight to storage via signed URLs.
  app.useBodyParser('json', { limit: '256kb' });
  app.useBodyParser('urlencoded', { limit: '64kb', extended: false });
  app.setGlobalPrefix('api');
  app.enableCors({ origin: config.get<string[]>('corsOrigins'), credentials: true, exposedHeaders: ['x-request-id'] });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new DomainErrorFilter());
  app.enableShutdownHooks();

  if (!cfg.isProduction || process.env.ENABLE_SWAGGER === 'true') {
    const doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('Tour Guide Marketplace API').setVersion('0.4.0').addBearerAuth().build(),
    );
    SwaggerModule.setup('api/docs', app, doc);
  }

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
