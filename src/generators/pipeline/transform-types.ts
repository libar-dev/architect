/**
 * @libar-docs
 * @libar-docs-pattern TransformTypes
 * @libar-docs-status active
 * @libar-docs-arch-role types
 * @libar-docs-arch-context generator
 * @libar-docs-arch-layer application
 * @libar-docs-used-by TransformDataset, Orchestrator
 * @libar-docs-uses MasterDataset, LoadedWorkflow, ExtractedPattern, TagRegistry, ContextInferenceRule
 *
 * ## TransformTypes - MasterDataset Transformation Types
 *
 * Type definitions for the dataset transformation pipeline.
 * Separated from transform-dataset.ts to allow importing types
 * without pulling in the transformation logic.
 */

import type { MasterDataset } from '../../validation-schemas/master-dataset.js';
import type { LoadedWorkflow } from '../../config/workflow-loader.js';
import type { ExtractedPattern, TagRegistry } from '../../validation-schemas/index.js';
import type { ContextInferenceRule } from './context-inference.js';

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
 * Runtime MasterDataset with optional workflow
 *
 * Extends the Zod-compatible MasterDataset with workflow reference.
 * LoadedWorkflow contains Maps which aren't JSON-serializable,
 * so it's kept separate from the Zod schema.
 *
 * @libar-docs-shape master-dataset
 */
export interface RuntimeMasterDataset extends MasterDataset {
  /** Optional workflow configuration (not serializable) */
  readonly workflow?: LoadedWorkflow;
}

/**
 * Raw input data for transformation
 *
 * @libar-docs-shape master-dataset
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
