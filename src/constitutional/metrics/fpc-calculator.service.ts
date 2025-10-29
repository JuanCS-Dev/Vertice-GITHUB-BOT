import { Injectable, Logger } from '@nestjs/common';

/**
 * FPC (Feature Parity Completeness) Calculator Service
 *
 * Purpose: Calculate Feature Parity Completeness score
 * Constitutional Requirement: FPC ≥ 80% (Padrão Pagani)
 *
 * Formula: FPC = (implemented_features / planned_features) × 100
 *
 * Validates: All planned features are fully implemented
 * Detects: Partial implementations, missing features, stub handlers
 */

export interface FeatureDefinition {
  id: string;
  name: string;
  category: string;
  required: boolean;
  implemented: boolean;
  completeness: number;
  testCoverage?: number;
}

export interface FPCCalculationResult {
  fpc: number;
  totalFeatures: number;
  implementedFeatures: number;
  partialFeatures: number;
  missingFeatures: number;
  features: FeatureDefinition[];
  passed: boolean;
  threshold: number;
  categoryBreakdown: Record<string, number>;
}

@Injectable()
export class FPCCalculatorService {
  // private readonly logger = new Logger(FPCCalculatorService.name);
  private readonly THRESHOLD = 80.0;

  /**
   * Calculate FPC for given features
   */
  calculate(features: FeatureDefinition[]): FPCCalculationResult {
    if (features.length === 0) {
      return this.buildEmptyResult();
    }

    const implementedFeatures = features.filter(
      (f) => f.implemented && f.completeness === 100,
    ).length;

    const partialFeatures = features.filter(
      (f) => f.implemented && f.completeness > 0 && f.completeness < 100,
    ).length;

    const missingFeatures = features.filter(
      (f) => !f.implemented || f.completeness === 0,
    ).length;

    const totalCompleteness = features.reduce(
      (sum, f) => sum + f.completeness,
      0,
    );

    const fpc = (totalCompleteness / (features.length * 100)) * 100;

    const categoryBreakdown = this.calculateCategoryBreakdown(features);

    const passed = fpc >= this.THRESHOLD;

    return {
      fpc: parseFloat(fpc.toFixed(2)),
      totalFeatures: features.length,
      implementedFeatures,
      partialFeatures,
      missingFeatures,
      features,
      passed,
      threshold: this.THRESHOLD,
      categoryBreakdown,
    };
  }

  /**
   * Calculate FPC from code analysis
   */
  calculateFromCode(
    code: string,
    featureMap: Map<string, { pattern: RegExp; category: string }>,
  ): FPCCalculationResult {
    const features: FeatureDefinition[] = [];

    for (const [featureId, config] of featureMap.entries()) {
      const implemented = config.pattern.test(code);
      const completeness = implemented ? 100 : 0;

      features.push({
        id: featureId,
        name: this.humanizeFeatureId(featureId),
        category: config.category,
        required: true,
        implemented,
        completeness,
      });
    }

    return this.calculate(features);
  }

  /**
   * Analyze webhook handler implementation
   */
  analyzeWebhookHandler(code: string): FPCCalculationResult {
    const webhookFeatures = new Map<string, { pattern: RegExp; category: string }>([
      ['issues', { pattern: /handleIssues|issues.*handler/i, category: 'webhooks' }],
      ['issue_comment', { pattern: /handleIssueComment|issueComment.*handler/i, category: 'webhooks' }],
      ['pull_request', { pattern: /handlePullRequest|pullRequest.*handler/i, category: 'webhooks' }],
      ['pull_request_review', { pattern: /handlePullRequestReview|pullRequestReview.*handler/i, category: 'webhooks' }],
      ['push', { pattern: /handlePush|push.*handler/i, category: 'webhooks' }],
      ['release', { pattern: /handleRelease|release.*handler/i, category: 'webhooks' }],
    ]);

    return this.calculateFromCode(code, webhookFeatures);
  }

  /**
   * Analyze AI analysis features
   */
  analyzeAIFeatures(code: string): FPCCalculationResult {
    const aiFeatures = new Map<string, { pattern: RegExp; category: string }>([
      ['issue_classification', { pattern: /classifyIssue|issue.*classification/i, category: 'ai_analysis' }],
      ['sentiment_analysis', { pattern: /analyzeSentiment|sentiment.*analysis/i, category: 'ai_analysis' }],
      ['priority_calculation', { pattern: /calculatePriority|priority.*calculation/i, category: 'ai_analysis' }],
      ['label_suggestion', { pattern: /suggestLabels|label.*suggestion/i, category: 'ai_analysis' }],
      ['code_review', { pattern: /reviewCode|code.*review/i, category: 'ai_analysis' }],
      ['security_check', { pattern: /checkSecurity|security.*check/i, category: 'ai_analysis' }],
    ]);

    return this.calculateFromCode(code, aiFeatures);
  }

