/**
 * @architect
 * @architect-pattern RegistryBuilder
 * @architect-status active
 * @architect-role:utility
 * @architect-bounded-context:configuration
 *
 * ## RegistryBuilder - Canonical TagRegistry Assembly
 *
 * Assembles the canonical `TagRegistry` from the repo's built-in role, metadata,
 * and aggregation tag definitions. Exports `buildRegistry`, which composes role
 * constants, status/hierarchy values, and format options into the immutable
 * registry that drives tag classification and validation across the toolchain.
 */
import type {
  AggregationTagDefinition,
  MetadataTagDefinition,
  TagRegistry,
  RoleDefinition,
} from '../validation-schemas/tag-registry.js';
import { BUILTIN_ROLES } from '../config/role-constants.js';
import { DEFAULT_FILE_OPT_IN_TAG, DEFAULT_TAG_PREFIX } from '../config/defaults.js';
import {
  ADR_LAYER_VALUES,
  ADR_STATUS_VALUES,
  ADR_THEME_VALUES,
  GLOBAL_FORMAT_OPTIONS,
} from './generator-options.js';
import { HIERARCHY_LEVELS } from './hierarchy-levels.js';
import type { KnownTransformName } from './metadata-transforms.js';
import { ACCEPTED_STATUS_VALUES, DEFAULT_STATUS } from './status-values.js';
import { ADR_CATEGORY_VALUES } from './adr-category-values.js';

export type {
  AggregationTagDefinition as AggregationTagDefinitionForRegistry,
  MetadataTagDefinition as MetadataTagDefinitionForRegistry,
  TagRegistry,
} from '../validation-schemas/tag-registry.js';

interface MutableTagRegistry {
  version: string;
  roles: RoleDefinition[];
  metadataTags: MetadataTagDefinition[];
  aggregationTags: AggregationTagDefinition[];
  formatOptions: string[];
  tagPrefix: string;
  fileOptInTag: string;
}

function cloneRoleDefinitions(roles: readonly RoleDefinition[]): RoleDefinition[] {
  return roles.map((role) => ({
    ...role,
    aliases: [...(role.aliases ?? [])],
  }));
}

export interface RegisteredRoleValue {
  readonly value: RoleDefinition['tag'];
  readonly description?: string;
}

export function buildRegisteredRoleValues(
  roles: readonly RoleDefinition[],
): readonly RegisteredRoleValue[] {
  const registeredByTag = new Map<string, RegisteredRoleValue>();

  for (const role of roles) {
    if (!registeredByTag.has(role.tag)) {
      registeredByTag.set(role.tag, {
        value: role.tag,
        ...(role.description !== undefined ? { description: role.description } : {}),
      });
    }
  }

  return [...registeredByTag.values()].sort((a, b) => a.value.localeCompare(b.value));
}

export const BOUNDED_CONTEXT_TAG = 'bounded-context';

export const METADATA_TAGS_BY_GROUP = {
  core: ['pattern', 'status'] as const,
  relationship: ['uses', 'implements', 'extends', 'see-also', 'enforces-decision'] as const,
  process: ['completed'] as const,
  prd: ['product-area'] as const,
  adr: [
    'adr',
    'adr-status',
    'adr-category',
    'adr-supersedes',
    'adr-superseded-by',
    'adr-theme',
    'adr-layer',
  ] as const,
  hierarchy: ['title'] as const,
  traceability: [] as const,
  discovery: ['shape'] as const,
  architecture: ['role', BOUNDED_CONTEXT_TAG] as const,
  extraction: [] as const,
  stub: ['target'] as const,
  convention: [] as const,
} as const;

const PAD_ADR_TRANSFORM: KnownTransformName = 'padAdr';
const STRIP_QUOTES_TRANSFORM: KnownTransformName = 'stripQuotes';

