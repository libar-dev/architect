import type { LoadedWorkflow } from '../../config/workflow-loader.js';
import type { ContextInferenceRule } from './context-inference.js';
import type { PatternGraph } from '../../validation-schemas/pattern-graph.js';
import type { PatternParseFailure } from '../../validation-schemas/pattern-graph.js';
import type { ExtractedPattern } from '../../validation-schemas/index.js';
import type { TagRegistry } from '../../validation-schemas/tag-registry.js';

export interface MalformedPattern {
  patternId: string;
  issues: string[];
}

export interface DanglingReference {
  pattern: string;
  field: string;
  missing: string;
}

export interface ValidationSummary {
  totalPatterns: number;
  malformedPatterns: MalformedPattern[];
  danglingReferences: DanglingReference[];
  unknownStatuses: string[];
  warningCount: number;
}

export interface TransformResult {
  dataset: RuntimePatternGraph;
  validation: ValidationSummary;
}

export interface RuntimePatternGraph extends PatternGraph {
  readonly workflow?: LoadedWorkflow;
}

export interface RawDataset {
  readonly patterns: readonly ExtractedPattern[];
  readonly tagRegistry: TagRegistry;
  readonly workflow?: LoadedWorkflow | undefined;
  readonly contextInferenceRules?: readonly ContextInferenceRule[] | undefined;
  readonly featureParseFailures?: readonly PatternParseFailure[] | undefined;
}