  /**
   * Analyze constitutional compliance features
   */
  analyzeConstitutionalFeatures(code: string): FPCCalculationResult {
    const constitutionalFeatures = new Map<string, { pattern: RegExp; category: string }>([
      ['zero_trust_validation', { pattern: /ZeroTrust|zero.*trust/i, category: 'constitutional' }],
      ['signature_verification', { pattern: /SignatureValidator|signature.*verification/i, category: 'constitutional' }],
      ['rate_limiting', { pattern: /RateLimit|rate.*limit/i, category: 'constitutional' }],
      ['audit_logging', { pattern: /AuditLog|audit.*log/i, category: 'constitutional' }],
      ['lei_calculation', { pattern: /LEICalculator|lei.*calculator/i, category: 'constitutional' }],
      ['crs_calculation', { pattern: /CRSCalculator|crs.*calculator/i, category: 'constitutional' }],
      ['deter_agent', { pattern: /DeterAgent|deter.*agent/i, category: 'constitutional' }],
    ]);

    return this.calculateFromCode(code, constitutionalFeatures);
  }

  /**
   * Calculate category breakdown
   */
  private calculateCategoryBreakdown(
    features: FeatureDefinition[],
  ): Record<string, number> {
    const breakdown: Record<string, { total: number; completeness: number }> = {};

    for (const feature of features) {
      if (!breakdown[feature.category]) {
        breakdown[feature.category] = { total: 0, completeness: 0 };
      }

      breakdown[feature.category].total++;
      breakdown[feature.category].completeness += feature.completeness;
    }

    const result: Record<string, number> = {};

    for (const [category, data] of Object.entries(breakdown)) {
      result[category] = parseFloat(
        ((data.completeness / (data.total * 100)) * 100).toFixed(2),
      );
    }

    return result;
  }

  /**
   * Build empty result for zero features
   */
  public buildEmptyResult(): FPCCalculationResult {
    return {
      fpc: 0,
      totalFeatures: 0,
      implementedFeatures: 0,
      partialFeatures: 0,
      missingFeatures: 0,
      features: [],
      passed: false,
      threshold: this.THRESHOLD,
      categoryBreakdown: {},
    };
  }

