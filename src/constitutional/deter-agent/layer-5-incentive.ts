import { Injectable, Logger } from '@nestjs/common';
import { ExecutionResult, ActionResult } from './layer-4-execution';

/**
 * DETER-AGENT Layer 5: Incentive Layer (Behavioral Control)
 *
 * Purpose: Feedback and optimization through quality metrics
 * Article X: Camada de Incentivo - Controle Comportamental
 *
 * Constitutional Compliance: Continuous learning and improvement
 * Aligns incentives with constitutional values
 */

export interface QualityMetrics {
  lei: number;
  crs: number;
  fpc: number;
  accuracy: number;
  timeliness: number;
  efficiency: number;
}

export interface QualityFeedback {
  accuracy: number;
  timeliness: number;
  efficiency: number;
  constitutionalAlignment: number;
  userSatisfaction?: number;
}

export interface ImprovementMetrics {
  accuracy: number;
  timeliness: number;
  efficiency: number;
  constitutionalAlignment: number;
}

export interface OptimizationRecommendation {
  category: string;
  priority: 'high' | 'medium' | 'low';
  description: string;
  expectedImpact: string;
}

export interface Optimization {
  improvement: ImprovementMetrics;
  recommendations: OptimizationRecommendation[];
  incentivesApplied: string[];
}

@Injectable()
export class IncentiveLayer {
  private readonly logger = new Logger(IncentiveLayer.name);

  /**
   * Optimize based on execution results and quality metrics
   * Article X: Preference-As-Reward Modeling
   */
  async optimize(
    result: ExecutionResult,
    metrics: QualityMetrics,
  ): Promise<Optimization> {
    this.logger.log('Optimizing based on quality feedback and constitutional alignment');

    const feedback = await this.gatherFeedback(result, metrics);

    const improvement = this.calculateImprovementMetrics(feedback);

    const recommendations = await this.generateRecommendations(improvement, metrics);

    const incentivesApplied = await this.applyIncentives(result, improvement);

    await this.logOptimization(result, feedback, improvement, recommendations);

    this.logger.log(
      `Optimization complete: ${recommendations.length} recommendations generated`,
    );

    return {
      improvement,
      recommendations,
      incentivesApplied,
    };
  }

  /**
   * Gather feedback from execution results
   * Constitutional metrics + performance metrics
   */
  private async gatherFeedback(
    result: ExecutionResult,
    metrics: QualityMetrics,
  ): Promise<QualityFeedback> {
    const accuracy = this.calculateAccuracy(result);

    const timeliness = this.calculateTimeliness(result);

    const efficiency = this.calculateEfficiency(result, metrics);

    const constitutionalAlignment = this.calculateConstitutionalAlignment(metrics);

    return {
      accuracy,
      timeliness,
      efficiency,
      constitutionalAlignment,
    };
  }

  /**
   * Calculate accuracy of actions
   * Preference 1: Primeira tentativa correta > múltiplas correções
   */
  private calculateAccuracy(result: ExecutionResult): number {
    if (result.results.length === 0) return 0;

    const totalAttempts = result.results.reduce(
      (sum, r) => sum + r.attemptsRequired,
      0,
    );
    const idealAttempts = result.results.length;

    const accuracyScore = (idealAttempts / totalAttempts) * 100;

    return Math.min(100, accuracyScore);
  }

  /**
   * Calculate timeliness
   * Faster execution is preferred (within quality constraints)
   */
  private calculateTimeliness(result: ExecutionResult): number {
    const targetTimePerAction = 5000;
    const avgTimePerAction =
      result.totalExecutionTimeMs / (result.actionsCompleted || 1);

    if (avgTimePerAction <= targetTimePerAction) {
      return 100;
    }

    const timelinessScore = (targetTimePerAction / avgTimePerAction) * 100;

    return Math.max(0, timelinessScore);
  }

  /**
   * Calculate efficiency
   * Preference 2: Soluções de 1 turno > soluções iterativas
   */
  private calculateEfficiency(
    result: ExecutionResult,
    metrics: QualityMetrics,
  ): number {
    const singlePassActions = result.results.filter(
      (r: ActionResult) => r.attemptsRequired === 1,
    ).length;
    const totalActions = result.results.length || 1;

    const singlePassRate = (singlePassActions / totalActions) * 100;

    const leiBonus = metrics.lei < 1.0 ? 10 : 0;
    const fpcBonus = metrics.fpc >= 80 ? 10 : 0;

    const efficiencyScore = singlePassRate + leiBonus + fpcBonus;

    return Math.min(100, efficiencyScore);
  }

  /**
   * Calculate constitutional alignment
   * CRS score is primary measure
   */
  private calculateConstitutionalAlignment(metrics: QualityMetrics): number {
    return metrics.crs;
  }

  /**
   * Calculate improvement metrics
   */
  private calculateImprovementMetrics(
    feedback: QualityFeedback,
  ): ImprovementMetrics {
    return {
      accuracy: feedback.accuracy,
      timeliness: feedback.timeliness,
      efficiency: feedback.efficiency,
      constitutionalAlignment: feedback.constitutionalAlignment,
    };
  }

