export {
  transformToPatternGraph,
  transformToPatternGraphWithValidation,
} from './transform-dataset.js';
export type { ContextInferenceRule } from './context-inference.js';
export type {
  DanglingReference,
  MalformedPattern,
  RawDataset,
  RuntimePatternGraph,
  TransformResult,
  ValidationSummary,
} from './transform-types.js';
export { mergePatterns } from './merge-patterns.js';
export {
  buildPatternGraph,
  type BuildResult,
  type PipelineError,
  type PipelineOptions,
  type PipelineWarning,
  type PipelineWarningDetail,
  type ScanMetadata,
} from './build-pipeline.js';
