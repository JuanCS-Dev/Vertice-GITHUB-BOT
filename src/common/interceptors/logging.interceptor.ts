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

/**
 * Logging Interceptor
 *
 * Purpose: Log all HTTP requests and responses
 * Constitutional Requirement: P4 Rastreabilidade Total
 *
 * Logs:
 * - Request method, path, headers
 * - Response status code, execution time
 * - Constitutional validation results if present
 * - User agent, IP address for security audit
 */

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const startTime = Date.now();
    const requestId = this.generateRequestId();

    const method = request.method;
    const url = request.url;
    const userAgent = request.headers['user-agent'] || 'unknown';
    const ip = request.ip || 'unknown';

    this.logger.log(
      `→ ${method} ${url} [${requestId}]`,
      {
        requestId,
        method,
        url,
        userAgent,
        ip,
      },
    );

    return next.handle().pipe(
      tap({
        next: (/*data: unknown*/ _data: unknown) => {
          const executionTime = Date.now() - startTime;
          const statusCode = response.statusCode;

          const constitutionalValidation = request['constitutionalValidation'];

          this.logger.log(
            `← ${method} ${url} ${statusCode} [${executionTime}ms] [${requestId}]`,
            {
              requestId,
              method,
              url,
              statusCode,
              executionTime,
              constitutionalCompliance: constitutionalValidation?.constitutionalCompliance,
              crs: constitutionalValidation?.metrics?.crs?.crs,
              lei: constitutionalValidation?.metrics?.lei?.lei,
            },
          );
        },
        error: (error: Error) => {
          const executionTime = Date.now() - startTime;
          const statusCode = response.statusCode || 500;

          this.logger.error(
            `✖ ${method} ${url} ${statusCode} [${executionTime}ms] [${requestId}] - ${error.message}`,
            error.stack,
            {
              requestId,
              method,
              url,
              statusCode,
              executionTime,
              error: error.name,
            },
          );
        },
      }),
    );
  }

  /**
   * Generate unique request ID for tracing
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
