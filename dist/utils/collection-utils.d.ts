/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern CollectionUtilities
 * @libar-docs-status completed
 * @libar-docs-used-by SectionRenderer, DocExtractor
 *
 * ## CollectionUtilities - Array and Map Operations
 *
 * Provides shared utilities for working with arrays and collections,
 * such as grouping items by a key function.
 *
 * ### When to Use
 *
 * - Use `groupBy()` when categorizing patterns by category, status, or other key
 * - Use when aggregating items for section rendering (e.g., patterns by domain)
 */
/**
 * Group items by a key function
 *
 * Creates a Map where each key maps to an array of items that share that key.
 * This is a generic utility that replaces duplicate groupByX implementations.
 *
 * @typeParam T - Type of items in the collection
 * @typeParam K - Type of the grouping key (must be usable as Map key)
 * @param items - Array of items to group
 * @param keyFn - Function to extract the grouping key from each item
 * @returns Map from keys to arrays of items
 *
 * @example
 * ```typescript
 * interface Pattern { name: string; category: string; status?: string; }
 *
 * const patterns: Pattern[] = [
 *   { name: 'Auth', category: 'core' },
 *   { name: 'Logger', category: 'core' },
 *   { name: 'Store', category: 'infra' }
 * ];
 *
 * // Group by category
 * const byCategory = groupBy(patterns, p => p.category);
 * // Map { 'core' => [Auth, Logger], 'infra' => [Store] }
 *
 * // Group by status with default
 * const byStatus = groupBy(patterns, p => p.status ?? 'implemented');
 * ```
 */
export declare function groupBy<T, K>(items: readonly T[], keyFn: (item: T) => K): Map<K, T[]>;
//# sourceMappingURL=collection-utils.d.ts.map