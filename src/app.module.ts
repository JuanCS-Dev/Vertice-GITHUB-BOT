import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { ConstitutionalModule } from './constitutional/constitutional.module';
import { ConstitutionalGuard } from './constitutional/constitutional.guard';
import { HealthModule } from './health/health.module';

import { validateEnvironment } from './config/env.validation';

/**
 * App Module
 *
 * Purpose: Root application module with constitutional compliance
 * Constitutional Requirement: Article III - Zero Trust architecture
 *
 * Features:
 * - Global configuration management
 * - Constitutional framework integration
 * - Rate limiting (DDoS protection)
 * - Database connection management
 * - Health checks and monitoring
 *
 * All modules respect constitutional principles P1-P6
 */

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      validate: validateEnvironment,
      envFilePath: ['.env.local', '.env'],
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    PrismaModule,
    ConstitutionalModule,
    HealthModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ConstitutionalGuard,
    },
  ],
})
export class AppModule {}
