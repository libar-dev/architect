export {
  extractPatterns,
  buildPattern,
  inferPatternName,
  inferCategory,
  hasAggregationTag,
  getAggregationTags,
  type ExtractionResults,
  type AggregationTags,
} from './doc-extractor.js';

// Re-export generatePatternId from canonical location for backward compatibility
export { generatePatternId } from '../utils/index.js';

// Dual-Source Extraction (USDP)
export {
  extractProcessMetadata,
  extractDeliverables,
  combineSources,
  validateDualSource,
  type ProcessMetadata,
  type Deliverable,
  type DualSourcePattern,
  type CrossValidationError,
  type DualSourceResults,
  type ValidationSummary,
} from './dual-source-extractor.js';

// Layer Inference
export { inferFeatureLayer, FEATURE_LAYERS, type FeatureLayer } from './layer-inference.js';

// Gherkin Extraction (Feature File → Pattern)
export {
  extractPatternsFromGherkin,
  extractPatternsFromGherkinAsync,
  computeHierarchyChildren,
  type GherkinExtractorConfig,
  type GherkinExtractionResult,
} from './gherkin-extractor.js';
