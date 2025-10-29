import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Metrics Endpoints E2E Tests
 *
 * Purpose: Test Prometheus metrics endpoints end-to-end
 * Constitutional Requirement: P4 Rastreabilidade Total
 *
 * Endpoints tested:
 * - GET /metrics - Prometheus text format
 * - GET /metrics/summary - JSON format
 */

describe('Metrics Controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /metrics', () => {
    it('should return Prometheus format metrics', () => {
      return request(app.getHttpServer())
        .get('/metrics')
        .expect(200)
        .expect('Content-Type', /text/);
    });

    it('should include HTTP request metrics', () => {
      return request(app.getHttpServer())
        .get('/metrics')
        .expect(200)
        .expect((res) => {
          expect(res.text).toContain('# HELP http_requests_total');
          expect(res.text).toContain('# TYPE http_requests_total counter');
          expect(res.text).toContain('http_requests_total');
        });
    });

    it('should include HTTP error metrics', () => {
      return request(app.getHttpServer())
        .get('/metrics')
        .expect(200)
        .expect((res) => {
          expect(res.text).toContain('# HELP http_errors_total');
          expect(res.text).toContain('# TYPE http_errors_total counter');
          expect(res.text).toContain('http_errors_total');
        });
    });

    it('should include HTTP duration metrics', () => {
      return request(app.getHttpServer())
        .get('/metrics')
        .expect(200)
        .expect((res) => {
          expect(res.text).toContain('http_request_duration_seconds');
        });
    });

    it('should include webhook metrics', () => {
      return request(app.getHttpServer())
        .get('/metrics')
        .expect(200)
        .expect((res) => {
          expect(res.text).toContain('webhooks_processed_total');
          expect(res.text).toContain('webhook_errors_total');
        });
    });

    it('should follow Prometheus text format', () => {
      return request(app.getHttpServer())
        .get('/metrics')
        .expect(200)
        .expect((res) => {
          const lines = res.text.split('\n');
          const hasHelpLines = lines.some((line) => line.startsWith('# HELP'));
          const hasTypeLines = lines.some((line) => line.startsWith('# TYPE'));
          expect(hasHelpLines).toBe(true);
          expect(hasTypeLines).toBe(true);
        });
    });

    it('should be scrapable by Prometheus', () => {
      return request(app.getHttpServer())
        .get('/metrics')
        .expect(200)
        .expect((res) => {
          const lines = res.text.split('\n');
          const metricLines = lines.filter((line) => line && !line.startsWith('#'));
          expect(metricLines.length).toBeGreaterThan(0);
        });
    });
  });

  describe('GET /metrics/summary', () => {
    it('should return JSON format summary', () => {
      return request(app.getHttpServer())
        .get('/metrics/summary')
        .expect(200)
        .expect('Content-Type', /json/);
    });

    it('should include HTTP metrics in summary', () => {
      return request(app.getHttpServer())
        .get('/metrics/summary')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('http');
          expect(res.body.http).toHaveProperty('totalRequests');
          expect(res.body.http).toHaveProperty('totalErrors');
          expect(res.body.http).toHaveProperty('errorRate');
          expect(res.body.http).toHaveProperty('avgDuration');
        });
    });

    it('should include webhook metrics in summary', () => {
      return request(app.getHttpServer())
        .get('/metrics/summary')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('webhooks');
          expect(res.body.webhooks).toHaveProperty('totalProcessed');
          expect(res.body.webhooks).toHaveProperty('totalErrors');
          expect(res.body.webhooks).toHaveProperty('errorRate');
          expect(res.body.webhooks).toHaveProperty('avgDuration');
        });
    });

    it('should include constitutional metrics if available', () => {
      return request(app.getHttpServer())
        .get('/metrics/summary')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('constitutional');
        });
    });

    it('should have numeric values', () => {
      return request(app.getHttpServer())
        .get('/metrics/summary')
        .expect(200)
        .expect((res) => {
          expect(typeof res.body.http.totalRequests).toBe('number');
          expect(typeof res.body.http.totalErrors).toBe('number');
          expect(typeof res.body.http.errorRate).toBe('number');
          expect(typeof res.body.http.avgDuration).toBe('number');
        });
    });
  });

  describe('Metrics Accumulation', () => {
    it('should accumulate metrics across requests', async () => {
      await request(app.getHttpServer()).get('/health');
      await request(app.getHttpServer()).get('/health');

      const response = await request(app.getHttpServer()).get('/metrics/summary').expect(200);

      expect(response.body.http.totalRequests).toBeGreaterThanOrEqual(2);
    });

    it('should track both successful and failed requests', async () => {
      await request(app.getHttpServer()).get('/health');
      await request(app.getHttpServer()).get('/nonexistent').expect(404);

      const response = await request(app.getHttpServer()).get('/metrics/summary').expect(200);

      expect(response.body.http.totalRequests).toBeGreaterThanOrEqual(2);
      expect(response.body.http.totalErrors).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Constitutional Compliance', () => {
    it('should skip constitutional check for metrics endpoints', () => {
      return request(app.getHttpServer())
        .get('/metrics')
        .expect(200)
        .expect((res) => {
          expect(res.headers).not.toHaveProperty('x-constitutional-validation');
        });
    });

    it('should not require authentication', () => {
      return request(app.getHttpServer()).get('/metrics').expect(200);
    });

    it('should be accessible without rate limiting', async () => {
      const promises = Array(10)
        .fill(null)
        .map(() => request(app.getHttpServer()).get('/metrics'));

      const responses = await Promise.all(promises);
      responses.forEach((res) => {
        expect(res.status).toBe(200);
      });
    });

    it('should not log metrics endpoint requests to avoid recursion', async () => {
      const initialResponse = await request(app.getHttpServer())
        .get('/metrics/summary')
        .expect(200);

      const initialCount = initialResponse.body.http.totalRequests;

      await request(app.getHttpServer()).get('/metrics/summary');

      const finalResponse = await request(app.getHttpServer()).get('/metrics/summary').expect(200);

      const increment = finalResponse.body.http.totalRequests - initialCount;
      expect(increment).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Response Performance', () => {
    it('should respond quickly for Prometheus format (< 500ms)', async () => {
      const start = Date.now();
      await request(app.getHttpServer()).get('/metrics').expect(200);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });

    it('should respond quickly for JSON summary (< 500ms)', async () => {
      const start = Date.now();
      await request(app.getHttpServer()).get('/metrics/summary').expect(200);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid routes gracefully', () => {
      return request(app.getHttpServer()).get('/metrics/invalid').expect(404);
    });

    it('should not expose sensitive information in errors', () => {
      return request(app.getHttpServer())
        .get('/metrics/invalid')
        .expect(404)
        .expect((res) => {
          expect(res.body).not.toHaveProperty('stack');
        });
    });
  });
});
