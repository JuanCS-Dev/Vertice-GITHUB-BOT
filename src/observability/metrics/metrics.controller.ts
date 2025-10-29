import { Controller, Get, Logger } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { SkipConstitutionalCheck } from '../../constitutional/constitutional.guard';

/**
 * Metrics Controller
 *
 * Purpose: Expose metrics endpoint for Prometheus scraping
 * Constitutional Requirement: P4 Rastreabilidade Total
 *
 * Endpoints:
 * - GET /metrics - Prometheus format metrics
 * - GET /metrics/summary - JSON summary for dashboards
 */

@Controller('metrics')
@SkipConstitutionalCheck()
export class MetricsController {
  private readonly logger = new Logger(MetricsController.name);

  constructor(private readonly metricsService: MetricsService) {
    // NestJS dependency injection
  }

  /**
   * Get metrics in Prometheus format
   */
  @Get()
  getMetrics(): string {
    this.logger.debug('Metrics endpoint accessed');
    return this.metricsService.getPrometheusMetrics();
  }

  /**
   * Get metrics summary in JSON format
   */
  @Get('summary')
  getSummary(): ReturnType<typeof this.metricsService.getSummary> {
    return this.metricsService.getSummary();
  }
}
