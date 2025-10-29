import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConstitutionalService } from './constitutional.service';
import { Request } from 'express';

/**
 * Constitutional Guard
 *
 * Purpose: Protect NestJS endpoints with constitutional compliance
 * Constitutional Requirement: Article III - Zero Trust
 * P2: Validação Preventiva - validate before processing
 *
 * Validates: Signatures, rate limits, zero trust rules
 * Applies: To all webhook endpoints automatically
 */

export const SKIP_CONSTITUTIONAL_CHECK = 'skipConstitutionalCheck';

export interface ConstitutionalContext {
  repository?: string;
  senderId?: string;
  deliveryId?: string;
  eventType?: string;
}

@Injectable()
export class ConstitutionalGuard implements CanActivate {
  private readonly logger = new Logger(ConstitutionalGuard.name);

  constructor(
    private readonly constitutionalService: ConstitutionalService,
    private readonly reflector: Reflector,
  ) {
    // NestJS dependency injection
  }

  /**
   * Validate request against constitutional requirements
   * Article III: Zero Trust - Never trust, always verify
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_CONSTITUTIONAL_CHECK,
      [context.getHandler(), context.getClass()],
    );

    if (skipCheck) {
      this.logger.debug('Skipping constitutional check (decorator present)');
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    const isWebhookEndpoint = this.isWebhookEndpoint(request);

    if (!isWebhookEndpoint) {
      this.logger.debug(
        `Non-webhook endpoint: ${request.method} ${request.path}`,
      );
      return true;
    }

    try {
      await this.validateWebhookRequest(request);
      return true;
    } catch (error) {
      this.logger.error(
        `Constitutional validation failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Validate webhook request
   */
  private async validateWebhookRequest(request: Request): Promise<void> {
    const secret = this.getWebhookSecret();

    if (!secret) {
      throw new HttpException(
        'Webhook secret not configured',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const headers = this.extractHeaders(request);
    const repository = this.extractRepository(request);
    const senderId = this.extractSenderId(request);
    const deliveryId = headers['x-github-delivery'];

    const body = this.getRequestBody(request);

    const validation = await this.constitutionalService.validateWebhook({
      headers,
      body,
      secret,
      repository: repository || 'unknown',
      senderId,
      deliveryId,
    });

    if (!validation.valid) {
      this.logger.error(
        `Webhook validation failed: ${validation.violations.join(', ')}`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Constitutional validation failed',
          violations: validation.violations,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.FORBIDDEN,
      );
    }

    if (!validation.constitutionalCompliance) {
      this.logger.warn(
        `Webhook passed basic validation but failed constitutional compliance`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message: 'Constitutional compliance failed',
          metrics: {
            lei: validation.metrics.lei.lei,
            crs: validation.metrics.crs.crs,
          },
          timestamp: new Date().toISOString(),
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    request['constitutionalValidation'] = validation;

    this.logger.log(
      `Webhook validated successfully: ${deliveryId || 'unknown'} (CRS: ${validation.metrics.crs.crs.toFixed(2)}%)`,
    );
  }

  /**
   * Check if endpoint is a webhook endpoint
   */
  private isWebhookEndpoint(request: Request): boolean {
    const path = request.path.toLowerCase();
    return (
      path.includes('/webhook') ||
      path.includes('/github') ||
      request.headers['x-github-event'] !== undefined
    );
  }

  /**
   * Extract headers from request
   */
  private extractHeaders(request: Request): Record<string, string | undefined> {
    return {
      'x-hub-signature-256': request.headers['x-hub-signature-256'] as
        | string
        | undefined,
      'x-hub-signature': request.headers['x-hub-signature'] as
        | string
        | undefined,
      'x-github-delivery': request.headers['x-github-delivery'] as
        | string
        | undefined,
      'x-github-event': request.headers['x-github-event'] as string | undefined,
      'user-agent': request.headers['user-agent'] as string | undefined,
    };
  }

  /**
   * Extract repository from request
   */
  private extractRepository(request: Request): string | undefined {
    if (request.body && typeof request.body === 'object') {
      const body = request.body as Record<string, unknown>;

      if (body.repository && typeof body.repository === 'object') {
        const repo = body.repository as Record<string, unknown>;
        if (typeof repo.full_name === 'string') {
          return repo.full_name;
        }
      }
    }

    return undefined;
  }

  /**
   * Extract sender ID from request
   */
  private extractSenderId(request: Request): string | undefined {
    if (request.body && typeof request.body === 'object') {
      const body = request.body as Record<string, unknown>;

      if (body.sender && typeof body.sender === 'object') {
        const sender = body.sender as Record<string, unknown>;
        if (typeof sender.login === 'string') {
          return sender.login;
        }
      }
    }

    return undefined;
  }

  /**
   * Get request body as string or Buffer
   */
  private getRequestBody(request: Request): string | Buffer {
    if (Buffer.isBuffer(request.body)) {
      return request.body;
    }

    if (typeof request.body === 'string') {
      return request.body;
    }

    return JSON.stringify(request.body);
  }

  /**
   * Get webhook secret from environment
   */
  private getWebhookSecret(): string | undefined {
    return process.env.GITHUB_WEBHOOK_SECRET;
  }
}

/**
 * Decorator to skip constitutional validation
 * Use only for public endpoints that don't need protection
 */
export function SkipConstitutionalCheck(): MethodDecorator & ClassDecorator {
  return (
    /*target: object*/ _target: object,
    /*propertyKey?: string*/ _propertyKey?: string | symbol,
    /*descriptor?: PropertyDescriptor*/ _descriptor?: PropertyDescriptor,
  ): void => {
    if (_descriptor) {
      Reflector.prototype.get = function <T>(
        metadataKey: string,
        /*target: object*/ _targetInner: object,
      ): T | undefined {
        if (metadataKey === SKIP_CONSTITUTIONAL_CHECK) {
          return true as unknown as T;
        }
        return undefined;
      };
    } else {
      Reflector.prototype.get = function <T>(
        metadataKey: string,
        /*target: object*/ _targetInner: object,
      ): T | undefined {
        if (metadataKey === SKIP_CONSTITUTIONAL_CHECK) {
          return true as unknown as T;
        }
        return undefined;
      };
    }
  };
}

/**
 * Decorator to require constitutional validation
 * Explicitly marks endpoints as protected
 */
export function RequireConstitutionalCheck(): MethodDecorator & ClassDecorator {
  return (
    /*target: object*/ _target: object,
    /*propertyKey?: string*/ _propertyKey?: string | symbol,
    /*descriptor?: PropertyDescriptor*/ _descriptor?: PropertyDescriptor,
  ): void => {
    if (_descriptor) {
      const logger = new Logger('ConstitutionalGuard');
      logger.debug(
        `Constitutional validation required for ${_target.constructor.name}.${String(_propertyKey)}`,
      );
    }
  };
}
