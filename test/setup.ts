/**
 * Jest Setup for Unit Tests
 *
 * Purpose: Global test configuration and utilities
 * Constitutional Requirement: P4 Rastreabilidade Total
 *
 * Sets up:
 * - Environment variables for testing
 * - Global test utilities
 * - Mock configurations
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/vertice_test';
process.env.GITHUB_WEBHOOK_SECRET = 'test-webhook-secret-12345';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.PORT = '3000';
process.env.LOG_LEVEL = 'error';
process.env.OTEL_ENABLED = 'false';

// Increase test timeout for integration tests
jest.setTimeout(10000);

// Suppress console output during tests unless explicitly needed
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Reset mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
