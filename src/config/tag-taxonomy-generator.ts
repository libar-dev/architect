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
export function generateTagTaxonomy(registry: TagRegistry, config?: TagTaxonomyConfig): string {
  const title = config?.title ?? 'Tag Taxonomy Reference';
  const sourceRef = config?.sourcePath ? `\`${config.sourcePath}\`` : 'tag registry';

  const sections: string[] = [];

  // Header
  sections.push(`# ${title}`);
  sections.push('');
  sections.push(`> ⚠️ **Auto-generated from ${sourceRef}** - Do not edit manually.`);
  sections.push('');

  // File Opt-In
  sections.push('## File Opt-In');
  sections.push('');
  sections.push(
    'All files must have this tag at the top to be included in documentation extraction:'
  );
  sections.push('');
  sections.push('| Tag | Purpose |');
  sections.push('|-----|---------|');
  sections.push(`| \`${registry.fileOptInTag}\` | Gates extraction - file must have this tag |`);
  sections.push('');

  // Category Tags
  sections.push('## Category Tags');
  sections.push('');
  sections.push('Sorted by priority (lower number = higher priority):');
  sections.push('');
  sections.push('| Priority | Tag | Domain | Description |');
  sections.push('|----------|-----|--------|-------------|');

  const sortedCategories = [...registry.categories].sort((a, b) => a.priority - b.priority);
  for (const cat of sortedCategories) {
    const tag = `${registry.tagPrefix}${cat.tag}`;
    const aliases =
      cat.aliases.length > 0
        ? ` (aliases: ${cat.aliases.map((a) => `\`${registry.tagPrefix}${a}\``).join(', ')})`
        : '';
    sections.push(
      `| ${cat.priority} | \`${tag}\`${aliases} | ${cat.domain} | ${cat.description} |`
    );
  }
  sections.push('');

  // Metadata Tags
  sections.push('## Metadata Tags');
  sections.push('');
  sections.push('| Tag | Format | Purpose | Required | Example |');
  sections.push('|-----|--------|---------|----------|---------|');

  for (const meta of registry.metadataTags) {
    const tag = `${registry.tagPrefix}${meta.tag}`;
    const required = meta.required ? 'Yes' : 'No';
    const example = meta.example ?? `${tag} <value>`;
    sections.push(
      `| \`${tag}\` | ${meta.format} | ${meta.purpose} | ${required} | \`${example}\` |`
    );
  }
  sections.push('');

  // Aggregation Tags
  sections.push('## Aggregation Tags');
  sections.push('');
  sections.push('| Tag | Target Document | Purpose |');
  sections.push('|-----|-----------------|---------|');

  for (const agg of registry.aggregationTags) {
    const tag = `${registry.tagPrefix}${agg.tag}`;
    const targetDoc = agg.targetDoc ?? '(template placeholder only)';
    sections.push(`| \`${tag}\` | ${targetDoc} | ${agg.purpose} |`);
  }
  sections.push('');

  // Format Options
  sections.push('## Format Options');
  sections.push('');
  sections.push('Used in template placeholders: `{{@libar-docs-core format=X}}`');
  sections.push('');
  for (const fmt of registry.formatOptions) {
    sections.push(`- \`${fmt}\``);
  }
  sections.push('');

  return sections.join('\n');
}
