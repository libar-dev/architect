/**
 * @architect-bounded-context:documentation-composition
 */
export {
  parseAndProjectArchitectureDiagram,
  projectArchitectureDiagram,
} from './architecture-diagram.js';
export type { ProjectArchitectureDiagramOptions } from './architecture-diagram.js';
export {
  ProjectConfigOptionsSchema,
  SourceGlobGroupsSchema,
  parseAndProjectConfig,
  projectConfig,
} from './project-config.js';
export {
  ProjectDocumentationBundleOptionsSchema,
  parseAndProjectDocumentationBundle,
  projectDocumentationBundle,
} from './documentation-bundle.js';
export type { ProjectDocumentationBundleOptions } from './documentation-bundle.js';
export { parseAndProjectPrChangeReview, projectPrChangeReview } from './pr-change-review.js';
export {
  ContentRichnessSchema,
  DisclosureSpecSchema,
  GroupingAxisSchema,
} from './disclosure-spec.js';
export {
  SupportedDocumentationTypeRegistryEntrySchema,
  SUPPORTED_DOCUMENTATION_TYPE_REGISTRY,
  SUPPORTED_DOCUMENTATION_TYPES,
  getDocumentationTypeMetadata,
  getSupportedDocumentationTypeMetadata,
} from './documentation-type-registry.js';
export { resolveProjectionFilter } from './projection-filter-resolver.js';
export {
  LogicalRouteIdSchema,
  LogicalRouteSegmentSchema,
  PROGRESSIVE_DISCLOSURE_LEVELS,
  PROGRESSIVE_DISCLOSURE_POLICY,
  ProgressiveDisclosureLevelSchema,
  ProgressiveDisclosurePolicySchema,
  createChildRouteId,
  createEntityRouteId,
  createIndexRouteId,
  isLogicalRouteId,
} from './progressive-disclosure.js';
export type { ProjectPrChangeReviewOptions } from './pr-change-review.js';
export type { ProjectConfigOptions, SourceGlobGroups } from './project-config.js';
export type { ContentRichness, DisclosureSpec, GroupingAxis } from './disclosure-spec.js';
export type {
  DocumentationTypeMetadata,
  SupportedDocumentationTypeRegistryEntry,
  SupportedDocumentationType,
  SupportedDocumentationTypeMetadata,
} from './documentation-type-registry.js';
export type {
  LogicalRouteId,
  ProgressiveDisclosureLevel,
  ProgressiveDisclosurePolicy,
} from './progressive-disclosure.js';
