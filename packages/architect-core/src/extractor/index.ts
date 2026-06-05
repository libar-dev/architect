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
  type Deliverable,
  type DualSourcePattern,
  type DualSourceResults,
  type ProcessMetadata,
  type ValidationSummary,
} from './dual-source-extractor.js';
export { inferFeatureLayer, type FeatureLayer } from './layer-inference.js';
export {
  extractPatternsFromGherkin,
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
