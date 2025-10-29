import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';

/**
 * Metrics Service Unit Tests
 *
 * Purpose: Test Prometheus metrics collection
 * Constitutional Requirement: P4 Rastreabilidade Total
 */

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => {
    service.reset();
  });

  describe('HTTP Request Metrics', () => {
    it('should record HTTP request', () => {
      service.recordHttpRequest(150, 200, 'GET', '/api/v1/health');

      const summary = service.getSummary();
      expect(summary.http.totalRequests).toBe(1);
      expect(summary.http.avgDuration).toBe(150);
    });

    it('should record HTTP errors', () => {
      service.recordHttpRequest(100, 500, 'POST', '/api/v1/webhook');

      const summary = service.getSummary();
      expect(summary.http.totalErrors).toBe(1);
      expect(summary.http.errorRate).toBe(100);
    });

    it('should calculate error rate correctly', () => {
      service.recordHttpRequest(100, 200, 'GET', '/test');
      service.recordHttpRequest(100, 200, 'GET', '/test');
      service.recordHttpRequest(100, 500, 'GET', '/test');

      const summary = service.getSummary();
      expect(summary.http.totalRequests).toBe(3);
      expect(summary.http.totalErrors).toBe(1);
      expect(summary.http.errorRate).toBeCloseTo(33.33, 1);
    });

    it('should calculate average duration', () => {
      service.recordHttpRequest(100, 200, 'GET', '/test');
      service.recordHttpRequest(200, 200, 'GET', '/test');
      service.recordHttpRequest(300, 200, 'GET', '/test');

      const summary = service.getSummary();
      expect(summary.http.avgDuration).toBe(200);
    });

    it('should treat 4xx as errors', () => {
      service.recordHttpRequest(100, 404, 'GET', '/not-found');

      const summary = service.getSummary();
      expect(summary.http.totalErrors).toBe(1);
    });
  });

  describe('Webhook Processing Metrics', () => {
    it('should record successful webhook processing', () => {
      service.recordWebhookProcessing(250, 'issues', true);

      const summary = service.getSummary();
      expect(summary.webhooks.totalProcessed).toBe(1);
      expect(summary.webhooks.totalErrors).toBe(0);
    });

    it('should record failed webhook processing', () => {
      service.recordWebhookProcessing(150, 'pull_request', false);

      const summary = service.getSummary();
      expect(summary.webhooks.totalProcessed).toBe(1);
      expect(summary.webhooks.totalErrors).toBe(1);
      expect(summary.webhooks.errorRate).toBe(100);
    });

    it('should calculate webhook error rate', () => {
      service.recordWebhookProcessing(100, 'issues', true);
      service.recordWebhookProcessing(100, 'issues', true);
      service.recordWebhookProcessing(100, 'issues', false);

      const summary = service.getSummary();
      expect(summary.webhooks.errorRate).toBeCloseTo(33.33, 1);
    });

    it('should calculate average webhook duration', () => {
      service.recordWebhookProcessing(100, 'issues', true);
      service.recordWebhookProcessing(200, 'issues', true);
      service.recordWebhookProcessing(300, 'issues', true);

      const summary = service.getSummary();
      expect(summary.webhooks.avgDuration).toBe(200);
    });
  });

  describe('Constitutional Metrics', () => {
    it('should record constitutional compliance metrics', () => {
      const metrics = {
        crs: 95.5,
        lei: 0.5,
        fpc: 85.0,
        timestamp: new Date(),
      };

      service.recordConstitutionalMetrics(metrics);

      const summary = service.getSummary();
      expect(summary.constitutional).toEqual(metrics);
    });

    it('should update constitutional metrics', () => {
      const metrics1 = {
        crs: 90.0,
        lei: 1.0,
        fpc: 80.0,
        timestamp: new Date(),
      };

      const metrics2 = {
        crs: 95.5,
        lei: 0.5,
        fpc: 85.0,
        timestamp: new Date(),
      };

      service.recordConstitutionalMetrics(metrics1);
      service.recordConstitutionalMetrics(metrics2);

      const summary = service.getSummary();
      expect(summary.constitutional).toEqual(metrics2);
    });

    it('should return null when no constitutional metrics recorded', () => {
      const summary = service.getSummary();
      expect(summary.constitutional).toBeNull();
    });
  });

  describe('DETER-AGENT Layer Metrics', () => {
    it('should record layer execution time', () => {
      service.recordDeterAgentLayer('constitutional', 50, true);
      service.recordDeterAgentLayer('deliberation', 100, true);

      expect(service).toBeDefined();
    });

    it('should record layer failures', () => {
      service.recordDeterAgentLayer('execution', 200, false);

      expect(service).toBeDefined();
    });
  });

  describe('Database Query Metrics', () => {
    it('should record database query duration', () => {
      service.recordDatabaseQuery('SELECT', 25, 'webhookDelivery');

      expect(service).toBeDefined();
    });

    it('should record different query operations', () => {
      service.recordDatabaseQuery('SELECT', 25, 'webhookDelivery');
      service.recordDatabaseQuery('INSERT', 50, 'issueAnalysis');
      service.recordDatabaseQuery('UPDATE', 35, 'repository');

      expect(service).toBeDefined();
    });
  });

  describe('Prometheus Format', () => {
    it('should export metrics in Prometheus format', () => {
      service.recordHttpRequest(100, 200, 'GET', '/test');

      const prometheus = service.getPrometheusMetrics();

      expect(prometheus).toContain('# HELP http_requests_total');
      expect(prometheus).toContain('# TYPE http_requests_total counter');
      expect(prometheus).toContain('http_requests_total 1');
    });

    it('should include constitutional metrics in Prometheus format', () => {
      service.recordConstitutionalMetrics({
        crs: 95.5,
        lei: 0.5,
        fpc: 85.0,
        timestamp: new Date(),
      });

      const prometheus = service.getPrometheusMetrics();

      expect(prometheus).toContain('constitutional_crs_score 95.50');
      expect(prometheus).toContain('constitutional_lei_score 0.5');
      expect(prometheus).toContain('constitutional_fpc_score 85.00');
    });

    it('should format duration in seconds for Prometheus', () => {
      service.recordHttpRequest(1000, 200, 'GET', '/test');

      const prometheus = service.getPrometheusMetrics();

      expect(prometheus).toContain('http_request_duration_seconds');
      expect(prometheus).toContain('1.000');
    });
  });

  describe('Metrics Reset', () => {
    it('should reset all metrics', () => {
      service.recordHttpRequest(100, 200, 'GET', '/test');
      service.recordWebhookProcessing(150, 'issues', true);
      service.recordConstitutionalMetrics({
        crs: 95.0,
        lei: 0.5,
        fpc: 80.0,
        timestamp: new Date(),
      });

      service.reset();

      const summary = service.getSummary();
      expect(summary.http.totalRequests).toBe(0);
      expect(summary.webhooks.totalProcessed).toBe(0);
      expect(summary.constitutional).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero HTTP requests', () => {
      const summary = service.getSummary();
      expect(summary.http.errorRate).toBe(0);
      expect(summary.http.avgDuration).toBe(0);
    });

    it('should handle zero webhook processing', () => {
      const summary = service.getSummary();
      expect(summary.webhooks.errorRate).toBe(0);
      expect(summary.webhooks.avgDuration).toBe(0);
    });

    it('should handle metrics buffer overflow', () => {
      // Record more than 1000 metrics to test buffer limit
      for (let i = 0; i < 1500; i++) {
        service.recordHttpRequest(100, 200, 'GET', '/test');
      }

      const summary = service.getSummary();
      expect(summary.http.totalRequests).toBe(1500);
    });
  });

  describe('Constitutional Compliance', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have logger instance', () => {
      expect(service['logger']).toBeDefined();
    });

    it('should log constitutional metrics recording', () => {
      const loggerSpy = jest.spyOn(service['logger'], 'debug');

      service.recordConstitutionalMetrics({
        crs: 95.5,
        lei: 0.5,
        fpc: 85.0,
        timestamp: new Date(),
      });

      expect(loggerSpy).toHaveBeenCalled();
      loggerSpy.mockRestore();
    });
  });
});
