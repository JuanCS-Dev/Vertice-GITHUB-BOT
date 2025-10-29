import { Controller, Get, Logger } from '@nestjs/common';
import { HealthService } from './health.service';
import { SkipConstitutionalCheck } from '../constitutional/constitutional.guard';

/**
 * Health Controller
 *
 * Purpose: Provide health check endpoints for monitoring
 * Constitutional Requirement: P4 Rastreabilidade Total
 *
 * Endpoints:
 * - GET /health - Overall health status
 * - GET /health/live - Liveness probe (K8s)
 * - GET /health/ready - Readiness probe (K8s)
 *
 * Note: Health endpoints skip constitutional validation for availability
 */

@Controller('health')
@SkipConstitutionalCheck()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly healthService: HealthService) {}

  /**
   * Overall health check
   * Returns detailed status of all components
   */
  @Get()
  async getHealth(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    components: Record<string, unknown>;
  }> {
    this.logger.debug('Health check requested');
    return this.healthService.getHealthStatus();
  }

  /**
   * Liveness probe
   * Indicates if application is running
   */
  @Get('live')
  getLiveness(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness probe
   * Indicates if application is ready to accept traffic
   */
  @Get('ready')
  async getReadiness(): Promise<{
    status: string;
    timestamp: string;
    ready: boolean;
    checks: Record<string, boolean>;
  }> {
    return this.healthService.getReadinessStatus();
  }
}
