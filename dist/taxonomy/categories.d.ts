/**
 * Category definitions for DDD/ES/CQRS domain taxonomy
 *
 * Categories are used to classify patterns and organize documentation.
 * Priority determines display order (lower = higher priority).
 */
export interface CategoryDefinition {
    readonly tag: string;
    readonly domain: string;
    readonly priority: number;
    readonly description: string;
    readonly aliases: readonly string[];
}
/**
 * All category definitions for the monorepo
 */
export declare const CATEGORIES: readonly CategoryDefinition[];
/**
 * Category tags as a union type
 */
export type CategoryTag = (typeof CATEGORIES)[number]["tag"];
/**
 * Extract all category tags as an array
 */
export declare const CATEGORY_TAGS: readonly CategoryTag[];
//# sourceMappingURL=categories.d.ts.map