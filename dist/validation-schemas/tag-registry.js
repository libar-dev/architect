/**
 * @libar-docs
 * @libar-docs-core @libar-docs-infra
 * @libar-docs-pattern Tag Registry Configuration
 * @libar-docs-status completed
 *
 * ## Tag Registry Configuration Schema
 *
 * Defines the structure and validation for tag taxonomy configuration.
 * The taxonomy is defined in TypeScript at src/taxonomy/ and built via buildRegistry().
 *
 * ### When to Use
 *
 * - Validating tag registry configuration at runtime
 * - Merging custom registry overrides with default registry
 * - Creating delivery process instances with custom categories
 */
import { z } from 'zod';
import { buildRegistry, FORMAT_TYPES } from '../taxonomy/index.js';
/**
 * Category definition schema
 *
 * Defines a documentation category (e.g., "core", "ddd", "event-sourcing").
 * Categories organize patterns by domain and determine priority when a pattern
 * has multiple category tags.
 *
 * @example
 * ```typescript
 * {
 *   tag: "event-sourcing",
 *   domain: "Event Sourcing",
 *   priority: 4,
 *   description: "Event store, aggregates, replay",
 *   aliases: ["es"]
 * }
 * ```
 */
export const CategoryDefinitionSchema = z
    .object({
    /** Tag name (without prefix), e.g., "event-sourcing" */
    tag: z.string().min(1, 'Category tag cannot be empty').max(100),
    /** Display name for the category, e.g., "Event Sourcing" */
    domain: z.string().min(1, 'Category domain cannot be empty').max(200),
    /** Priority for category selection (lower number = higher priority) */
    priority: z.number().int().positive('Priority must be a positive integer'),
    /** Human-readable description of what this category represents */
    description: z.string().max(1000),
    /** Alternative tag names that map to this category */
    aliases: z.array(z.string().max(100)).max(20).optional().default([]),
})
    .strict();
/**
 * Metadata tag definition schema
 *
 * Defines a metadata tag (e.g., "pattern", "status", "usecase").
 * Metadata tags provide additional information about patterns beyond categorization.
 *
 * @example
 * ```typescript
 * {
 *   tag: "status",
 *   format: "enum",
 *   purpose: "Implementation status",
 *   required: false,
 *   values: ["roadmap", "active", "completed"],
 *   default: "roadmap",
 *   example: "@libar-docs-status completed"
 * }
 * ```
 */
export const MetadataTagDefinitionSchema = z
    .object({
    /** Tag name (without prefix), e.g., "status" */
    tag: z.string().min(1, 'Metadata tag cannot be empty').max(100),
    /** Format specifies how the tag value is parsed (from taxonomy/format-types.ts) */
    format: z.enum(FORMAT_TYPES),
    /** Human-readable description of the tag's purpose */
    purpose: z.string().max(1000),
    /** Whether this tag is required for all patterns */
    required: z.boolean().optional().default(false),
    /** Whether this tag can appear multiple times */
    repeatable: z.boolean().optional().default(false),
    /** Valid values for enum format */
    values: z.array(z.string().max(200)).max(50).optional(),
    /** Default value if tag is not specified */
    default: z.string().max(200).optional(),
    /** Example usage of this tag */
    example: z.string().max(500).optional(),
    /** Maps tag name to metadata object property name (defaults to kebab-to-camelCase) */
    metadataKey: z.string().max(100).optional(),
    /** Post-parse value transformer (runtime-only, not serializable) */
    transform: z.function().optional(),
})
    .strict();
/**
 * Aggregation tag definition schema
 *
 * Defines tags that route patterns to specific aggregated documents
 * (e.g., OVERVIEW.md, DECISIONS.md).
 *
 * @example
 * ```typescript
 * {
 *   tag: "overview",
 *   targetDoc: "OVERVIEW.md",
 *   purpose: "Architecture overview patterns"
 * }
 * ```
 */
export const AggregationTagDefinitionSchema = z
    .object({
    /** Tag name (without prefix), e.g., "overview" */
    tag: z.string().min(1, 'Aggregation tag cannot be empty').max(100),
    /** Target document filename, or null for template placeholders only */
    targetDoc: z.string().max(200).nullable(),
    /** Human-readable description of where patterns with this tag appear */
    purpose: z.string().max(1000),
})
    .strict();
