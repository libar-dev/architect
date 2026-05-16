/**
 * @architect-bounded-context:documentation-composition
 */
import { z } from 'zod';

import type { ProjectionContext } from '../../context/projection-context.js';
import type { DisclosureSpec } from './disclosure-spec.js';
import { DisclosureSpecSchema } from './disclosure-spec.js';
import type { ProgressiveDisclosureLevel } from './progressive-disclosure.js';
import {
  createIndexRouteId,
  LogicalRouteIdSchema,
  ProgressiveDisclosureLevelSchema,
} from './progressive-disclosure.js';

type DocumentationDisclosureMatrix = Readonly<Record<ProgressiveDisclosureLevel, DisclosureSpec>>;

const DEFAULT_COMMITTED_FILTER = {
  maturity: ['plan', 'design', 'executable'],
  status: ['active', 'completed'],
} as const satisfies DisclosureSpec['filter'];

const DEFAULT_USEFUL_FILTER = {
  maturity: ['design', 'executable'],
  status: ['active', 'completed'],
} as const satisfies DisclosureSpec['filter'];

const PLANNED_WORK_FILTER = {
  maturity: ['plan', 'design'],
  status: ['roadmap', 'deferred'],
} as const satisfies DisclosureSpec['filter'];

const DisclosureMatrixSchema = z.record(ProgressiveDisclosureLevelSchema, DisclosureSpecSchema);

export const SupportedDocumentationTypeRegistryEntrySchema = z.strictObject({
  key: z.string().min(1),
  displayTitle: z.string().min(1),
  description: z.string().min(1),
  rootRouteId: LogicalRouteIdSchema,
  markdownRootTarget: z.string().regex(/\.md$/u),
  childDirectory: z.string().min(1).optional(),
  status: z.literal('supported'),
  defaultDisclosureLevel: ProgressiveDisclosureLevelSchema,
  disclosureMatrix: DisclosureMatrixSchema,
  generatorName: z.string().min(1),
  generatorAliases: z.array(z.string()),
});

const DroppedDocumentationTypeRegistryEntrySchema = z.strictObject({
  key: z.string().min(1),
  displayTitle: z.string().min(1),
  description: z.string().min(1),
  rootRouteId: LogicalRouteIdSchema,
  markdownRootTarget: z.null(),
  status: z.literal('dropped'),
  defaultDisclosureLevel: ProgressiveDisclosureLevelSchema,
  generatorName: z.null(),
  generatorAliases: z.array(z.string()).length(0),
});

const DocumentationTypeRegistryEntrySchema = z.discriminatedUnion('status', [
  SupportedDocumentationTypeRegistryEntrySchema,
  DroppedDocumentationTypeRegistryEntrySchema,
]);

type DocumentationTypeRegistryEntry = z.infer<typeof DocumentationTypeRegistryEntrySchema>;
export type SupportedDocumentationTypeRegistryEntry = z.infer<
  typeof SupportedDocumentationTypeRegistryEntrySchema
>;

const flatSummaryDisclosureMatrix = disclosureMatrix({
  essential: disclosureSpec('flat', 'summary', false, true),
  important: disclosureSpec('flat', 'summary', false, true),
  useful: disclosureSpec('flat', 'summary', false, true),
  advanced: disclosureSpec('flat', 'summary', false, true),
});

const architectureDisclosureMatrix = flatSummaryDisclosureMatrix;

const decisionsDisclosureMatrix = disclosureMatrix({
  essential: disclosureSpec('flat', 'name-only', false, true),
  important: disclosureSpec('flat', 'summary', true, true),
  useful: disclosureSpec('flat', 'full', true, true),
  advanced: disclosureSpec('flat', 'full', true, true),
});

const businessRulesDisclosureMatrix = disclosureMatrix({
  essential: disclosureSpec('package', 'name-only', true, true),
  important: disclosureSpec('package', 'summary', true, true, undefined, 'navigation'),
  useful: disclosureSpec('feature', 'summary-with-references', false, false),
  advanced: disclosureSpec('feature', 'full', false, false),
});

