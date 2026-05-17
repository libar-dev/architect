import { z } from 'zod';

import { DIAGRAM_SHAPE_VALUES, FORMAT_TYPES, buildRegistry } from '../taxonomy/index.js';
import type { RoleDefinition as ConfigRoleDefinition } from '../config/role-constants.js';
import type {
  AggregationTagDefinition,
  MetadataTagDefinition,
  TagRegistry,
} from '../config/tag-registry-contract.js';

export const RoleDefinitionSchema = z.strictObject({
  tag: z.string().min(1, 'Role tag cannot be empty').max(100),
  domain: z.string().min(1, 'Role domain cannot be empty').max(200),
  priority: z.number().int().positive('Priority must be a positive integer'),
  description: z.string().max(1000).optional(),
  aliases: z.array(z.string().max(100)).max(20).optional().default([]),
  diagramShape: z.enum(DIAGRAM_SHAPE_VALUES).optional(),
});

export type RoleDefinition = ConfigRoleDefinition;

export const MetadataTagDefinitionSchema = z.strictObject({
  tag: z.string().min(1, 'Metadata tag cannot be empty').max(100),
  format: z.enum(FORMAT_TYPES),
  purpose: z.string().max(1000),
  required: z.boolean().optional().default(false),
  repeatable: z.boolean().optional().default(false),
  values: z.array(z.string().max(200)).max(50).optional(),
  default: z.string().max(200).optional(),
  example: z.string().max(500).optional(),
  metadataKey: z.string().max(100).optional(),
  transform: z.function().optional(),
});

export const AggregationTagDefinitionSchema = z.strictObject({
  tag: z.string().min(1, 'Aggregation tag cannot be empty').max(100),
  targetDoc: z.string().max(200).nullable(),
  purpose: z.string().max(1000),
});

export const TagRegistrySchema = z.strictObject({
  $schema: z.string().max(500).optional(),
  version: z.string().max(20).default('1.0.0'),
  roles: z.array(RoleDefinitionSchema).max(1000),
  metadataTags: z.array(MetadataTagDefinitionSchema).max(100),
  aggregationTags: z.array(AggregationTagDefinitionSchema).max(50),
  formatOptions: z.array(z.string().max(50)).max(20).default(['full', 'list', 'summary']),
  tagPrefix: z.string().max(50).default('@architect-'),
  fileOptInTag: z.string().max(50).default('@architect'),
});

export type { AggregationTagDefinition, MetadataTagDefinition, TagRegistry };

export function createDefaultTagRegistry(): TagRegistry {
  const registry = buildRegistry();
  return {
    version: registry.version,
    roles: [...registry.roles].map((role) => ({
      ...role,
      aliases: [...(role.aliases ?? [])],
    })),
    metadataTags: [...registry.metadataTags].map(
      (tag): MetadataTagDefinition => ({
        tag: tag.tag,
        format: tag.format,
        purpose: tag.purpose,
        required: tag.required ?? false,
        repeatable: tag.repeatable ?? false,
        ...(tag.values !== undefined ? { values: Array.from(tag.values) } : {}),
        ...(tag.default !== undefined ? { default: tag.default } : {}),
        ...(tag.example !== undefined ? { example: tag.example } : {}),
        ...(tag.metadataKey !== undefined ? { metadataKey: tag.metadataKey } : {}),
        ...(tag.transform !== undefined ? { transform: tag.transform } : {}),
      }),
    ),
    aggregationTags: [...registry.aggregationTags],
    formatOptions: [...registry.formatOptions],
    tagPrefix: registry.tagPrefix,
    fileOptInTag: registry.fileOptInTag,
  };
}

export function mergeTagRegistries(base: TagRegistry, override: Partial<TagRegistry>): TagRegistry {
  function mergeByTag<T extends { tag: string }>(
    baseArr: readonly T[],
    overrideArr?: readonly T[],
  ): T[] {
    if (!overrideArr) return [...baseArr];

    const merged = new Map<string, T>();
    for (const item of baseArr) {
      merged.set(item.tag, item);
    }
    for (const item of overrideArr) {
      merged.set(item.tag, item);
    }
    return Array.from(merged.values());
  }

  return {
    version: override.version ?? base.version,
    roles: mergeByTag(base.roles, override.roles),
    metadataTags: mergeByTag(base.metadataTags, override.metadataTags),
    aggregationTags: mergeByTag(base.aggregationTags, override.aggregationTags),
    formatOptions: override.formatOptions ?? base.formatOptions,
    tagPrefix: override.tagPrefix ?? base.tagPrefix,
    fileOptInTag: override.fileOptInTag ?? base.fileOptInTag,
  };
}