  /**
   * Humanize feature ID into readable name
   */
  private humanizeFeatureId(featureId: string): string {
    return featureId
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Validate FPC meets constitutional requirements
   */
  validate(fpc: number): { passed: boolean; message: string } {
    if (fpc >= this.THRESHOLD) {
      return {
        passed: true,
        message: `FPC ${fpc.toFixed(2)}% meets constitutional requirement (≥ ${this.THRESHOLD}%)`,
      };
    }

    return {
      passed: false,
      message: `FPC ${fpc.toFixed(2)}% violates constitutional requirement (must be ≥ ${this.THRESHOLD}%)`,
    };
  }

  /**
   * Calculate weighted FPC with test coverage
   */
  calculateWeightedFPC(features: FeatureDefinition[]): {
    fpc: number;
    weightedFpc: number;
    testCoverageWeight: number;
  } {
    const basicResult = this.calculate(features);

    const featuresWithTests = features.filter((f) => f.testCoverage !== undefined);

    if (featuresWithTests.length === 0) {
      return {
        fpc: basicResult.fpc,
        weightedFpc: basicResult.fpc,
        testCoverageWeight: 0,
      };
    }

    const avgTestCoverage =
      featuresWithTests.reduce((sum, f) => sum + (f.testCoverage || 0), 0) /
      featuresWithTests.length;

    const testCoverageWeight = avgTestCoverage / 100;

    const weightedFpc = basicResult.fpc * 0.7 + avgTestCoverage * 0.3;

    return {
      fpc: basicResult.fpc,
      weightedFpc: parseFloat(weightedFpc.toFixed(2)),
      testCoverageWeight: parseFloat(testCoverageWeight.toFixed(2)),
    };
  }

  /**
   * Generate FPC report
   */
  generateReport(result: FPCCalculationResult): string {
    const lines: string[] = [];

    lines.push('=== Feature Parity Completeness Report ===');
    lines.push('');
    lines.push(`FPC Score: ${result.fpc.toFixed(2)}% ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    lines.push(`Threshold: ${result.threshold}%`);
    lines.push('');
    lines.push(`Total Features: ${result.totalFeatures}`);
    lines.push(`  Implemented: ${result.implementedFeatures}`);
    lines.push(`  Partial: ${result.partialFeatures}`);
    lines.push(`  Missing: ${result.missingFeatures}`);
    lines.push('');

    if (Object.keys(result.categoryBreakdown).length > 0) {
      lines.push('Category Breakdown:');
      for (const [category, score] of Object.entries(result.categoryBreakdown)) {
        lines.push(`  ${category}: ${score.toFixed(2)}%`);
      }
      lines.push('');
    }

    const incompleteFeatures = result.features.filter(
      (f) => !f.implemented || f.completeness < 100,
    );

    if (incompleteFeatures.length > 0) {
      lines.push('Incomplete Features:');
      for (const feature of incompleteFeatures) {
        const status = feature.implemented
          ? `${feature.completeness}% complete`
          : 'Not implemented';
        lines.push(`  - ${feature.name} [${feature.category}]: ${status}`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Compare FPC between two feature sets
   */
  compareFPC(
    before: FeatureDefinition[],
    after: FeatureDefinition[],
  ): {
    beforeFpc: number;
    afterFpc: number;
    improvement: number;
    newFeatures: number;
    improvedFeatures: string[];
    regressions: string[];
  } {
    const beforeResult = this.calculate(before);
    const afterResult = this.calculate(after);

    const improvement = afterResult.fpc - beforeResult.fpc;
    const newFeatures = afterResult.totalFeatures - beforeResult.totalFeatures;

    const beforeMap = new Map(before.map((f) => [f.id, f.completeness]));
    const afterMap = new Map(after.map((f) => [f.id, f.completeness]));

    const improvedFeatures: string[] = [];
    const regressions: string[] = [];

    for (const [id, afterCompleteness] of afterMap.entries()) {
      const beforeCompleteness = beforeMap.get(id) || 0;

      if (afterCompleteness > beforeCompleteness) {
        improvedFeatures.push(id);
      } else if (afterCompleteness < beforeCompleteness) {
        regressions.push(id);
      }
    }

    return {
      beforeFpc: beforeResult.fpc,
      afterFpc: afterResult.fpc,
      improvement: parseFloat(improvement.toFixed(2)),
      newFeatures,
      improvedFeatures,
      regressions,
    };
  }

  /**
   * Calculate FPC trend over time
   */
  calculateTrend(
    historicalResults: Array<{ timestamp: Date; fpc: number }>,
  ): {
    currentFpc: number;
    averageFpc: number;
    trend: 'improving' | 'stable' | 'declining';
    changeRate: number;
  } {
    if (historicalResults.length === 0) {
      return {
        currentFpc: 0,
        averageFpc: 0,
        trend: 'stable',
        changeRate: 0,
      };
    }

    const sortedResults = historicalResults.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
    );

    const currentFpc = sortedResults[sortedResults.length - 1].fpc;
    const averageFpc =
      sortedResults.reduce((sum, r) => sum + r.fpc, 0) / sortedResults.length;

    if (sortedResults.length < 2) {
      return {
        currentFpc,
        averageFpc,
        trend: 'stable',
        changeRate: 0,
      };
    }

    const recentCount = Math.min(5, sortedResults.length);
    const recentResults = sortedResults.slice(-recentCount);
    const oldResults = sortedResults.slice(-recentCount * 2, -recentCount);

    const recentAvg =
      recentResults.reduce((sum, r) => sum + r.fpc, 0) / recentResults.length;
    const oldAvg =
      oldResults.length > 0
        ? oldResults.reduce((sum, r) => sum + r.fpc, 0) / oldResults.length
        : recentAvg;

    const changeRate = recentAvg - oldAvg;

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (changeRate > 2) {
      trend = 'improving';
    } else if (changeRate < -2) {
      trend = 'declining';
    }

    return {
      currentFpc,
      averageFpc: parseFloat(averageFpc.toFixed(2)),
      trend,
      changeRate: parseFloat(changeRate.toFixed(2)),
    };
  }
}
