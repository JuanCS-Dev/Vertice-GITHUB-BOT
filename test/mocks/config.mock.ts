/**
 * ConfigService Mock for Testing
 *
 * Purpose: Mock NestJS ConfigService
 * Constitutional Requirement: P4 Rastreabilidade Total
 *
 * Provides consistent test configuration across all tests
 */

export const mockConfigService = {
  get: jest.fn((key: string, defaultValue?: unknown) => {
    const config: Record<string, unknown> = {
      NODE_ENV: 'test',
      PORT: 3000,
      DATABASE_URL: 'postgresql://test:test@localhost:5432/vertice_test',
      GITHUB_WEBHOOK_SECRET: 'test-webhook-secret-12345',
      GEMINI_API_KEY: 'test-gemini-key',
      ANTHROPIC_API_KEY: 'test-anthropic-key',
      REDIS_HOST: 'localhost',
      REDIS_PORT: '6379',
      LOG_LEVEL: 'error',
      OTEL_ENABLED: false,
      OTEL_SERVICE_NAME: 'vertice-github-bot-test',
      CORS_ORIGINS: '*',
    };

    return config[key] !== undefined ? config[key] : defaultValue;
  }),
  getOrThrow: jest.fn((key: string) => {
    const value = mockConfigService.get(key);
    if (value === undefined) {
      throw new Error(`Configuration key "${key}" not found`);
    }
    return value;
  }),
};

export const createMockConfigService = () => mockConfigService;
