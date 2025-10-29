import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * HTTP Exception Filter
 *
 * Purpose: Centralized exception handling with audit logging
 * Constitutional Requirement: P4 Rastreabilidade Total + P5 Recuperação Automática
 *
 * Features:
 * - Structured error responses
 * - Audit logging for all errors
 * - Security: Never expose sensitive information
 * - Constitutional compliance tracking
 */

export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string;
  error?: string;
  constitutionalViolation?: boolean;
  traceId?: string;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    const isConstitutionalViolation = this.isConstitutionalViolation(
      exceptionResponse,
    );

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.extractMessage(exceptionResponse),
      error: exception.name,
      constitutionalViolation: isConstitutionalViolation,
      traceId: this.generateTraceId(),
    };

    this.logError(errorResponse, exception, request);

    response.status(status).json(errorResponse);
  }

  /**
   * Extract error message from exception response
   */
  private extractMessage(exceptionResponse: string | object): string {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse
    ) {
      const message = (exceptionResponse as { message: unknown }).message;

      if (typeof message === 'string') {
        return message;
      }

      if (Array.isArray(message)) {
        return message.join(', ');
      }
    }

    return 'An error occurred';
  }

  /**
   * Check if error is a constitutional violation
   */
  private isConstitutionalViolation(exceptionResponse: string | object): boolean {
    if (typeof exceptionResponse === 'object') {
      return (
        'constitutionalViolation' in exceptionResponse ||
        'violations' in exceptionResponse
      );
    }

    return false;
  }

  /**
   * Generate unique trace ID for error tracking
   */
  private generateTraceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Log error with context for audit trail
   * P4: Rastreabilidade Total
   */
  private logError(
    errorResponse: ErrorResponse,
    exception: HttpException,
    request: Request,
  ): void {
    const logContext = {
      traceId: errorResponse.traceId,
      statusCode: errorResponse.statusCode,
      path: errorResponse.path,
      method: errorResponse.method,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      constitutionalViolation: errorResponse.constitutionalViolation,
    };

    if (errorResponse.statusCode >= 500) {
      this.logger.error(
        `${errorResponse.method} ${errorResponse.path} - ${errorResponse.message}`,
        exception.stack,
        logContext,
      );
    } else if (errorResponse.constitutionalViolation) {
      this.logger.warn(
        `Constitutional Violation: ${errorResponse.method} ${errorResponse.path} - ${errorResponse.message}`,
        logContext,
      );
    } else {
      this.logger.warn(
        `${errorResponse.method} ${errorResponse.path} - ${errorResponse.message}`,
        logContext,
      );
    }
  }
}

/**
 * All Exceptions Filter
 *
 * Purpose: Catch any unhandled exceptions
 * Constitutional Requirement: P5 Recuperação Automática
 */

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof Error
        ? exception.message
        : 'Internal server error';

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error: exception instanceof Error ? exception.name : 'UnknownError',
      traceId: this.generateTraceId(),
    };

    this.logger.error(
      `Unhandled exception: ${message}`,
      exception instanceof Error ? exception.stack : String(exception),
      {
        traceId: errorResponse.traceId,
        path: request.url,
        method: request.method,
      },
    );

    response.status(status).json(errorResponse);
  }

  private generateTraceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}
