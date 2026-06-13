/**
 * @architect
 * @architect-pattern PipelineDatasetContract
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:pipeline
 * @architect-uses ExtractedPattern, PatternGraph, TagRegistrySchemas
 *
 * ## PipelineDatasetContract - Extraction-to-Assembly Boundary
 *
 * The typed boundary between extraction and graph assembly — the shapes that
 * flow through the projection pipeline's read side. `RawDataset` carries the
 * extracted patterns, tag registry, workflow, context-inference rules, and any
 * feature parse failures into transform; `TransformResult` returns the assembled
 * `RuntimePatternGraph` (a {@link PatternGraph}) alongside a `ValidationSummary`
 * of `DanglingReference`s, unknown statuses, and warning counts. A contract over
 * `ExtractedPattern` records and the tag-registry schemas, not a derived view.
 *
 * ### When to Use
 *
 * - Feeding extracted patterns + tag registry into graph assembly.
 * - Consuming the transform output (graph plus validation summary).
 * - Reporting dangling references or unknown statuses surfaced by transform.
 */
import type { LoadedWorkflow } from '../../config/workflow-loader.js';
import type { ContextInferenceRule } from './context-inference.js';
import type { PatternGraph } from '../../validation-schemas/pattern-graph.js';
import type { PatternParseFailure } from '../../validation-schemas/pattern-graph.js';
import type { ExtractedPattern } from '../../validation-schemas/index.js';
import type { TagRegistry } from '../../validation-schemas/tag-registry.js';

export interface DanglingReference {
  pattern: string;
  field: string;
  missing: string;
}

export interface ValidationSummary {
  totalPatterns: number;
  danglingReferences: DanglingReference[];
  unknownStatuses: string[];
  warningCount: number;
}

export interface TransformResult {
  dataset: RuntimePatternGraph;
  validation: ValidationSummary;
}

export type RuntimePatternGraph = PatternGraph;

export interface RawDataset {
  readonly patterns: readonly ExtractedPattern[];
  readonly tagRegistry: TagRegistry;
  readonly workflow?: LoadedWorkflow | undefined;
  readonly contextInferenceRules?: readonly ContextInferenceRule[] | undefined;
  readonly featureParseFailures?: readonly PatternParseFailure[] | undefined;
}
