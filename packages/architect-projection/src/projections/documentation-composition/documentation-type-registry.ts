/**
 * @architect-bounded-context:documentation-composition
 */
import { z } from 'zod';

import { DisclosureSpecSchema } from '../../disclosure/spec.js';
import {
  architectureDisclosureMatrix,
  businessRulesDisclosureMatrix,
  changelogDisclosureMatrix,
  currentWorkDisclosureMatrix,
  decisionsDisclosureMatrix,
  freezeDisclosureMatrix,
  patternsDisclosureMatrix,
  requirementsDisclosureMatrix,
  roadmapDisclosureMatrix,
  taxonomyDisclosureMatrix,
  traceabilityDisclosureMatrix,
  validationRulesDisclosureMatrix,
} from './disclosure-matrix.js';
import { ProgressiveDisclosureLevelSchema } from '../../disclosure/levels.js';
import { createIndexRouteId, LogicalRouteIdSchema } from '../../routing/route-id.js';

const DisclosureMatrixSchema = z.record(ProgressiveDisclosureLevelSchema, DisclosureSpecSchema);

export const SupportedDocumentationTypeRegistryEntrySchema = z.strictObject({
  key: z.string().min(1),
  displayTitle: z.string().min(1),
  description: z.string().min(1),
  rootRouteId: LogicalRouteIdSchema,
  markdownRootTarget: z.string().regex(/\.md$/u),
  childDirectory: z.string().min(1).optional(),
  defaultDisclosureLevel: ProgressiveDisclosureLevelSchema,
  disclosureMatrix: DisclosureMatrixSchema,
  generatorName: z.string().min(1),
  generatorAliases: z.array(z.string()),
});

export type SupportedDocumentationTypeRegistryEntry = z.infer<
  typeof SupportedDocumentationTypeRegistryEntrySchema
>;

/**
 * Documentation-type registry — closed dispatch table for legacy doc-gen.
 *
 * **DO NOT ADD ENTRIES HERE.** New documentation surfaces must arrive as
 * `DocDefinition` instances via the upcoming doc-gen consolidation campaign
 * (see `.pr-coordination/PROPOSED-DESIGN.md`). This module exists only to
 * carry the 12 pre-campaign entries until they migrate; it will be deleted
 * once the campaign lands.
 */
