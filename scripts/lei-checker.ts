#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';

interface LazyPattern {
  pattern: RegExp;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  description: string;
}

const LAZY_PATTERNS: LazyPattern[] = [
  {
    pattern: /\/\/\s*(TODO|FIXME|HACK|XXX|FIX|IMPLEMENT)/i,
    severity: 'CRITICAL',
    description: 'TODO/FIXME comments',
  },
  {
    pattern: /\/\*\s*(TODO|FIXME|HACK|XXX|FIX|IMPLEMENT)/i,
    severity: 'CRITICAL',
    description: 'TODO/FIXME block comments',
  },
  {
    pattern: /#\s*(TODO|FIXME|HACK|XXX|FIX|IMPLEMENT)/i,
    severity: 'CRITICAL',
    description: 'TODO/FIXME Python-style comments',
  },
  {
    pattern: /throw new Error\(['"]Not implemented['"]\)/i,
    severity: 'HIGH',
    description: 'Not implemented errors',
  },
  {
    pattern: /throw new Error\(['"]TODO['"]\)/i,
    severity: 'HIGH',
    description: 'TODO errors',
  },
  {
    pattern: /\/\/\s*@ts-ignore/i,
    severity: 'HIGH',
    description: '@ts-ignore comments',
  },
  {
    pattern: /\/\/\s*eslint-disable/i,
    severity: 'MEDIUM',
    description: 'ESLint disable comments',
  },
  {
    pattern: /const\s+\w+\s*=\s*\{\s*\};\s*\/\/\s*(mock|placeholder|stub)/i,
    severity: 'HIGH',
    description: 'Mock/placeholder data',
  },
];

interface LEIViolation {
  file: string;
  line: number;
  pattern: string;
  severity: string;
  code: string;
}

interface LEIReport {
  totalFiles: number;
  totalLines: number;
  totalViolations: number;
  lei: number;
  violations: LEIViolation[];
  passed: boolean;
}

function countLines(content: string): number {
  return content.split('\n').length;
}

function scanFile(filePath: string): LEIViolation[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const violations: LEIViolation[] = [];

  lines.forEach((line, index) => {
    for (const { pattern, severity, description } of LAZY_PATTERNS) {
      if (pattern.test(line)) {
        violations.push({
          file: filePath,
          line: index + 1,
          pattern: description,
          severity,
          code: line.trim(),
        });
      }
    }
  });

  return violations;
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

function calculateLEI(violations: number, totalLines: number): number {
  if (totalLines === 0) return 0;
  return (violations / totalLines) * 1000;
}

function generateReport(srcDir: string, threshold: number): LEIReport {
  console.log('🔍 Scanning codebase for lazy execution patterns...\n');

  const files = walkDirectory(srcDir, ['.ts', '.js', '.tsx', '.jsx']);
  let totalLines = 0;
  const allViolations: LEIViolation[] = [];

  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf-8');
    totalLines += countLines(content);

    const violations = scanFile(file);
    allViolations.push(...violations);
  });

  const lei = calculateLEI(allViolations.length, totalLines);
  const passed = lei < threshold;

  return {
    totalFiles: files.length,
    totalLines,
    totalViolations: allViolations.length,
    lei: parseFloat(lei.toFixed(2)),
    violations: allViolations,
    passed,
  };
}

function printReport(report: LEIReport, threshold: number): void {
  console.log('📊 === LAZY EXECUTION INDEX (LEI) REPORT ===\n');
  console.log(`Total Files Scanned: ${report.totalFiles}`);
  console.log(`Total Lines of Code: ${report.totalLines}`);
  console.log(`Total Violations: ${report.totalViolations}`);
  console.log(`LEI Score: ${report.lei} (threshold: < ${threshold})\n`);

  if (report.violations.length > 0) {
    console.log('🚨 Violations Found:\n');

    const violationsByFile = report.violations.reduce(
      (acc, v) => {
        if (!acc[v.file]) acc[v.file] = [];
        acc[v.file].push(v);
        return acc;
      },
      {} as Record<string, LEIViolation[]>,
    );

    Object.entries(violationsByFile).forEach(([file, violations]) => {
      console.log(`\n📄 ${file}`);
      violations.forEach((v) => {
        console.log(`  Line ${v.line} [${v.severity}]: ${v.pattern}`);
        console.log(`    ${v.code}`);
      });
    });

    console.log('\n');
  }

  if (report.passed) {
    console.log(`✅ LEI CHECK PASSED (${report.lei} < ${threshold})`);
    console.log('Constitutional compliance verified.\n');
  } else {
    console.log(`❌ LEI CHECK FAILED (${report.lei} >= ${threshold})`);
    console.log('CONSTITUTIONAL VIOLATION: Lazy execution patterns detected.');
    console.log('Action required: Remove all TODOs, FIXMEs, and placeholders.\n');
  }
}

function main(): void {
  const srcDir = path.join(process.cwd(), 'src');
  const threshold = 1.0;

  if (!fs.existsSync(srcDir)) {
    console.log('⚠️  src/ directory not found. Skipping LEI check.');
    console.log('(This is expected during initial setup)\n');
    process.exit(0);
  }

  const report = generateReport(srcDir, threshold);
  printReport(report, threshold);

  process.exit(report.passed ? 0 : 1);
}

main();