  /**
   * Generate optimization recommendations
   * Article X, Section 2: Modelo de Recompensa Orientado ao Determinismo
   */
  private async generateRecommendations(
    improvement: ImprovementMetrics,
    metrics: QualityMetrics,
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    if (improvement.accuracy < 80) {
      recommendations.push({
        category: 'accuracy',
        priority: 'high',
        description: 'Improve first-pass correctness through better validation',
        expectedImpact: 'Reduce retry attempts by 30%',
      });
    }

    if (metrics.lei >= 1.0) {
      recommendations.push({
        category: 'completeness',
        priority: 'high',
        description: 'Eliminate placeholder code and TODOs',
        expectedImpact: 'Achieve LEI < 1.0 constitutional requirement',
      });
    }

    if (metrics.crs < 95.0) {
      recommendations.push({
        category: 'constitutional',
        priority: 'high',
        description: 'Improve constitutional rule satisfaction',
        expectedImpact: 'Meet CRS ≥ 95% requirement',
      });
    }

    if (improvement.efficiency < 70) {
      recommendations.push({
        category: 'efficiency',
        priority: 'medium',
        description: 'Optimize for single-pass execution',
        expectedImpact: 'Increase efficiency by 20%',
      });
    }

    if (improvement.timeliness < 80) {
      recommendations.push({
        category: 'performance',
        priority: 'medium',
        description: 'Optimize execution time through caching and parallelization',
        expectedImpact: 'Reduce average execution time by 25%',
      });
    }

    if (metrics.fpc < 80) {
      recommendations.push({
        category: 'completeness',
        priority: 'medium',
        description: 'Ensure all planned features are fully implemented',
        expectedImpact: 'Achieve FPC ≥ 80% target',
      });
    }

    recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return recommendations;
  }

  /**
   * Apply incentives based on performance
   * Article X, Section 4: Mitigação de Incentivos Perversos de Token
   */
  private async applyIncentives(
    result: ExecutionResult,
    improvement: ImprovementMetrics,
  ): Promise<string[]> {
    const incentives: string[] = [];

    if (improvement.accuracy >= 90) {
      incentives.push('high-accuracy-reward');
      this.logger.log('✅ High accuracy incentive applied');
    }

    if (improvement.efficiency >= 90) {
      incentives.push('high-efficiency-reward');
      this.logger.log('✅ High efficiency incentive applied');
    }

    if (improvement.constitutionalAlignment >= 95) {
      incentives.push('constitutional-excellence-reward');
      this.logger.log('✅ Constitutional excellence incentive applied');
    }

    if (result.success && result.actionsFailed === 0) {
      incentives.push('zero-failures-reward');
      this.logger.log('✅ Zero failures incentive applied');
    }

    const singlePassRate =
      result.results.filter((r) => r.attemptsRequired === 1).length /
      (result.results.length || 1);

    if (singlePassRate >= 0.9) {
      incentives.push('first-pass-excellence-reward');
      this.logger.log('✅ First-pass excellence incentive applied');
    }

    return incentives;
  }

  /**
   * Log optimization for continuous improvement
   * P4: Rastreabilidade Total
   */
  private async logOptimization(
    _result: ExecutionResult,
    _feedback: QualityFeedback,
    improvement: ImprovementMetrics,
    recommendations: OptimizationRecommendation[],
  ): Promise<void> {
    this.logger.debug(
      `Optimization Log: Accuracy ${improvement.accuracy.toFixed(2)}%, Efficiency ${improvement.efficiency.toFixed(2)}%, CRS ${improvement.constitutionalAlignment.toFixed(2)}%`,
    );

    this.logger.debug(
      `Generated ${recommendations.length} recommendations (${recommendations.filter((r) => r.priority === 'high').length} high priority)`,
    );
  }

  /**
   * Get quality score summary
   * For dashboard and monitoring
   */
  getQualityScore(metrics: QualityMetrics): {
    overall: number;
    breakdown: Record<string, number>;
    grade: string;
  } {
    const weights = {
      lei: 0.2,
      crs: 0.3,
      fpc: 0.2,
      accuracy: 0.15,
      timeliness: 0.1,
      efficiency: 0.05,
    };

    const leiScore = metrics.lei < 1.0 ? 100 : 0;
    const crsScore = metrics.crs;
    const fpcScore = metrics.fpc;
    const accuracyScore = metrics.accuracy;
    const timelinessScore = metrics.timeliness;
    const efficiencyScore = metrics.efficiency;

    const overall =
      leiScore * weights.lei +
      crsScore * weights.crs +
      fpcScore * weights.fpc +
      accuracyScore * weights.accuracy +
      timelinessScore * weights.timeliness +
      efficiencyScore * weights.efficiency;

    let grade = 'F';
    if (overall >= 95) grade = 'A+';
    else if (overall >= 90) grade = 'A';
    else if (overall >= 85) grade = 'B+';
    else if (overall >= 80) grade = 'B';
    else if (overall >= 75) grade = 'C+';
    else if (overall >= 70) grade = 'C';
    else if (overall >= 60) grade = 'D';

    return {
      overall: Math.round(overall * 10) / 10,
      breakdown: {
        lei: leiScore,
        crs: crsScore,
        fpc: fpcScore,
        accuracy: accuracyScore,
        timeliness: timelinessScore,
        efficiency: efficiencyScore,
      },
      grade,
    };
  }
}