const patternsDisclosureMatrix = disclosureMatrix({
  essential: disclosureSpec('package', 'name-only', false, true),
  important: disclosureSpec('package', 'summary', false, true),
  useful: disclosureSpec('per-entity', 'full', true, false),
  advanced: disclosureSpec('per-entity', 'full', true, false),
});

const roadmapDisclosureMatrix = disclosureMatrix({
  essential: disclosureSpec('phase', 'summary', false, true, PLANNED_WORK_FILTER),
  important: disclosureSpec('phase', 'summary', true, true, PLANNED_WORK_FILTER),
  useful: disclosureSpec('phase', 'full', true, true, PLANNED_WORK_FILTER),
  advanced: disclosureSpec('phase', 'full', true, true),
});

const currentWorkDisclosureMatrix = flatSummaryDisclosureMatrix;

const requirementsDisclosureMatrix = disclosureMatrix({
  essential: disclosureSpec('package', 'name-only', false, true),
  important: disclosureSpec('package', 'summary', false, true),
  useful: disclosureSpec('per-entity', 'full', true, false),
  advanced: disclosureSpec('per-entity', 'full', true, false),
});

const validationRulesDisclosureMatrix = disclosureMatrix({
  essential: disclosureSpec('flat', 'name-only', false, true),
  important: disclosureSpec('flat', 'summary', false, true),
  useful: disclosureSpec('flat', 'full', false, true),
  advanced: disclosureSpec('flat', 'full', false, true),
});

const taxonomyDisclosureMatrix = disclosureMatrix({
  essential: disclosureSpec('flat', 'summary', false, true),
  important: disclosureSpec('flat', 'full', true, true),
  useful: disclosureSpec('flat', 'full', true, true),
  advanced: disclosureSpec('flat', 'full', true, true),
});

const changelogDisclosureMatrix = flatSummaryDisclosureMatrix;

const traceabilityDisclosureMatrix = disclosureMatrix({
  essential: disclosureSpec('flat', 'summary', false, true),
  important: disclosureSpec('flat', 'full', false, true),
  useful: disclosureSpec('flat', 'full', false, true),
  advanced: disclosureSpec('flat', 'full', false, true),
});

const DOCUMENTATION_TYPE_REGISTRY = Object.freeze([
  {
    key: 'architecture',
    displayTitle: 'Architecture',
    description: 'System structure, relationships, and implementation surfaces.',
    rootRouteId: createIndexRouteId('architecture'),
    markdownRootTarget: 'ARCHITECTURE.md',
    status: 'supported',
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
    status: 'supported',
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
    status: 'supported',
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
    status: 'supported',
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
    status: 'supported',
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
    status: 'supported',
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
    status: 'supported',
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
    status: 'supported',
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
    status: 'supported',
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
    status: 'supported',
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
    status: 'supported',
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
    status: 'supported',
    defaultDisclosureLevel: 'advanced',
    disclosureMatrix: traceabilityDisclosureMatrix,
    generatorName: 'traceability',
    generatorAliases: [],
  },
  {
    key: 'reference',
    displayTitle: 'Reference',
    description: 'Former catch-all reference surface rejected in favor of focused live docs.',
    rootRouteId: createIndexRouteId('reference'),
    markdownRootTarget: null,
    status: 'dropped',
    defaultDisclosureLevel: 'advanced',
    generatorName: null,
    generatorAliases: [],
  },
  {
    key: 'product-areas',
    displayTitle: 'Product Areas',
    description:
      'Former product-area surface rejected in favor of pattern and taxonomy projections.',
    rootRouteId: createIndexRouteId('product-areas'),
    markdownRootTarget: null,
    status: 'dropped',
    defaultDisclosureLevel: 'advanced',
    generatorName: null,
    generatorAliases: [],
  },
  {
    key: 'design-review',
    displayTitle: 'Design Review',
    description: 'Former design-review surface rejected as a live generated documentation type.',
    rootRouteId: createIndexRouteId('design-review'),
    markdownRootTarget: null,
    status: 'dropped',
    defaultDisclosureLevel: 'advanced',
    generatorName: null,
    generatorAliases: [],
  },
  {
    key: 'product-requirements',
    displayTitle: 'Product Requirements',
    description:
      'Rejected monolithic requirements surface replaced by executable and spec-tier requirements.',
    rootRouteId: createIndexRouteId('product-requirements'),
    markdownRootTarget: null,
    status: 'dropped',
    defaultDisclosureLevel: 'advanced',
    generatorName: null,
    generatorAliases: [],
  },
] as const satisfies readonly DocumentationTypeRegistryEntry[]);

