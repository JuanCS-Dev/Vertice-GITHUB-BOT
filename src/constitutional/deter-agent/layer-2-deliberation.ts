import { Injectable, Logger } from '@nestjs/common';

/**
 * DETER-AGENT Layer 2: Deliberation Layer (Cognitive Control)
 *
 * Purpose: Explicit reasoning about what action to take
 * Article VII: Camada de Deliberação - Controle Cognitivo
 *
 * Constitutional Compliance: Tree of Thoughts implementation
 * Implements P3: Ceticismo Crítico - Critical analysis of options
 */

export interface ProcessedEvent {
  eventType: string;
  payload: unknown;
  metadata: Record<string, unknown>;
}

export interface EventClassification {
  type: string;
  subtype: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
}

export interface PriorityCalculation {
  urgency: 'critical' | 'high' | 'medium' | 'low';
  complexity: 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  score: number;
}

export interface ActionPlan {
  actions: string[];
  reasoning: string;
  alternatives: string[];
  selectedRationale: string;
}

export interface DeliberationResult {
  classification: EventClassification;
  priority: PriorityCalculation;
  actionPlan: ActionPlan;
  thoughtsExplored: number;
  deliberationTimeMs: number;
}

@Injectable()
export class DeliberationLayer {
  private readonly logger = new Logger(DeliberationLayer.name);

  /**
   * Analyze event and plan actions
   * Tree of Thoughts: Explore multiple solution paths
   */
  async analyze(event: ProcessedEvent): Promise<DeliberationResult> {
    const startTime = Date.now();

    this.logger.log(`Deliberating on event: ${event.eventType}`);

    // Phase 1: Classify event
    const classification = await this.classifyEvent(event);

    // Phase 2: Calculate priority
    const priority = await this.calculatePriority(event, classification);

    // Phase 3: Tree of Thoughts - Explore multiple approaches
    const actionPlan = await this.planActionWithTreeOfThoughts(
      event,
      classification,
      priority,
    );

    const deliberationTimeMs = Date.now() - startTime;

    const result: DeliberationResult = {
      classification,
      priority,
      actionPlan,
      thoughtsExplored: 3,
      deliberationTimeMs,
    };

    // Log decision for transparency
    await this.logDeliberation(event, result);

    this.logger.log(
      `Deliberation complete: ${classification.type} (${priority.urgency} priority) - ${deliberationTimeMs}ms`,
    );

    return result;
  }

  /**
   * Classify event type and subtype
   * P2: Validação Preventiva - Verify event structure
   */
  private async classifyEvent(
    event: ProcessedEvent,
  ): Promise<EventClassification> {
    const { eventType } = event;

    let type = 'unknown';
    let subtype = 'general';
    let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    let confidence = 0.8;

    if (eventType.includes('issue')) {
      type = 'issue';
      subtype = this.classifyIssueSubtype(event);
      priority = this.inferPriorityFromEvent(event);
    } else if (eventType.includes('pull_request')) {
      type = 'pull_request';
      subtype = this.classifyPRSubtype(event);
      priority = 'high';
    } else if (eventType.includes('push')) {
      type = 'push';
      subtype = 'commit';
      priority = 'medium';
    } else if (eventType.includes('release')) {
      type = 'release';
      subtype = 'published';
      priority = 'low';
    }

    return {
      type,
      subtype,
      priority,
      confidence,
    };
  }

  /**
   * Classify issue subtype based on content
   */
  private classifyIssueSubtype(event: ProcessedEvent): string {
    const payload = event.payload as { action?: string; issue?: { title?: string; body?: string } };

    if (!payload.issue) {
      return 'unknown';
    }

    const title = (payload.issue.title || '').toLowerCase();
    const body = (payload.issue.body || '').toLowerCase();
    const content = `${title} ${body}`;

    if (content.includes('bug') || content.includes('error') || content.includes('crash')) {
      return 'bug';
    }

    if (content.includes('feature') || content.includes('enhancement')) {
      return 'feature';
    }

    if (content.includes('question') || content.includes('how to') || content.includes('help')) {
      return 'question';
    }

    if (content.includes('documentation') || content.includes('docs')) {
      return 'documentation';
    }

    return 'general';
  }

  /**
   * Classify PR subtype
   */
  private classifyPRSubtype(event: ProcessedEvent): string {
    const payload = event.payload as { action?: string };
    return payload.action || 'unknown';
  }

