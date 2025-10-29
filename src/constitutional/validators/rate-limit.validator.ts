import { Injectable, Logger } from '@nestjs/common';

/**
 * Rate Limit Validator
 *
 * Purpose: Enforce rate limiting for constitutional compliance
 * Constitutional Requirement: Article III - Zero Trust
 * P2: Validação Preventiva - prevent abuse and resource exhaustion
 *
 * Implements: Token bucket algorithm with sliding window
 * Tracks: Per-sender, per-repository, and global rate limits
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfterMs?: number;
}

export interface RateLimitInfo {
  requests: number;
  windowStart: number;
  lastRequest: number;
}

@Injectable()
export class RateLimitValidator {
  private readonly logger = new Logger(RateLimitValidator.name);
  private readonly limits = new Map<string, RateLimitInfo>();

  private readonly DEFAULT_LIMITS = {
    GLOBAL: { maxRequests: 1000, windowMs: 60000 },
    PER_SENDER: { maxRequests: 100, windowMs: 60000 },
    PER_REPO: { maxRequests: 200, windowMs: 60000 },
    WEBHOOK: { maxRequests: 5000, windowMs: 3600000 },
  };

  /**
   * Check if request is within rate limit
   * Article III: Zero Trust - Enforce limits on all operations
   */
  async checkRateLimit(config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const key = this.buildKey(config.identifier);

    const info = this.limits.get(key) || this.initializeLimit(key, now);

    if (now - info.windowStart >= config.windowMs) {
      this.resetWindow(key, now);
      info.requests = 0;
      info.windowStart = now;
    }

    const remaining = config.maxRequests - info.requests;

    if (remaining <= 0) {
      const resetAt = new Date(info.windowStart + config.windowMs);
      const retryAfterMs = resetAt.getTime() - now;

      this.logger.warn(
        `Rate limit exceeded for ${config.identifier}: ${info.requests}/${config.maxRequests}`,
      );

      await this.logRateLimitExceeded({
        identifier: config.identifier,
        requests: info.requests,
        maxRequests: config.maxRequests,
        resetAt,
      });

      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfterMs,
      };
    }

    info.requests++;
    info.lastRequest = now;
    this.limits.set(key, info);

    const resetAt = new Date(info.windowStart + config.windowMs);

    return {
      allowed: true,
      remaining: remaining - 1,
      resetAt,
    };
  }

  /**
   * Check global rate limit
   */
  async checkGlobalLimit(identifier: string): Promise<RateLimitResult> {
    return this.checkRateLimit({
      identifier: `global:${identifier}`,
      maxRequests: this.DEFAULT_LIMITS.GLOBAL.maxRequests,
      windowMs: this.DEFAULT_LIMITS.GLOBAL.windowMs,
    });
  }

  /**
   * Check per-sender rate limit
   */
  async checkSenderLimit(senderId: string): Promise<RateLimitResult> {
    return this.checkRateLimit({
      identifier: `sender:${senderId}`,
      maxRequests: this.DEFAULT_LIMITS.PER_SENDER.maxRequests,
      windowMs: this.DEFAULT_LIMITS.PER_SENDER.windowMs,
    });
  }

  /**
   * Check per-repository rate limit
   */
  async checkRepositoryLimit(repoFullName: string): Promise<RateLimitResult> {
    return this.checkRateLimit({
      identifier: `repo:${repoFullName}`,
      maxRequests: this.DEFAULT_LIMITS.PER_REPO.maxRequests,
      windowMs: this.DEFAULT_LIMITS.PER_REPO.windowMs,
    });
  }

  /**
   * Check webhook rate limit (higher threshold)
   */
  async checkWebhookLimit(deliveryId: string): Promise<RateLimitResult> {
    return this.checkRateLimit({
      identifier: `webhook:${deliveryId}`,
      maxRequests: this.DEFAULT_LIMITS.WEBHOOK.maxRequests,
      windowMs: this.DEFAULT_LIMITS.WEBHOOK.windowMs,
    });
  }

  /**
   * Check all rate limits for a request
   */
  async checkAllLimits(request: {
    senderId?: string;
    repository?: string;
    deliveryId?: string;
  }): Promise<{
    allowed: boolean;
    violations: string[];
    limits: Record<string, RateLimitResult>;
  }> {
    const violations: string[] = [];
    const limits: Record<string, RateLimitResult> = {};

    const globalLimit = await this.checkGlobalLimit('system');
    limits.global = globalLimit;
    if (!globalLimit.allowed) {
      violations.push('Global rate limit exceeded');
    }

    if (request.senderId) {
      const senderLimit = await this.checkSenderLimit(request.senderId);
      limits.sender = senderLimit;
      if (!senderLimit.allowed) {
        violations.push(`Sender ${request.senderId} rate limit exceeded`);
      }
    }

    if (request.repository) {
      const repoLimit = await this.checkRepositoryLimit(request.repository);
      limits.repository = repoLimit;
      if (!repoLimit.allowed) {
        violations.push(`Repository ${request.repository} rate limit exceeded`);
      }
    }

    if (request.deliveryId) {
      const webhookLimit = await this.checkWebhookLimit(request.deliveryId);
      limits.webhook = webhookLimit;
      if (!webhookLimit.allowed) {
        violations.push('Webhook rate limit exceeded');
      }
    }

    return {
      allowed: violations.length === 0,
      violations,
      limits,
    };
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(identifier: string): RateLimitInfo | null {
    const key = this.buildKey(identifier);
    return this.limits.get(key) || null;
  }

  /**
   * Reset rate limit for identifier
   */
  resetRateLimit(identifier: string): void {
    const key = this.buildKey(identifier);
    this.limits.delete(key);
    this.logger.log(`Rate limit reset for ${identifier}`);
  }

  /**
   * Get all active rate limits
   */
  getAllRateLimits(): Map<string, RateLimitInfo> {
    return new Map(this.limits);
  }

  /**
   * Clear expired rate limits (cleanup)
   */
  cleanupExpiredLimits(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, info] of this.limits.entries()) {
      const maxWindow = Math.max(
        ...Object.values(this.DEFAULT_LIMITS).map((l) => l.windowMs),
      );

      if (now - info.lastRequest > maxWindow) {
        this.limits.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleaned up ${cleaned} expired rate limits`);
    }

    return cleaned;
  }

  /**
   * Build cache key for rate limit tracking
   */
  private buildKey(identifier: string): string {
    return `ratelimit:${identifier}`;
  }

  /**
   * Initialize rate limit tracking
   */
  private initializeLimit(key: string, now: number): RateLimitInfo {
    const info: RateLimitInfo = {
      requests: 0,
      windowStart: now,
      lastRequest: now,
    };
    this.limits.set(key, info);
    return info;
  }

  /**
   * Reset rate limit window
   */
  private resetWindow(key: string, now: number): void {
    const info = this.limits.get(key);
    if (info) {
      info.requests = 0;
      info.windowStart = now;
      this.limits.set(key, info);
    }
  }

  /**
   * Calculate remaining requests in current window
   */
  getRemainingRequests(
    identifier: string,
    maxRequests: number,
  ): number {
    const key = this.buildKey(identifier);
    const info = this.limits.get(key);

    if (!info) {
      return maxRequests;
    }

    return Math.max(0, maxRequests - info.requests);
  }

  /**
   * Calculate time until rate limit reset
   */
  getTimeUntilReset(
    identifier: string,
    windowMs: number,
  ): number {
    const key = this.buildKey(identifier);
    const info = this.limits.get(key);

    if (!info) {
      return 0;
    }

    const resetTime = info.windowStart + windowMs;
    const now = Date.now();

    return Math.max(0, resetTime - now);
  }

  /**
   * Check if identifier is currently rate limited
   */
  isRateLimited(identifier: string, config: RateLimitConfig): boolean {
    const key = this.buildKey(identifier);
    const info = this.limits.get(key);

    if (!info) {
      return false;
    }

    const now = Date.now();

    if (now - info.windowStart >= config.windowMs) {
      return false;
    }

    return info.requests >= config.maxRequests;
  }

  /**
   * Log rate limit exceeded event
   * P4: Rastreabilidade Total
   */
  private async logRateLimitExceeded(event: {
    identifier: string;
    requests: number;
    maxRequests: number;
    resetAt: Date;
  }): Promise<void> {
    this.logger.warn(
      `Rate limit exceeded: ${event.identifier} (${event.requests}/${event.maxRequests}, resets at ${event.resetAt.toISOString()})`,
    );
  }

  /**
   * Get rate limit statistics
   */
  getStatistics(): {
    totalTracked: number;
    activeWindows: number;
    totalRequests: number;
    averageRequestsPerWindow: number;
  } {
    const now = Date.now();
    let activeWindows = 0;
    let totalRequests = 0;

    for (const info of this.limits.values()) {
      const maxWindow = Math.max(
        ...Object.values(this.DEFAULT_LIMITS).map((l) => l.windowMs),
      );

      if (now - info.windowStart < maxWindow) {
        activeWindows++;
        totalRequests += info.requests;
      }
    }

    return {
      totalTracked: this.limits.size,
      activeWindows,
      totalRequests,
      averageRequestsPerWindow:
        activeWindows > 0 ? totalRequests / activeWindows : 0,
    };
  }

  /**
   * Update rate limit configuration dynamically
   */
  updateLimitConfig(
    type: keyof typeof RateLimitValidator.prototype.DEFAULT_LIMITS,
    config: { maxRequests: number; windowMs: number },
  ): void {
    this.DEFAULT_LIMITS[type] = config;
    this.logger.log(
      `Updated rate limit config for ${type}: ${config.maxRequests} requests per ${config.windowMs}ms`,
    );
  }

  /**
   * Schedule periodic cleanup
   */
  startCleanupSchedule(intervalMs: number = 300000): NodeJS.Timeout {
    return setInterval(() => {
      this.cleanupExpiredLimits();
    }, intervalMs);
  }
}
