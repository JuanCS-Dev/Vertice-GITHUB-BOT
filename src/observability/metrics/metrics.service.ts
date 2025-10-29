import { Injectable, Logger } from '@nestjs/common';

/**
 * Metrics Service
 *
 * Purpose: Application metrics for monitoring and alerting
 * Constitutional Requirement: P4 Rastreabilidade Total
 *
 * Metrics tracked:
 * - HTTP request count, duration, errors
 * - Webhook processing metrics
 * - Constitutional compliance scores (CRS, LEI, FPC)
 * - DETER-AGENT layer execution times
 * - Database query performance
 */

export interface MetricData {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp?: Date;
}

export interface ConstitutionalMetrics {
  crs: number;
  lei: number;
  fpc: number;
  timestamp: Date;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private metrics: Map<string, MetricData[]> = new Map();

  private httpRequestCount = 0;
  private httpRequestDuration: number[] = [];
  private httpErrorCount = 0;

  private webhookProcessedCount = 0;
  private webhookErrorCount = 0;
  private webhookDuration: number[] = [];

  private constitutionalMetrics: ConstitutionalMetrics[] = [];

  /**
   * Record HTTP request metrics
   */
  recordHttpRequest(duration: number, statusCode: number, method: string, path: string): void {
    this.httpRequestCount++;
    this.httpRequestDuration.push(duration);

    if (statusCode >= 400) {
      this.httpErrorCount++;
    }

    this.recordMetric({
      name: 'http_requests_total',
      value: 1,
      labels: {
        method,
        path,
        status: String(statusCode),
      },
    });

    this.recordMetric({
      name: 'http_request_duration_ms',
      value: duration,
      labels: {
        method,
        path,
      },
    });
  }

  /**
   * Record webhook processing metrics
   */
  recordWebhookProcessing(
    duration: number,
    eventType: string,
    success: boolean,
  ): void {
    this.webhookProcessedCount++;
    this.webhookDuration.push(duration);

    if (!success) {
      this.webhookErrorCount++;
    }

    this.recordMetric({
      name: 'webhooks_processed_total',
      value: 1,
      labels: {
        event_type: eventType,
        success: String(success),
      },
    });

    this.recordMetric({
      name: 'webhook_processing_duration_ms',
      value: duration,
      labels: {
        event_type: eventType,
      },
    });
  }

  /**
   * Record constitutional compliance metrics
   * Article II: Constitutional metrics must be tracked
   */
  recordConstitutionalMetrics(metrics: ConstitutionalMetrics): void {
    this.constitutionalMetrics.push(metrics);

    this.recordMetric({
      name: 'constitutional_crs_score',
      value: metrics.crs,
    });

    this.recordMetric({
      name: 'constitutional_lei_score',
      value: metrics.lei,
    });

    this.recordMetric({
      name: 'constitutional_fpc_score',
      value: metrics.fpc,
    });

    this.logger.debug(
      `Constitutional metrics recorded: CRS=${metrics.crs.toFixed(2)}%, LEI=${metrics.lei}, FPC=${metrics.fpc.toFixed(2)}%`,
    );
  }

  /**
   * Record DETER-AGENT layer execution time
   */
  recordDeterAgentLayer(
    layer: string,
    duration: number,
    success: boolean,
  ): void {
    this.recordMetric({
      name: 'deter_agent_layer_duration_ms',
      value: duration,
      labels: {
        layer,
        success: String(success),
      },
    });
  }

  /**
   * Record database query metrics
   */
  recordDatabaseQuery(operation: string, duration: number, table: string): void {
    this.recordMetric({
      name: 'database_query_duration_ms',
      value: duration,
      labels: {
        operation,
        table,
      },
    });
  }

  /**
   * Generic metric recording
   */
  private recordMetric(metric: MetricData): void {
    const key = metric.name;
    const existing = this.metrics.get(key) || [];

    existing.push({
      ...metric,
      timestamp: metric.timestamp || new Date(),
    });

    if (existing.length > 1000) {
      existing.shift();
    }

    this.metrics.set(key, existing);
  }

