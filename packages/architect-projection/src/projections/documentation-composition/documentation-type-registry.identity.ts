/**
 * @architect
 * @architect-pattern DocumentationTypeIdentity
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:documentation-composition
 * @architect-uses LogicalRouteId
 *
 * ## DocumentationTypeIdentity - The Closed Set of Documentation Types
 *
 * `SUPPORTED_DOCUMENTATION_TYPE_IDENTITIES` is the closed set of 14 documentation
 * types — each a `key` / `displayTitle` / `description` / `rootRouteId` tuple —
 * plus the derived `SupportedDocumentationType` key union and the
 * `DocumentationTypeIdentity` record type. This is the identity backbone the
 * multi-file `DocumentationTypeRegistry` constellation keys off: every doc type
 * a projection can emit, its UI title, and the `LogicalRouteId` that roots it.
 *
 * ### When to Use
 *
 * - Enumerating or validating the supported documentation types.
 * - Resolving a doc type's display title or root route id.
 * - Narrowing a raw string to the `SupportedDocumentationType` union.
 */
import type { LogicalRouteId } from '../../routing/route-id.js';
import { createIndexRouteId } from '../../routing/route-id.js';

type DocumentationTypeIdentityDefinition = Readonly<{
  key: string;
  displayTitle: string;
  description: string;
  rootRouteId: LogicalRouteId;
}>;

export const SUPPORTED_DOCUMENTATION_TYPE_IDENTITIES = [
  {
    key: 'architecture',
    displayTitle: 'Architecture',
    description: 'System structure, relationships, and implementation surfaces.',
    rootRouteId: createIndexRouteId('architecture'),
  },
  {
    key: 'design-review',
    displayTitle: 'Design Review',
    description:
      'Component diagrams over the live graph including not-yet-implemented specs, for spec-driven design work.',
    rootRouteId: createIndexRouteId('design-review'),
  },
  {
    key: 'api-reference',
    displayTitle: 'API Reference',
    description: 'Type and API surface (shapes) extracted from @architect-shape annotations.',
    rootRouteId: createIndexRouteId('api-reference'),
  },
  {
    key: 'decisions',
    displayTitle: 'Decisions',
    description: 'Architecture decision records and their consequences.',
    rootRouteId: createIndexRouteId('decisions'),
  },
  {
    key: 'business-rules',
    displayTitle: 'Business Rules',
    description: 'Business constraints, invariants, and verification coverage.',
    rootRouteId: createIndexRouteId('business-rules'),
  },
  {
    key: 'patterns',
    displayTitle: 'Patterns',
    description: 'Pattern catalog with deliverables, relationships, and rules.',
    rootRouteId: createIndexRouteId('patterns'),
  },
  {
    key: 'roadmap',
    displayTitle: 'Roadmap',
    description: 'Phase-level planning progress and delivery sequencing.',
    rootRouteId: createIndexRouteId('roadmap'),
  },
  {
    key: 'current-work',
    displayTitle: 'Current Work',
    description: 'Active work snapshot across the live pattern graph.',
    rootRouteId: createIndexRouteId('current-work'),
  },
  {
    key: 'requirements-executable',
    displayTitle: 'Implemented Product Requirements',
    description: 'Requirement digests for value-transfer-complete patterns.',
    rootRouteId: createIndexRouteId('requirements-executable'),
  },
  {
    key: 'requirements-specs',
    displayTitle: 'Spec-Tier Product Requirements',
    description: 'Requirement digests for design-level specs still in flight.',
    rootRouteId: createIndexRouteId('requirements-specs'),
  },
  {
    key: 'validation-rules',
    displayTitle: 'Validation Rules',
    description: 'Validation rule digest for architecture-linked delivery checks.',
    rootRouteId: createIndexRouteId('validation-rules'),
  },
  {
    key: 'taxonomy',
    displayTitle: 'Taxonomy',
    description: 'Registered tags, roles, phases, and related taxonomy metadata.',
    rootRouteId: createIndexRouteId('taxonomy'),
  },
  {
    key: 'changelog',
    displayTitle: 'Changelog',
    description: 'Release notes and recent completed delivery changes.',
    rootRouteId: createIndexRouteId('changelog'),
  },
  {
    key: 'traceability',
    displayTitle: 'Traceability',
    description: 'Traceability links between patterns, files, and execution surfaces.',
    rootRouteId: createIndexRouteId('traceability'),
  },
] as const satisfies readonly DocumentationTypeIdentityDefinition[];

export type SupportedDocumentationType =
  (typeof SUPPORTED_DOCUMENTATION_TYPE_IDENTITIES)[number]['key'];

export type DocumentationTypeIdentity = (typeof SUPPORTED_DOCUMENTATION_TYPE_IDENTITIES)[number];
