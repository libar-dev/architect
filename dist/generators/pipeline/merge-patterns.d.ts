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
 */
import type { ExtractedPattern } from '../../validation-schemas/index.js';
import type { Result } from '../../types/result.js';
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
export declare function mergePatterns(tsPatterns: readonly ExtractedPattern[], gherkinPatterns: readonly ExtractedPattern[]): Result<readonly ExtractedPattern[], string>;
//# sourceMappingURL=merge-patterns.d.ts.map