/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern TaxonomyCodec
 * @libar-docs-status completed
 * @libar-docs-convention codec-registry
 * @libar-docs-product-area:Generation
 *
 * ## TaxonomyDocumentCodec
 *
 * Transforms MasterDataset into a RenderableDocument for taxonomy reference output.
 * Generates TAXONOMY.md and detail files (taxonomy/*.md).
 *
 * **Purpose:** Taxonomy reference documentation with tag definitions, preset comparison, and format type reference.
 *
 * **Output Files:** `TAXONOMY.md` (main reference), `taxonomy/<domain>.md` (domain details)
 *
 * | Option | Type | Default | Description |
 * | --- | --- | --- | --- |
 * | includePresets | boolean | true | Include preset comparison table |
 * | includeFormatTypes | boolean | true | Include format type reference |
 * | includeArchDiagram | boolean | true | Include architecture diagram |
 * | groupByDomain | boolean | true | Group metadata tags by domain |
 *
 * ### When to Use
 *
 * - When generating the taxonomy reference documentation (TAXONOMY.md)
 * - When creating tag reference files for progressive disclosure
 * - When building taxonomy overview reports
 *
 * ### Factory Pattern
 *
 * Use `createTaxonomyCodec(options)` to create a configured codec:
 * ```typescript
 * const codec = createTaxonomyCodec({ generateDetailFiles: false });
 * const doc = codec.decode(dataset);
 * ```
 *
 * Or use the default export for standard behavior:
 * ```typescript
 * const doc = TaxonomyDocumentCodec.decode(dataset);
 * ```
 */

import { z } from 'zod';
import {
  MasterDatasetSchema,
  type MasterDataset,
} from '../../validation-schemas/master-dataset.js';
import {
  type RenderableDocument,
  type SectionBlock,
  heading,
  paragraph,
  separator,
  table,
  code,
  mermaid,
  linkOut,
  document,
} from '../schema.js';
import { type BaseCodecOptions, DEFAULT_BASE_OPTIONS, mergeOptions } from './types/base.js';
import { RenderableDocumentOutputSchema } from './shared-schema.js';
import { PRESETS, type PresetName } from '../../config/presets.js';
import { FORMAT_TYPES, type FormatType } from '../../taxonomy/format-types.js';
import type { TagRegistry, MetadataTagDefinition } from '../../validation-schemas/tag-registry.js';

// ═══════════════════════════════════════════════════════════════════════════
// Taxonomy Codec Options (co-located with codec)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Options for TaxonomyDocumentCodec
 */
export interface TaxonomyCodecOptions extends BaseCodecOptions {
  /** Include preset comparison table (default: true) */
  includePresets?: boolean;

  /** Include format type reference (default: true) */
  includeFormatTypes?: boolean;

  /** Include architecture diagram (default: true) */
  includeArchDiagram?: boolean;

  /** Group metadata tags by domain (default: true) */
  groupByDomain?: boolean;
}

/**
 * Default options for TaxonomyDocumentCodec
 */
export const DEFAULT_TAXONOMY_OPTIONS: Required<TaxonomyCodecOptions> = {
  ...DEFAULT_BASE_OPTIONS,
  includePresets: true,
  includeFormatTypes: true,
  includeArchDiagram: true,
  groupByDomain: true,
};

// ═══════════════════════════════════════════════════════════════════════════
// Taxonomy Document Codec
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a TaxonomyDocumentCodec with custom options.
 *
 * @param options - Codec configuration options
 * @returns Configured Zod codec
 *
 * @example
 * ```typescript
 * // Disable detail files for summary output
 * const codec = createTaxonomyCodec({ generateDetailFiles: false });
 *
 * // Disable presets section
 * const codec = createTaxonomyCodec({ includePresets: false });
 * ```
 */
export function createTaxonomyCodec(
  options?: TaxonomyCodecOptions
): z.ZodCodec<typeof MasterDatasetSchema, typeof RenderableDocumentOutputSchema> {
  const opts = mergeOptions(DEFAULT_TAXONOMY_OPTIONS, options);

  return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
    decode: (dataset: MasterDataset): RenderableDocument => {
      return buildTaxonomyDocument(dataset, opts);
    },
    /** @throws Always - this codec is decode-only. See zod-codecs.md */
    encode: (): never => {
      throw new Error('TaxonomyDocumentCodec is decode-only. See zod-codecs.md');
    },
  });
}

