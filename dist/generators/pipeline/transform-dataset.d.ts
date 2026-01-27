/**
 * @libar-docs
 * @libar-docs-generator @libar-docs-core
 * @libar-docs-pattern TransformDataset
 * @libar-docs-status completed
 * @libar-docs-arch-role service
 * @libar-docs-arch-context generator
 * @libar-docs-arch-layer application
 * @libar-docs-uses MasterDataset, ExtractedPattern, TagRegistry, NormalizeStatus
 * @libar-docs-used-by Orchestrator
 * @libar-docs-usecase "When computing all pattern views in a single pass"
 * @libar-docs-usecase "When transforming raw extracted data for generators"
 *
 * ## TransformDataset - Single-Pass Pattern Transformation
 *
 * Transforms raw extracted patterns into a MasterDataset with all pre-computed
 * views. This is the core of the unified transformation pipeline, computing
 * status groups, phase groups, quarter groups, category groups, and source
 * groups in a single iteration over the pattern array.
 *
 * ### When to Use
 *
 * - Use in orchestrator after pattern extraction and merging
 * - Use when you need pre-computed views for multiple generators
 *
 * ### Key Concepts
 *
 * - **Single-pass**: O(n) complexity regardless of view count
 * - **Immutable output**: Returns a new MasterDataset object
 * - **Workflow integration**: Uses workflow config for phase names
 */
import type { ExtractedPattern, TagRegistry } from '../../validation-schemas/index.js';
import type { LoadedWorkflow } from '../../config/workflow-loader.js';
import type { StatusCounts } from '../../validation-schemas/master-dataset.js';
import type { MasterDataset } from '../../validation-schemas/master-dataset.js';
/**
 * Runtime MasterDataset with optional workflow
 *
 * Extends the Zod-compatible MasterDataset with workflow reference.
 * LoadedWorkflow contains Maps which aren't JSON-serializable,
 * so it's kept separate from the Zod schema.
 */
export interface RuntimeMasterDataset extends MasterDataset {
    /** Optional workflow configuration (not serializable) */
    readonly workflow?: LoadedWorkflow;
}
/**
 * Raw input data for transformation
 */
export interface RawDataset {
    /** Extracted patterns from TypeScript and/or Gherkin sources */
    readonly patterns: readonly ExtractedPattern[];
    /** Tag registry for category lookups */
    readonly tagRegistry: TagRegistry;
    /** Optional workflow configuration for phase names (can be undefined) */
    readonly workflow?: LoadedWorkflow | undefined;
}
/**
 * Transform raw extracted data into a MasterDataset with all pre-computed views.
 *
 * This is a ONE-PASS transformation that computes:
 * - Status-based groupings (completed/active/planned)
 * - Phase-based groupings with counts
 * - Quarter-based groupings for timeline views
 * - Category-based groupings for taxonomy
 * - Source-based views (TypeScript vs Gherkin, roadmap, PRD)
 * - Aggregate statistics (counts, phase count, category count)
 * - Optional relationship index
 *
 * @param raw - Raw dataset with patterns, registry, and optional workflow
 * @returns MasterDataset with all pre-computed views
 *
 * @example
 * ```typescript
 * const masterDataset = transformToMasterDataset({
 *   patterns: mergedPatterns,
 *   tagRegistry: registry,
 *   workflow,
 * });
 *
 * // Access pre-computed views
 * const completed = masterDataset.byStatus.completed;
 * const phase3Patterns = masterDataset.byPhase.find(p => p.phaseNumber === 3);
 * const q42024 = masterDataset.byQuarter["Q4-2024"];
 * ```
 */
export declare function transformToMasterDataset(raw: RawDataset): RuntimeMasterDataset;
/**
 * Compute completion percentage from status counts
 *
 * @param counts - Status counts
 * @returns Percentage (0-100) of completed items
 */
export declare function completionPercentage(counts: StatusCounts): number;
/**
 * Check if all items in a phase/group are completed
 *
 * @param counts - Status counts
 * @returns True if all items are completed
 */
export declare function isFullyCompleted(counts: StatusCounts): boolean;
//# sourceMappingURL=transform-dataset.d.ts.map