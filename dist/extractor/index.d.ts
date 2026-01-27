export { extractPatterns, buildPattern, inferPatternName, inferCategory, hasAggregationTag, getAggregationTags, type ExtractionResults, type AggregationTags, } from './doc-extractor.js';
export { generatePatternId } from '../utils/index.js';
export { extractProcessMetadata, extractDeliverables, combineSources, validateDualSource, type ProcessMetadata, type Deliverable, type DualSourcePattern, type CrossValidationError, type DualSourceResults, type ValidationSummary, } from './dual-source-extractor.js';
export { inferFeatureLayer, FEATURE_LAYERS, type FeatureLayer } from './layer-inference.js';
export { extractPatternsFromGherkin, extractPatternsFromGherkinAsync, computeHierarchyChildren, type GherkinExtractorConfig, type GherkinExtractionResult, } from './gherkin-extractor.js';
//# sourceMappingURL=index.d.ts.map