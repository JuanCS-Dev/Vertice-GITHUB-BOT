import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConstitutionalService } from '../constitutional/constitutional.service';

/**
 * Health Service
 *
 * Purpose: Monitor application and component health
 * Constitutional Requirement: P4 Rastreabilidade Total
 *
 * Checks:
 * - Database connectivity
 * - Constitutional framework health
 * - Memory usage
 * - Uptime
 */

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly constitutional: ConstitutionalService,
  ) {
    this.startTime = Date.now();
  }

  /**
   * Get overall health status
   */
  async getHealthStatus(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    components: Record<string, unknown>;
  }> {
    const timestamp = new Date().toISOString();
    const uptime = Date.now() - this.startTime;

    const components: Record<string, unknown> = {
      database: await this.checkDatabase(),
      constitutional: await this.checkConstitutional(),
      memory: this.checkMemory(),
    };

    const allHealthy = Object.values(components).every(
      (component) =>
        typeof component === 'object' &&
        component !== null &&
        'healthy' in component &&
        component.healthy === true,
    );

    const status = allHealthy ? 'healthy' : 'degraded';

    this.logger.debug(`Health status: ${status}`);

    return {
      status,
      timestamp,
      uptime,
      components,
    };
  }

  /**
   * Get readiness status
   * Used by Kubernetes readiness probe
   */
  async getReadinessStatus(): Promise<{
    status: string;
    timestamp: string;
    ready: boolean;
    checks: Record<string, boolean>;
  }> {
    const checks: Record<string, boolean> = {
      database: await this.isDatabaseReady(),
      constitutional: await this.isConstitutionalReady(),
    };

    const ready = Object.values(checks).every((check) => check === true);

    return {
      status: ready ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      ready,
      checks,
    };
  }

  /**
   * Check database health
   */
  private async checkDatabase(): Promise<{
    healthy: boolean;
    responseTime?: number;
    error?: string;
  }> {
    try {
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1 as health_check`;
      const responseTime = Date.now() - startTime;

      return {
        healthy: true,
        responseTime,
      };
    } catch (error) {
      this.logger.error(
        `Database health check failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        healthy: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check constitutional framework health
   */
  private async checkConstitutional(): Promise<{
    healthy: boolean;
    components?: Record<string, boolean>;
    error?: string;
  }> {
    try {
      const health = await this.constitutional.healthCheck();

      return {
        healthy: health.healthy,
        components: health.components,
      };
    } catch (error) {
      this.logger.error(
        `Constitutional health check failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        healthy: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check memory usage
   */
  private checkMemory(): {
    healthy: boolean;
    usage: {
      heapUsed: string;
      heapTotal: string;
      external: string;
      rss: string;
    };
    percentage: number;
  } {
    const memoryUsage = process.memoryUsage();

    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const externalMB = Math.round(memoryUsage.external / 1024 / 1024);
    const rssMB = Math.round(memoryUsage.rss / 1024 / 1024);

    const percentage = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    const healthy = percentage < 90;

    return {
      healthy,
      usage: {
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        external: `${externalMB}MB`,
        rss: `${rssMB}MB`,
      },
      percentage: Math.round(percentage),
    };
  }

  /**
   * Check if database is ready
   */
  private async isDatabaseReady(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1 as ready_check`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if constitutional framework is ready
   */
  private async isConstitutionalReady(): Promise<boolean> {
    try {
      const health = await this.constitutional.healthCheck();
      return health.healthy;
    } catch {
      return false;
    }
  }

  /**
   * Get application uptime in seconds
   */
  getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  /**
   * Get application version from package.json
   */
  getVersion(): string {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const packageJson = require('../../package.json');
      return packageJson.version || 'unknown';
    } catch {
      return 'unknown';
    }
  }
}