const DOCUMENTATION_TYPE_REGISTRY = Object.freeze([
  {
    key: 'architecture',
    displayTitle: 'Architecture',
    description: 'System structure, relationships, and implementation surfaces.',
    rootRouteId: createIndexRouteId('architecture'),
    markdownRootTarget: 'ARCHITECTURE.md',
    defaultDisclosureLevel: 'essential',
    disclosureMatrix: architectureDisclosureMatrix,
    generatorName: 'architecture',
    generatorAliases: [],
  },
  {
    key: 'decisions',
    displayTitle: 'Decisions',
    description: 'Architecture decision records and their consequences.',
    rootRouteId: createIndexRouteId('decisions'),
    markdownRootTarget: 'DECISIONS.md',
    childDirectory: 'decisions',
    defaultDisclosureLevel: 'important',
    disclosureMatrix: decisionsDisclosureMatrix,
    generatorName: 'decisions',
    generatorAliases: ['adrs'],
  },
  {
    key: 'business-rules',
    displayTitle: 'Business Rules',
    description: 'Business constraints, invariants, and verification coverage.',
    rootRouteId: createIndexRouteId('business-rules'),
    markdownRootTarget: 'BUSINESS-RULES.md',
    childDirectory: 'business-rules',
    defaultDisclosureLevel: 'important',
    disclosureMatrix: businessRulesDisclosureMatrix,
    generatorName: 'business-rules',
    generatorAliases: [],
  },
  {
    key: 'patterns',
    displayTitle: 'Patterns',
    description: 'Pattern catalog with deliverables, relationships, and rules.',
    rootRouteId: createIndexRouteId('patterns'),
    markdownRootTarget: 'PATTERNS.md',
    childDirectory: 'patterns',
    defaultDisclosureLevel: 'important',
    disclosureMatrix: patternsDisclosureMatrix,
    generatorName: 'patterns',
    generatorAliases: [],
  },
  {
    key: 'roadmap',
    displayTitle: 'Roadmap',
    description: 'Phase-level planning progress and delivery sequencing.',
    rootRouteId: createIndexRouteId('roadmap'),
    markdownRootTarget: 'ROADMAP.md',
    childDirectory: 'roadmap',
    defaultDisclosureLevel: 'important',
    disclosureMatrix: roadmapDisclosureMatrix,
    generatorName: 'roadmap',
    generatorAliases: [],
  },
  {
    key: 'current-work',
    displayTitle: 'Current Work',
    description: 'Active work snapshot across the live pattern graph.',
    rootRouteId: createIndexRouteId('current-work'),
    markdownRootTarget: 'CURRENT-WORK.md',
    defaultDisclosureLevel: 'essential',
    disclosureMatrix: currentWorkDisclosureMatrix,
    generatorName: 'current-work',
    generatorAliases: ['current'],
  },
  {
    key: 'requirements-executable',
    displayTitle: 'Implemented Product Requirements',
    description: 'Requirement digests for value-transfer-complete patterns.',
    rootRouteId: createIndexRouteId('requirements-executable'),
    markdownRootTarget: 'REQUIREMENTS-EXECUTABLE.md',
    childDirectory: 'requirements-executable',
    defaultDisclosureLevel: 'important',
    disclosureMatrix: requirementsDisclosureMatrix,
    generatorName: 'requirements-executable',
    generatorAliases: [],
  },
  {
    key: 'requirements-specs',
    displayTitle: 'Spec-Tier Product Requirements',
    description: 'Requirement digests for design-level specs still in flight.',
    rootRouteId: createIndexRouteId('requirements-specs'),
    markdownRootTarget: 'REQUIREMENTS-SPECS.md',
    childDirectory: 'requirements-specs',
    defaultDisclosureLevel: 'important',
    disclosureMatrix: requirementsDisclosureMatrix,
    generatorName: 'requirements-specs',
    generatorAliases: [],
  },
  {
    key: 'validation-rules',
    displayTitle: 'Validation Rules',
    description: 'Validation rule digest for architecture-linked delivery checks.',
    rootRouteId: createIndexRouteId('validation-rules'),
    markdownRootTarget: 'VALIDATION-RULES.md',
    childDirectory: 'validation',
    defaultDisclosureLevel: 'useful',
    disclosureMatrix: validationRulesDisclosureMatrix,
    generatorName: 'validation-rules',
    generatorAliases: [],
  },
  {
    key: 'taxonomy',
    displayTitle: 'Taxonomy',
    description: 'Registered tags, roles, phases, and related taxonomy metadata.',
    rootRouteId: createIndexRouteId('taxonomy'),
    markdownRootTarget: 'TAXONOMY.md',
    childDirectory: 'taxonomy',
    defaultDisclosureLevel: 'advanced',
    disclosureMatrix: taxonomyDisclosureMatrix,
    generatorName: 'taxonomy',
    generatorAliases: [],
  },
  {
    key: 'changelog',
    displayTitle: 'Changelog',
    description: 'Release notes and recent completed delivery changes.',
    rootRouteId: createIndexRouteId('changelog'),
    markdownRootTarget: 'CHANGELOG.md',
    defaultDisclosureLevel: 'useful',
    disclosureMatrix: changelogDisclosureMatrix,
    generatorName: 'changelog',
    generatorAliases: [],
  },
  {
    key: 'traceability',
    displayTitle: 'Traceability',
    description: 'Traceability links between patterns, files, and execution surfaces.',
    rootRouteId: createIndexRouteId('traceability'),
    markdownRootTarget: 'TRACEABILITY.md',
    childDirectory: 'traceability',
    defaultDisclosureLevel: 'advanced',
    disclosureMatrix: traceabilityDisclosureMatrix,
    generatorName: 'traceability',
    generatorAliases: [],
  },
] as const satisfies readonly SupportedDocumentationTypeRegistryEntry[]);

type InternalDocumentationTypeMetadata = (typeof DOCUMENTATION_TYPE_REGISTRY)[number];
export type SupportedDocumentationTypeMetadata = InternalDocumentationTypeMetadata;
export type DocumentationTypeMetadata = SupportedDocumentationTypeMetadata;
export type SupportedDocumentationType = SupportedDocumentationTypeMetadata['key'];

export const SUPPORTED_DOCUMENTATION_TYPE_REGISTRY = Object.freeze(
  DOCUMENTATION_TYPE_REGISTRY.map(freezeSupportedDocumentationTypeMetadata)
);

export const SUPPORTED_DOCUMENTATION_TYPES = Object.freeze(
  SUPPORTED_DOCUMENTATION_TYPE_REGISTRY.map((entry) => entry.key)
);

const SUPPORTED_BY_KEY: ReadonlyMap<string, SupportedDocumentationTypeMetadata> = new Map(
  SUPPORTED_DOCUMENTATION_TYPE_REGISTRY.map((entry) => [entry.key, entry])
);

export function getDocumentationTypeMetadata(key: string): DocumentationTypeMetadata | undefined {
  return SUPPORTED_BY_KEY.get(key);
}

export function getSupportedDocumentationTypeMetadata(
  key: SupportedDocumentationType
): SupportedDocumentationTypeMetadata {
  const metadata = SUPPORTED_BY_KEY.get(key);

  if (metadata === undefined) {
    throw new Error(`Unsupported documentation type: ${key}`);
  }

  return metadata;
}

export function freezeSupportedDocumentationTypeMetadata(
  entry: SupportedDocumentationTypeMetadata
): SupportedDocumentationTypeMetadata {
  Object.freeze(entry.generatorAliases);
  freezeDisclosureMatrix(entry.disclosureMatrix);
  return Object.freeze(entry);
}
