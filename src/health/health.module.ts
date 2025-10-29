import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * Health Module
 *
 * Purpose: Provide health check endpoints for monitoring and orchestration
 * Constitutional Requirement: P4 Rastreabilidade Total
 *
 * Exports: Health service for use in other modules
 * Controllers: Health check endpoints
 */

@Module({
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
