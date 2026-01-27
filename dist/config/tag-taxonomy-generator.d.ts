/**
 * Tag Taxonomy Generator
 *
 * Generates TAG_TAXONOMY.md from tag registry configuration.
 * Produces comprehensive markdown documentation showing:
 * - File opt-in tag
 * - Category tags (sorted by priority)
 * - Metadata tags (with format, purpose, examples)
 * - Aggregation tags (with target documents)
 * - Format options for templates
 */
import type { TagRegistry } from '../validation-schemas/index.js';
/**
 * Configuration for tag taxonomy generation
 */
export interface TagTaxonomyConfig {
    /** Optional title override (default: "Tag Taxonomy Reference") */
    readonly title?: string;
    /** Optional source path to reference in header */
    readonly sourcePath?: string;
}
/**
 * Generate TAG_TAXONOMY.md content from tag registry
 *
 * @param registry - The tag registry containing all tag definitions
 * @param config - Optional configuration for title and source path
 * @returns Markdown content for TAG_TAXONOMY.md
 */
export declare function generateTagTaxonomy(registry: TagRegistry, config?: TagTaxonomyConfig): string;
//# sourceMappingURL=tag-taxonomy-generator.d.ts.map