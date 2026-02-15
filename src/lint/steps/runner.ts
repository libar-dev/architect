/**
 * Orchestrator for vitest-cucumber step lint checks.
 *
 * Discovers feature and step files, pairs them, runs all checks,
 * and returns a LintSummary compatible with the existing lint engine.
 */

import { readFileSync } from 'fs';
import { globSync } from 'glob';
import type { LintSummary, LintResult } from '../engine.js';
import type { LintViolation } from '../../validation-schemas/lint.js';
import { runFeatureChecks } from './feature-checks.js';
import { runStepChecks } from './step-checks.js';
import { runCrossChecks } from './cross-checks.js';
import { resolveFeatureStepPairs } from './pair-resolver.js';

/**
 * Default scan paths relative to baseDir
 */
const DEFAULT_FEATURE_GLOBS = [
  'tests/features/**/*.feature',
  'delivery-process/specs/**/*.feature',
  'delivery-process/decisions/**/*.feature',
];

const DEFAULT_STEP_GLOBS = ['tests/steps/**/*.steps.ts'];

/**
 * Options for the step lint runner
 */
export interface StepLintOptions {
  /** Base directory for resolving paths (default: cwd) */
  readonly baseDir?: string;
  /** Feature file glob patterns (default: tests + specs + decisions) */
  readonly featureGlobs?: readonly string[];
  /** Step file glob patterns (default: tests/steps) */
  readonly stepGlobs?: readonly string[];
}

/**
 * Run all step lint checks and return a LintSummary.
 *
 * Executes three categories of checks:
 * 1. Feature-only checks on all .feature files
 * 2. Step-only checks on all .steps.ts files
 * 3. Cross-file checks on paired feature+step files
 */
export function runStepLint(options: StepLintOptions = {}): LintSummary {
  const baseDir = options.baseDir ?? process.cwd();
  const featureGlobs = options.featureGlobs ?? DEFAULT_FEATURE_GLOBS;
  const stepGlobs = options.stepGlobs ?? DEFAULT_STEP_GLOBS;

  // Discover files
  const featureFiles = discoverFiles(featureGlobs, baseDir);
  const stepFiles = discoverFiles(stepGlobs, baseDir);

  // Collect all violations keyed by file path
  const violationsByFile = new Map<string, LintViolation[]>();

  function addViolations(filePath: string, violations: readonly LintViolation[]): void {
    for (const v of violations) {
      const existing = violationsByFile.get(filePath);
      if (existing !== undefined) {
        existing.push(v);
      } else {
        violationsByFile.set(filePath, [v]);
      }
    }
  }

  // Phase 1: Feature-only checks
  for (const featurePath of featureFiles) {
    const content = readFileSafe(featurePath);
    if (content === null) continue;
    addViolations(featurePath, runFeatureChecks(content, featurePath));
  }

  // Phase 2: Step-only checks
  for (const stepPath of stepFiles) {
    const content = readFileSafe(stepPath);
    if (content === null) continue;
    addViolations(stepPath, runStepChecks(content, stepPath));
  }

  // Phase 3: Cross-file checks
  const { pairs, warnings } = resolveFeatureStepPairs(stepFiles, baseDir);

  // Add pairing warnings
  for (const w of warnings) {
    addViolations(w.file, [w]);
  }

  for (const { featurePath, stepPath } of pairs) {
    const featureContent = readFileSafe(featurePath);
    const stepContent = readFileSafe(stepPath);
    if (featureContent === null || stepContent === null) continue;

    const crossViolations = runCrossChecks(featureContent, stepContent, stepPath, featurePath);
    // Cross-check violations may reference either the step file or the feature file.
    // Group each violation under its own reported file path.
    for (const v of crossViolations) {
      addViolations(v.file, [v]);
    }
  }

  // Build LintSummary
  return buildSummary(violationsByFile, featureFiles.length + stepFiles.length);
}

/**
 * Discover files matching glob patterns relative to baseDir.
 */
function discoverFiles(patterns: readonly string[], baseDir: string): readonly string[] {
  const files: string[] = [];
  for (const pattern of patterns) {
    const matches = globSync(pattern, { cwd: baseDir, absolute: true });
    files.push(...matches);
  }
  // Deduplicate (in case patterns overlap)
  return [...new Set(files)].sort();
}

/**
 * Read a file safely, returning null on failure.
 */
function readFileSafe(filePath: string): string | null {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Build a LintSummary from collected violations.
 */
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
    directivesChecked: filesScanned, // Each file is one "unit" checked
  };
}
