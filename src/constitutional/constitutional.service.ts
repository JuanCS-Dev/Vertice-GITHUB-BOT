import { Injectable, Logger } from '@nestjs/common';
import { ZeroTrustValidator, ValidationResult } from './validators/zero-trust.validator';
import { SignatureValidator, SignatureValidationResult } from './validators/signature.validator';
import { RateLimitValidator, RateLimitResult, RateLimitInfo } from './validators/rate-limit.validator';
import { LEICalculatorService, LEICalculationResult } from './metrics/lei-calculator.service';
import { CRSCalculatorService, CRSCalculationResult } from './metrics/crs-calculator.service';
import { FPCCalculatorService, FPCCalculationResult, FeatureDefinition } from './metrics/fpc-calculator.service';
import { DeterAgentOrchestrator, DeterAgentInput, DeterAgentResult } from './deter-agent/deter-agent.orchestrator';

/**
 * Constitutional Service
 *
 * Purpose: Central service for all constitutional compliance operations
 * Constitutional Requirement: Enforce all principles (P1-P6) and Article III
 *
 * Integrates: Validators, Metrics, DETER-AGENT Framework
 * Provides: Complete constitutional compliance validation and reporting
 */

export interface ConstitutionalValidation {
  valid: boolean;
  violations: string[];
  metrics: {
    lei: LEICalculationResult;
    crs: CRSCalculationResult;
    fpc: FPCCalculationResult;
  };
  validation: {
    zeroTrust: ValidationResult[];
    signature?: SignatureValidationResult;
    rateLimit?: RateLimitResult;
  };
  timestamp: Date;
  constitutionalCompliance: boolean;
}

export interface WebhookValidationRequest {
  headers: Record<string, string | undefined>;
  body: string | Buffer;
  secret: string;
  repository: string;
  senderId?: string;
  deliveryId?: string;
}

export interface CodeValidationRequest {
  code: string;
  features?: FeatureDefinition[];
  context?: {
    hasTests?: boolean;
    hasErrorHandling?: boolean;
    hasLogging?: boolean;
    hasValidation?: boolean;
    hasDeterAgent?: boolean;
  };
}

@Injectable()
export class ConstitutionalService {
  private readonly logger = new Logger(ConstitutionalService.name);

  constructor(
    private readonly zeroTrustValidator: ZeroTrustValidator,
    private readonly signatureValidator: SignatureValidator,
    private readonly rateLimitValidator: RateLimitValidator,
    private readonly leiCalculator: LEICalculatorService,
    private readonly crsCalculator: CRSCalculatorService,
    private readonly fpcCalculator: FPCCalculatorService,
    private readonly deterAgent: DeterAgentOrchestrator,
  ) {
    // NestJS dependency injection
  }

  /**
   * Validate webhook request with full constitutional compliance
   * Article III: Zero Trust - validate everything
   */
  async validateWebhook(
    request: WebhookValidationRequest,
  ): Promise<ConstitutionalValidation> {
    const startTime = Date.now();
    const violations: string[] = [];
    const zeroTrustValidations: ValidationResult[] = [];

    this.logger.log(
      `Validating webhook: ${request.deliveryId || 'unknown'} for ${request.repository}`,
    );

    const repoValidation = this.zeroTrustValidator.validateRepositoryName(
      request.repository,
    );
    zeroTrustValidations.push(repoValidation);

    if (!repoValidation.valid) {
      violations.push(...repoValidation.errors);
    }

    const signatureValidation = await this.signatureValidator.validateWebhookRequest({
      headers: request.headers,
      body: request.body,
      secret: request.secret,
    });

    if (!signatureValidation.valid) {
      violations.push(...signatureValidation.errors);
    }

    const rateLimitCheck = await this.rateLimitValidator.checkAllLimits({
      senderId: request.senderId,
      repository: request.repository,
      deliveryId: request.deliveryId,
    });

    if (!rateLimitCheck.allowed) {
      violations.push(...rateLimitCheck.violations);
    }

    const bodyString = Buffer.isBuffer(request.body)
      ? request.body.toString('utf-8')
      : request.body;

    const leiResult = this.leiCalculator.calculate(bodyString);
    const crsResult = this.crsCalculator.calculate(bodyString);
    const fpcResult = this.fpcCalculator.buildEmptyResult();

    const constitutionalCompliance =
      violations.length === 0 &&
      leiResult.passed &&
      crsResult.passed;

    const executionTime = Date.now() - startTime;

    this.logger.log(
      `Webhook validation complete: ${constitutionalCompliance ? 'VALID' : 'INVALID'} in ${executionTime}ms (CRS: ${crsResult.crs.toFixed(2)}%, LEI: ${leiResult.lei})`,
    );

    return {
      valid: violations.length === 0,
      violations,
      metrics: {
        lei: leiResult,
        crs: crsResult,
        fpc: fpcResult,
      },
      validation: {
        zeroTrust: zeroTrustValidations,
        signature: signatureValidation.valid
          ? { valid: true, timestamp: new Date() }
          : { valid: false, reason: signatureValidation.errors.join(', ') },
        rateLimit: rateLimitCheck.limits.global,
      },
      timestamp: new Date(),
      constitutionalCompliance,
    };
  }

