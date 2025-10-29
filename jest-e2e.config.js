/**
 * Jest E2E Configuration
 *
 * Purpose: End-to-end testing configuration
 * Constitutional Requirement: P4 Rastreabilidade Total
 *
 * E2E tests validate complete request-response cycles with constitutional compliance
 */

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.e2e-spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000,
  verbose: true,
  collectCoverage: false,
  maxWorkers: 1,
};
