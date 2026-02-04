export { extractPatterns, buildPattern, inferPatternName, inferCategory, hasAggregationTag, getAggregationTags, } from './doc-extractor.js';
// Dual-Source Extraction (USDP)
export { extractProcessMetadata, extractDeliverables, combineSources, validateDualSource, } from './dual-source-extractor.js';
// Layer Inference
export { inferFeatureLayer, FEATURE_LAYERS } from './layer-inference.js';
// Gherkin Extraction (Feature File → Pattern)
export { extractPatternsFromGherkin, extractPatternsFromGherkinAsync, computeHierarchyChildren, } from './gherkin-extractor.js';
// Shape Extraction (ADR-021: Documentation Generation)
export { extractShapes, processExtractShapesTag, renderShapesAsMarkdown, } from './shape-extractor.js';
//# sourceMappingURL=index.js.map