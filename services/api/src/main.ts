import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DomainErrorFilter } from './common/errors/domain-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableCors({ origin: config.get<string[]>('corsOrigins'), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new DomainErrorFilter());

  const doc = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Tour Guide Marketplace API')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('api/docs', app, doc);

  const port = config.get<number>('port') ?? 3000;
  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port}/api (docs at /api/docs)`, 'Bootstrap');
}

bootstrap();