/**
 * Default Taxonomy Document Codec
 *
 * Transforms MasterDataset → RenderableDocument for taxonomy reference.
 * Uses default options with all features enabled.
 *
 * @example
 * ```typescript
 * const doc = TaxonomyDocumentCodec.decode(masterDataset);
 * const markdown = renderToMarkdown(doc);
 * ```
 */
export const TaxonomyDocumentCodec = createTaxonomyCodec();

// ═══════════════════════════════════════════════════════════════════════════
// Document Builder
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build the taxonomy document from dataset
 */
function buildTaxonomyDocument(
  dataset: MasterDataset,
  options: Required<TaxonomyCodecOptions>
): RenderableDocument {
  const sections: SectionBlock[] = [];
  const tagRegistry = dataset.tagRegistry;

  // 1. Overview section (always included)
  sections.push(...buildOverviewSection(tagRegistry));

  // 2. Categories section
  sections.push(...buildCategoriesSection(tagRegistry, options));

  // 3. Metadata Tags section
  sections.push(...buildMetadataTagsSection(tagRegistry, options));

  // 4. Aggregation Tags section
  sections.push(...buildAggregationTagsSection(tagRegistry));

  // 5. Format Types section (if enabled)
  if (options.includeFormatTypes) {
    sections.push(...buildFormatTypesSection(options));
  }

  // 6. Presets section (if enabled)
  if (options.includePresets) {
    sections.push(...buildPresetsSection());
  }

  // 7. Architecture section (if enabled)
  if (options.includeArchDiagram) {
    sections.push(...buildArchitectureSection());
  }

  // Build additional files for progressive disclosure (if enabled)
  const additionalFiles = options.generateDetailFiles
    ? buildTaxonomyDetailFiles(tagRegistry, options)
    : {};

  const docOpts: {
    purpose: string;
    detailLevel: string;
    additionalFiles?: Record<string, RenderableDocument>;
  } = {
    purpose: 'Tag taxonomy configuration for code-first documentation',
    detailLevel: options.generateDetailFiles ? 'Overview with links to details' : 'Compact summary',
  };

  if (Object.keys(additionalFiles).length > 0) {
    docOpts.additionalFiles = additionalFiles;
  }

  return document('Taxonomy Reference', sections, docOpts);
}

// ═══════════════════════════════════════════════════════════════════════════
// Section Builders
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build overview section with statistics
 */
function buildOverviewSection(tagRegistry: TagRegistry): SectionBlock[] {
  const categoryCount = tagRegistry.categories.length;
  const metadataTagCount = tagRegistry.metadataTags.length;
  const aggregationTagCount = tagRegistry.aggregationTags.length;

  return [
    heading(2, 'Overview'),
    paragraph(
      `**${categoryCount} categories** | **${metadataTagCount} metadata tags** | **${aggregationTagCount} aggregation tags**`
    ),
    paragraph(
      `Current configuration uses \`${tagRegistry.tagPrefix}\` prefix with \`${tagRegistry.fileOptInTag}\` file opt-in.`
    ),
    table(
      ['Component', 'Count', 'Description'],
      [
        ['Categories', String(categoryCount), 'Pattern classification by domain'],
        ['Metadata Tags', String(metadataTagCount), 'Pattern enrichment and relationships'],
        ['Aggregation Tags', String(aggregationTagCount), 'Document routing'],
      ]
    ),
    separator(),
  ];
}

/**
 * Build categories reference section
 */
