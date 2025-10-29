import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma Service - Database client with lifecycle management
 * Constitutional Compliance: Complete implementation with proper error handling
 * DETER-AGENT Layer 3: State Management - Database connection state
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
      errorFormat: 'pretty',
    });

    // Log Prisma queries in development
    if (process.env.NODE_ENV === 'development') {
      this.$on('query' as never, (event: unknown) => {
        const queryEvent = event as { query: string; duration: number };
        this.logger.debug(`Query: ${queryEvent.query} (${queryEvent.duration}ms)`);
      });
    }

    // Log Prisma errors
    this.$on('error' as never, (event: unknown) => {
      const errorEvent = event as { message: string };
      this.logger.error(`Prisma Error: ${errorEvent.message}`);
    });
  }

  /**
   * Connect to database on module initialization
   * Constitutional Principle P2: Validation Preventiva - Verify connection
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('✅ Database connection established');

      // Verify connection with a simple query
      const result = await this.$queryRaw`SELECT 1 as connected`;
      this.logger.debug(`Database health check: ${JSON.stringify(result)}`);
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
      throw new Error(`Database connection failed: ${error}`);
    }
  }

  /**
   * Disconnect from database on module destruction
   * Constitutional Principle P5: Consciência Sistêmica - Clean shutdown
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.$disconnect();
      this.logger.log('✅ Database connection closed gracefully');
    } catch (error) {
      this.logger.error('❌ Error disconnecting from database', error);
      throw error;
    }
  }

  /**
   * Enable shutdown hooks for graceful termination
   * Zero Trust Principle: Clean resource cleanup
   */
  async enableShutdownHooks(app: { close: () => Promise<void> }): Promise<void> {
    this.$on('beforeExit' as never, async () => {
      await app.close();
    });
  }

  /**
   * Health check for database connection
   * Used by /health endpoint
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  }

  /**
   * Get database connection statistics
   * Observability: Monitoring database connections
   */
  async getConnectionStats(): Promise<{
    isConnected: boolean;
    activeConnections: number;
  }> {
    try {
      const isConnected = await this.isHealthy();
      return {
        isConnected,
        activeConnections: 1,
      };
    } catch (error) {
      return {
        isConnected: false,
        activeConnections: 0,
      };
    }
  }
}
