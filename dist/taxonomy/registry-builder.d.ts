import { type FormatType } from './format-types.js';
/**
 * TagRegistry interface (matches schema from validation-schemas/tag-registry.ts)
 */
export interface TagRegistry {
    version: string;
    categories: readonly CategoryDefinitionForRegistry[];
    metadataTags: readonly MetadataTagDefinitionForRegistry[];
    aggregationTags: readonly AggregationTagDefinitionForRegistry[];
    formatOptions: readonly string[];
    tagPrefix: string;
    fileOptInTag: string;
}
interface CategoryDefinitionForRegistry {
    tag: string;
    domain: string;
    priority: number;
    description: string;
    aliases: readonly string[];
}
export interface MetadataTagDefinitionForRegistry {
    tag: string;
    format: FormatType;
    purpose: string;
    required?: boolean;
    repeatable?: boolean;
    values?: readonly string[];
    default?: string;
    example?: string;
}
export type TagDefinition = MetadataTagDefinitionForRegistry;
interface AggregationTagDefinitionForRegistry {
    tag: string;
    targetDoc: string | null;
    purpose: string;
}
/**
 * Build the complete tag registry from TypeScript constants
 *
 * This is THE single source of truth for the taxonomy.
 * All consumers should use this function instead of loading JSON.
 */
export declare function buildRegistry(): TagRegistry;
export {};
//# sourceMappingURL=registry-builder.d.ts.map