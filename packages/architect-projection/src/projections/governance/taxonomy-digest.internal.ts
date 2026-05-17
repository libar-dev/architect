/**
 * @architect-bounded-context:governance
 */
/**
 * Builds the governance taxonomy digest from the graph's tag registry and optional example overrides.
 */

import type {
  AggregationTagDefinition,
  FormatType,
  MetadataTagDefinition,
  RoleDefinition,
  TagRegistry,
} from '@libar-dev/architect-core';
import { FORMAT_TYPES, METADATA_TAGS_BY_GROUP } from '@libar-dev/architect-core';
import { z } from 'zod';

import type { ProjectionContext, TagExampleOverrides } from '../../context/projection-context.js';
import type { TaxonomyDigest } from '../../fragments/governance/index.js';
import type { TagEntry, TagGroupEntry } from '../../fragments/governance/supporting.js';

const TagExampleOverrideSchema = z
  .strictObject({
    description: z.string().optional(),
    example: z.string().optional(),
  })
  .readonly();

const TagExampleOverridesSchema = z
  .strictObject({
    value: TagExampleOverrideSchema.optional(),
    enum: TagExampleOverrideSchema.optional(),
    'quoted-value': TagExampleOverrideSchema.optional(),
    csv: TagExampleOverrideSchema.optional(),
    number: TagExampleOverrideSchema.optional(),
    flag: TagExampleOverrideSchema.optional(),
  })
  .readonly();

export const TaxonomyDigestOptionsSchema = z
  .strictObject({
    exampleOverrides: TagExampleOverridesSchema.optional(),
  })
  .readonly();

export type TaxonomyDigestOptions = z.infer<typeof TaxonomyDigestOptionsSchema>;

const HIDDEN_TAXONOMY_TAGS = new Set(['title', 'target', 'unlock-reason']);

export function buildTaxonomyDigest(
  context: ProjectionContext,
  options: TaxonomyDigestOptions = {},
): TaxonomyDigest {
  const overrides = cloneExampleOverrides(options.exampleOverrides);
  const tags = buildTaxonomyGroups(context.graph.tagRegistry);
  const formatTypes = buildFormatTypeEntries(overrides);
  const exampleOverrides = toExampleOverrideRecord(overrides);

  return {
    kind: 'TaxonomyDigest',
    tags,
    formatTypes,
    ...(Object.keys(exampleOverrides).length > 0 ? { exampleOverrides } : {}),
  };
}

function buildTaxonomyGroups(registry: TagRegistry): TagGroupEntry[] {
  const groups: TagGroupEntry[] = [];
  const tagPrefix = registry.tagPrefix;

  groups.push({
    groupName: 'Roles',
    entries: [...registry.roles]
      .sort((left, right) => left.priority - right.priority || left.tag.localeCompare(right.tag))
      .map((role) => createRoleTagEntry(role)),
  });

  const metadataGroups = groupMetadataTagsByDomain(
    registry.metadataTags.filter((tag) => !HIDDEN_TAXONOMY_TAGS.has(tag.tag)),
  );
  for (const [groupName, tags] of metadataGroups) {
    groups.push({
      groupName,
      entries: tags.map((tag) => createMetadataTagEntry(tag, tagPrefix)),
    });
  }

  groups.push({
    groupName: 'Aggregation Tags',
    entries: [...registry.aggregationTags]
      .sort((left, right) => left.tag.localeCompare(right.tag))
      .map((tag) => createAggregationTagEntry(tag)),
  });

  return groups.filter((group) => group.entries.length > 0);
}

function createRoleTagEntry(role: RoleDefinition): TagEntry {
  return {
    kind: 'role',
    tag: role.tag,
    purpose: role.description ?? `${role.domain} role`,
    domain: role.domain,
    priority: role.priority,
    ...(role.description !== undefined ? { description: role.description } : {}),
    ...(role.aliases !== undefined && role.aliases.length > 0
      ? { aliases: [...role.aliases] }
      : {}),
  };
}

function createMetadataTagEntry(tag: MetadataTagDefinition, tagPrefix: string): TagEntry {
  return {
    kind: 'metadata',
    tag: tag.tag,
    purpose: tag.purpose,
    format: tag.format,
    ...(tag.required !== undefined ? { required: tag.required } : {}),
    ...(tag.repeatable !== undefined ? { repeatable: tag.repeatable } : {}),
    ...(tag.values !== undefined ? { values: [...tag.values] } : {}),
    ...(tag.default !== undefined ? { defaultValue: tag.default } : {}),
    example: tag.example ?? `${tagPrefix}${tag.tag} ...`,
  };
}

