/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern APIModule
 * @libar-docs-status active
 *
 * ## API Module - Programmatic Process State Interface
 *
 * Central export for the Process State API, providing a TypeScript
 * interface for querying delivery process state.
 *
 * ### When to Use
 *
 * - When building tools that need programmatic access to delivery process state
 * - When integrating with Claude Code for real-time process queries
 * - When building CI/CD pipelines that validate delivery workflow
 *
 * ### Usage
 *
 * ```typescript
 * import {
 *   createProcessStateAPI,
 *   type ProcessStateAPI,
 *   type QueryResult,
 * } from "@libar-dev/delivery-process/api";
 *
 * const api = createProcessStateAPI(masterDataset);
 *
 * // Query current work
 * const activeWork = api.getCurrentWork();
 *
 * // Check FSM transition
 * const check = api.checkTransition("roadmap", "active");
 * if (check.valid) {
 *   console.log("Transition is valid");
 * }
 * ```
 */
export { createSuccess, createError, QueryApiError } from './types.js';
export { createProcessStateAPI } from './process-state.js';
export { PatternSummarySchema, SUMMARY_FIELDS, summarizePattern, summarizePatterns, } from './summarize.js';
export { fuzzyMatchPatterns, findBestMatch } from './fuzzy-match.js';
// Pattern Helpers
export { getPatternName, findPatternByName, getRelationships, allPatternNames, suggestPattern, firstImplements, } from './pattern-helpers.js';
export { findStubPatterns, resolveStubs, groupStubsByPattern, extractDecisionItems, findPdrReferences, } from './stub-resolver.js';
export { isValidSessionType, assembleContext, buildDepTree, buildFileReadingList, buildOverview, } from './context-assembler.js';
// Context Formatting
export { formatContextBundle, formatDepTree, formatFileReadingList, formatOverview, } from './context-formatter.js';
export { computeNeighborhood, compareContexts, aggregateTagUsage, buildSourceInventory, } from './arch-queries.js';
export { analyzeCoverage, findUnannotatedFiles, findUnusedTaxonomy } from './coverage-analyzer.js';
// Pattern Summarization (extended)
export { deriveSource } from './summarize.js';
//# sourceMappingURL=index.js.map