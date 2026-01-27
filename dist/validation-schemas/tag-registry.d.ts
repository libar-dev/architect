/**
 * @libar-docs
 * @libar-docs-core @libar-docs-infra
 * @libar-docs-pattern Tag Registry Configuration
 * @libar-docs-status completed
 *
 * ## Tag Registry Configuration Schema
 *
 * Defines the structure and validation for external tag taxonomy configuration.
 * Enables repos to define their own taxonomy (categories, metadata tags, etc.)
 * without hardcoding values in the delivery-process package.
 *
 * ### When to Use
 *
 * - Creating a custom tag-registry.json for your project
 * - Validating tag registry configuration at load time
 * - Merging user registry with default registry
 */
import { z } from 'zod';
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
export declare const CategoryDefinitionSchema: z.ZodObject<{
    tag: z.ZodString;
    domain: z.ZodString;
    priority: z.ZodNumber;
    description: z.ZodString;
    aliases: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
}, z.core.$strict>;
export type CategoryDefinition = z.infer<typeof CategoryDefinitionSchema>;
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
export declare const MetadataTagDefinitionSchema: z.ZodObject<{
    tag: z.ZodString;
    format: z.ZodEnum<{
        number: "number";
        value: "value";
        enum: "enum";
        "quoted-value": "quoted-value";
        csv: "csv";
        flag: "flag";
    }>;
    purpose: z.ZodString;
    required: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    repeatable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    values: z.ZodOptional<z.ZodArray<z.ZodString>>;
    default: z.ZodOptional<z.ZodString>;
    example: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type MetadataTagDefinition = z.infer<typeof MetadataTagDefinitionSchema>;
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
export declare const AggregationTagDefinitionSchema: z.ZodObject<{
    tag: z.ZodString;
    targetDoc: z.ZodNullable<z.ZodString>;
    purpose: z.ZodString;
}, z.core.$strict>;
export type AggregationTagDefinition = z.infer<typeof AggregationTagDefinitionSchema>;
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
export declare const TagRegistrySchema: z.ZodObject<{
    $schema: z.ZodOptional<z.ZodString>;
    version: z.ZodDefault<z.ZodString>;
    categories: z.ZodArray<z.ZodObject<{
        tag: z.ZodString;
        domain: z.ZodString;
        priority: z.ZodNumber;
        description: z.ZodString;
        aliases: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    }, z.core.$strict>>;
    metadataTags: z.ZodArray<z.ZodObject<{
        tag: z.ZodString;
        format: z.ZodEnum<{
            number: "number";
            value: "value";
            enum: "enum";
            "quoted-value": "quoted-value";
            csv: "csv";
            flag: "flag";
        }>;
        purpose: z.ZodString;
        required: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        repeatable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        values: z.ZodOptional<z.ZodArray<z.ZodString>>;
        default: z.ZodOptional<z.ZodString>;
        example: z.ZodOptional<z.ZodString>;
    }, z.core.$strict>>;
    aggregationTags: z.ZodArray<z.ZodObject<{
        tag: z.ZodString;
        targetDoc: z.ZodNullable<z.ZodString>;
        purpose: z.ZodString;
    }, z.core.$strict>>;
    formatOptions: z.ZodDefault<z.ZodArray<z.ZodString>>;
    tagPrefix: z.ZodDefault<z.ZodString>;
    fileOptInTag: z.ZodDefault<z.ZodString>;
}, z.core.$strict>;
export type TagRegistry = z.infer<typeof TagRegistrySchema>;
/**
 * Parse and validate tag registry data
 *
 * @param data - Unknown data to parse as tag registry
 * @returns Validated tag registry
 * @throws ZodError if data doesn't match schema
 *
 * @example
 * ```typescript
 * const data = JSON.parse(fs.readFileSync("tag-registry.json", "utf-8"));
 * const registry = parseTagRegistry(data);
 * ```
 */
export declare function parseTagRegistry(data: unknown): TagRegistry;
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
export declare function createDefaultTagRegistry(): TagRegistry;
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
export declare function mergeTagRegistries(base: TagRegistry, override: Partial<TagRegistry>): TagRegistry;
//# sourceMappingURL=tag-registry.d.ts.map