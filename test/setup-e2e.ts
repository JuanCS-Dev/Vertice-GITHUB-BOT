/**
 * Jest Setup for E2E Tests
 *
 * Purpose: End-to-end test environment configuration
 * Constitutional Requirement: P4 Rastreabilidade Total
 *
 * Sets up:
 * - Test database connection
 * - Application bootstrap for e2e tests
 * - Global cleanup hooks
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/vertice_e2e_test';
process.env.GITHUB_WEBHOOK_SECRET = 'test-webhook-secret-e2e-12345';
process.env.GEMINI_API_KEY = 'test-gemini-key-e2e';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key-e2e';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.PORT = '3001';
process.env.LOG_LEVEL = 'error';
process.env.OTEL_ENABLED = 'false';

// Increase timeout for e2e tests
jest.setTimeout(30000);

// Suppress console output during e2e tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global teardown
afterAll(async () => {
  // Allow time for cleanup
  await new Promise((resolve) => setTimeout(resolve, 500));
});