export function registerUnifiedRoleTaxonomy(
  registry: MutableTagRegistry,
  roles: readonly RoleDefinition[],
): void {
  const registeredRoles = buildRegisteredRoleValues(roles);

  registry.metadataTags = registry.metadataTags.filter(
    (tag) =>
      ![
        'arch-role',
        'arch-context',
        'arch-layer',
        'role',
        'context',
        'layer',
        BOUNDED_CONTEXT_TAG,
      ].includes(tag.tag),
  );

  const exampleRoleValue = roles[0]?.tag ?? 'service';

  registry.metadataTags = [
    ...registry.metadataTags,
    {
      tag: 'role',
      format: 'value',
      purpose: 'Canonical role tag for pattern classification and architecture grouping',
      values: registeredRoles.map((role) => role.value),
      example: `@architect-role ${exampleRoleValue}`,
      metadataKey: 'role',
    },
    {
      tag: BOUNDED_CONTEXT_TAG,
      format: 'value',
      purpose: 'Canonical bounded-context grouping for structural and subgraph views',
      example: '@architect-bounded-context delivery-reporting',
      metadataKey: 'boundedContext',
    },
  ];
}

export interface BuildRegistryOptions {
  readonly roles?: readonly RoleDefinition[];
  /**
   * Per ADR-001 Rule 1 (D-8 reshape): productAreas are organizational and
   * project-specific, with no universal default. When this list is provided,
   * the `product-area` tag's registry entry gets a `values:` list that the
   * value-format dispatch validates against (emitting `invalid-enum-value`
   * diagnostics for unrecognized values). When absent, the entry has no
   * `values:` and the tag stays unconstrained.
   */
  readonly productAreas?: readonly string[];
}