  /**
   * Validate code with constitutional metrics
   * P1: Completude Obrigatória - code must be complete
   */
  async validateCode(
    request: CodeValidationRequest,
  ): Promise<ConstitutionalValidation> {
    const startTime = Date.now();
    const violations: string[] = [];

    this.logger.log('Validating code for constitutional compliance');

    const leiResult = this.leiCalculator.calculate(request.code);
    if (!leiResult.passed) {
      violations.push(
        `LEI ${leiResult.lei} violates constitutional requirement (must be < ${leiResult.threshold})`,
      );
    }

    const crsResult = this.crsCalculator.calculate(request.code, request.context);
    if (!crsResult.passed) {
      violations.push(
        `CRS ${crsResult.crs.toFixed(2)}% violates constitutional requirement (must be ≥ ${crsResult.threshold}%)`,
      );
    }

    const fpcResult = request.features
      ? this.fpcCalculator.calculate(request.features)
      : this.fpcCalculator.analyzeConstitutionalFeatures(request.code);

    if (!fpcResult.passed) {
      violations.push(
        `FPC ${fpcResult.fpc.toFixed(2)}% violates constitutional requirement (must be ≥ ${fpcResult.threshold}%)`,
      );
    }

    const constitutionalCompliance =
      leiResult.passed && crsResult.passed && fpcResult.passed;

    const executionTime = Date.now() - startTime;

    this.logger.log(
      `Code validation complete: ${constitutionalCompliance ? 'COMPLIANT' : 'NON-COMPLIANT'} in ${executionTime}ms (LEI: ${leiResult.lei}, CRS: ${crsResult.crs.toFixed(2)}%, FPC: ${fpcResult.fpc.toFixed(2)}%)`,
    );

    return {
      valid: violations.length === 0,
      violations,
      metrics: {
        lei: leiResult,
        crs: crsResult,
        fpc: fpcResult,
      },
      validation: {
        zeroTrust: [],
      },
      timestamp: new Date(),
      constitutionalCompliance,
    };
  }

  /**
   * Execute DETER-AGENT workflow
   * All 5 layers with constitutional compliance
   */
  async executeDeterAgent(input: DeterAgentInput): Promise<DeterAgentResult> {
    this.logger.log(
      `Executing DETER-AGENT workflow: ${input.eventType} on ${input.repository.fullName}`,
    );

    const result = await this.deterAgent.execute(input);

    this.logger.log(
      `DETER-AGENT workflow ${result.success ? 'completed successfully' : 'failed'}: CRS ${result.layers.constitutional.crs.toFixed(2)}%, Quality ${result.qualityMetrics.grade}`,
    );

    return result;
  }

