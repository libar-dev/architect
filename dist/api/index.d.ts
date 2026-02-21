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
export type { QuerySuccess, QueryError, QueryErrorCode, QueryResult, StatusCounts, StatusDistribution, PhaseProgress, PhaseGroup, PatternDependencies, PatternRelationships, PatternDeliverable, QuarterGroup, TransitionCheck, ProtectionInfo, } from './types.js';
export { createSuccess, createError, QueryApiError } from './types.js';
export type { NeighborEntry } from './types.js';
export type { ProcessStateAPI } from './process-state.js';
export { createProcessStateAPI } from './process-state.js';
export type { PatternSummary } from './summarize.js';
export { PatternSummarySchema, SUMMARY_FIELDS, summarizePattern, summarizePatterns, } from './summarize.js';
export type { FuzzyMatch } from './fuzzy-match.js';
export { fuzzyMatchPatterns, findBestMatch } from './fuzzy-match.js';
export { getPatternName, findPatternByName, getRelationships, allPatternNames, suggestPattern, firstImplements, } from './pattern-helpers.js';
export type { StubResolution, StubSummary, DecisionItem, PdrReference } from './stub-resolver.js';
export { findStubPatterns, resolveStubs, groupStubsByPattern, extractDecisionItems, findPdrReferences, } from './stub-resolver.js';
export type { SessionType, ContextOptions, DepTreeOptions, PatternContextMeta, StubRef, DepEntry, DeliverableEntry, FsmContext, ContextBundle, DepTreeNode, FileReadingList, ProgressSummary, ActivePhaseSummary, BlockingEntry, OverviewSummary, } from './context-assembler.js';
export { isValidSessionType, assembleContext, buildDepTree, buildFileReadingList, buildOverview, } from './context-assembler.js';
export { formatContextBundle, formatDepTree, formatFileReadingList, formatOverview, } from './context-formatter.js';
export type { NeighborhoodResult, ContextComparison, TagUsageReport, SourceInventory, } from './arch-queries.js';
export { computeNeighborhood, compareContexts, aggregateTagUsage, buildSourceInventory, } from './arch-queries.js';
export type { CoverageReport } from './coverage-analyzer.js';
export { analyzeCoverage, findUnannotatedFiles, findUnusedTaxonomy } from './coverage-analyzer.js';
export type { RulesFilters, RuleOutput, RulesQueryResult } from './rules-query.js';
export { queryBusinessRules } from './rules-query.js';
export { deriveSource } from './summarize.js';
//# sourceMappingURL=index.d.ts.map