/**
 * Complete tag registry schema
 *
 * Defines the full taxonomy configuration for a project, including all categories,
 * metadata tags, aggregation tags, and format options.
 *
 * @example
 * ```typescript
 * {
 *   version: "1.0.0",
 *   categories: [
 *     { tag: "core", domain: "Core", priority: 1, description: "Core utilities", aliases: [] }
 *   ],
 *   metadataTags: [
 *     { tag: "pattern", format: "value", purpose: "Pattern name", required: true }
 *   ],
 *   aggregationTags: [
 *     { tag: "overview", targetDoc: "OVERVIEW.md", purpose: "Overview patterns" }
 *   ],
 *   formatOptions: ["full", "list", "summary"],
 *   tagPrefix: "@libar-docs-",
 *   fileOptInTag: "@libar-docs"
 * }
 * ```
 */
export const TagRegistrySchema = z
    .object({
    /** JSON Schema reference (standard $schema property, optional) */
    $schema: z.string().max(500).optional(),
    /** Schema version for future compatibility */
    version: z.string().max(20).default('1.0.0'),
    /** Category definitions for organizing patterns */
    categories: z.array(CategoryDefinitionSchema).max(1000),
    /** Metadata tag definitions for pattern enrichment */
    metadataTags: z.array(MetadataTagDefinitionSchema).max(100),
    /** Aggregation tag definitions for document routing */
    aggregationTags: z.array(AggregationTagDefinitionSchema).max(50),
    /** Valid format options for template placeholders */
    formatOptions: z.array(z.string().max(50)).max(20).default(['full', 'list', 'summary']),
    /** Prefix used for all delivery-process tags */
    tagPrefix: z.string().max(50).default('@libar-docs-'),
    /** File-level opt-in tag that gates extraction */
    fileOptInTag: z.string().max(50).default('@libar-docs'),
})
    .strict();
/**
 * Create default tag registry
 *
 * Delegates to the taxonomy module's buildRegistry() function which is
 * the single source of truth for all taxonomy definitions.
 *
 * @returns Default tag registry with all categories and metadata tags
 *
 * @see src/taxonomy/registry-builder.ts
 *
 * @example
 * ```typescript
 * const defaultRegistry = createDefaultTagRegistry();
 * console.log(defaultRegistry.categories); // Full DDD/ES/CQRS taxonomy
 * ```
 */
export function createDefaultTagRegistry() {
    const registry = buildRegistry();
    // Convert readonly arrays to mutable for compatibility with TagRegistry type
    return {
        version: registry.version,
        categories: [...registry.categories].map((c) => ({ ...c, aliases: [...c.aliases] })),
        metadataTags: [...registry.metadataTags].map((t) => ({
            ...t,
            values: t.values ? [...t.values] : undefined,
            required: t.required ?? false,
            repeatable: t.repeatable ?? false,
        })),
        aggregationTags: [...registry.aggregationTags],
        formatOptions: [...registry.formatOptions],
        tagPrefix: registry.tagPrefix,
        fileOptInTag: registry.fileOptInTag,
    };
}
/**
 * Merge user registry with default registry
 *
 * Performs deep merge where user registry extends and overrides defaults:
 * - Categories: Merged by tag (user overrides default, user additions kept)
 * - MetadataTags: Merged by tag (user overrides default, user additions kept)
 * - AggregationTags: Merged by tag (user overrides default)
 * - FormatOptions: Full replacement if specified
 * - TagPrefix: Full replacement if specified
 * - FileOptInTag: Full replacement if specified
 *
 * @param base - Base registry (usually default registry)
 * @param override - User registry to merge on top
 * @returns Merged registry
 *
 * @example
 * ```typescript
 * const base = createDefaultTagRegistry();
 * const user = { categories: [{ tag: "core", domain: "Core", priority: 10, description: "..." }] };
 * const merged = mergeTagRegistries(base, user);
 * // merged.categories[0].priority === 10 (user override)
 * ```
 */
export function mergeTagRegistries(base, override) {
    // Helper to merge arrays by tag, with user overrides taking precedence
    function mergeByTag(baseArr, overrideArr) {
        if (!overrideArr)
            return baseArr;
        const merged = new Map();
        // Add all base items
        for (const item of baseArr) {
            merged.set(item.tag, item);
        }
        // Override/add user items
        for (const item of overrideArr) {
            merged.set(item.tag, item);
        }
        return Array.from(merged.values());
    }
    return {
        version: override.version ?? base.version,
        categories: mergeByTag(base.categories, override.categories),
        metadataTags: mergeByTag(base.metadataTags, override.metadataTags),
        aggregationTags: mergeByTag(base.aggregationTags, override.aggregationTags),
        formatOptions: override.formatOptions ?? base.formatOptions,
        tagPrefix: override.tagPrefix ?? base.tagPrefix,
        fileOptInTag: override.fileOptInTag ?? base.fileOptInTag,
    };
}
//# sourceMappingURL=tag-registry.js.map