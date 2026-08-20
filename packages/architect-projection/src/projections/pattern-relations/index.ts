/**
 * @architect-bounded-context:pattern-relations
 *
 * Re-exports the pattern-relations projection entrypoints and option schemas for bundle, catalog, detail, dependency, neighborhood, and context surfaces.
 */
export { projectArchitectureComparison } from './architecture-comparison.js';
export { projectBoundedContext } from './architecture-context.js';
export {
  projectArchitectureGraph,
  ArchitectureGraphSchema,
  type ArchitectureGraph,
} from './architecture-graph.js';
export { projectArchitectureNeighborhood } from './architecture-neighborhood.js';
export {
  BundleIncludeSchema,
  BundleModeSchema,
  parseAndProjectPatternBundle,
  PatternBundleOptionsSchema,
  projectPatternBundle,
} from './bundle.js';
export { projectDependencyEdges } from './dependency-edges.js';
export {
  parseAndProjectDependencyContext,
  projectDependencyContext,
} from './dependency-context.js';
export {
  OpenQuestionListOptionsSchema,
  parseAndProjectOpenQuestionList,
  projectOpenQuestionList,
} from './open-question-list.js';
export { projectOrphanPatternList } from './orphan-pattern-list.js';
export { parseAndProjectPatternCatalog, projectPatternCatalog } from './pattern-catalog.js';
export type { DepContextOptions } from './dependency-context.js';
export type { OpenQuestionListOptions } from './open-question-list.js';
export type { PatternBundleOptions } from './bundle.js';
export { projectPatternDetail } from './pattern-detail.js';
export { projectPatternSummary } from './pattern-summary.js';
export type { PatternCatalogOptions } from './pattern-catalog.js';
