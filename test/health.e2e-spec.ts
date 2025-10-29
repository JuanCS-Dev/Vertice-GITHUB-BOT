import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * Health Endpoints E2E Tests
 *
 * Purpose: Test health check endpoints end-to-end
 * Constitutional Requirement: P4 Rastreabilidade Total
 *
 * Endpoints tested:
 * - GET /health - Overall health status
 * - GET /health/live - Liveness probe
 * - GET /health/ready - Readiness probe
 */

describe('Health Controller (e2e)', () => {
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

  describe('GET /health', () => {
    it('should return overall health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('components');
        });
    });

    it('should include component health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.components).toHaveProperty('database');
          expect(res.body.components).toHaveProperty('constitutional');
          expect(res.body.components).toHaveProperty('memory');
        });
    });

    it('should include timestamp in ISO format', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          const timestamp = new Date(res.body.timestamp);
          expect(timestamp).toBeInstanceOf(Date);
          expect(timestamp.getTime()).not.toBeNaN();
        });
    });

    it('should include uptime as number', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(typeof res.body.uptime).toBe('number');
          expect(res.body.uptime).toBeGreaterThan(0);
        });
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness status', () => {
      return request(app.getHttpServer())
        .get('/health/live')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
        });
    });

    it('should always return ok for liveness', () => {
      return request(app.getHttpServer())
        .get('/health/live')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
        });
    });

    it('should respond quickly (< 1000ms)', async () => {
      const start = Date.now();
      await request(app.getHttpServer()).get('/health/live').expect(200);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status', () => {
      return request(app.getHttpServer())
        .get('/health/ready')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('ready');
          expect(res.body).toHaveProperty('checks');
        });
    });

    it('should include individual component checks', () => {
      return request(app.getHttpServer())
        .get('/health/ready')
        .expect(200)
        .expect((res) => {
          expect(res.body.checks).toHaveProperty('database');
          expect(res.body.checks).toHaveProperty('constitutional');
          expect(typeof res.body.checks.database).toBe('boolean');
          expect(typeof res.body.checks.constitutional).toBe('boolean');
        });
    });

    it('should be ready when all checks pass', () => {
      return request(app.getHttpServer())
        .get('/health/ready')
        .expect(200)
        .expect((res) => {
          if (res.body.checks.database && res.body.checks.constitutional) {
            expect(res.body.ready).toBe(true);
          }
        });
    });
  });

  describe('Constitutional Compliance', () => {
    it('should skip constitutional check for health endpoints', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.headers).not.toHaveProperty('x-constitutional-validation');
        });
    });

    it('should not require authentication', () => {
      return request(app.getHttpServer()).get('/health').expect(200);
    });

    it('should be accessible without rate limiting', async () => {
      // Make multiple rapid requests
      const promises = Array(10)
        .fill(null)
        .map(() => request(app.getHttpServer()).get('/health/live'));

      const responses = await Promise.all(promises);
      responses.forEach((res) => {
        expect(res.status).toBe(200);
      });
    });
  });

  describe('Response Format', () => {
    it('should return JSON content type', () => {
      return request(app.getHttpServer()).get('/health').expect('Content-Type', /json/);
    });

    it('should include proper HTTP status codes', () => {
      return request(app.getHttpServer()).get('/health').expect(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid routes gracefully', () => {
      return request(app.getHttpServer()).get('/health/invalid').expect(404);
    });

    it('should not expose sensitive information in errors', () => {
      return request(app.getHttpServer())
        .get('/health/invalid')
        .expect(404)
        .expect((res) => {
          expect(res.body).not.toHaveProperty('stack');
        });
    });
  });
});
