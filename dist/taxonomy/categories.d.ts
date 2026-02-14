/**
 * @libar-docs
 * @libar-docs-pattern CategoryDefinitions
 * @libar-docs-status completed
 * @libar-docs-core
 * @libar-docs-arch-role read-model
 * @libar-docs-arch-context taxonomy
 * @libar-docs-arch-layer domain
 * @libar-docs-extract-shapes CategoryDefinition, CATEGORIES, CategoryTag, CATEGORY_TAGS
 *
 * ## Category Definitions
 *
 * Categories are used to classify patterns and organize documentation.
 * Priority determines display order (lower = higher priority).
 * The ddd-es-cqrs preset includes all 21 categories; simpler presets use subsets.
 */
/** @libar-docs-shape reference-sample */
export interface CategoryDefinition {
    /** Category tag name without prefix (e.g., "core", "api", "ddd", "saga") */
    readonly tag: string;
    /** Human-readable domain name for display (e.g., "Strategic DDD", "Event Sourcing") */
    readonly domain: string;
    /** Display order priority - lower values appear first in sorted output */
    readonly priority: number;
    /** Brief description of the category's purpose and typical patterns */
    readonly description: string;
    /** Alternative tag names that map to this category (e.g., "es" for "event-sourcing") */
    readonly aliases: readonly string[];
}
/**
 * All category definitions for the monorepo
 */
export declare const CATEGORIES: readonly CategoryDefinition[];
/**
 * Category tags as a union type
 */
export type CategoryTag = (typeof CATEGORIES)[number]['tag'];
/**
 * Extract all category tags as an array
 */
export declare const CATEGORY_TAGS: readonly CategoryTag[];
//# sourceMappingURL=categories.d.ts.map