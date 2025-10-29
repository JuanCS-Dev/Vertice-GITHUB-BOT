import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

/**
 * Prisma Service Unit Tests
 * Constitutional Compliance: ≥90% coverage required
 * DETER-AGENT Layer 4: Execution - Test execution reliability
 */
describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    await service.$disconnect();
  });

  describe('Constitutional Compliance Tests', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have a logger instance', () => {
      expect(service['logger']).toBeDefined();
    });
  });

  describe('Connection Management', () => {
    it('should connect to database on module init', async () => {
      const connectSpy = jest.spyOn(service, '$connect').mockResolvedValue(undefined);
      const queryRawSpy = jest.spyOn(service, '$queryRaw').mockResolvedValue([{ connected: 1 }]);

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalled();
      expect(queryRawSpy).toHaveBeenCalled();

      connectSpy.mockRestore();
      queryRawSpy.mockRestore();
    });

    it('should disconnect from database on module destroy', async () => {
      const disconnectSpy = jest.spyOn(service, '$disconnect').mockResolvedValue(undefined);

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalled();

      disconnectSpy.mockRestore();
    });

    it('should throw error if connection fails', async () => {
      const connectSpy = jest
        .spyOn(service, '$connect')
        .mockRejectedValue(new Error('Connection failed'));

      await expect(service.onModuleInit()).rejects.toThrow('Database connection failed');

      connectSpy.mockRestore();
    });
  });

  describe('Health Checks', () => {
    it('should return true when database is healthy', async () => {
      const queryRawSpy = jest.spyOn(service, '$queryRaw').mockResolvedValue([{ result: 1 }]);

      const result = await service.isHealthy();

      expect(result).toBe(true);
      expect(queryRawSpy).toHaveBeenCalled();

      queryRawSpy.mockRestore();
    });

    it('should return false when database is unhealthy', async () => {
      const queryRawSpy = jest
        .spyOn(service, '$queryRaw')
        .mockRejectedValue(new Error('Query failed'));

      const result = await service.isHealthy();

      expect(result).toBe(false);

      queryRawSpy.mockRestore();
    });

    it('should get connection stats when healthy', async () => {
      jest.spyOn(service, 'isHealthy').mockResolvedValue(true);

      const stats = await service.getConnectionStats();

      expect(stats).toEqual({
        isConnected: true,
        activeConnections: 1,
      });
    });

    it('should get connection stats when unhealthy', async () => {
      jest.spyOn(service, 'isHealthy').mockResolvedValue(false);

      const stats = await service.getConnectionStats();

      expect(stats).toEqual({
        isConnected: false,
        activeConnections: 0,
      });
    });
  });

  describe('Shutdown Hooks', () => {
    it('should enable shutdown hooks', async () => {
      const mockApp = {
        close: jest.fn().mockResolvedValue(undefined),
      };

      await service.enableShutdownHooks(mockApp);

      expect((service as any)['_emitter']).toBeDefined();
    });
  });

  describe('Zero Trust Principles', () => {
    it('should handle unexpected errors gracefully', async () => {
      const disconnectSpy = jest
        .spyOn(service, '$disconnect')
        .mockRejectedValue(new Error('Disconnect error'));

      await expect(service.onModuleDestroy()).rejects.toThrow('Disconnect error');

      disconnectSpy.mockRestore();
    });

    it('should validate connection before health check', async () => {
      const queryRawSpy = jest.spyOn(service, '$queryRaw').mockResolvedValue([]);

      await service.isHealthy();

      expect(queryRawSpy).toHaveBeenCalledWith(expect.any(Array));

      queryRawSpy.mockRestore();
    });
  });
});
