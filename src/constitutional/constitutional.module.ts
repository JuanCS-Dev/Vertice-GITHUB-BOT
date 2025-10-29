import { Module, Global } from '@nestjs/common';
import { ConstitutionalService } from './constitutional.service';
import { ConstitutionalGuard } from './constitutional.guard';

import { ZeroTrustValidator } from './validators/zero-trust.validator';
import { SignatureValidator } from './validators/signature.validator';
import { RateLimitValidator } from './validators/rate-limit.validator';

import { LEICalculatorService } from './metrics/lei-calculator.service';
import { CRSCalculatorService } from './metrics/crs-calculator.service';
import { FPCCalculatorService } from './metrics/fpc-calculator.service';

import { ConstitutionalLayer } from './deter-agent/layer-1-constitutional';
import { DeliberationLayer } from './deter-agent/layer-2-deliberation';
import { StateManagementLayer } from './deter-agent/layer-3-state';
import { ExecutionLayer } from './deter-agent/layer-4-execution';
import { IncentiveLayer } from './deter-agent/layer-5-incentive';
import { DeterAgentOrchestrator } from './deter-agent/deter-agent.orchestrator';

import { PrismaModule } from '../prisma/prisma.module';

/**
 * Constitutional Module
 *
 * Purpose: Provide constitutional compliance throughout the application
 * Constitutional Requirement: Enforce all principles and DETER-AGENT framework
 *
 * Exports: All validators, metrics, and DETER-AGENT components
 * Global: Available to all modules without explicit import
 *
 * @Global decorator ensures constitutional compliance is available everywhere
 */

@Global()
@Module({
  imports: [PrismaModule],
  providers: [
    ZeroTrustValidator,
    SignatureValidator,
    RateLimitValidator,
    LEICalculatorService,
    CRSCalculatorService,
    FPCCalculatorService,
    ConstitutionalLayer,
    DeliberationLayer,
    StateManagementLayer,
    ExecutionLayer,
    IncentiveLayer,
    DeterAgentOrchestrator,
    ConstitutionalService,
    ConstitutionalGuard,
  ],
  exports: [
    ZeroTrustValidator,
    SignatureValidator,
    RateLimitValidator,
    LEICalculatorService,
    CRSCalculatorService,
    FPCCalculatorService,
    ConstitutionalLayer,
    DeliberationLayer,
    StateManagementLayer,
    ExecutionLayer,
    IncentiveLayer,
    DeterAgentOrchestrator,
    ConstitutionalService,
    ConstitutionalGuard,
  ],
})
export class ConstitutionalModule {}
