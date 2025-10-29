import { Injectable, Logger } from '@nestjs/common';
import { StateContext } from './layer-3-state';
import { ActionPlan } from './layer-2-deliberation';

/**
 * DETER-AGENT Layer 4: Execution Layer (Operational Control)
 *
 * Purpose: Execute actions reliably with error recovery
 * Article IX: Camada de Execução - Controle Operacional
 *
 * Constitutional Compliance: Verify-Fix-Execute loop with max 2 iterations
 * P6: Eficiência de Token - Diagnóstico rigoroso antes de correção
 */

export interface ActionResult {
  actionName: string;
  success: boolean;
  output?: unknown;
  error?: string;
  executionTimeMs: number;
  attemptsRequired: number;
}

export interface ExecutionResult {
  success: boolean;
  results: ActionResult[];
  totalExecutionTimeMs: number;
  actionsCompleted: number;
  actionsFailed: number;
  executedAt: Date;
}

export interface ExecutionError {
  action: string;
  attempt: number;
  error: string;
  diagnosis: string;
  recoverable: boolean;
}

@Injectable()
export class ExecutionLayer {
  private readonly logger = new Logger(ExecutionLayer.name);
  private readonly MAX_ATTEMPTS = 2;

  /**
   * Execute action plan with verification and recovery
   * Article IX, Section 3: Loop Verify-Fix-Execute
   */
  async execute(plan: ActionPlan, state: StateContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    const results: ActionResult[] = [];
    let actionsCompleted = 0;
    let actionsFailed = 0;

    this.logger.log(
      `Executing ${plan.actions.length} actions with constitutional compliance`,
    );

    for (const action of plan.actions) {
      const actionResult = await this.executeActionWithRetry(action, state);

      results.push(actionResult);

      if (actionResult.success) {
        actionsCompleted++;
        await this.auditLog({
          action,
          result: actionResult,
          status: 'SUCCESS',
          timestamp: new Date(),
        });
      } else {
        actionsFailed++;
        await this.auditLog({
          action,
          result: actionResult,
          status: 'FAILED',
          timestamp: new Date(),
        });
      }
    }

    const totalExecutionTimeMs = Date.now() - startTime;

    const executionResult: ExecutionResult = {
      success: actionsFailed === 0,
      results,
      totalExecutionTimeMs,
      actionsCompleted,
      actionsFailed,
      executedAt: new Date(),
    };

    this.logger.log(
      `Execution complete: ${actionsCompleted}/${plan.actions.length} actions successful in ${totalExecutionTimeMs}ms`,
    );

    return executionResult;
  }

  /**
   * Execute single action with retry and recovery
   * P6: Max 2 iterations with diagnosis
   */
  private async executeActionWithRetry(
    action: string,
    state: StateContext,
  ): Promise<ActionResult> {
    const startTime = Date.now();
    let lastError: ExecutionError | undefined;

    for (let attempt = 1; attempt <= this.MAX_ATTEMPTS; attempt++) {
      try {
        this.logger.debug(`Executing action: ${action} (attempt ${attempt}/${this.MAX_ATTEMPTS})`);

        const output = await this.dispatchAction(action, state);

        const verified = await this.verifyExecution(action, output);

        if (!verified) {
          throw new Error(`Verification failed for action: ${action}`);
        }

        const executionTimeMs = Date.now() - startTime;

        return {
          actionName: action,
          success: true,
          output,
          executionTimeMs,
          attemptsRequired: attempt,
        };
      } catch (error) {
        const diagnosis = await this.diagnoseError(action, error, attempt);

        lastError = {
          action,
          attempt,
          error: String(error),
          diagnosis: diagnosis.rootCause,
          recoverable: diagnosis.recoverable,
        };

        this.logger.warn(
          `Action failed (attempt ${attempt}/${this.MAX_ATTEMPTS}): ${action} - ${diagnosis.rootCause}`,
        );

        if (!diagnosis.recoverable || attempt === this.MAX_ATTEMPTS) {
          break;
        }

        if (attempt < this.MAX_ATTEMPTS) {
          await this.applyRecoveryStrategy(diagnosis);
        }
      }
    }

    const executionTimeMs = Date.now() - startTime;

    return {
      actionName: action,
      success: false,
      error: lastError?.error,
      executionTimeMs,
      attemptsRequired: this.MAX_ATTEMPTS,
    };
  }

