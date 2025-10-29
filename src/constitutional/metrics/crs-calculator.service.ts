import { Injectable, Logger } from '@nestjs/common';

/**
 * CRS (Constitutional Rule Satisfaction) Calculator Service
 *
 * Purpose: Calculate Constitutional Rule Satisfaction score
 * Constitutional Requirement: CRS ≥ 95% (Article II)
 *
 * Formula: CRS = (satisfied_rules / total_rules) × 100
 *
 * Validates: Zero Trust, Error Handling, Audit Logging, Type Safety,
 *            Constitutional Decorators, DETER-AGENT Layers
 */

export interface ConstitutionalRule {
  id: string;
  name: string;
  required: boolean;
  weight: number;
  satisfied: boolean;
}

export interface CRSCalculationResult {
  crs: number;
  totalRules: number;
  satisfiedRules: number;
  failedRules: number;
  rules: ConstitutionalRule[];
  passed: boolean;
  threshold: number;
}

@Injectable()
export class CRSCalculatorService {
  // private readonly logger = new Logger(CRSCalculatorService.name);
  private readonly THRESHOLD = 95.0;

  /**
   * Calculate CRS for given code and context
   */
  calculate(
    code: string,
    context?: {
      hasTests?: boolean;
      hasErrorHandling?: boolean;
      hasLogging?: boolean;
      hasValidation?: boolean;
      hasDeterAgent?: boolean;
    },
  ): CRSCalculationResult {
    const rules: ConstitutionalRule[] = [
      {
        id: 'ZERO_TRUST_VALIDATION',
        name: 'Zero Trust Input Validation',
        required: true,
        weight: 1.0,
        satisfied: this.checkZeroTrustValidation(code, context),
      },
      {
        id: 'ERROR_HANDLING',
        name: 'Comprehensive Error Handling',
        required: true,
        weight: 1.0,
        satisfied: this.checkErrorHandling(code, context),
      },
      {
        id: 'AUDIT_LOGGING',
        name: 'Audit Logging Present',
        required: true,
        weight: 1.0,
        satisfied: this.checkAuditLogging(code, context),
      },
      {
        id: 'TYPE_SAFETY',
        name: 'TypeScript Strict Mode',
        required: true,
        weight: 1.0,
        satisfied: this.checkTypeSafety(code),
      },
      {
        id: 'CONSTITUTIONAL_DECORATOR',
        name: 'Constitutional Validation Decorator',
        required: false,
        weight: 0.5,
        satisfied: this.checkConstitutionalDecorator(code),
      },
      {
        id: 'DETER_AGENT_LAYERS',
        name: 'DETER-AGENT Layer Implementation',
        required: false,
        weight: 0.5,
        satisfied: this.checkDeterAgentLayers(code, context),
      },
      {
        id: 'COMPLETE_TESTS',
        name: 'Comprehensive Test Coverage',
        required: true,
        weight: 1.0,
        satisfied: context?.hasTests ?? false,
      },
      {
        id: 'NO_PLACEHOLDERS',
        name: 'No Placeholders or TODOs',
        required: true,
        weight: 1.0,
        satisfied: this.checkNoPlaceholders(code),
      },
    ];

    const totalWeight = rules.reduce((sum, rule) => sum + rule.weight, 0);
    const satisfiedWeight = rules
      .filter((rule) => rule.satisfied)
      .reduce((sum, rule) => sum + rule.weight, 0);

    const crs = totalWeight > 0 ? (satisfiedWeight / totalWeight) * 100 : 0;

    const satisfiedRules = rules.filter((r) => r.satisfied).length;
    const failedRules = rules.length - satisfiedRules;
    const passed = crs >= this.THRESHOLD;

    return {
      crs: parseFloat(crs.toFixed(2)),
      totalRules: rules.length,
      satisfiedRules,
      failedRules,
      rules,
      passed,
      threshold: this.THRESHOLD,
    };
  }

  /**
   * Check Zero Trust validation patterns
   */
  private checkZeroTrustValidation(
    code: string,
    context?: { hasValidation?: boolean },
  ): boolean {
    if (context?.hasValidation) return true;

    const patterns = [
      /validate/i,
      /validator/i,
      /ValidationPipe/i,
      /Joi\.object/i,
      /z\.object/i,
      /@IsString|@IsNumber|@IsEmail/i,
    ];

    return patterns.some((pattern) => pattern.test(code));
  }

  /**
   * Check error handling patterns
   */
  private checkErrorHandling(
    code: string,
    context?: { hasErrorHandling?: boolean },
  ): boolean {
    if (context?.hasErrorHandling) return true;

    const patterns = [
      /try\s*\{/,
      /catch\s*\(/,
      /HttpException/i,
      /@Catch/i,
      /\.catch\(/,
      /throw\s+new\s+\w+Error/,
    ];

    return patterns.some((pattern) => pattern.test(code));
  }

  /**
   * Check audit logging patterns
   */
  private checkAuditLogging(
    code: string,
    context?: { hasLogging?: boolean },
  ): boolean {
    if (context?.hasLogging) return true;

    const patterns = [
      /logger\./i,
      /this\.logger/i,
      /winston/i,
      /@Logger/i,
      /\.log\(/i,
      /\.warn\(/i,
      /\.error\(/i,
    ];

    return patterns.some((pattern) => pattern.test(code));
  }

  /**
   * Check TypeScript strict mode
   */
  private checkTypeSafety(code: string): boolean {
    const hasTypeAnnotations = /:\s*(string|number|boolean|Promise<\w+>|void)/.test(code);
    const hasNoAny = !/:\s*any/.test(code);

    return hasTypeAnnotations && hasNoAny;
  }

  /**
   * Check constitutional decorator usage
   */
  private checkConstitutionalDecorator(code: string): boolean {
    const patterns = [
      /@Constitutional/i,
      /@ConstitutionalGuard/i,
      /UseGuards.*Constitutional/i,
    ];

    return patterns.some((pattern) => pattern.test(code));
  }

  /**
   * Check DETER-AGENT layer implementation
   */
  private checkDeterAgentLayers(
    code: string,
    context?: { hasDeterAgent?: boolean },
  ): boolean {
    if (context?.hasDeterAgent) return true;

    const patterns = [
      /Layer1|Layer2|Layer3|Layer4|Layer5/i,
      /DeterAgent/i,
      /Constitutional.*Layer/i,
      /Deliberation.*Layer/i,
      /State.*Layer/i,
      /Execution.*Layer/i,
      /Incentive.*Layer/i,
    ];

    return patterns.some((pattern) => pattern.test(code));
  }

  /**
   * Check for absence of placeholders
   */
  private checkNoPlaceholders(code: string): boolean {
    const placeholderPatterns = [
      /TODO|FIXME|HACK|XXX/i,
      /throw new Error\(['"]Not implemented['"]\)/i,
      /\/\/\s*@ts-ignore/i,
    ];

    return !placeholderPatterns.some((pattern) => pattern.test(code));
  }

  /**
   * Validate CRS meets constitutional requirements
   */
  validate(crs: number): { passed: boolean; message: string } {
    if (crs >= this.THRESHOLD) {
      return {
        passed: true,
        message: `CRS ${crs.toFixed(2)}% meets constitutional requirement (≥ ${this.THRESHOLD}%)`,
      };
    }

    return {
      passed: false,
      message: `CRS ${crs.toFixed(2)}% violates constitutional requirement (must be ≥ ${this.THRESHOLD}%)`,
    };
  }
}
