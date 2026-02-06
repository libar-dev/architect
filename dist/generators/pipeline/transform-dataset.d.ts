/**
 * @libar-docs
 * @libar-docs-generator @libar-docs-core
 * @libar-docs-pattern TransformDataset
 * @libar-docs-status completed
 * @libar-docs-implements PatternRelationshipModel
 * @libar-docs-arch-role service
 * @libar-docs-arch-context generator
 * @libar-docs-arch-layer application
 * @libar-docs-uses MasterDataset, ExtractedPattern, TagRegistry, NormalizeStatus
 * @libar-docs-used-by Orchestrator
 * @libar-docs-usecase "When computing all pattern views in a single pass"
 * @libar-docs-usecase "When transforming raw extracted data for generators"
 * @libar-docs-extract-shapes RuntimeMasterDataset, RawDataset, transformToMasterDataset
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
 * Information about a malformed pattern that failed schema validation.
 */
export interface MalformedPattern {
    /** Pattern ID or name for identification */
    patternId: string;
    /** List of validation issues found */
    issues: string[];
}
/**
 * Information about a dangling reference (reference to non-existent pattern).
 */
export interface DanglingReference {
    /** The pattern containing the dangling reference */
    pattern: string;
    /** The field containing the dangling reference (e.g., "uses", "dependsOn") */
    field: string;
    /** The referenced pattern name that doesn't exist */
    missing: string;
}
/**
 * Summary of validation results from dataset transformation.
 *
 * Provides structured information about data quality issues encountered
 * during transformation, enabling upstream error handling and reporting.
 */
export interface ValidationSummary {
    /** Total number of patterns processed */
    totalPatterns: number;
    /** Patterns that failed schema validation */
    malformedPatterns: MalformedPattern[];
    /** References to patterns that don't exist in the dataset */
    danglingReferences: DanglingReference[];
    /** Status values that were not recognized (normalized to 'planned') */
    unknownStatuses: string[];
    /** Total count of all warnings (malformed + dangling + unknown statuses) */
    warningCount: number;
}
/**
 * Result of transformToMasterDataset including both dataset and validation info.
 */
export interface TransformResult {
    /** The transformed MasterDataset */
    dataset: RuntimeMasterDataset;
    /** Validation summary with any issues found during transformation */
    validation: ValidationSummary;
}
/**
 * Rule for auto-inferring bounded context from file paths.
 *
 * When a pattern has an architecture layer (`@libar-docs-arch-layer`) but no explicit
 * context (`@libar-docs-arch-context`), these rules can infer the context from the
 * file path. This reduces annotation redundancy when directory structure already
 * implies the bounded context.
 *
 * @example
 * ```typescript
 * const rules: ContextInferenceRule[] = [
 *   { pattern: 'src/validation/**', context: 'validation' },
 *   { pattern: 'src/lint/**', context: 'lint' },
 * ];
 * // File at src/validation/rules.ts will get archContext='validation' if not explicit
 * ```
 */
export interface ContextInferenceRule {
    /** Glob pattern to match file paths (e.g., 'src/validation/**') */
    readonly pattern: string;
    /** Default context name to assign when pattern matches */
    readonly context: string;
}
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
    /** Optional rules for inferring bounded context from file paths */
    readonly contextInferenceRules?: readonly ContextInferenceRule[] | undefined;
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
 * For backward compatibility, this function returns just the dataset.
 * Use `transformToMasterDatasetWithValidation` to get validation summary.
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
 * Transform raw extracted data into a MasterDataset with validation summary.
 *
 * This is the full transformation that includes:
 * - Pre-loop validation against ExtractedPatternSchema
 * - Status-based groupings (completed/active/planned)
 * - Phase-based groupings with counts
 * - Quarter-based groupings for timeline views
 * - Category-based groupings for taxonomy
 * - Source-based views (TypeScript vs Gherkin, roadmap, PRD)
 * - Aggregate statistics (counts, phase count, category count)
 * - Relationship index with dangling reference detection
 * - Validation summary with malformed patterns and unknown statuses
 *
 * @param raw - Raw dataset with patterns, registry, and optional workflow
 * @returns TransformResult with dataset and validation summary
 *
 * @example
 * ```typescript
 * const result = transformToMasterDatasetWithValidation({
 *   patterns: mergedPatterns,
 *   tagRegistry: registry,
 *   workflow,
 * });
 *
 * if (result.validation.warningCount > 0) {
 *   console.warn(`Found ${result.validation.warningCount} validation issues`);
 * }
 *
 * const dataset = result.dataset;
 * ```
 */
export declare function transformToMasterDatasetWithValidation(raw: RawDataset): TransformResult;
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