DOCUMENTATION_TYPE_REGISTRY.forEach((entry) => {
  DocumentationTypeRegistryEntrySchema.parse(entry);
});

type InternalDocumentationTypeMetadata = (typeof DOCUMENTATION_TYPE_REGISTRY)[number];
export type SupportedDocumentationTypeMetadata = Extract<
  InternalDocumentationTypeMetadata,
  { readonly status: 'supported' }
>;
export type DroppedDocumentationTypeMetadata = Extract<
  InternalDocumentationTypeMetadata,
  { readonly status: 'dropped' }
>;
export type DocumentationTypeMetadata = SupportedDocumentationTypeMetadata;
export type SupportedDocumentationType = SupportedDocumentationTypeMetadata['key'];
export type DroppedDocumentationType = DroppedDocumentationTypeMetadata['key'];

export const SUPPORTED_DOCUMENTATION_TYPE_REGISTRY = Object.freeze(
  DOCUMENTATION_TYPE_REGISTRY.filter(isSupportedDocumentationTypeMetadata).map(
    freezeSupportedDocumentationTypeMetadata
  )
);

export const DROPPED_DOCUMENTATION_TYPE_REGISTRY = Object.freeze(
  DOCUMENTATION_TYPE_REGISTRY.filter(isDroppedDocumentationTypeMetadata).map(
    freezeDroppedDocumentationTypeMetadata
  )
);

export const SUPPORTED_DOCUMENTATION_TYPES = Object.freeze(
  SUPPORTED_DOCUMENTATION_TYPE_REGISTRY.map((entry) => entry.key)
);

export const DROPPED_DOCUMENTATION_TYPES = Object.freeze(
  DROPPED_DOCUMENTATION_TYPE_REGISTRY.map((entry) => entry.key)
);

export function getDocumentationTypeMetadata(key: string): DocumentationTypeMetadata | undefined {
  return SUPPORTED_DOCUMENTATION_TYPE_REGISTRY.find((entry) => entry.key === key);
}

export function isDroppedDocumentationType(key: string): key is DroppedDocumentationType {
  return DROPPED_DOCUMENTATION_TYPE_REGISTRY.some((entry) => entry.key === key);
}

export function getSupportedDocumentationTypeMetadata(
  key: SupportedDocumentationType
): SupportedDocumentationTypeMetadata {
  const metadata = SUPPORTED_DOCUMENTATION_TYPE_REGISTRY.find((entry) => entry.key === key);

  if (metadata === undefined) {
    throw new Error(`Unsupported documentation type: ${key}`);
  }

  return metadata;
}

function isSupportedDocumentationTypeMetadata(
  entry: DocumentationTypeRegistryEntry
): entry is SupportedDocumentationTypeMetadata {
  return entry.status === 'supported';
}

function isDroppedDocumentationTypeMetadata(
  entry: DocumentationTypeRegistryEntry
): entry is DroppedDocumentationTypeMetadata {
  return entry.status === 'dropped';
}

