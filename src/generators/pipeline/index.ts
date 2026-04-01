/**
 * @architect
 * @architect-generator @architect-infra
 * @architect-pattern PipelineModule
 * @architect-status completed
 * @architect-uses TransformDataset
 * @architect-used-by Orchestrator, Generators
 *
 * ## Pipeline Module - Unified Transformation Infrastructure
 *
 * Barrel export for the unified transformation pipeline components.
 * This module provides single-pass pattern transformation.
 *
 * ### When to Use
 *
 * - When transforming extracted patterns into a PatternGraph
 * - When building custom generation pipelines
 * - When accessing pre-computed indexes and views from the dataset
 *
 * NOTE: Report codecs have been replaced by RDM codecs in src/renderable/codecs/
 */

// ═══════════════════════════════════════════════════════════════════════════
// Transform Dataset
// ═══════════════════════════════════════════════════════════════════════════

export {
  transformToPatternGraph,
  transformToPatternGraphWithValidation,
  completionPercentage,
  isFullyCompleted,
} from './transform-dataset.js';

export type { ContextInferenceRule } from './context-inference.js';

export type {
  RawDataset,
  RuntimePatternGraph,
  ValidationSummary,
  MalformedPattern,
  DanglingReference,
  TransformResult,
} from './transform-types.js';

// ═══════════════════════════════════════════════════════════════════════════
// Merge Patterns
// ═══════════════════════════════════════════════════════════════════════════

export { mergePatterns } from './merge-patterns.js';

// ═══════════════════════════════════════════════════════════════════════════
// Pipeline Factory
// ═══════════════════════════════════════════════════════════════════════════

export {
  buildPatternGraph,
  type PipelineOptions,
  type PipelineResult,
  type PipelineError,
  type PipelineWarning,
  type PipelineWarningDetail,
  type ScanMetadata,
} from './build-pipeline.js';
