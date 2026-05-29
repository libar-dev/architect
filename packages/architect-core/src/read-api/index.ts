export type {
  QuerySuccess,
  QueryError,
  QueryErrorCode,
  QueryResult,
  QueryMetadataExtra,
  RoleInfo,
  StatusDistribution,
  PhaseProgress,
  PatternDependencies,
  PatternRelationships,
  QuarterGroup,
  TransitionCheck,
  ProtectionInfo,
  NeighborEntry,
} from './types.js';

export { createSuccess, createError, QueryApiError } from './types.js';

export type { PatternGraphAPI } from './pattern-graph-api.js';
export { createPatternGraphAPI } from './pattern-graph-api.js';

export {
  getPatternName,
  findPatternByName,
  findPatternParseFailure,
  getRelationshipsForPattern,
  getRelationships,
  resolveRoleDefinition,
  suggestPattern,
} from './pattern-helpers.js';

export type { NeighborhoodResult, ContextComparison } from './architecture-inspection.js';
export { computeNeighborhood, compareContexts } from './architecture-inspection.js';

export type { TagUsageReport, SourceInventory, OrphanEntry } from './graph-inventory.js';
export { aggregateTagUsage, buildSourceInventory, findOrphanPatterns } from './graph-inventory.js';

export type { EdgeExternality, DeclaredPatternTarget } from './pattern-classification.js';
export {
  classifyEdgeExternality,
  buildDeclaredPatternIndex,
  inferPackageId,
  resolveUsesTarget,
} from './pattern-classification.js';
