/**
 * @architect
 * @architect-pattern TagRegistrySchemas
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:validation-schemas
 *
 * ## TagRegistrySchemas - Zod Contracts for the Tag Registry
 *
 * Defines the Zod schemas for the tag registry — `RoleDefinitionSchema`,
 * `MetadataTagDefinitionSchema`, `AggregationTagDefinitionSchema`, and the
 * composing `TagRegistrySchema` — plus the inferred types and the
 * `createDefaultTagRegistry` / `mergeTagRegistries` helpers that build and
 * combine registries from these contracts.
 */
import { z } from 'zod';

import { DIAGRAM_SHAPE_VALUES, FORMAT_TYPES, buildRegistry } from '../taxonomy/index.js';
import { KNOWN_TRANSFORM_NAMES } from '../taxonomy/metadata-transforms.js';

/**
 * Schema for a role definition — its canonical tag, domain, priority, optional
 * description, aliases, and diagram shape.
 *
 * @architect-shape
 */
export const RoleDefinitionSchema = z.strictObject({
  tag: z.string().min(1, 'Role tag cannot be empty').max(100),
  domain: z.string().min(1, 'Role domain cannot be empty').max(200),
  priority: z.number().int().positive('Priority must be a positive integer'),
  description: z.string().max(1000).optional(),
  aliases: z.array(z.string().max(100)).max(20).optional(),
  diagramShape: z.enum(DIAGRAM_SHAPE_VALUES).optional(),
});

export type RoleDefinition = z.output<typeof RoleDefinitionSchema>;

/**
 * Schema for a metadata tag definition — its tag, value format, purpose, and
 * the flags/values/transform governing how it is parsed.
 *
 * @architect-shape
 */
export const MetadataTagDefinitionSchema = z.strictObject({
  tag: z.string().min(1, 'Metadata tag cannot be empty').max(100),
  format: z.enum(FORMAT_TYPES),
  purpose: z.string().max(1000),
  required: z.boolean().optional(),
  repeatable: z.boolean().optional(),
  values: z.array(z.string().max(200)).max(50).optional(),
  default: z.string().max(200).optional(),
  example: z.string().max(500).optional(),
  metadataKey: z.string().max(100).optional(),
  transform: z.enum(KNOWN_TRANSFORM_NAMES).optional(),
});

export type MetadataTagDefinition = z.output<typeof MetadataTagDefinitionSchema>;

/**
 * Schema for an aggregation tag definition — its tag, target document (or
 * `null`), and purpose.
 *
 * @architect-shape
 */
export const AggregationTagDefinitionSchema = z.strictObject({
  tag: z.string().min(1, 'Aggregation tag cannot be empty').max(100),
  targetDoc: z.string().max(200).nullable(),
  purpose: z.string().max(1000),
});

export type AggregationTagDefinition = z.output<typeof AggregationTagDefinitionSchema>;

/**
 * Schema for the full tag registry — version, role/metadata/aggregation tag
 * definitions, format options, and the configured tag prefix.
 *
 * @architect-shape
 */
export const TagRegistrySchema = z.strictObject({
  $schema: z.string().max(500).optional(),
  version: z.string().max(20),
  roles: z.array(RoleDefinitionSchema).max(1000),
  metadataTags: z.array(MetadataTagDefinitionSchema).max(100),
  aggregationTags: z.array(AggregationTagDefinitionSchema).max(50),
  formatOptions: z.array(z.string().max(50)).max(20),
  tagPrefix: z.string().max(50),
  fileOptInTag: z.string().max(50),
});

export type TagRegistry = z.output<typeof TagRegistrySchema>;

/**
 * Pre-computed lookup tables for resolving role tags and their aliases.
 *
 * @architect-shape
 */
export interface RoleLookup {
  /** Map of canonical role tag to itself, for membership/identity checks. */
  readonly canonical: ReadonlyMap<string, string>;
  /** Map of alias to the canonical role tag it resolves to. */
  readonly aliases: ReadonlyMap<string, string>;
  /** Set of every recognized tag (canonical tags and aliases). */
  readonly all: ReadonlySet<string>;
}

const roleLookupCache = new WeakMap<TagRegistry, RoleLookup>();

/**
 * Build (and memoize per registry) the {@link RoleLookup} tables for resolving
 * role tags and aliases.
 *
 * @architect-shape
 * @param registry - The tag registry to derive lookups from.
 * @returns The cached or freshly built role lookup tables.
 */
export function buildRoleLookup(registry: TagRegistry): RoleLookup {
  const cached = roleLookupCache.get(registry);
  if (cached !== undefined) {
    return cached;
  }

  const canonical = new Map<string, string>();
  const aliases = new Map<string, string>();
  for (const role of registry.roles) {
    canonical.set(role.tag, role.tag);
    for (const alias of role.aliases ?? []) {
      aliases.set(alias, role.tag);
    }
  }

  const lookup: RoleLookup = {
    canonical,
    aliases,
    all: new Set([...canonical.keys(), ...aliases.keys()]),
  };
  roleLookupCache.set(registry, lookup);
  return lookup;
}

/**
 * Resolve a raw role value to its canonical role tag, following aliases.
 *
 * @architect-shape
 * @param registry - The tag registry to resolve against.
 * @param rawValue - The raw role value (canonical tag or alias), or `undefined`.
 * @returns The canonical role tag, or `undefined` if unknown or input was `undefined`.
 */
export function resolveCanonicalRole(
  registry: TagRegistry,
  rawValue: string | undefined,
): string | undefined {
  if (rawValue === undefined) {
    return undefined;
  }

  const lookup = buildRoleLookup(registry);
  if (lookup.canonical.has(rawValue)) {
    return rawValue;
  }

  return lookup.aliases.get(rawValue);
}

/**
 * Report whether a raw value is a recognized role tag or alias in the registry.
 *
 * @architect-shape
 * @param registry - The tag registry to check against.
 * @param rawValue - The candidate role tag or alias.
 * @returns `true` if the value is a known canonical tag or alias.
 */
export function isKnownRoleTag(registry: TagRegistry, rawValue: string): boolean {
  return buildRoleLookup(registry).all.has(rawValue);
}

/**
 * Build the default tag registry from the compiled-in taxonomy, materializing
 * its role, metadata, and aggregation tag definitions.
 *
 * @architect-shape
 * @returns A fresh, fully populated default tag registry.
 */
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

/**
 * Merge an override registry onto a base registry, combining tag arrays by
 * `tag` (override wins) and replacing scalar fields when present.
 *
 * @architect-shape
 * @param base - The base registry to start from.
 * @param override - Partial registry whose set fields take precedence.
 * @returns The merged registry.
 */
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
