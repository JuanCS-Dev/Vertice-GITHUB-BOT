import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * User Decorator
 *
 * Purpose: Extract user/sender information from request
 * Constitutional Requirement: P2 Validação Preventiva
 *
 * Usage: @User() user: UserInfo
 * Extracts: GitHub sender information from webhook payload
 */

export interface UserInfo {
  id?: number;
  login?: string;
  type?: string;
  siteAdmin?: boolean;
}

export const User = createParamDecorator(
  (/* data: unknown */ _data: unknown, ctx: ExecutionContext): UserInfo | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();

    if (request.body && typeof request.body === 'object') {
      const body = request.body as Record<string, unknown>;

      if (body.sender && typeof body.sender === 'object') {
        const sender = body.sender as Record<string, unknown>;

        return {
          id: typeof sender.id === 'number' ? sender.id : undefined,
          login: typeof sender.login === 'string' ? sender.login : undefined,
          type: typeof sender.type === 'string' ? sender.type : undefined,
          siteAdmin:
            typeof sender.site_admin === 'boolean'
              ? sender.site_admin
              : undefined,
        };
      }
    }

    return undefined;
  },
);

/**
 * Repository Decorator
 *
 * Purpose: Extract repository information from request
 * Constitutional Requirement: P2 Validação Preventiva
 *
 * Usage: @Repository() repo: RepositoryInfo
 * Extracts: GitHub repository information from webhook payload
 */

export interface RepositoryInfo {
  id?: number;
  name?: string;
  fullName?: string;
  owner?: string;
  private?: boolean;
  defaultBranch?: string;
}

export const Repository = createParamDecorator(
  (/* data: unknown */ _data: unknown, ctx: ExecutionContext): RepositoryInfo | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();

    if (request.body && typeof request.body === 'object') {
      const body = request.body as Record<string, unknown>;

      if (body.repository && typeof body.repository === 'object') {
        const repo = body.repository as Record<string, unknown>;
        const owner =
          repo.owner && typeof repo.owner === 'object'
            ? (repo.owner as Record<string, unknown>)
            : undefined;

        return {
          id: typeof repo.id === 'number' ? repo.id : undefined,
          name: typeof repo.name === 'string' ? repo.name : undefined,
          fullName:
            typeof repo.full_name === 'string' ? repo.full_name : undefined,
          owner:
            owner && typeof owner.login === 'string'
              ? owner.login
              : undefined,
          private:
            typeof repo.private === 'boolean' ? repo.private : undefined,
          defaultBranch:
            typeof repo.default_branch === 'string'
              ? repo.default_branch
              : undefined,
        };
      }
    }

    return undefined;
  },
);

/**
 * WebhookEvent Decorator
 *
 * Purpose: Extract webhook event information from headers
 * Constitutional Requirement: P2 Validação Preventiva
 *
 * Usage: @WebhookEvent() event: WebhookEventInfo
 * Extracts: GitHub event type and delivery ID
 */

export interface WebhookEventInfo {
  eventType?: string;
  deliveryId?: string;
  signature?: string;
}

export const WebhookEvent = createParamDecorator(
  (/* data: unknown */ _data: unknown, ctx: ExecutionContext): WebhookEventInfo => {
    const request = ctx.switchToHttp().getRequest<Request>();

    return {
      eventType: request.headers['x-github-event'] as string | undefined,
      deliveryId: request.headers['x-github-delivery'] as string | undefined,
      signature:
        (request.headers['x-hub-signature-256'] as string | undefined) ||
        (request.headers['x-hub-signature'] as string | undefined),
    };
  },
);
