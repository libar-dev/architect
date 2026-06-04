/**
 * @architect
 * @architect-pattern ProjectionFragmentSchema
 * @architect-role:contract
 * @architect-bounded-context:rendering
 * @architect-status active
 *
 * ### When to Use
 *
 * - Defines the discriminated union that collects every projection fragment
 *   kind into one read model.
 */
import { z } from 'zod';

import {
  ArchitectureComparisonSchema,
  BoundedContextSchema,
  ArchitectureNeighborhoodSchema,
  DependencyEdgeSchema,
  DependencyEdgeSetSchema,
  DependencyContextSchema,
  PatternBundleEntrySchema,
  OpenQuestionListSchema,
  OrphanPatternListSchema,
  PatternCatalogSchema,
  PatternDetailSchema,
  PatternSummarySchema,
} from './pattern-relations/index.js';
import {
  PhaseProgressSchema,
  ReleaseNotesDigestSchema,
  StatusDistributionSchema,
  TraceabilityMatrixSchema,
} from './delivery-reporting/index.js';
import { RoadmapTimelineSchema as InternalRoadmapTimelineSchema } from './delivery-reporting/roadmap-timeline.js';
import {
  BusinessRuleReferenceSchema,
  BusinessRuleSchema,
  BusinessRuleSetSchema,
  DecisionCatalogSchema,
  DecisionRecordSchema,
  TaxonomyDigestSchema,
  ValidationRuleDigestSchema,
} from './governance/index.js';
import {
  DeliverableManifestSchema,
  DeliverableSchema,
  FileReadingListSchema,
  HandoffRecordSchema,
  ScopeReadinessCheckSchema,
  ScopeReadinessReportSchema,
  SessionContextBundleSchema,
} from './execution-context/index.js';
import {
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
import {
  ApiReferenceDigestSchema,
  ArchitectureDiagramSchema,
  PrChangeReviewSchema,
  ProjectConfigSnapshotSchema,
} from './documentation-composition/index.js';

export const FragmentSchema = z.discriminatedUnion('kind', [
  PatternCatalogSchema,
  BoundedContextSchema,
  ArchitectureComparisonSchema,
  PatternSummarySchema,
  PatternBundleEntrySchema,
  PatternDetailSchema,
  DependencyEdgeSchema,
  DependencyContextSchema,
  ArchitectureNeighborhoodSchema,
  OpenQuestionListSchema,
  OrphanPatternListSchema,
  PhaseProgressSchema,
  StatusDistributionSchema,
  InternalRoadmapTimelineSchema,
  ReleaseNotesDigestSchema,
  TraceabilityMatrixSchema,
  DecisionRecordSchema,
  DecisionCatalogSchema,
  BusinessRuleReferenceSchema,
  BusinessRuleSchema,
  BusinessRuleSetSchema,
  ValidationRuleDigestSchema,
  TaxonomyDigestSchema,
  SessionContextBundleSchema,
  ScopeReadinessCheckSchema,
  ScopeReadinessReportSchema,
  HandoffRecordSchema,
  FileReadingListSchema,
  DeliverableSchema,
  DeliverableManifestSchema,
  OverviewDigestSchema,
  AnnotationCoverageSchema,
  TagUsageEntrySchema,
  TagUsageMatrixSchema,
  SourceInventoryEntrySchema,
  SourceInventoryDigestSchema,
  RoleProfileSchema,
  RoleProfileCollectionSchema,
  RequirementDigestSchema,
  ProjectConfigSnapshotSchema,
  ArchitectureDiagramSchema,
  ApiReferenceDigestSchema,
  PrChangeReviewSchema,
  DependencyEdgeSetSchema,
]);

export type Fragment = z.infer<typeof FragmentSchema>;
export type FragmentKind = Fragment['kind'];
export type FragmentByKind<K extends FragmentKind> = Extract<Fragment, { kind: K }>;
