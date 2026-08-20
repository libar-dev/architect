export type {
  QueryErrorCode,
  QueryMetadataExtra,
  RoleInfo,
  StatusDistribution,
  PatternDependencies,
  PatternRelationships,
  BusinessRuleRef,
  TransitionCheck,
  ProtectionInfo,
  NeighborEntry,
} from './types.js';

export { getDependencyContext } from './dependency-context.js';
export type { DependencyContext, DependencyContextNode } from './dependency-context.js';

export {
  resolveImplementingFeatures,
  getRulesForPattern,
  ProvenancedRuleSchema,
} from './rule-aggregation.js';
export type { ProvenancedRule } from './rule-aggregation.js';

export {
  getPatternName,
  findPatternByName,
  findPatternParseFailure,
  getRelationshipsForPattern,
  getRelationships,
  resolveRoleDefinition,
  suggestPattern,
} from './pattern-helpers.js';

export {
  isDecisionPattern,
  listDecisionPatterns,
  resolveDecisionPattern,
  canonicalDecisionKey,
} from './decision-resolution.js';

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
