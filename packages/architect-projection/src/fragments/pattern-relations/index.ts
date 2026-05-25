/**
 * @architect
 * @architect-pattern PatternRelationsFragmentContracts
 * @architect-role:contract
 * @architect-bounded-context:pattern-relations
 * @architect-status active
 *
 * ### When to Use
 *
 * - Re-exports the pattern-relations fragment contracts for catalog, detail, bundle, dependency, neighborhood, and context projections.
 */
export { ArchitectureComparisonSchema } from './architecture-comparison.js';
export type { ArchitectureComparison } from './architecture-comparison.js';
export { BoundedContextSchema } from './architecture-context.js';
export type { BoundedContext } from './architecture-context.js';
export { ArchitectureNeighborhoodSchema } from './architecture-neighborhood.js';
export type { ArchitectureNeighborhood } from './architecture-neighborhood.js';
export { DependencyEdgeSchema } from './dependency-edge.js';
export type { DependencyEdge } from './dependency-edge.js';
export { DependencyEdgeSetSchema } from './dependency-edge-set.js';
export type { DependencyEdgeSet } from './dependency-edge-set.js';
export { DependencyTreeSchema } from './dependency-tree.js';
export type { DependencyTree } from './dependency-tree.js';
export { OrphanPatternListSchema } from './orphan-pattern-list.js';
export type { OrphanPatternList } from './orphan-pattern-list.js';
export { OpenQuestionListSchema } from './open-question-list.js';
export type { OpenQuestionList } from './open-question-list.js';
export {
  BundleBlockTokenEstimateSchema,
  BundleIncludeSchema,
  BundleModeSchema,
  BundleScenarioDigestSchema,
  BundleTokenEstimateSchema,
  PatternBundleBlocksSchema,
  PatternBundleEntrySchema,
} from './pattern-bundle-entry.js';
export type {
  BundleBlockTokenEstimate,
  BundleInclude,
  BundleMode,
  BundleScenarioDigest,
  BundleTokenEstimate,
  PatternBundleBlocks,
  PatternBundleEntry,
} from './pattern-bundle-entry.js';
export { PatternCatalogSchema } from './pattern-catalog.js';
export type { PatternCatalog } from './pattern-catalog.js';
export { PatternDetailSchema } from './pattern-detail.js';
export type { PatternDetail } from './pattern-detail.js';
export { PatternSummarySchema } from './pattern-summary.js';
export type { PatternSummary } from './pattern-summary.js';