export function buildRegistry(options: BuildRegistryOptions = {}): TagRegistry {
  const roles = options.roles ?? BUILTIN_ROLES;
  const productAreas = options.productAreas;
  const registry: MutableTagRegistry = {
    version: '2.0.0',
    roles: cloneRoleDefinitions(roles),
    metadataTags: [
      {
        tag: 'pattern',
        format: 'value',
        purpose: 'Explicit pattern name',
        required: true,
        example: '@architect-pattern CommandOrchestrator',
      },
      {
        tag: 'status',
        format: 'enum',
        purpose: 'Work item lifecycle status (per PDR-005 FSM)',
        values: [...ACCEPTED_STATUS_VALUES],
        default: DEFAULT_STATUS,
        example: '@architect-status roadmap',
      },
      {
        tag: 'unlock-reason',
        format: 'quoted-value',
        purpose: 'Reason for intentionally modifying a completed pattern despite hard lock',
        example: '@architect-unlock-reason "Correct post-completion process drift"',
        metadataKey: 'unlockReason',
      },
      {
        tag: 'uses',
        format: 'csv',
        purpose: 'Patterns this depends on',
        example: '@architect-uses CommandBus, EventStore',
      },
      {
        tag: 'level',
        format: 'enum',
        purpose:
          'Hierarchy-axis level (epic / phase / task / slice). Independent of lifecycle status (see @architect-status).',
        values: [...HIERARCHY_LEVELS],
        example: '@architect-level epic',
      },
      {
        tag: 'parent',
        format: 'value',
        purpose:
          'Hierarchy-axis parent edge. Target must carry @architect-level at a strictly higher level.',
        example: '@architect-parent LifecycleMvpEpic',
      },
      {
        tag: 'implements',
        format: 'csv',
        purpose: 'Patterns this code file realizes (realization relationship)',
        metadataKey: 'implementsPatterns',
        example: '@architect-implements EventStoreDurability, IdempotentAppend',
      },
      {
        tag: 'extends',
        format: 'value',
        purpose: 'Base pattern this pattern extends (generalization relationship)',
        metadataKey: 'extendsPattern',
        example: '@architect-extends ProjectionCategories',
      },
      {
        tag: 'completed',
        format: 'value',
        purpose: 'Completion date (YYYY-MM-DD format)',
        example: '@architect-completed 2026-01-08',
      },
      {
        tag: 'product-area',
        format: 'value',
        purpose: 'Product area for PRD grouping (per ADR-001 Rule 1)',
        ...(productAreas !== undefined ? { values: [...productAreas] } : {}),
        example: '@architect-product-area Annotation',
      },
      {
        tag: 'adr',
        format: 'value',
        purpose: 'ADR/PDR number for decision tracking',
        transform: PAD_ADR_TRANSFORM,
        example: '@architect-adr 015',
      },
      {
        tag: 'adr-status',
        format: 'enum',
        purpose: 'ADR/PDR decision status',
        values: [...ADR_STATUS_VALUES],
        default: 'proposed',
        example: '@architect-adr-status accepted',
      },
      {
        tag: 'adr-category',
        format: 'value',
        purpose: 'ADR/PDR category (per ADR-001 Rule 2)',
        values: [...ADR_CATEGORY_VALUES],
        example: '@architect-adr-category architecture',
      },
      {
        tag: 'adr-supersedes',
        format: 'value',
        purpose: 'ADR/PDR number this decision supersedes',
        transform: PAD_ADR_TRANSFORM,
        example: '@architect-adr-supersedes 012',
      },
      {
        tag: 'adr-superseded-by',
        format: 'value',
        purpose: 'ADR/PDR number that supersedes this decision',
        transform: PAD_ADR_TRANSFORM,
        example: '@architect-adr-superseded-by 020',
      },
      {
        tag: 'adr-theme',
        format: 'enum',
        purpose: 'Theme grouping for related decisions (from synthesis)',
        values: [...ADR_THEME_VALUES],
        example: '@architect-adr-theme persistence',
      },
      {
        tag: 'adr-layer',
        format: 'enum',
        purpose: 'Evolutionary layer of the decision',
        values: [...ADR_LAYER_VALUES],
        example: '@architect-adr-layer foundation',
      },
      {
        tag: 'title',
        format: 'quoted-value',
        purpose: 'Human-readable display title (supports quoted values with spaces)',
        transform: STRIP_QUOTES_TRANSFORM,
        example: '@architect-title:"Process Guard Linter"',
      },
      {
        tag: 'see-also',
        format: 'csv',
        purpose: 'Related patterns for cross-reference without dependency implication',
        example: '@architect-see-also AgentAsBoundedContext, CrossContextIntegration',
      },
      {
        tag: 'enforces-decision',
        format: 'csv',
        purpose:
          'Decision records (ADR/PDR/…) whose invariants this feature/pattern enforces — the structured ADR→enforcing-rule edge',
        metadataKey: 'enforcesDecisions',
        example:
          '@architect-enforces-decision ADR009ProjectionTrustBoundary, ADR006SingleReadModelArchitecture',
      },
      {
        tag: 'target',
        format: 'value',
        purpose: 'Target implementation path for stub files',
        example: '@architect-target src/api/stub-resolver.ts',
      },
      {
        tag: 'shape',
        format: 'flag',
        purpose:
          'Marks an exported declaration (interface / type / enum / const / function) for API-reference shape extraction. An optional trailing group label clusters related shapes; per-shape data is discovered from the AST, not from this presence marker.',
        example: '@architect-shape',
      },
    ],
    aggregationTags: [
      {
        tag: 'overview',
        targetDoc: 'OVERVIEW.md',
        purpose: 'Architecture overview patterns',
      },
      {
        tag: 'decision',
        targetDoc: 'DECISIONS.md',
        purpose: 'ADR-style decisions (auto-numbered)',
      },
      {
        tag: 'intro',
        targetDoc: null,
        purpose: 'Package introduction (template placeholder)',
      },
    ],
    formatOptions: [...GLOBAL_FORMAT_OPTIONS],
    tagPrefix: DEFAULT_TAG_PREFIX,
    fileOptInTag: DEFAULT_FILE_OPT_IN_TAG,
  };

  registerUnifiedRoleTaxonomy(registry, roles);

  return registry;
}
