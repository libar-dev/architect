export {
  extractPatterns,
  buildPattern,
  inferPatternName,
  hasAggregationTag,
  getAggregationTags,
  type AggregationTags,
  type ExtractionResults,
} from './doc-extractor.js';
export {
  extractProcessMetadata,
  extractDeliverables,
  combineSources,
  validateDualSource,
  type CrossValidationError,
  type Deliverable,
  type DualSourcePattern,
  type DualSourceResults,
  type ProcessMetadata,
  type ValidationSummary,
} from './dual-source-extractor.js';
export { inferFeatureLayer, FEATURE_LAYERS, type FeatureLayer } from './layer-inference.js';
export {
  extractPatternsFromGherkin,
  extractPatternsFromGherkinAsync,
  computeHierarchyChildren,
  inferBehaviorFilePath,
  type GherkinExtractionResult,
  type GherkinExtractorConfig,
} from './gherkin-extractor.js';
export {
  discoverTaggedShapes,
  extractShapes,
  type ProcessExtractShapesResult,
} from './shape-extractor.js';
