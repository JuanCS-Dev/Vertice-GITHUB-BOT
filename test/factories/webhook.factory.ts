/**
 * Webhook Test Data Factory
 *
 * Purpose: Create test data for webhook-related tests
 * Constitutional Requirement: P4 Rastreabilidade Total
 *
 * Provides factory functions for:
 * - GitHub webhook payloads
 * - Webhook delivery records
 * - GitHub event signatures
 */

import * as crypto from 'crypto';

export interface CreateWebhookPayloadOptions {
  eventType?: string;
  action?: string;
  repositoryName?: string;
  repositoryOwner?: string;
  issueNumber?: number;
  prNumber?: number;
}

/**
 * Create a test GitHub webhook payload
 */
export function createWebhookPayload(
  options: CreateWebhookPayloadOptions = {},
): Record<string, unknown> {
  const {
    eventType = 'issues',
    action = 'opened',
    repositoryName = 'test-repo',
    repositoryOwner = 'test-owner',
    issueNumber = 1,
    prNumber = 1,
  } = options;

  const basePayload = {
    action,
    repository: {
      id: 123456789,
      name: repositoryName,
      full_name: `${repositoryOwner}/${repositoryName}`,
      owner: {
        login: repositoryOwner,
        id: 987654321,
        type: 'User',
      },
      private: false,
      html_url: `https://github.com/${repositoryOwner}/${repositoryName}`,
    },
    sender: {
      login: 'test-user',
      id: 111222333,
      type: 'User',
    },
  };

  if (eventType === 'issues') {
    return {
      ...basePayload,
      issue: {
        number: issueNumber,
        title: 'Test Issue',
        body: 'This is a test issue body',
        state: 'open',
        user: {
          login: 'issue-creator',
          id: 444555666,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  if (eventType === 'pull_request') {
    return {
      ...basePayload,
      pull_request: {
        number: prNumber,
        title: 'Test Pull Request',
        body: 'This is a test PR body',
        state: 'open',
        user: {
          login: 'pr-creator',
          id: 777888999,
        },
        head: {
          ref: 'feature/test-branch',
          sha: 'abc123def456',
        },
        base: {
          ref: 'main',
          sha: '789ghi012jkl',
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };
  }

  return basePayload;
}

/**
 * Generate GitHub webhook signature
 */
export function generateWebhookSignature(
  payload: string | object,
  secret: string,
): string {
  const payloadString =
    typeof payload === 'string' ? payload : JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadString);
  return `sha256=${hmac.digest('hex')}`;
}

/**
 * Create webhook delivery record for database
 */
export function createWebhookDeliveryRecord(
  options: CreateWebhookPayloadOptions = {},
) {
  const payload = createWebhookPayload(options);
  return {
    id: 'test-delivery-uuid',
    eventType: options.eventType || 'issues',
    deliveryId: 'test-github-delivery-id',
    payload: payload as object,
    signature: 'sha256=test-signature',
    receivedAt: new Date(),
    processedAt: null,
    status: 'pending',
    errorMessage: null,
  };
}
