/**
 * Prisma Mock for Testing
 *
 * Purpose: Mock Prisma Client for unit tests
 * Constitutional Requirement: P4 Rastreabilidade Total
 *
 * Provides:
 * - Mock database operations
 * - Type-safe mocks matching Prisma Client API
 * - Test data factories
 */

export const mockPrismaService = {
  webhookDelivery: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  repository: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    upsert: jest.fn(),
  },
  botConfiguration: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  },
  issueAnalysis: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  pRAnalysis: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  constitutionalComplianceLog: {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  },
  jobQueue: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
};

export const createMockPrismaService = () => mockPrismaService;