function createAggregationTagEntry(tag: AggregationTagDefinition): TagEntry {
  return {
    kind: 'aggregation',
    tag: tag.tag,
    purpose: tag.purpose,
    ...(tag.targetDoc !== null ? { targetDoc: tag.targetDoc } : {}),
  };
}

function buildFormatTypeEntries(
  overrides: TagExampleOverrides | undefined,
): TaxonomyDigest['formatTypes'] {
  const defaults: Record<FormatType, { description: string; example: string }> = {
    value: { description: 'Simple string value', example: '@architect-pattern MyPattern' },
    enum: {
      description: 'Constrained to predefined values',
      example: '@architect-status roadmap',
    },
    'quoted-value': {
      description: 'String in quotes (preserves spaces)',
      example: '@architect-unlock-reason "Correct post-completion drift"',
    },
    csv: { description: 'Comma-separated values', example: '@architect-uses A, B, C' },
    number: { description: 'Numeric value', example: '@architect-adr 2' },
    flag: { description: 'Boolean presence (no value)', example: '@architect' },
  };

  return FORMAT_TYPES.map((format) => {
    const info = defaults[format];
    const override = overrides?.[format];

    return {
      format,
      description: override?.description ?? info.description,
      example: override?.example ?? info.example,
    };
  });
}

function toExampleOverrideRecord(
  overrides: TagExampleOverrides | undefined,
): Record<string, string> {
  if (overrides === undefined) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(overrides).flatMap(([format, override]) =>
      override.example !== undefined ? [[format, override.example] as const] : [],
    ),
  );
}

function cloneExampleOverrides(
  overrides: TaxonomyDigestOptions['exampleOverrides'],
): TagExampleOverrides | undefined {
  if (overrides === undefined) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(overrides).flatMap(([format, override]) =>
      override === undefined ? [] : [[format, { ...override }] as const],
    ),
  );
}

type GroupKey = keyof typeof METADATA_TAGS_BY_GROUP;

const GROUP_DISPLAY_NAMES: Record<GroupKey, string> = {
  core: 'Core Tags',
  relationship: 'Relationship Tags',
  architecture: 'Architecture Tags',
  process: 'Timeline Tags',
  prd: 'PRD Tags',
  adr: 'ADR Tags',
  hierarchy: 'Hierarchy Tags',
  traceability: 'Traceability Tags',
  discovery: 'Discovery Tags',
  extraction: 'Extraction Tags',
  stub: 'Stub Tags',
  convention: 'Convention Tags',
};

const OTHER_GROUP = 'Other Tags';

const DISPLAY_ORDER: readonly string[] = [
  ...(['core', 'relationship', 'architecture', 'process', 'prd', 'adr'] as const).map(
    (key) => GROUP_DISPLAY_NAMES[key],
  ),
  ...(['hierarchy', 'traceability', 'discovery', 'extraction', 'stub', 'convention'] as const).map(
    (key) => GROUP_DISPLAY_NAMES[key],
  ),
  OTHER_GROUP,
];

const TAG_TO_GROUP_DISPLAY: ReadonlyMap<string, string> = (() => {
  const map = new Map<string, string>();
  for (const [groupKey, tags] of Object.entries(METADATA_TAGS_BY_GROUP) as [
    GroupKey,
    readonly string[],
  ][]) {
    const displayName = GROUP_DISPLAY_NAMES[groupKey];
    for (const tag of tags) {
      map.set(tag, displayName);
    }
  }
  return map;
})();

function groupMetadataTagsByDomain(
  tags: MetadataTagDefinition[],
): [string, MetadataTagDefinition[]][] {
  const groups = new Map<string, MetadataTagDefinition[]>();

  for (const tag of [...tags].sort((left, right) => left.tag.localeCompare(right.tag))) {
    const groupName = getMetadataTagGroup(tag.tag);
    const bucket = groups.get(groupName) ?? [];
    bucket.push(tag);
    groups.set(groupName, bucket);
  }

  return DISPLAY_ORDER.map((groupName): [string, MetadataTagDefinition[]] => [
    groupName,
    groups.get(groupName) ?? [],
  ]).filter((entry) => entry[1].length > 0);
}

function getMetadataTagGroup(tag: string): string {
  return TAG_TO_GROUP_DISPLAY.get(tag) ?? OTHER_GROUP;
}
