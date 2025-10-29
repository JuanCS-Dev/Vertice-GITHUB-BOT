import { plainToInstance } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  /* IsUrl, */
  Min,
  Max,
  validateSync,
  ValidationError,
} from 'class-validator';

/**
 * Environment Configuration Validation
 *
 * Purpose: Validate environment variables with Zero Trust principle
 * Constitutional Requirement: P2 Validação Preventiva
 * Article III: Zero Trust - validate all configuration
 *
 * Ensures: All required environment variables are present and valid
 * Fails fast: Application won't start with invalid configuration
 */

export enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  DATABASE_URL!: string;

  @IsString()
  @IsOptional()
  REDIS_URL?: string;

  @IsString()
  GITHUB_WEBHOOK_SECRET!: string;

  @IsString()
  @IsOptional()
  GITHUB_TOKEN?: string;

  @IsString()
  @IsOptional()
  GITHUB_APP_ID?: string;

  @IsString()
  @IsOptional()
  GITHUB_APP_PRIVATE_KEY?: string;

  @IsString()
  GEMINI_API_KEY!: string;

  @IsString()
  @IsOptional()
  ANTHROPIC_API_KEY?: string;

  @IsString()
  @IsOptional()
  OPENAI_API_KEY?: string;

  @IsString()
  @IsOptional()
  LOG_LEVEL?: string = 'info';

  @IsString()
  @IsOptional()
  CORS_ORIGINS?: string = '*';

  @IsNumber()
  @IsOptional()
  RATE_LIMIT_TTL?: number = 60000;

  @IsNumber()
  @IsOptional()
  RATE_LIMIT_MAX?: number = 100;

  @IsString()
  @IsOptional()
  OTEL_EXPORTER_OTLP_ENDPOINT?: string;

  @IsString()
  @IsOptional()
  OTEL_SERVICE_NAME?: string = 'vertice-github-bot';
}

/**
 * Validate environment variables
 * Returns validated config or throws error
 */
export function validateEnvironment(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error: ValidationError) => {
        const constraints = error.constraints
          ? Object.values(error.constraints)
          : [];
        return `${error.property}: ${constraints.join(', ')}`;
      })
      .join('\n  ');

    throw new Error(
      `❌ Environment validation failed:\n  ${errorMessages}\n\nPlease check your .env file and ensure all required variables are set.`,
    );
  }

  return validatedConfig;
}

/**
 * Get typed configuration
 * Use this helper in services to get type-safe config access
 */
export function getTypedConfig(): EnvironmentVariables {
  return validateEnvironment(process.env);
}