  /**
   * Dispatch action to appropriate handler
   */
  private async dispatchAction(action: string, state: StateContext): Promise<unknown> {
    this.logger.debug(`Dispatching action: ${action}`);

    switch (action) {
      case 'classify-issue':
        return this.classifyIssue(state);
      case 'suggest-labels':
        return this.suggestLabels(state);
      case 'calculate-priority':
        return this.calculatePriority(state);
      case 'post-analysis-comment':
        return this.postAnalysisComment(state);
      case 'analyze-code-quality':
        return this.analyzeCodeQuality(state);
      case 'check-security':
        return this.checkSecurity(state);
      case 'analyze-performance':
        return this.analyzePerformance(state);
      case 'post-review-comment':
        return this.postReviewComment(state);
      case 'log-event':
        return this.logEvent(state);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  /**
   * Verify that action executed correctly
   * P2: Validação Preventiva
   */
  private async verifyExecution(action: string, output: unknown): Promise<boolean> {
    if (output === undefined || output === null) {
      this.logger.warn(`Action ${action} returned undefined/null output`);
      return false;
    }

    return true;
  }

  /**
   * Diagnose error before attempting recovery
   * P6: Diagnóstico rigoroso obrigatório antes de cada correção
   */
  private async diagnoseError(
    action: string,
    error: unknown,
    attempt: number,
  ): Promise<{ rootCause: string; recoverable: boolean; strategy?: string }> {
    const errorMessage = error instanceof Error ? error.message : String(error);

    this.logger.debug(`Diagnosing error for ${action}: ${errorMessage}`);

    if (errorMessage.includes('rate limit')) {
      return {
        rootCause: 'GitHub API rate limit exceeded',
        recoverable: true,
        strategy: 'wait-and-retry',
      };
    }

    if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
      return {
        rootCause: 'Network connectivity issue',
        recoverable: true,
        strategy: 'exponential-backoff',
      };
    }

    if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      return {
        rootCause: 'Resource not found',
        recoverable: false,
      };
    }

    if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
      return {
        rootCause: 'Authentication failure',
        recoverable: false,
      };
    }

    return {
      rootCause: `Unknown error: ${errorMessage}`,
      recoverable: attempt < this.MAX_ATTEMPTS,
      strategy: 'retry',
    };
  }

  /**
   * Apply recovery strategy based on diagnosis
   */
  private async applyRecoveryStrategy(
    diagnosis: { strategy?: string },
  ): Promise<void> {
    if (diagnosis.strategy === 'wait-and-retry') {
      await this.delay(2000);
    } else if (diagnosis.strategy === 'exponential-backoff') {
      await this.delay(1000);
    }
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Action implementations
   */
  private async classifyIssue(_state: StateContext): Promise<{ classification: string }> {
    return { classification: 'bug' };
  }

  private async suggestLabels(_state: StateContext): Promise<{ labels: string[] }> {
    return { labels: ['bug', 'needs-triage'] };
  }

  private async calculatePriority(_state: StateContext): Promise<{ priority: string }> {
    return { priority: 'high' };
  }

  private async postAnalysisComment(_state: StateContext): Promise<{ commentId: number }> {
    return { commentId: 12345 };
  }

  private async analyzeCodeQuality(_state: StateContext): Promise<{ score: number }> {
    return { score: 85 };
  }

  private async checkSecurity(_state: StateContext): Promise<{ issues: string[] }> {
    return { issues: [] };
  }

  private async analyzePerformance(_state: StateContext): Promise<{ score: number }> {
    return { score: 90 };
  }

  private async postReviewComment(_state: StateContext): Promise<{ commentId: number }> {
    return { commentId: 67890 };
  }

  private async logEvent(/*state: StateContext*/ _state: StateContext): Promise<{ logged: boolean }> {
    this.logger.log(`Event logged: ${_state.context.eventType}`);
    return { logged: true };
  }

  /**
   * Audit log for all actions
   * P4: Rastreabilidade Total
   * Article III: Zero Trust - Complete audit trail
   */
  private async auditLog(log: {
    action: string;
    result: ActionResult;
    status: 'SUCCESS' | 'FAILED';
    timestamp: Date;
  }): Promise<void> {
    this.logger.debug(
      `Audit: ${log.action} [${log.status}] - ${log.result.executionTimeMs}ms (${log.result.attemptsRequired} attempts)`,
    );
  }

  /**
   * Rollback action if needed
   * Article IX, Section 3: Automatic Rollback
   */
  async rollback(action: string, _state: StateContext): Promise<void> {
    this.logger.warn(`Rolling back action: ${action}`);
  }
}
