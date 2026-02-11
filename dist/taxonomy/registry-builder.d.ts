import { type FormatType } from './format-types.js';
/**
 * TagRegistry interface (matches schema from validation-schemas/tag-registry.ts)
 */
export interface TagRegistry {
    /** Schema version for forward/backward compatibility checking */
    version: string;
    /** Category definitions for classifying patterns by domain (e.g., core, api, ddd) */
    categories: readonly CategoryDefinitionForRegistry[];
    /** Metadata tag definitions with format, purpose, and validation rules */
    metadataTags: readonly MetadataTagDefinitionForRegistry[];
    /** Aggregation tag definitions for document-level grouping */
    aggregationTags: readonly AggregationTagDefinitionForRegistry[];
    /** Available format options for documentation output */
    formatOptions: readonly string[];
    /** Prefix for all tags (e.g., "@libar-docs-") */
    tagPrefix: string;
    /** File-level opt-in marker tag (e.g., "@libar-docs") */
    fileOptInTag: string;
}
interface CategoryDefinitionForRegistry {
    /** Category tag name without prefix (e.g., "core", "api", "ddd") */
    tag: string;
    /** Human-readable domain name (e.g., "Core Infrastructure", "Strategic DDD") */
    domain: string;
    /** Display order priority (lower = higher priority, determines sort order) */
    priority: number;
    /** Brief description of the category's purpose and scope */
    description: string;
    /** Alternative tag names that map to this category */
    aliases: readonly string[];
}
export interface MetadataTagDefinitionForRegistry {
    /** Tag name without prefix (e.g., "pattern", "status", "phase") */
    tag: string;
    /** Value format type determining parsing rules (flag, value, enum, csv, number, quoted-value) */
    format: FormatType;
    /** Human-readable description of the tag's purpose and usage */
    purpose: string;
    /** Whether this tag must be present for valid patterns */
    required?: boolean;
    /** Whether this tag can appear multiple times on a single pattern */
    repeatable?: boolean;
    /** Valid values for enum-type tags (undefined for non-enum formats) */
    values?: readonly string[];
    /** Default value applied when tag is not specified */
    default?: string;
    /** Example usage showing tag syntax (e.g., "@libar-docs-pattern MyPattern") */
    example?: string;
}
export type TagDefinition = MetadataTagDefinitionForRegistry;
interface AggregationTagDefinitionForRegistry {
    /** Aggregation tag name (e.g., "overview", "decision", "intro") */
    tag: string;
    /** Target document filename this tag aggregates to (null = inline rendering) */
    targetDoc: string | null;
    /** Description of what this aggregation collects */
    purpose: string;
}
/**
 * Metadata tags organized by functional group.
 * Used for documentation generation to create organized sections.
 *
 * Groups:
 * - core: Essential pattern identification (pattern, status, core, usecase, brief)
 * - relationship: Pattern dependencies and connections
 * - process: Timeline and assignment tracking
 * - prd: Product requirements documentation
 * - adr: Architecture decision records
 * - hierarchy: Epic/phase/task breakdown
 * - traceability: Two-tier spec architecture links
 * - architecture: Diagram generation tags
 * - extraction: Documentation extraction control
 * - stub: Design session stub metadata
 */
export declare const METADATA_TAGS_BY_GROUP: {
    readonly core: readonly ["pattern", "status", "core", "usecase", "brief"];
    readonly relationship: readonly ["uses", "used-by", "implements", "extends", "depends-on", "enables", "see-also", "api-ref"];
    readonly process: readonly ["phase", "release", "quarter", "completed", "effort", "effort-actual", "team", "workflow", "risk", "priority"];
    readonly prd: readonly ["product-area", "user-role", "business-value", "constraint"];
    readonly adr: readonly ["adr", "adr-status", "adr-category", "adr-supersedes", "adr-superseded-by", "adr-theme", "adr-layer"];
    readonly hierarchy: readonly ["level", "parent"];
    readonly traceability: readonly ["executable-specs", "roadmap-spec"];
    readonly architecture: readonly ["arch-role", "arch-context", "arch-layer"];
    readonly extraction: readonly ["extract-shapes"];
    readonly stub: readonly ["target", "since"];
    readonly convention: readonly ["convention"];
};
/**
 * Build the complete tag registry from TypeScript constants
 *
 * This is THE single source of truth for the taxonomy.
 * All consumers should use this function instead of loading JSON.
 */
export declare function buildRegistry(): TagRegistry;
export {};
//# sourceMappingURL=registry-builder.d.ts.map