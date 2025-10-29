import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * GitHub Webhook Signature Validator
 *
 * Purpose: Verify HMAC-SHA256 signatures from GitHub webhooks
 * Constitutional Requirement: Article III - Zero Trust
 * P2: Validação Preventiva - reject invalid signatures
 *
 * Security: Timing-safe comparison to prevent timing attacks
 * Algorithm: HMAC-SHA256 with webhook secret
 */

export interface SignatureValidationResult {
  valid: boolean;
  reason?: string;
  algorithm?: string;
  timestamp?: Date;
}

@Injectable()
export class SignatureValidator {
  private readonly logger = new Logger(SignatureValidator.name);
  private readonly SIGNATURE_HEADER = 'x-hub-signature-256';
  private readonly DELIVERY_HEADER = 'x-github-delivery';

  /**
   * Validate GitHub webhook signature
   * Article III: Zero Trust - Never trust, always verify
   */
  async validateSignature(
    payload: string | Buffer,
    signature: string,
    secret: string,
  ): Promise<SignatureValidationResult> {
    try {
      if (!signature || !secret || !payload) {
        this.logger.warn('Missing required parameters for signature validation');
        return {
          valid: false,
          reason: 'Missing signature, secret, or payload',
        };
      }

      const signatureParts = this.parseSignature(signature);
      if (!signatureParts) {
        this.logger.warn(`Invalid signature format: ${signature}`);
        return {
          valid: false,
          reason: 'Invalid signature format',
        };
      }

      const { algorithm, hash } = signatureParts;

      if (algorithm !== 'sha256') {
        this.logger.warn(`Unsupported signature algorithm: ${algorithm}`);
        return {
          valid: false,
          reason: `Unsupported algorithm: ${algorithm}`,
          algorithm,
        };
      }

      const expectedHash = this.computeSignature(payload, secret, algorithm);

      const isValid = this.timingSafeCompare(hash, expectedHash);

      if (!isValid) {
        this.logger.error('Signature validation failed: hash mismatch');
        await this.logSecurityEvent({
          event: 'SIGNATURE_VALIDATION_FAILED',
          reason: 'Hash mismatch',
          timestamp: new Date(),
        });
      }

      return {
        valid: isValid,
        reason: isValid ? undefined : 'Signature mismatch',
        algorithm,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(
        `Signature validation error: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        valid: false,
        reason: 'Validation error occurred',
      };
    }
  }

  /**
   * Parse signature header into algorithm and hash
   */
  private parseSignature(
    signature: string,
  ): { algorithm: string; hash: string } | null {
    const match = signature.match(/^([a-z0-9]+)=([a-f0-9]+)$/);
    if (!match) {
      return null;
    }

    return {
      algorithm: match[1],
      hash: match[2],
    };
  }

  /**
   * Compute HMAC signature
   */
  private computeSignature(
    payload: string | Buffer,
    secret: string,
    algorithm: string,
  ): string {
    const hmac = createHmac(algorithm, secret);
    hmac.update(payload);
    return hmac.digest('hex');
  }

  /**
   * Timing-safe string comparison
   * Security: Prevents timing attacks by ensuring constant-time comparison
   */
  private timingSafeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    const bufferA = Buffer.from(a, 'hex');
    const bufferB = Buffer.from(b, 'hex');

    try {
      return timingSafeEqual(bufferA, bufferB);
    } catch {
      return false;
    }
  }

  /**
   * Validate GitHub webhook headers
   */
  validateHeaders(headers: Record<string, string | undefined>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!headers[this.SIGNATURE_HEADER]) {
      errors.push(`Missing ${this.SIGNATURE_HEADER} header`);
    }

    if (!headers[this.DELIVERY_HEADER]) {
      errors.push(`Missing ${this.DELIVERY_HEADER} header`);
    }

    const eventType = headers['x-github-event'];
    if (!eventType) {
      errors.push('Missing x-github-event header');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Extract signature from request headers
   */
  extractSignature(headers: Record<string, string | undefined>): string | null {
    const signature = headers[this.SIGNATURE_HEADER] || headers['x-hub-signature'];

    if (!signature) {
      this.logger.warn('No signature found in headers');
      return null;
    }

    return signature;
  }

  /**
   * Validate signature age to prevent replay attacks
   */
  validateSignatureAge(
    timestamp: Date | string,
    maxAgeSeconds: number = 300,
  ): { valid: boolean; reason?: string } {
    try {
      const signatureTime =
        timestamp instanceof Date ? timestamp : new Date(timestamp);

      if (isNaN(signatureTime.getTime())) {
        return {
          valid: false,
          reason: 'Invalid timestamp format',
        };
      }

      const now = new Date();
      const ageSeconds = (now.getTime() - signatureTime.getTime()) / 1000;

      if (ageSeconds > maxAgeSeconds) {
        this.logger.warn(
          `Signature too old: ${ageSeconds}s (max: ${maxAgeSeconds}s)`,
        );
        return {
          valid: false,
          reason: `Signature expired (age: ${ageSeconds}s)`,
        };
      }

      if (ageSeconds < -60) {
        this.logger.warn(`Signature from future: ${ageSeconds}s`);
        return {
          valid: false,
          reason: 'Signature timestamp in future',
        };
      }

      return { valid: true };
    } catch (error) {
      this.logger.error(
        `Error validating signature age: ${error instanceof Error ? error.message : String(error)}`,
      );
      return {
        valid: false,
        reason: 'Error validating timestamp',
      };
    }
  }

  /**
   * Validate complete GitHub webhook request
   */
  async validateWebhookRequest(request: {
    headers: Record<string, string | undefined>;
    body: string | Buffer;
    secret: string;
  }): Promise<{
    valid: boolean;
    errors: string[];
    deliveryId?: string;
    eventType?: string;
  }> {
    const errors: string[] = [];

    const headersValidation = this.validateHeaders(request.headers);
    if (!headersValidation.valid) {
      errors.push(...headersValidation.errors);
    }

    const signature = this.extractSignature(request.headers);
    if (!signature) {
      errors.push('Missing or invalid signature');
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const signatureValidation = await this.validateSignature(
      request.body,
      signature!,
      request.secret,
    );

    if (!signatureValidation.valid) {
      errors.push(
        signatureValidation.reason || 'Signature validation failed',
      );
    }

    const deliveryId = request.headers[this.DELIVERY_HEADER];
    const eventType = request.headers['x-github-event'];

    return {
      valid: errors.length === 0,
      errors,
      deliveryId,
      eventType,
    };
  }

  /**
   * Generate test signature for development
   * WARNING: Only use in test environments
   */
  generateTestSignature(payload: string | Buffer, secret: string): string {
    const hash = this.computeSignature(payload, secret, 'sha256');
    return `sha256=${hash}`;
  }

  /**
   * Log security event for audit trail
   * P4: Rastreabilidade Total
   */
  private async logSecurityEvent(event: {
    event: string;
    reason: string;
    timestamp: Date;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    this.logger.error(
      `Security Event: ${event.event} - ${event.reason}`,
      event.metadata,
    );
  }

  /**
   * Verify webhook secret strength
   */
  validateSecretStrength(secret: string): {
    valid: boolean;
    strength: 'weak' | 'medium' | 'strong';
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let strength: 'weak' | 'medium' | 'strong' = 'weak';

    if (secret.length < 20) {
      recommendations.push('Secret should be at least 20 characters');
    }

    if (!/[A-Z]/.test(secret)) {
      recommendations.push('Secret should contain uppercase letters');
    }

    if (!/[a-z]/.test(secret)) {
      recommendations.push('Secret should contain lowercase letters');
    }

    if (!/[0-9]/.test(secret)) {
      recommendations.push('Secret should contain numbers');
    }

    if (!/[^A-Za-z0-9]/.test(secret)) {
      recommendations.push('Secret should contain special characters');
    }

    if (recommendations.length === 0 && secret.length >= 32) {
      strength = 'strong';
    } else if (recommendations.length <= 2 && secret.length >= 20) {
      strength = 'medium';
    }

    return {
      valid: strength !== 'weak',
      strength,
      recommendations,
    };
  }
}