function buildCategoriesSection(
  tagRegistry: TagRegistry,
  options: Required<TaxonomyCodecOptions>
): SectionBlock[] {
  // Sort categories by priority
  const sortedCategories = [...tagRegistry.categories].sort((a, b) => a.priority - b.priority);

  const rows = sortedCategories.map((cat) => [
    `\`${cat.tag}\``,
    cat.domain,
    String(cat.priority),
    cat.description,
  ]);

  const sections: SectionBlock[] = [
    heading(2, 'Categories'),
    paragraph('Domain classifications for organizing patterns by priority.'),
    table(['Tag', 'Domain', 'Priority', 'Description'], rows),
  ];

  // Add link to detail file if generating detail files
  if (options.generateDetailFiles) {
    sections.push(linkOut('Full category reference', 'taxonomy/categories.md'));
  }
  sections.push(separator());

  return sections;
}

/**
 * Build metadata tags reference section
 */
function buildMetadataTagsSection(
  tagRegistry: TagRegistry,
  options: Required<TaxonomyCodecOptions>
): SectionBlock[] {
  const sections: SectionBlock[] = [
    heading(2, 'Metadata Tags'),
    paragraph('Tags for enriching patterns with additional metadata.'),
  ];

  if (options.groupByDomain) {
    // Group tags by domain/purpose
    const groups = groupMetadataTagsByDomain(tagRegistry.metadataTags);

    for (const [groupName, tags] of Object.entries(groups)) {
      sections.push(heading(3, groupName));
      sections.push(...buildMetadataTagTable(tags, tagRegistry.tagPrefix));
    }
  } else {
    // Single table with all tags
    sections.push(...buildMetadataTagTable([...tagRegistry.metadataTags], tagRegistry.tagPrefix));
  }

  // Add link to detail file if generating detail files
  if (options.generateDetailFiles) {
    sections.push(linkOut('Full metadata tag reference', 'taxonomy/metadata-tags.md'));
  }
  sections.push(separator());

  return sections;
}

/**
 * Build a table of metadata tags
 */
function buildMetadataTagTable(tags: MetadataTagDefinition[], tagPrefix: string): SectionBlock[] {
  const rows = tags.map((tag) => {
    const example = tag.example ?? `${tagPrefix}${tag.tag} ...`;
    const required = tag.required ? 'Yes' : 'No';
    return [`\`${tag.tag}\``, tag.format, tag.purpose, required, `\`${example}\``];
  });

  return [table(['Tag', 'Format', 'Purpose', 'Required', 'Example'], rows)];
}

/**
 * Group metadata tags by domain/purpose.
 *
 * **Design Decision**: Tag domain categorization is intentionally hardcoded rather than
 * derived from schema metadata. This provides:
 *
 * 1. **Stability**: Domain assignments don't change unexpectedly when new tags are added
 * 2. **Documentation Focus**: Domains are presentation-oriented, not runtime concerns
 * 3. **Explicit Curation**: Human judgment decides which domain best fits each tag
 *
 * When adding new tags to the taxonomy:
 * - Core Tags: Essential identifiers (pattern, status, core, usecase)
 * - Relationship Tags: Cross-reference links (uses, used-by, depends-on, etc.)
 * - Timeline Tags: Planning/scheduling (phase, quarter, priority, etc.)
 * - ADR Tags: Decision records (adr-* prefix)
 * - Architecture Tags: System structure (arch-* prefix)
 * - Other Tags: Anything that doesn't fit the above categories
 */
