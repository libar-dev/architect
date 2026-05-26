/**
 * @architect
 * @architect-pattern ProjectionFragmentContracts
 * @architect-role:contract
 * @architect-status active
 *
 * ### When to Use
 *
 * - Re-exports the projection fragment contracts across pattern-relations,
 *   delivery-reporting, governance, execution-context, operational-insights,
 *   and documentation-composition.
 */
export {
  ArchitectureComparisonSchema,
  BoundedContextSchema,
  ArchitectureNeighborhoodSchema,
  DependencyEdgeSchema,
  DependencyEdgeSetSchema,
  DependencyTreeSchema,
  PatternBundleEntrySchema,
  OpenQuestionListSchema,
  OrphanPatternListSchema,
  PatternCatalogSchema,
  PatternDetailSchema,
  PatternSummarySchema,
} from './pattern-relations/index.js';
export {
  PhaseProgressSchema,
  RoadmapTimelineSchema,
  ReleaseNotesDigestSchema,
  StatusDistributionSchema,
  TraceabilityMatrixSchema,
} from './delivery-reporting/index.js';
export {
  BusinessRuleReferenceSchema,
  BusinessRuleSchema,
  BusinessRuleSetSchema,
  DecisionCatalogSchema,
  DecisionRecordSchema,
  TaxonomyDigestCountSummarySchema,
  TaxonomyDigestSchema,
  ValidationRuleDigestSchema,
} from './governance/index.js';
export {
  DeliverableManifestSchema,
  DeliverableSchema,
  FileReadingListSchema,
  HandoffRecordSchema,
  ScopeReadinessCheckSchema,
  ScopeReadinessReportSchema,
  SessionContextBundleSchema,
} from './execution-context/index.js';
export {
  AnnotationCoverageSchema,
  OverviewDigestSchema,
  RequirementDigestSchema,
  RoleProfileCollectionSchema,
  RoleProfileSchema,
  SourceInventoryDigestSchema,
  SourceInventoryEntrySchema,
  TagUsageEntrySchema,
  TagUsageMatrixSchema,
} from './operational-insights/index.js';
export {
  ApiReferenceDigestSchema,
  ApiShapeSchema,
  ApiShapeKindSchema,
  ArchitectureDiagramSchema,
  PrChangeReviewSchema,
  ProjectConfigSnapshotSchema,
} from './documentation-composition/index.js';
export { FragmentSchema } from './fragment-schema.internal.js';
export { isBundle, projectSingle } from './base.js';
export type { BundleRouting, ProjectionBundle } from './base.js';
export type {
  ArchitectureComparison,
  BoundedContext,
  ArchitectureNeighborhood,
  DependencyEdge,
  DependencyEdgeSet,
  DependencyTree,
  PatternBundleEntry,
  OpenQuestionList,
  OrphanPatternList,
  PatternCatalog,
  PatternDetail,
  PatternSummary,
} from './pattern-relations/index.js';
export type {
  PhaseProgress,
  RoadmapTimeline,
  ReleaseNotesDigest,
  StatusDistribution,
  TraceabilityMatrix,
} from './delivery-reporting/index.js';
export type {
  BusinessRuleReference,
  BusinessRule,
  BusinessRuleSet,
  DecisionCatalog,
  DecisionRecord,
  TaxonomyDigest,
  TaxonomyDigestCountSummary,
  ValidationRuleDigest,
} from './governance/index.js';
export type {
  Deliverable,
  DeliverableManifest,
  FileReadingList,
  HandoffRecord,
  ScopeReadinessCheck,
  ScopeReadinessReport,
  SessionContextBundle,
} from './execution-context/index.js';
export type {
  AnnotationCoverage,
  OverviewDigest,
  RequirementDigest,
  RoleProfile,
  RoleProfileCollection,
  SourceInventoryDigest,
  SourceInventoryEntry,
  TagUsageEntry,
  TagUsageMatrix,
} from './operational-insights/index.js';
export type {
  ApiReferenceDigest,
  ApiReferenceGroupingEntry,
  ApiShape,
  ApiShapeKind,
  ArchitectureDiagram,
  PrChangeReview,
  ProjectConfigSnapshot,
} from './documentation-composition/index.js';
export type { Fragment, FragmentByKind, FragmentKind } from './fragment-schema.internal.js';
