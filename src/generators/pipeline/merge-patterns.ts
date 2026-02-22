/**
 * @libar-docs
 * @libar-docs-generator @libar-docs-infra
 * @libar-docs-pattern MergePatterns
 * @libar-docs-status completed
 * @libar-docs-implements OrchestratorPipelineFactoryMigration
 * @libar-docs-product-area Generation
 * @libar-docs-uses PatternHelpers
 *
 * ## MergePatterns - Dual-Source Pattern Merging
 *
 * Merges patterns from TypeScript and Gherkin sources with conflict detection.
 * Each pattern name must be unique across both sources.
 *
 * Target: src/generators/pipeline/merge-patterns.ts
 * See: DD-2 (OrchestratorPipelineFactoryMigration)
 *
 * **When to Use:** When combining TypeScript and Gherkin extracted patterns into a single list with conflict detection.
 */

import type { ExtractedPattern } from '../../validation-schemas/index.js';
import type { Result } from '../../types/result.js';
import { Result as R } from '../../types/result.js';
import { getPatternName } from '../../api/pattern-helpers.js';

/**
 * Merge patterns from TypeScript and Gherkin sources with conflict detection
 *
 * Exported for testing purposes - allows direct unit testing of merge logic
 * without running the full pipeline.
 *
 * @param tsPatterns - Patterns extracted from TypeScript files
 * @param gherkinPatterns - Patterns extracted from Gherkin feature files
 * @returns Result containing merged patterns or error if conflicts detected
 */
export function mergePatterns(
  tsPatterns: readonly ExtractedPattern[],
  gherkinPatterns: readonly ExtractedPattern[]
): Result<readonly ExtractedPattern[], string> {
  // Check for conflicts (same pattern name in both sources)
  const conflicts: string[] = [];

  const tsPatternNames = new Set(tsPatterns.map((p) => getPatternName(p)));

  for (const gherkinPattern of gherkinPatterns) {
    const patternName = getPatternName(gherkinPattern);
    if (tsPatternNames.has(patternName)) {
      conflicts.push(patternName);
    }
  }

  if (conflicts.length > 0) {
    return R.err(
      `Pattern conflicts detected: ${conflicts.join(', ')}. ` +
        `These patterns are defined in both TypeScript and Gherkin sources. ` +
        `Each pattern should only be defined in one source.`
    );
  }

  // No conflicts - merge patterns
  return R.ok([...tsPatterns, ...gherkinPatterns]);
}
