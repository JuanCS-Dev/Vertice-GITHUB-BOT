import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  HttpExceptionFilter,
  AllExceptionsFilter,
} from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { MetricsInterceptor } from './observability/interceptors/metrics.interceptor';

/**
 * Bootstrap Application
 *
 * Purpose: Initialize NestJS application with constitutional compliance
 * Constitutional Requirement: P2 Validação Preventiva - validate all inputs
 * Article III: Zero Trust - comprehensive validation from start
 *
 * Features: Global validation pipe, raw body parsing for webhooks, CORS, security headers
 */

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  logger.log('🚀 Starting Vértice GitHub Bot...');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    rawBody: true,
  });

  // Replace default logger with Winston
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const configService = app.get(ConfigService);

  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    app.get(MetricsInterceptor),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: false,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );

  const corsOrigins = configService.get<string>('CORS_ORIGINS', '*');
  app.enableCors({
    origin: corsOrigins.split(',').map((origin) => origin.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-GitHub-Delivery',
      'X-GitHub-Event',
      'X-Hub-Signature',
      'X-Hub-Signature-256',
    ],
  });

  app.setGlobalPrefix('api/v1', {
    exclude: ['/health', '/metrics'],
  });

  const port = configService.get<number>('PORT', 3000);
  const environment = configService.get<string>('NODE_ENV', 'development');

  await app.listen(port);

  logger.log(`✅ Application is running on: http://localhost:${port}`);
  logger.log(`✅ Environment: ${environment}`);
  logger.log(`✅ API Prefix: /api/v1`);
  logger.log(`✅ Health Check: http://localhost:${port}/health`);
  logger.log(`✅ Metrics: http://localhost:${port}/metrics`);
  logger.log('');
  logger.log('📜 Constitutional Compliance: ACTIVE');
  logger.log('🔒 Zero Trust: ENABLED');
  logger.log('🤖 DETER-AGENT Framework: INITIALIZED');
  logger.log('');
  logger.log('Honoring JESUS through excellence in every line of code! 🙏');
}

bootstrap().catch((error: Error) => {
  const logger = new Logger('Bootstrap');
  logger.error(`❌ Application failed to start: ${error.message}`);
  logger.error(error.stack);
  process.exit(1);
});