  /**
   * Get all metrics in Prometheus format
   */
  getPrometheusMetrics(): string {
    const lines: string[] = [];

    lines.push('# HELP http_requests_total Total number of HTTP requests');
    lines.push('# TYPE http_requests_total counter');
    lines.push(`http_requests_total ${this.httpRequestCount}`);
    lines.push('');

    lines.push('# HELP http_errors_total Total number of HTTP errors');
    lines.push('# TYPE http_errors_total counter');
    lines.push(`http_errors_total ${this.httpErrorCount}`);
    lines.push('');

    lines.push(
      '# HELP http_request_duration_seconds HTTP request duration in seconds',
    );
    lines.push('# TYPE http_request_duration_seconds histogram');
    if (this.httpRequestDuration.length > 0) {
      const avg =
        this.httpRequestDuration.reduce((a, b) => a + b, 0) /
        this.httpRequestDuration.length /
        1000;
      lines.push(`http_request_duration_seconds ${avg.toFixed(3)}`);
    }
    lines.push('');

    lines.push('# HELP webhooks_processed_total Total webhooks processed');
    lines.push('# TYPE webhooks_processed_total counter');
    lines.push(`webhooks_processed_total ${this.webhookProcessedCount}`);
    lines.push('');

    lines.push('# HELP webhook_errors_total Total webhook processing errors');
    lines.push('# TYPE webhook_errors_total counter');
    lines.push(`webhook_errors_total ${this.webhookErrorCount}`);
    lines.push('');

    if (this.constitutionalMetrics.length > 0) {
      const latest =
        this.constitutionalMetrics[this.constitutionalMetrics.length - 1];

      lines.push(
        '# HELP constitutional_crs_score Constitutional Rule Satisfaction score',
      );
      lines.push('# TYPE constitutional_crs_score gauge');
      lines.push(`constitutional_crs_score ${latest.crs.toFixed(2)}`);
      lines.push('');

      lines.push('# HELP constitutional_lei_score Lazy Execution Index');
      lines.push('# TYPE constitutional_lei_score gauge');
      lines.push(`constitutional_lei_score ${latest.lei}`);
      lines.push('');

      lines.push(
        '# HELP constitutional_fpc_score Feature Parity Completeness score',
      );
      lines.push('# TYPE constitutional_fpc_score gauge');
      lines.push(`constitutional_fpc_score ${latest.fpc.toFixed(2)}`);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    http: {
      totalRequests: number;
      totalErrors: number;
      errorRate: number;
      avgDuration: number;
    };
    webhooks: {
      totalProcessed: number;
      totalErrors: number;
      errorRate: number;
      avgDuration: number;
    };
    constitutional: ConstitutionalMetrics | null;
  } {
    const httpAvgDuration =
      this.httpRequestDuration.length > 0
        ? this.httpRequestDuration.reduce((a, b) => a + b, 0) /
          this.httpRequestDuration.length
        : 0;

    const webhookAvgDuration =
      this.webhookDuration.length > 0
        ? this.webhookDuration.reduce((a, b) => a + b, 0) /
          this.webhookDuration.length
        : 0;

    return {
      http: {
        totalRequests: this.httpRequestCount,
        totalErrors: this.httpErrorCount,
        errorRate:
          this.httpRequestCount > 0
            ? (this.httpErrorCount / this.httpRequestCount) * 100
            : 0,
        avgDuration: httpAvgDuration,
      },
      webhooks: {
        totalProcessed: this.webhookProcessedCount,
        totalErrors: this.webhookErrorCount,
        errorRate:
          this.webhookProcessedCount > 0
            ? (this.webhookErrorCount / this.webhookProcessedCount) * 100
            : 0,
        avgDuration: webhookAvgDuration,
      },
      constitutional:
        this.constitutionalMetrics.length > 0
          ? this.constitutionalMetrics[this.constitutionalMetrics.length - 1]
          : null,
    };
  }

  /**
   * Reset all metrics (for testing)
   */
  reset(): void {
    this.metrics.clear();
    this.httpRequestCount = 0;
    this.httpRequestDuration = [];
    this.httpErrorCount = 0;
    this.webhookProcessedCount = 0;
    this.webhookErrorCount = 0;
    this.webhookDuration = [];
    this.constitutionalMetrics = [];
  }
}