  /**
   * Health check for all constitutional components
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    components: Record<string, boolean>;
    timestamp: Date;
  }> {
    const components: Record<string, boolean> = {
      zeroTrustValidator: true,
      signatureValidator: true,
      rateLimitValidator: true,
      leiCalculator: true,
      crsCalculator: true,
      fpcCalculator: true,
    };

    const deterAgentHealth = await this.deterAgent.healthCheck();
    components.deterAgent = deterAgentHealth.healthy;

    const healthy = Object.values(components).every((c) => c);

    this.logger.debug(
      `Constitutional health check: ${healthy ? 'HEALTHY' : 'UNHEALTHY'}`,
    );

    return {
      healthy,
      components,
      timestamp: new Date(),
    };
  }

  /**
   * Generate constitutional compliance report
   */
  generateComplianceReport(validation: ConstitutionalValidation): string {
    const lines: string[] = [];

    lines.push('=== Constitutional Compliance Report ===');
    lines.push('');
    lines.push(`Timestamp: ${validation.timestamp.toISOString()}`);
    lines.push(`Overall Status: ${validation.constitutionalCompliance ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`);
    lines.push('');

    lines.push('Metrics:');
    lines.push(`  LEI: ${validation.metrics.lei.lei} ${validation.metrics.lei.passed ? '✅' : '❌'} (threshold: < ${validation.metrics.lei.threshold})`);
    lines.push(`  CRS: ${validation.metrics.crs.crs.toFixed(2)}% ${validation.metrics.crs.passed ? '✅' : '❌'} (threshold: ≥ ${validation.metrics.crs.threshold}%)`);
    lines.push(`  FPC: ${validation.metrics.fpc.fpc.toFixed(2)}% ${validation.metrics.fpc.passed ? '✅' : '❌'} (threshold: ≥ ${validation.metrics.fpc.threshold}%)`);
    lines.push('');

    if (validation.violations.length > 0) {
      lines.push('Violations:');
      for (const violation of validation.violations) {
        lines.push(`  - ${violation}`);
      }
      lines.push('');
    }

    if (validation.metrics.lei.patterns.length > 0) {
      lines.push(`LEI Violations (${validation.metrics.lei.patterns.length}):`);
      for (const pattern of validation.metrics.lei.patterns.slice(0, 10)) {
        lines.push(`  Line ${pattern.line} [${pattern.severity}]: ${pattern.type}`);
      }
      if (validation.metrics.lei.patterns.length > 10) {
        lines.push(`  ... and ${validation.metrics.lei.patterns.length - 10} more`);
      }
      lines.push('');
    }

    if (validation.metrics.crs.failedRules > 0) {
      lines.push(`CRS Failed Rules (${validation.metrics.crs.failedRules}):`);
      const failedRules = validation.metrics.crs.rules.filter((r) => !r.satisfied);
      for (const rule of failedRules) {
        lines.push(`  - ${rule.name} ${rule.required ? '[REQUIRED]' : '[OPTIONAL]'}`);
      }
      lines.push('');
    }

    if (validation.metrics.fpc.missingFeatures > 0) {
      lines.push(`FPC Missing Features (${validation.metrics.fpc.missingFeatures}):`);
      const missingFeatures = validation.metrics.fpc.features.filter(
        (f) => !f.implemented || f.completeness < 100,
      );
      for (const feature of missingFeatures.slice(0, 10)) {
        const status = feature.implemented
          ? `${feature.completeness}% complete`
          : 'Not implemented';
        lines.push(`  - ${feature.name}: ${status}`);
      }
      if (missingFeatures.length > 10) {
        lines.push(`  ... and ${missingFeatures.length - 10} more`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Validate constitutional principles (P1-P6)
   */
  validatePrinciples(code: string): {
    satisfied: string[];
    violated: string[];
    score: number;
  } {
    const satisfied: string[] = [];
    const violated: string[] = [];

    const leiResult = this.leiCalculator.calculate(code);
    if (leiResult.passed) {
      satisfied.push('P1: Completude Obrigatória');
    } else {
      violated.push('P1: Completude Obrigatória');
    }

    const hasValidation = /validate|validator|ValidationPipe/i.test(code);
    if (hasValidation) {
      satisfied.push('P2: Validação Preventiva');
    } else {
      violated.push('P2: Validação Preventiva');
    }

    const hasVerification = /verify|check|assert/i.test(code);
    if (hasVerification) {
      satisfied.push('P3: Ceticismo Crítico');
    } else {
      violated.push('P3: Ceticismo Crítico');
    }

    const hasLogging = /logger|log\(|audit/i.test(code);
    if (hasLogging) {
      satisfied.push('P4: Rastreabilidade Total');
    } else {
      violated.push('P4: Rastreabilidade Total');
    }

    const hasErrorHandling = /try\s*{|catch\s*\(|throw\s+new/i.test(code);
    if (hasErrorHandling) {
      satisfied.push('P5: Recuperação Automática');
    } else {
      violated.push('P5: Recuperação Automática');
    }

    const hasMaxIterations = /MAX_ATTEMPTS|maxAttempts|iteration/i.test(code);
    if (hasMaxIterations) {
      satisfied.push('P6: Eficiência de Token');
    } else {
      violated.push('P6: Eficiência de Token');
    }

    const score = (satisfied.length / 6) * 100;

    return {
      satisfied,
      violated,
      score: parseFloat(score.toFixed(2)),
    };
  }

  /**
   * Get rate limit status for monitoring
   */
  getRateLimitStatus(identifier: string): {
    global: RateLimitInfo | null;
    statistics: ReturnType<RateLimitValidator['getStatistics']>;
  } {
    return {
      global: this.rateLimitValidator.getRateLimitStatus(identifier),
      statistics: this.rateLimitValidator.getStatistics(),
    };
  }

  /**
   * Reset rate limit for identifier
   */
  resetRateLimit(identifier: string): void {
    this.rateLimitValidator.resetRateLimit(identifier);
    this.logger.log(`Rate limit reset for ${identifier}`);
  }

  /**
   * Cleanup expired rate limits
   */
  cleanupRateLimits(): number {
    return this.rateLimitValidator.cleanupExpiredLimits();
  }
}