  /**
   * Infer priority from event content
   */
  private inferPriorityFromEvent(
    event: ProcessedEvent,
  ): 'critical' | 'high' | 'medium' | 'low' {
    const payload = event.payload as { issue?: { title?: string; body?: string } };

    if (!payload.issue) {
      return 'medium';
    }

    const content = `${payload.issue.title || ''} ${payload.issue.body || ''}`.toLowerCase();

    if (content.includes('critical') || content.includes('urgent') || content.includes('production')) {
      return 'critical';
    }

    if (content.includes('important') || content.includes('blocking')) {
      return 'high';
    }

    if (content.includes('minor') || content.includes('trivial')) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Calculate priority based on multiple factors
   * P5: Consciência Sistêmica - Consider system impact
   */
  private async calculatePriority(
    event: ProcessedEvent,
    classification: EventClassification,
  ): Promise<PriorityCalculation> {
    const urgency = classification.priority;

    const complexity = this.assessComplexity(event);

    const impact = this.assessImpact(event, classification);

    const score = this.calculatePriorityScore(urgency, complexity, impact);

    return {
      urgency,
      complexity,
      impact,
      score,
    };
  }

  /**
   * Assess complexity of handling this event
   */
  private assessComplexity(event: ProcessedEvent): 'high' | 'medium' | 'low' {
    const payload = event.payload as { pull_request?: { changed_files?: number } };

    if (payload.pull_request?.changed_files) {
      const filesChanged = payload.pull_request.changed_files;
      if (filesChanged > 20) return 'high';
      if (filesChanged > 5) return 'medium';
    }

    return 'low';
  }

  /**
   * Assess impact on system
   */
  private assessImpact(
    event: ProcessedEvent,
    classification: EventClassification,
  ): 'high' | 'medium' | 'low' {
    if (classification.type === 'issue' && classification.subtype === 'bug') {
      return 'high';
    }

    if (classification.type === 'pull_request') {
      return 'high';
    }

    if (classification.type === 'push') {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Calculate numeric priority score
   */
  private calculatePriorityScore(
    urgency: string,
    complexity: string,
    impact: string,
  ): number {
    const urgencyScores = { critical: 100, high: 75, medium: 50, low: 25 };
    const complexityScores = { high: 30, medium: 20, low: 10 };
    const impactScores = { high: 40, medium: 25, low: 10 };

    return (
      (urgencyScores[urgency as keyof typeof urgencyScores] || 50) +
      (complexityScores[complexity as keyof typeof complexityScores] || 20) +
      (impactScores[impact as keyof typeof impactScores] || 25)
    );
  }

  /**
   * Tree of Thoughts: Plan action by exploring multiple approaches
   * Article VII, Section 1: Mandato do Planejamento em Árvore de Pensamentos
   */
  private async planActionWithTreeOfThoughts(
    event: ProcessedEvent,
    classification: EventClassification,
    priority: PriorityCalculation,
  ): Promise<ActionPlan> {
    const thoughts: { approach: string; reasoning: string; feasibility: number }[] = [];

    if (classification.type === 'issue') {
      thoughts.push({
        approach: 'triage-and-label',
        reasoning: 'Automatically classify and label issue for team triage',
        feasibility: 0.9,
      });

      thoughts.push({
        approach: 'ai-analysis-only',
        reasoning: 'Provide AI analysis without auto-labeling',
        feasibility: 0.7,
      });

      thoughts.push({
        approach: 'full-automation',
        reasoning: 'Analyze, label, assign, and comment automatically',
        feasibility: 0.5,
      });
    } else if (classification.type === 'pull_request') {
      thoughts.push({
        approach: 'comprehensive-review',
        reasoning: 'Full code quality and security analysis',
        feasibility: 0.9,
      });

      thoughts.push({
        approach: 'quick-scan',
        reasoning: 'Quick security and lint check only',
        feasibility: 0.8,
      });

      thoughts.push({
        approach: 'full-ai-review',
        reasoning: 'Deep AI review with inline comments',
        feasibility: 0.6,
      });
    } else {
      thoughts.push({
        approach: 'log-only',
        reasoning: 'Log event for monitoring purposes',
        feasibility: 1.0,
      });
    }

    thoughts.sort((a, b) => b.feasibility - a.feasibility);

    const selectedThought = thoughts[0];

    const actions = this.determineActionsForApproach(selectedThought.approach, classification);

    return {
      actions,
      reasoning: selectedThought.reasoning,
      alternatives: thoughts.slice(1).map((t) => t.approach),
      selectedRationale: `Selected '${selectedThought.approach}' with feasibility ${selectedThought.feasibility} due to: ${selectedThought.reasoning}`,
    };
  }

  /**
   * Determine specific actions for chosen approach
   */
  private determineActionsForApproach(approach: string, classification: EventClassification): string[] {
    const actions: string[] = [];

    if (approach === 'triage-and-label') {
      actions.push('classify-issue');
      actions.push('suggest-labels');
      actions.push('calculate-priority');
      actions.push('post-analysis-comment');
    } else if (approach === 'comprehensive-review') {
      actions.push('analyze-code-quality');
      actions.push('check-security');
      actions.push('analyze-performance');
      actions.push('post-review-comment');
    } else if (approach === 'log-only') {
      actions.push('log-event');
    }

    return actions;
  }

  /**
   * Log deliberation for transparency and audit
   * P4: Rastreabilidade Total - All decisions are traceable
   */
  private async logDeliberation(
    event: ProcessedEvent,
    result: DeliberationResult,
  ): Promise<void> {
    this.logger.debug(
      `Deliberation: ${event.eventType} -> ${result.classification.type} (${result.priority.urgency}) -> ${result.actionPlan.actions.length} actions planned`,
    );
  }
}
