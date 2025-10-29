/**
 * Jest Configuration
 *
 * Purpose: Unit testing configuration with constitutional compliance
 * Constitutional Requirement: P4 Rastreabilidade Total
 *
 * Coverage thresholds enforce 90% minimum as per constitutional requirements
 */

module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/index.ts',
    '!**/*.interface.ts',
    '!**/*.dto.ts',
    '!**/main.ts',
    '!**/types/**',
    '!**/*.config.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testTimeout: 10000,
  verbose: true,
  collectCoverage: false,
  coverageReporters: ['text', 'lcov', 'html'],
};