function freezeSupportedDocumentationTypeMetadata(
  entry: SupportedDocumentationTypeMetadata
): SupportedDocumentationTypeMetadata {
  Object.freeze(entry.generatorAliases);
  freezeDisclosureMatrix(entry.disclosureMatrix);
  return Object.freeze(entry);
}

function freezeDroppedDocumentationTypeMetadata(
  entry: DroppedDocumentationTypeMetadata
): DroppedDocumentationTypeMetadata {
  Object.freeze(entry.generatorAliases);
  return Object.freeze(entry);
}

function freezeDisclosureMatrix(
  matrix: SupportedDocumentationTypeMetadata['disclosureMatrix']
): SupportedDocumentationTypeMetadata['disclosureMatrix'] {
  freezeDisclosureSpec(matrix.essential);
  freezeDisclosureSpec(matrix.important);
  freezeDisclosureSpec(matrix.useful);
  freezeDisclosureSpec(matrix.advanced);
  return Object.freeze(matrix);
}

function freezeDisclosureSpec(spec: DisclosureSpec): DisclosureSpec {
  if (spec.filter !== undefined) {
    freezeProjectionFilter(spec.filter);
  }

  return Object.freeze(spec);
}

function freezeProjectionFilter(
  filter: NonNullable<DisclosureSpec['filter']>
): NonNullable<DisclosureSpec['filter']> {
  if (filter.maturity !== undefined) {
    Object.freeze(filter.maturity);
  }

  if (filter.status !== undefined) {
    Object.freeze(filter.status);
  }

  return Object.freeze(filter);
}

function disclosureSpec(
  grouping: DisclosureSpec['grouping'],
  richness: DisclosureSpec['richness'],
  emitChildren: boolean,
  committed: boolean,
  filter?: DisclosureSpec['filter'],
  rootShape?: DisclosureSpec['rootShape']
): DisclosureSpec {
  return {
    grouping,
    richness,
    ...(rootShape !== undefined ? { rootShape } : {}),
    emitChildren,
    committed,
    ...(filter !== undefined ? { filter } : {}),
  };
}

function disclosureMatrix(matrix: DocumentationDisclosureMatrix): DocumentationDisclosureMatrix {
  return {
    essential: { ...matrix.essential, filter: matrix.essential.filter ?? DEFAULT_COMMITTED_FILTER },
    important: { ...matrix.important, filter: matrix.important.filter ?? DEFAULT_COMMITTED_FILTER },
    useful: { ...matrix.useful, filter: matrix.useful.filter ?? DEFAULT_USEFUL_FILTER },
    advanced: omitFilter(matrix.advanced),
  };
}

function omitFilter(spec: DisclosureSpec): DisclosureSpec {
  return {
    grouping: spec.grouping,
    richness: spec.richness,
    ...(spec.rootShape !== undefined ? { rootShape: spec.rootShape } : {}),
    emitChildren: spec.emitChildren,
    committed: spec.committed,
  };
}

export function resolveProjectionFilter(
  context: ProjectionContext,
  documentType: SupportedDocumentationType,
  disclosureLevel?: ProgressiveDisclosureLevel
): DisclosureSpec['filter'] {
  const metadata = getSupportedDocumentationTypeMetadata(documentType);
  const level = disclosureLevel ?? metadata.defaultDisclosureLevel;
  const registryFilter = metadata.disclosureMatrix[level].filter;
  const runtimeFilter = context.projectionFilter;

  if (runtimeFilter === undefined) {
    return registryFilter;
  }

  const merged = {
    ...(registryFilter?.maturity !== undefined ? { maturity: registryFilter.maturity } : {}),
    ...(registryFilter?.status !== undefined ? { status: registryFilter.status } : {}),
    ...(runtimeFilter.maturity !== undefined ? { maturity: runtimeFilter.maturity } : {}),
    ...(runtimeFilter.status !== undefined ? { status: runtimeFilter.status } : {}),
  } satisfies DisclosureSpec['filter'];

  return merged.maturity === undefined && merged.status === undefined ? undefined : merged;
}
