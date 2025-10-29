import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';

/**
 * OpenTelemetry Service
 *
 * Purpose: Distributed tracing and observability
 * Constitutional Requirement: P4 Rastreabilidade Total
 *
 * Features:
 * - Automatic instrumentation of HTTP, gRPC, database calls
 * - OTLP export to observability backends
 * - Custom spans for constitutional operations
 * - Performance monitoring
 */

@Injectable()
export class TelemetryService implements OnModuleInit {
  private readonly logger = new Logger(TelemetryService.name);
  private sdk: NodeSDK | null = null;

  constructor(private readonly configService: ConfigService) {
    // Constructor for dependency injection
  }

  async onModuleInit(): Promise<void> {
    const enabled = this.configService.get<boolean>('OTEL_ENABLED', false);

    if (!enabled) {
      this.logger.log('OpenTelemetry is disabled');
      return;
    }

    try {
      await this.initializeTelemetry();
      this.logger.log('✅ OpenTelemetry initialized successfully');
    } catch (error) {
      this.logger.error(
        `Failed to initialize OpenTelemetry: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async initializeTelemetry(): Promise<void> {
    const serviceName = this.configService.get<string>(
      'OTEL_SERVICE_NAME',
      'vertice-github-bot',
    );

    const otlpEndpoint = this.configService.get<string>(
      'OTEL_EXPORTER_OTLP_ENDPOINT',
    );

    const resource = new Resource({
      [SEMRESATTRS_SERVICE_NAME]: serviceName,
      [SEMRESATTRS_SERVICE_VERSION]:
        process.env.npm_package_version || '0.1.0',
      [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]:
        this.configService.get<string>('NODE_ENV', 'development'),
      'constitutional.compliance': true,
    });

    const traceExporter = otlpEndpoint
      ? new OTLPTraceExporter({
          url: `${otlpEndpoint}/v1/traces`,
        })
      : undefined;

    this.sdk = new NodeSDK({
      resource,
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
        }),
      ],
    });

    await this.sdk.start();
  }

  async shutdown(): Promise<void> {
    if (this.sdk) {
      try {
        await this.sdk.shutdown();
        this.logger.log('OpenTelemetry SDK shut down successfully');
      } catch (error) {
        this.logger.error(
          `Error shutting down OpenTelemetry: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  }
}
