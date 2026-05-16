/**
 * Orchestrator for the idea-tier soft lint pass. Default scope:
 * `architect/specs/**`. Returns a `LintSummary` compatible with the existing
 * lint engine output shape. All emitted violations are `warning` severity —
 * the pass never blocks a build.
 */
import { readFileSync } from 'fs';
import { globSync } from 'glob';
import type { LintViolation } from '@libar-dev/architect-core';
import type { LintResult, LintSummary } from '../engine.js';
import { runIdeaTierChecks } from './idea-tier-checks.js';

const DEFAULT_SPEC_GLOBS = ['architect/specs/**/*.feature'];

export interface IdeaTierLintOptions {
  readonly baseDir?: string;
  readonly specGlobs?: readonly string[];
}

export function runIdeaTierLint(options: IdeaTierLintOptions = {}): LintSummary {
  const baseDir = options.baseDir ?? process.cwd();
  const specGlobs = options.specGlobs ?? DEFAULT_SPEC_GLOBS;

  const specFiles = discoverFiles(specGlobs, baseDir);
  const violationsByFile = new Map<string, LintViolation[]>();

  for (const specPath of specFiles) {
    const content = readFileSafe(specPath);
    if (content === null) continue;

    const violations = runIdeaTierChecks(content, specPath);
    if (violations.length > 0) {
      violationsByFile.set(specPath, [...violations]);
    }
  }

  return buildSummary(violationsByFile, specFiles.length);
}

function discoverFiles(patterns: readonly string[], baseDir: string): readonly string[] {
  const files: string[] = [];
  for (const pattern of patterns) {
    const matches = globSync(pattern, { cwd: baseDir, absolute: true });
    files.push(...matches);
  }
  return [...new Set(files)].sort();
}

function readFileSafe(filePath: string): string | null {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

// Severity counts are derived defensively so the engine shape stays honest
// if a future rule emits something other than `warning`.
function buildSummary(
  violationsByFile: Map<string, LintViolation[]>,
  filesScanned: number
): LintSummary {
  const results: LintResult[] = [];
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  for (const [file, violations] of violationsByFile) {
    if (violations.length === 0) continue;
    results.push({ file, violations });
    for (const v of violations) {
      switch (v.severity) {
        case 'error':
          errorCount++;
          break;
        case 'warning':
          warningCount++;
          break;
        case 'info':
          infoCount++;
          break;
      }
    }
  }

  return {
    results,
    errorCount,
    warningCount,
    infoCount,
    filesScanned,
    directivesChecked: filesScanned,
  };
}
