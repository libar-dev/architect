/**
 * Resolves feature-to-step file pairs by extracting loadFeature() paths
 * from step definition files.
 */

import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import type { LintViolation } from '../../validation-schemas/lint.js';
import type { FeatureStepPair } from './types.js';
import { STEP_LINT_RULES } from './types.js';

/**
 * Extract the feature file path from a loadFeature() call in step file content.
 *
 * Supports two patterns:
 * 1. Simple string: loadFeature('tests/features/path/name.feature')
 * 2. resolve(): loadFeature(resolve(__dirname, '../../../features/path/name.feature'))
 *
 * Returns null if no loadFeature call found or path is not extractable.
 */
export function extractFeaturePath(stepFileContent: string): string | null {
  // Pattern 1: Simple string literal
  const simpleMatch = /loadFeature\s*\(\s*['"]([^'"]+)['"]\s*\)/.exec(stepFileContent);
  if (simpleMatch?.[1] !== undefined) {
    return simpleMatch[1];
  }

  // Pattern 2: resolve(__dirname, 'relative/path')
  const resolveMatch = /loadFeature\s*\(\s*resolve\s*\([^,]*,\s*['"]([^'"]+)['"]\s*\)\s*\)/.exec(
    stepFileContent
  );
  if (resolveMatch?.[1] !== undefined) {
    return resolveMatch[1];
  }

  return null;
}

/**
 * Resolve feature<->step file pairs from a list of step files.
 *
 * For each .steps.ts file, extracts the loadFeature() path and resolves
 * it to an absolute path relative to baseDir.
 *
 * Returns pairs and any warnings (e.g., unparseable loadFeature calls).
 */
export function resolveFeatureStepPairs(
  stepFiles: readonly string[],
  baseDir: string
): { readonly pairs: readonly FeatureStepPair[]; readonly warnings: readonly LintViolation[] } {
  const pairs: FeatureStepPair[] = [];
  const warnings: LintViolation[] = [];

  for (const stepPath of stepFiles) {
    let content: string;
    try {
      content = readFileSync(stepPath, 'utf-8');
    } catch {
      warnings.push({
        rule: STEP_LINT_RULES.pairResolver.id,
        severity: STEP_LINT_RULES.pairResolver.severity,
        message: `Could not read step file`,
        file: stepPath,
        line: 0,
      });
      continue;
    }

    const extractedPath = extractFeaturePath(content);
    if (extractedPath === null) {
      warnings.push({
        rule: STEP_LINT_RULES.pairResolver.id,
        severity: STEP_LINT_RULES.pairResolver.severity,
        message: `Could not extract loadFeature() path — cross-file checks will be skipped`,
        file: stepPath,
        line: 0,
      });
      continue;
    }

    // If path starts with ../ or ./, resolve relative to the step file's directory
    // (the resolve(__dirname, '...') pattern). Otherwise resolve relative to baseDir.
    const featurePath = extractedPath.startsWith('.')
      ? resolve(dirname(stepPath), extractedPath)
      : resolve(baseDir, extractedPath);
    pairs.push({ featurePath, stepPath });
  }

  return { pairs, warnings };
}
