#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

interface ConstitutionalRule {
  id: string;
  name: string;
  pattern: RegExp | ((content: string) => boolean);
  required: boolean;
  weight: number;
}

const CONSTITUTIONAL_RULES: ConstitutionalRule[] = [
  {
    id: 'ZERO_TRUST_VALIDATION',
    name: 'Zero Trust Input Validation',
    pattern: /(validate|validator|ValidationPipe|Joi\.object|z\.object)/,
    required: true,
    weight: 1.0,
  },
  {
    id: 'ERROR_HANDLING',
    name: 'Comprehensive Error Handling',
    pattern: /(try\s*\{|catch\s*\(|HttpException|@Catch)/,
    required: true,
    weight: 1.0,
  },
  {
    id: 'AUDIT_LOGGING',
    name: 'Audit Logging Present',
    pattern: /(logger\.|this\.logger|winston|@Logger)/,
    required: true,
    weight: 1.0,
  },
  {
    id: 'TYPE_SAFETY',
    name: 'TypeScript Strict Mode',
    pattern: (content: string) => {
      return content.includes('"strict": true') || content.includes("'strict': true");
    },
    required: true,
    weight: 1.0,
  },
  {
    id: 'CONSTITUTIONAL_DECORATOR',
    name: 'Constitutional Validation Decorator',
    pattern: /@Constitutional|@ConstitutionalGuard|UseGuards.*Constitutional/,
    required: false,
    weight: 0.5,
  },
  {
    id: 'DETER_AGENT_LAYERS',
    name: 'DETER-AGENT Layer Implementation',
    pattern: /(Layer1|Layer2|Layer3|Layer4|Layer5|DeterAgent|Constitutional.*Layer)/,
    required: false,
    weight: 0.5,
  },
];

interface RuleCheckResult {
  rule: ConstitutionalRule;
  passed: boolean;
  filesChecked: number;
  filesMatched: number;
}

interface CRSReport {
  totalFiles: number;
  totalRules: number;
  passedRules: number;
  failedRules: number;
  crs: number;
  ruleResults: RuleCheckResult[];
  passed: boolean;
}

function checkRule(files: string[], rule: ConstitutionalRule): RuleCheckResult {
  let filesMatched = 0;

  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf-8');

    if (typeof rule.pattern === 'function') {
      if (rule.pattern(content)) {
        filesMatched++;
      }
    } else {
      if (rule.pattern.test(content)) {
        filesMatched++;
      }
    }
  });

  const passed = rule.required ? filesMatched > 0 : true;

  return {
    rule,
    passed,
    filesChecked: files.length,
    filesMatched,
  };
}

function walkDirectory(dir: string, extensions: string[]): string[] {
  const files: string[] = [];

  function walk(currentDir: string): void {
    const items = fs.readdirSync(currentDir);

    items.forEach((item) => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        if (
          !item.startsWith('.') &&
          item !== 'node_modules' &&
          item !== 'dist' &&
          item !== 'coverage'
        ) {
          walk(fullPath);
        }
      } else if (stat.isFile()) {
        const ext = path.extname(item);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    });
  }

  walk(dir);
  return files;
}

function calculateCRS(results: RuleCheckResult[]): number {
  let totalWeight = 0;
  let satisfiedWeight = 0;

  results.forEach((result) => {
    totalWeight += result.rule.weight;
    if (result.passed) {
      satisfiedWeight += result.rule.weight;
    }
  });

  if (totalWeight === 0) return 100;
  return (satisfiedWeight / totalWeight) * 100;
}

function generateReport(srcDir: string, threshold: number): CRSReport {
  console.log('🔍 Checking Constitutional Rule Satisfaction (CRS)...\n');

  const files = walkDirectory(srcDir, ['.ts', '.js', '.json']);

  if (files.length === 0) {
    return {
      totalFiles: 0,
      totalRules: CONSTITUTIONAL_RULES.length,
      passedRules: 0,
      failedRules: 0,
      crs: 0,
      ruleResults: [],
      passed: false,
    };
  }

  const ruleResults: RuleCheckResult[] = [];

  CONSTITUTIONAL_RULES.forEach((rule) => {
    const result = checkRule(files, rule);
    ruleResults.push(result);
  });

  const passedRules = ruleResults.filter((r) => r.passed).length;
  const failedRules = ruleResults.length - passedRules;
  const crs = calculateCRS(ruleResults);

  return {
    totalFiles: files.length,
    totalRules: CONSTITUTIONAL_RULES.length,
    passedRules,
    failedRules,
    crs: parseFloat(crs.toFixed(2)),
    ruleResults,
    passed: crs >= threshold,
  };
}

function printReport(report: CRSReport, threshold: number): void {
  console.log('📊 === CONSTITUTIONAL RULE SATISFACTION (CRS) REPORT ===\n');
  console.log(`Total Files Scanned: ${report.totalFiles}`);
  console.log(`Total Rules: ${report.totalRules}`);
  console.log(`Passed Rules: ${report.passedRules}`);
  console.log(`Failed Rules: ${report.failedRules}`);
  console.log(`CRS Score: ${report.crs}% (threshold: ≥ ${threshold}%)\n`);

  console.log('📋 Rule Results:\n');

  report.ruleResults.forEach((result) => {
    const status = result.passed ? '✅' : '❌';
    const required = result.rule.required ? '[REQUIRED]' : '[OPTIONAL]';
    const coverage =
      result.filesChecked > 0
        ? `(${result.filesMatched}/${result.filesChecked} files)`
        : '(N/A)';

    console.log(
      `${status} ${result.rule.id} ${required} ${coverage}`,
    );
    console.log(`   ${result.rule.name}`);
  });

  console.log('\n');

  if (report.passed) {
    console.log(`✅ CRS CHECK PASSED (${report.crs}% ≥ ${threshold}%)`);
    console.log('Constitutional compliance verified.\n');
  } else {
    console.log(`❌ CRS CHECK FAILED (${report.crs}% < ${threshold}%)`);
    console.log('CONSTITUTIONAL VIOLATION: Insufficient rule satisfaction.');
    console.log('Action required: Implement missing constitutional requirements.\n');
  }
}

function main(): void {
  const srcDir = path.join(process.cwd(), 'src');
  const threshold = 95.0;

  if (!fs.existsSync(srcDir)) {
    console.log('⚠️  src/ directory not found. Skipping CRS check.');
    console.log('(This is expected during initial setup)\n');
    process.exit(0);
  }

  const report = generateReport(srcDir, threshold);
  printReport(report, threshold);

  process.exit(report.passed ? 0 : 1);
}

main();
