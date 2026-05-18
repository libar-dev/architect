/**
 * @architect-bounded-context:documentation-composition
 */
export {
  parseAndProjectArchitectureDiagram,
} from './architecture-diagram.js';
export type { ProjectArchitectureDiagramOptions } from './architecture-diagram.js';
export {
  ProjectConfigOptionsSchema,
  SourceGlobGroupsSchema,
  parseAndProjectConfig,
} from './project-config.js';
export {
  ProjectDocumentationBundleOptionsSchema,
  parseAndProjectDocumentationBundle,
} from './documentation-bundle.js';
export type { ProjectDocumentationBundleOptions } from './documentation-bundle.js';
export { parseAndProjectPrChangeReview } from './pr-change-review.js';
export {
  SupportedDocumentationTypeRegistryEntrySchema,
  SUPPORTED_DOCUMENTATION_TYPE_REGISTRY,
  SUPPORTED_DOCUMENTATION_TYPES,
  getDocumentationTypeMetadata,
  getSupportedDocumentationTypeMetadata,
} from './documentation-type-registry.js';
export { resolveProjectionFilter } from './projection-filter-resolver.js';
export type { ProjectPrChangeReviewOptions } from './pr-change-review.js';
export type { ProjectConfigOptions, SourceGlobGroups } from './project-config.js';
export type {
  DocumentationTypeMetadata,
  SupportedDocumentationTypeRegistryEntry,
  SupportedDocumentationType,
  SupportedDocumentationTypeMetadata,
} from './documentation-type-registry.js';
