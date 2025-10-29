import { Injectable, Logger } from '@nestjs/common';

/**
 * LEI (Lazy Execution Index) Calculator Service
 *
 * Purpose: Calculate Lazy Execution Index for code quality
 * Constitutional Requirement: LEI < 1.0 (Article II: Padrão Pagani)
 *
 * Formula: LEI = (total_lazy_patterns / total_lines_of_code) × 1000
 *
 * Detects: TODOs, FIXMEs, placeholders, stubs, mock data
 */

export interface LazyPattern {
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  line: number;
  code: string;
}

export interface LEICalculationResult {
  lei: number;
  totalLines: number;
  totalPatterns: number;
  patterns: LazyPattern[];
  passed: boolean;
  threshold: number;
}

@Injectable()
export class LEICalculatorService {
  // private readonly logger = new Logger(LEICalculatorService.name);
  private readonly THRESHOLD = 1.0;

  /**
   * Calculate LEI for given code
   */
  calculate(code: string): LEICalculationResult {
    const lines = code.split('\n');
    const totalLines = lines.length;
    const patterns = this.detectLazyPatterns(lines);
    const totalPatterns = patterns.length;

    const lei = totalLines > 0 ? (totalPatterns / totalLines) * 1000 : 0;

    const passed = lei < this.THRESHOLD;

    return {
      lei: parseFloat(lei.toFixed(2)),
      totalLines,
      totalPatterns,
      patterns,
      passed,
      threshold: this.THRESHOLD,
    };
  }

  /**
   * Detect lazy execution patterns in code
   */
  private detectLazyPatterns(lines: string[]): LazyPattern[] {
    const patterns: LazyPattern[] = [];

    const lazyRegexes = [
      {
        regex: /\/\/\s*(TODO|FIXME|HACK|XXX|FIX|IMPLEMENT)/i,
        type: 'TODO_COMMENT',
        severity: 'CRITICAL' as const,
      },
      {
        regex: /\/\*\s*(TODO|FIXME|HACK|XXX|FIX|IMPLEMENT)/i,
        type: 'TODO_BLOCK',
        severity: 'CRITICAL' as const,
      },
      {
        regex: /#\s*(TODO|FIXME|HACK|XXX|FIX|IMPLEMENT)/i,
        type: 'TODO_HASH',
        severity: 'CRITICAL' as const,
      },
      {
        regex: /throw new Error\(['"]Not implemented['"]\)/i,
        type: 'NOT_IMPLEMENTED',
        severity: 'HIGH' as const,
      },
      {
        regex: /throw new Error\(['"]TODO['"]\)/i,
        type: 'TODO_ERROR',
        severity: 'HIGH' as const,
      },
      {
        regex: /\/\/\s*@ts-ignore/i,
        type: 'TS_IGNORE',
        severity: 'HIGH' as const,
      },
      {
        regex: /\/\/\s*eslint-disable/i,
        type: 'ESLINT_DISABLE',
        severity: 'MEDIUM' as const,
      },
      {
        regex: /mock_data|placeholder|stub/i,
        type: 'MOCK_PLACEHOLDER',
        severity: 'HIGH' as const,
      },
    ];

    lines.forEach((line, index) => {
      for (const { regex, type, severity } of lazyRegexes) {
        if (regex.test(line)) {
          patterns.push({
            type,
            severity,
            line: index + 1,
            code: line.trim(),
          });
        }
      }
    });

    return patterns;
  }

  /**
   * Validate LEI meets constitutional requirements
   */
  validate(lei: number): { passed: boolean; message: string } {
    if (lei < this.THRESHOLD) {
      return {
        passed: true,
        message: `LEI ${lei.toFixed(2)} meets constitutional requirement (< ${this.THRESHOLD})`,
      };
    }

    return {
      passed: false,
      message: `LEI ${lei.toFixed(2)} violates constitutional requirement (must be < ${this.THRESHOLD})`,
    };
  }
}
