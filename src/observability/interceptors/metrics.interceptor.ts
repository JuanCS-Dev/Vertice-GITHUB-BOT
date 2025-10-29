import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { MetricsService } from '../metrics/metrics.service';

/**
 * Metrics Interceptor
 *
 * Purpose: Automatically record HTTP request metrics
 * Constitutional Requirement: P4 Rastreabilidade Total
 *
 * Metrics Recorded:
 * - Request duration (ms)
 * - Status codes
 * - HTTP methods
 * - Request paths
 * - Constitutional validation results
 *
 * Applied globally to all routes for comprehensive monitoring
 */

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MetricsInterceptor.name);

  constructor(private readonly metricsService: MetricsService) {
    // NestJS dependency injection
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    const startTime = Date.now();
    const method = request.method;
    const path = this.sanitizePath(request.path);

    return next.handle().pipe(
      tap({
        next: (_data: unknown) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          this.metricsService.recordHttpRequest(
            duration,
            statusCode,
            method,
            path,
          );

          // Record constitutional metrics if validation was performed
          const constitutionalValidation = request['constitutionalValidation'];
          if (constitutionalValidation) {
            this.logger.debug(
              `Constitutional validation recorded: CRS=${constitutionalValidation.metrics.crs.crs}%`,
            );
          }
        },
        error: (error: Error) => {
          const duration = Date.now() - startTime;
          const statusCode = 500;

          this.metricsService.recordHttpRequest(
            duration,
            statusCode,
            method,
            path,
          );

          this.logger.error(
            `HTTP request failed: ${method} ${path} - ${error.message}`,
          );
        },
      }),
    );
  }

  /**
   * Sanitize path to remove dynamic segments
   * Example: /api/v1/repos/123 -> /api/v1/repos/:id
   */
  private sanitizePath(path: string): string {
    // Replace numeric IDs
    let sanitized = path.replace(/\/\d+/g, '/:id');

    // Replace UUIDs
    sanitized = sanitized.replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      '/:uuid',
    );

    // Replace GitHub repository names (owner/repo format)
    sanitized = sanitized.replace(/\/[\w-]+\/[\w-]+/g, '/:owner/:repo');

    return sanitized;
  }
}
