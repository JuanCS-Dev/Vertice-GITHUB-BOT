import { Global, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './logger/winston.config';
import { TelemetryService } from './telemetry/telemetry.service';
import { MetricsService } from './metrics/metrics.service';
import { MetricsController } from './metrics/metrics.controller';
import { MetricsInterceptor } from './interceptors/metrics.interceptor';

/**
 * Observability Module
 *
 * Purpose: Centralize all observability concerns
 * Constitutional Requirement: P4 Rastreabilidade Total
 *
 * Components:
 * - Winston: Structured logging with audit trails
 * - OpenTelemetry: Distributed tracing
 * - Prometheus Metrics: Application monitoring
 *
 * Global module: All services exported for use throughout the application
 */

@Global()
@Module({
  imports: [
    WinstonModule.forRoot(winstonConfig),
  ],
  controllers: [MetricsController],
  providers: [
    TelemetryService,
    MetricsService,
    MetricsInterceptor,
  ],
  exports: [
    TelemetryService,
    MetricsService,
    MetricsInterceptor,
  ],
})
export class ObservabilityModule {
  // NestJS module configuration
}