function groupMetadataTagsByDomain(
  tags: MetadataTagDefinition[]
): Record<string, MetadataTagDefinition[]> {
  const coreTags: MetadataTagDefinition[] = [];
  const relationshipTags: MetadataTagDefinition[] = [];
  const timelineTags: MetadataTagDefinition[] = [];
  const adrTags: MetadataTagDefinition[] = [];
  const archTags: MetadataTagDefinition[] = [];
  const otherTags: MetadataTagDefinition[] = [];

  for (const tag of tags) {
    if (['pattern', 'status', 'core', 'usecase'].includes(tag.tag)) {
      coreTags.push(tag);
    } else if (
      [
        'uses',
        'used-by',
        'depends-on',
        'enables',
        'implements',
        'extends',
        'see-also',
        'api-ref',
      ].includes(tag.tag)
    ) {
      relationshipTags.push(tag);
    } else if (
      [
        'phase',
        'release',
        'quarter',
        'completed',
        'effort',
        'effort-actual',
        'team',
        'workflow',
        'priority',
        'risk',
      ].includes(tag.tag)
    ) {
      timelineTags.push(tag);
    } else if (tag.tag.startsWith('adr')) {
      adrTags.push(tag);
    } else if (tag.tag.startsWith('arch')) {
      archTags.push(tag);
    } else {
      otherTags.push(tag);
    }
  }

  // Build result object, excluding empty groups
  const result: Record<string, MetadataTagDefinition[]> = {};
  if (coreTags.length > 0) result['Core Tags'] = coreTags;
  if (relationshipTags.length > 0) result['Relationship Tags'] = relationshipTags;
  if (timelineTags.length > 0) result['Timeline Tags'] = timelineTags;
  if (adrTags.length > 0) result['ADR Tags'] = adrTags;
  if (archTags.length > 0) result['Architecture Tags'] = archTags;
  if (otherTags.length > 0) result['Other Tags'] = otherTags;

  return result;
}

/**
 * Build aggregation tags reference section
 */
function buildAggregationTagsSection(tagRegistry: TagRegistry): SectionBlock[] {
  const rows = tagRegistry.aggregationTags.map((tag) => [
    `\`${tag.tag}\``,
    tag.targetDoc ?? 'None',
    tag.purpose,
  ]);

  return [
    heading(2, 'Aggregation Tags'),
    paragraph('Tags that route patterns to specific aggregated documents.'),
    table(['Tag', 'Target Document', 'Purpose'], rows),
    separator(),
  ];
}

/**
 * Build format types reference section
 */
function buildFormatTypesSection(options: Required<TaxonomyCodecOptions>): SectionBlock[] {
  const formatDescriptions: Record<FormatType, { description: string; example: string }> = {
    value: { description: 'Simple string value', example: '@libar-docs-pattern MyPattern' },
    enum: {
      description: 'Constrained to predefined values',
      example: '@libar-docs-status roadmap',
    },
    'quoted-value': {
      description: 'String in quotes (preserves spaces)',
      example: '@libar-docs-usecase "When X happens"',
    },
    csv: { description: 'Comma-separated values', example: '@libar-docs-uses A, B, C' },
    number: { description: 'Numeric value', example: '@libar-docs-phase 14' },
    flag: { description: 'Boolean presence (no value)', example: '@libar-docs-core' },
  };

  const rows = FORMAT_TYPES.map((format) => {
    const info = formatDescriptions[format];
    return [`\`${format}\``, info.description, `\`${info.example}\``];
  });

  const sections: SectionBlock[] = [
    heading(2, 'Format Types'),
    paragraph('How tag values are parsed and validated.'),
    table(['Format', 'Description', 'Example'], rows),
  ];

  if (options.generateDetailFiles) {
    sections.push(linkOut('Format type details', 'taxonomy/format-types.md'));
  }
  sections.push(separator());

  return sections;
}

/**
 * Build presets comparison section
 */
function buildPresetsSection(): SectionBlock[] {
  const presetNames: PresetName[] = ['generic', 'libar-generic', 'ddd-es-cqrs'];

  const rows = presetNames.map((name) => {
    const preset = PRESETS[name];
    const categoryCount = preset.categories.length;
    let useCase = '';

    switch (name) {
      case 'generic':
        useCase = 'Simple projects with @docs- prefix';
        break;
      case 'libar-generic':
        useCase = 'Default preset with @libar-docs- prefix';
        break;
      case 'ddd-es-cqrs':
        useCase = 'Full DDD/ES/CQRS taxonomy';
        break;
    }

    return [`\`${name}\``, `\`${preset.tagPrefix}\``, String(categoryCount), useCase];
  });

  return [
    heading(2, 'Presets'),
    paragraph('Available configuration presets.'),
    table(['Preset', 'Tag Prefix', 'Categories', 'Use Case'], rows),
    separator(),
  ];
}

