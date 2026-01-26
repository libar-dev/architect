export { extractPatterns, buildPattern, inferPatternName, inferCategory, hasAggregationTag, getAggregationTags, } from "./doc-extractor.js";
// Re-export generatePatternId from canonical location for backward compatibility
export { generatePatternId } from "../utils/index.js";
// Dual-Source Extraction (USDP)
export { extractProcessMetadata, extractDeliverables, combineSources, validateDualSource, } from "./dual-source-extractor.js";
// Layer Inference
export { inferFeatureLayer, FEATURE_LAYERS } from "./layer-inference.js";
// Gherkin Extraction (Feature File → Pattern)
export { extractPatternsFromGherkin, extractPatternsFromGherkinAsync, computeHierarchyChildren, } from "./gherkin-extractor.js";
//# sourceMappingURL=index.js.map