/**
 * Build architecture section with directory tree and mermaid diagram
 */
function buildArchitectureSection(): SectionBlock[] {
  const directoryTree = `src/taxonomy/
├── categories.ts          # Category definitions (21 DDD-ES-CQRS)
├── format-types.ts        # Format type constants
├── registry-builder.ts    # Single source of truth builder
├── status-values.ts       # Status FSM values
├── generator-options.ts   # Generator option values
├── hierarchy-levels.ts    # Hierarchy level values
├── risk-levels.ts         # Risk level values
└── index.ts               # Barrel export`;

  const mermaidDiagram = `graph LR
    Config[Configuration] --> Scanner[Scanner]
    Scanner --> Extractor[Extractor]
    Extractor --> Transformer[Transformer]
    Transformer --> Codec[Codec]
    Codec --> Markdown[Markdown]

    Registry[TagRegistry] --> Scanner
    Registry --> Extractor`;

  return [
    heading(2, 'Architecture'),
    paragraph('Taxonomy source files and pipeline flow.'),
    code(directoryTree, 'plaintext'),
    mermaid(mermaidDiagram),
    separator(),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// Additional Detail Files (Progressive Disclosure)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build additional taxonomy detail files
 */
function buildTaxonomyDetailFiles(
  tagRegistry: TagRegistry,
  _options: Required<TaxonomyCodecOptions>
): Record<string, RenderableDocument> {
  const files: Record<string, RenderableDocument> = {};

  // taxonomy/categories.md - Full category reference with aliases
  files['taxonomy/categories.md'] = buildCategoriesDetailDocument(tagRegistry);

  // taxonomy/metadata-tags.md - Full metadata tag definitions
  files['taxonomy/metadata-tags.md'] = buildMetadataTagsDetailDocument(tagRegistry);

  // taxonomy/format-types.md - Format type parsing details
  files['taxonomy/format-types.md'] = buildFormatTypesDetailDocument();

  return files;
}

/**
 * Build categories detail document
 */
function buildCategoriesDetailDocument(tagRegistry: TagRegistry): RenderableDocument {
  const sections: SectionBlock[] = [];

  // Sort categories by priority
  const sortedCategories = [...tagRegistry.categories].sort((a, b) => a.priority - b.priority);

  // Full table with aliases
  const rows = sortedCategories.map((cat) => [
    `\`${cat.tag}\``,
    cat.domain,
    String(cat.priority),
    cat.description,
    cat.aliases.length > 0 ? cat.aliases.map((a) => `\`${a}\``).join(', ') : '-',
  ]);

  sections.push(
    heading(2, 'Category Definitions'),
    paragraph(`${sortedCategories.length} categories sorted by priority.`),
    table(['Tag', 'Domain', 'Priority', 'Description', 'Aliases'], rows)
  );

  // Group by domain for additional context
  const byDomain = new Map<string, typeof sortedCategories>();
  for (const cat of sortedCategories) {
    const existing = byDomain.get(cat.domain);
    if (existing) {
      existing.push(cat);
    } else {
      byDomain.set(cat.domain, [cat]);
    }
  }

  sections.push(heading(2, 'Categories by Domain'));
  for (const [domain, cats] of byDomain) {
    sections.push(heading(3, domain), paragraph(cats.map((c) => `\`${c.tag}\``).join(', ')));
  }

  // Back link
  sections.push(separator(), linkOut('Back to Taxonomy Reference', '../TAXONOMY.md'));

  return document('Category Reference', sections, {
    purpose: 'Complete category definitions with aliases and domain groupings',
  });
}

/**
 * Build metadata tags detail document
 */
function buildMetadataTagsDetailDocument(tagRegistry: TagRegistry): RenderableDocument {
  const sections: SectionBlock[] = [];

  sections.push(
    heading(2, 'Metadata Tag Definitions'),
    paragraph(`${tagRegistry.metadataTags.length} metadata tags with full details.`)
  );

  // Full table with all fields
  const rows = tagRegistry.metadataTags.map((tag) => {
    const values = tag.values ? tag.values.join(', ') : '-';
    const defaultVal = tag.default ?? '-';
    const repeatable = tag.repeatable ? 'Yes' : 'No';
    const required = tag.required ? 'Yes' : 'No';

    return [`\`${tag.tag}\``, tag.format, tag.purpose, required, repeatable, values, defaultVal];
  });

  sections.push(
    table(['Tag', 'Format', 'Purpose', 'Required', 'Repeatable', 'Values', 'Default'], rows)
  );

  // Individual tag details
  sections.push(heading(2, 'Tag Details'));

  for (const tag of tagRegistry.metadataTags) {
    sections.push(heading(3, `\`${tag.tag}\``));

    const detailRows: string[][] = [
      ['Format', tag.format],
      ['Purpose', tag.purpose],
      ['Required', tag.required ? 'Yes' : 'No'],
      ['Repeatable', tag.repeatable ? 'Yes' : 'No'],
    ];

    if (tag.values && tag.values.length > 0) {
      detailRows.push(['Valid Values', tag.values.join(', ')]);
    }

    if (tag.default) {
      detailRows.push(['Default', tag.default]);
    }

    if (tag.example) {
      detailRows.push(['Example', `\`${tag.example}\``]);
    }

    sections.push(table(['Property', 'Value'], detailRows));
  }

  // Back link
  sections.push(separator(), linkOut('Back to Taxonomy Reference', '../TAXONOMY.md'));

  return document('Metadata Tag Reference', sections, {
    purpose: 'Complete metadata tag definitions with all fields',
  });
}

/**
 * Build format types detail document
 */
function buildFormatTypesDetailDocument(): RenderableDocument {
  const sections: SectionBlock[] = [];

  const formatDetails: Record<
    FormatType,
    {
      description: string;
      parsingBehavior: string;
      example: string;
      notes: string;
    }
  > = {
    value: {
      description: 'Simple string value',
      parsingBehavior: 'Captures everything after the tag name as the value',
      example: '@libar-docs-pattern CommandOrchestrator',
      notes: 'Most common format for single-value tags',
    },
    enum: {
      description: 'Constrained to predefined values',
      parsingBehavior: 'Validates value against allowed list; rejects invalid values',
      example: '@libar-docs-status roadmap',
      notes: 'Used for FSM states, priority levels, risk levels',
    },
    'quoted-value': {
      description: 'String in quotes (preserves spaces)',
      parsingBehavior: 'Extracts content between quotes; preserves internal whitespace',
      example: '@libar-docs-usecase "When a user submits a form"',
      notes: 'Use for human-readable text with spaces',
    },
    csv: {
      description: 'Comma-separated values',
      parsingBehavior: 'Splits on commas; trims whitespace from each value',
      example: '@libar-docs-uses CommandBus, EventStore, Projection',
      notes: 'Used for relationship tags and multi-value references',
    },
    number: {
      description: 'Numeric value',
      parsingBehavior: 'Parses as integer; NaN if invalid',
      example: '@libar-docs-phase 14',
      notes: 'Used for phase numbers and ordering',
    },
    flag: {
      description: 'Boolean presence (no value needed)',
      parsingBehavior: 'Presence of tag indicates true; absence indicates false',
      example: '@libar-docs-core',
      notes: 'Used for boolean markers like core, overview, decision',
    },
  };

  sections.push(
    heading(2, 'Format Type Reference'),
    paragraph('Detailed parsing behavior for each format type.')
  );

  for (const format of FORMAT_TYPES) {
    const info = formatDetails[format];
    sections.push(
      heading(3, `\`${format}\``),
      table(
        ['Property', 'Value'],
        [
          ['Description', info.description],
          ['Parsing Behavior', info.parsingBehavior],
          ['Example', `\`${info.example}\``],
          ['Notes', info.notes],
        ]
      )
    );
  }

  // Back link
  sections.push(separator(), linkOut('Back to Taxonomy Reference', '../TAXONOMY.md'));

  return document('Format Type Reference', sections, {
    purpose: 'Detailed format type parsing behavior and examples',
  });
}
