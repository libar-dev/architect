/**
 * @architect
 * @architect-pattern ReferenceGeneratorRegistration
 * @architect-status active
 * @architect-implements CodecDrivenReferenceGeneration
 *
 * ## Reference Generator Registrations
 *
 * Registers all reference document generators. Each config produces
 * TWO generators: detailed (docs/) and summary (_claude-md/).
 *
 * **When to Use:** When adding or modifying reference document generators — register new product-area or reference configs here.
 */

import type { DocumentGenerator, GeneratorContext, GeneratorOutput } from '../types.js';
import type { ExtractedPattern } from '../../validation-schemas/index.js';
import type { MasterDataset } from '../../validation-schemas/master-dataset.js';
import type { DetailLevel } from '../../renderable/codecs/types/base.js';
import type { RenderableDocument, SectionBlock } from '../../renderable/schema.js';
import { heading, paragraph, separator, table, document } from '../../renderable/schema.js';
import type { GeneratorRegistry } from '../registry.js';
import { renderToMarkdown, renderToClaudeMdModule } from '../../renderable/render.js';
import {
  createReferenceCodec,
  PRODUCT_AREA_META,
  buildScopedDiagram,
  type ReferenceDocConfig,
  type DiagramScope,
} from '../../renderable/codecs/reference.js';
import { slugify, toKebabCase } from '../../utils/string-utils.js';
import { computeStatusCounts } from '../../renderable/utils.js';
import type { StatusCounts } from '../../validation-schemas/index.js';

// ============================================================================
// Reference Document Configurations
// ============================================================================

// ============================================================================
// Product Area Configs (ADR-001)
// ============================================================================

/**
 * Canonical product area values from ADR-001.
 * Each generates a composite overview document scoped to that area.
 */
export const PRODUCT_AREA_VALUES = [
  'Annotation',
  'Configuration',
  'Generation',
  'Validation',
  'DataAPI',
  'CoreTypes',
  'Process',
] as const;

/**
 * Options for customizing product area config generation.
 */
export interface ProductAreaConfigOptions {
  /** Filename suffix for docs output (default: '.md') */
  readonly docsFilenameSuffix?: string;
}

/**
 * Creates reference document configs for all canonical product areas.
 *
 * Each config uses `productArea` as the primary filter — the codec
 * auto-derives all content sources from the filtered pattern set.
 * Explicit `conventionTags`, `shapeSelectors`, and `behaviorCategories`
 * are left empty because the product-area decode path ignores them.
 *
 * @param options - Optional customization for output filenames
 */
export function createProductAreaConfigs(options?: ProductAreaConfigOptions): ReferenceDocConfig[] {
  const suffix = options?.docsFilenameSuffix ?? '.md';
  return PRODUCT_AREA_VALUES.map((area) => {
    const kebab = toKebabCase(area);
    return {
      title: `${area} Overview`,
      productArea: area,
      conventionTags: [],
      shapeSelectors: [],
      behaviorCategories: [],
      claudeMdSection: kebab,
      docsFilename: `${kebab.toUpperCase()}${suffix}`,
      claudeMdFilename: `${kebab}-overview.md`,
    };
  });
}

// ============================================================================
// Reference Document Generator
// ============================================================================

/**
 * Generator that wraps a reference codec for a specific config + detail level.
 * Implements DocumentGenerator directly (not via CodecBasedGenerator).
 */
class ReferenceDocGenerator implements DocumentGenerator {
  constructor(
    readonly name: string,
    readonly description: string,
    private readonly config: ReferenceDocConfig,
    private readonly detailLevel: DetailLevel,
    private readonly outputPath: string
  ) {}

  generate(
    _patterns: readonly ExtractedPattern[],
    context: GeneratorContext
  ): Promise<GeneratorOutput> {
    const dataset = context.masterDataset;

    const codec = createReferenceCodec(this.config, {
      detailLevel: this.detailLevel,
      generateDetailFiles: false,
    });

    const doc = codec.decode(dataset) as RenderableDocument;
    // Summary-level output (for _claude-md/) uses modular-claude-md compatible renderer
    const render = this.detailLevel === 'summary' ? renderToClaudeMdModule : renderToMarkdown;
    const content = render(doc);

    return Promise.resolve({
      files: [{ path: this.outputPath, content }],
    });
  }
}

// ============================================================================
// Registration
// ============================================================================

function toGeneratorName(title: string): string {
  return slugify(title.replace(/ Reference$/, ''));
}

/**
 * Shared loop for generating detailed + summary file pairs from reference configs.
 */
function generateDualOutputFiles(
  configs: readonly ReferenceDocConfig[],
  dataset: MasterDataset,
  pathPrefix: string
): Array<{ path: string; content: string }> {
  const files: Array<{ path: string; content: string }> = [];

  for (const config of configs) {
    // Detailed output -> {pathPrefix}/{docsFilename}
    const detailedCodec = createReferenceCodec(config, {
      detailLevel: 'detailed',
      generateDetailFiles: false,
    });
    const detailedDoc = detailedCodec.decode(dataset) as RenderableDocument;
    files.push({
      path: `${pathPrefix}/${config.docsFilename}`,
      content: renderToMarkdown(detailedDoc),
    });

    // Summary output -> _claude-md/{section}/{filename}
    const summaryCodec = createReferenceCodec(config, {
      detailLevel: 'summary',
      generateDetailFiles: false,
    });
    const summaryDoc = summaryCodec.decode(dataset) as RenderableDocument;
    files.push({
      path: `_claude-md/${config.claudeMdSection}/${config.claudeMdFilename}`,
      content: renderToClaudeMdModule(summaryDoc),
    });
  }

  return files;
}

/**
 * Meta-generator that produces all reference documents (detailed + summary per config)
 * from a single `-g reference-docs` invocation.
 *
 * Only handles configs WITHOUT `productArea` set. Product-area configs
 * are handled by `ProductAreaDocsGenerator` instead.
 */
class ReferenceDocsGenerator implements DocumentGenerator {
  readonly name = 'reference-docs';
  readonly description: string;

  constructor(private readonly configs: readonly ReferenceDocConfig[]) {
    this.description = `All reference documents (${configs.length} detailed + ${configs.length} summary)`;
  }

  generate(
    _patterns: readonly ExtractedPattern[],
    context: GeneratorContext
  ): Promise<GeneratorOutput> {
    const dataset = context.masterDataset;

    const files = generateDualOutputFiles(this.configs, dataset, 'reference');
    return Promise.resolve({ files });
  }
}

/**
 * Meta-generator for product area overview documents.
 *
 * Handles configs WITH `productArea` set. Outputs detailed docs to
 * `product-areas/{docsFilename}` and also generates a progressive
 * disclosure index at `PRODUCT-AREAS.md`.
 */
class ProductAreaDocsGenerator implements DocumentGenerator {
  readonly name = 'product-area-docs';
  readonly description: string;

  constructor(private readonly configs: readonly ReferenceDocConfig[]) {
    this.description = `Product area overview documents (${configs.length} areas)`;
  }

  generate(
    _patterns: readonly ExtractedPattern[],
    context: GeneratorContext
  ): Promise<GeneratorOutput> {
    const dataset = context.masterDataset;

    const files = generateDualOutputFiles(this.configs, dataset, 'product-areas');

    // Progressive disclosure index
    files.push({
      path: 'PRODUCT-AREAS.md',
      content: buildProductAreaIndex(this.configs, dataset),
    });

    return Promise.resolve({ files });
  }
}

/**
 * Builds a progressive disclosure index for product area documents.
 *
 * Data-driven: computes per-area statistics from MasterDataset patterns,
 * renders cross-area progress table, and generates live Mermaid diagrams
 * from annotation relationship data via buildScopedDiagram.
 */
function buildProductAreaIndex(
  configs: readonly ReferenceDocConfig[],
  dataset: MasterDataset
): string {
  const sections: SectionBlock[] = [];

  // Use pre-computed byProductArea view (ADR-006: no re-derivation from raw patterns)
  const areaStats = new Map<string, StatusCounts>();
  for (const [area, patterns] of Object.entries(dataset.byProductArea)) {
    areaStats.set(area, computeStatusCounts(patterns));
  }

  // Per-area sections with intro prose and live statistics
  for (const config of configs) {
    const area = config.productArea;
    if (area === undefined) continue;
    const meta = PRODUCT_AREA_META[area];
    if (meta === undefined) continue;

    sections.push(heading(2, `[${area}](product-areas/${config.docsFilename})`));
    sections.push(paragraph(`> **${meta.question}**`));
    sections.push(paragraph(meta.intro));

    // Live per-area statistics from pre-computed stats
    const stats = areaStats.get(area);
    if (stats !== undefined && stats.total > 0) {
      sections.push(
        paragraph(
          `**${stats.total} patterns** — ${stats.completed} completed, ${stats.active} active, ${stats.planned} planned`
        )
      );
    }

    // Key patterns from curated list
    if (meta.keyPatterns.length > 0) {
      sections.push(paragraph(`**Key patterns:** ${meta.keyPatterns.join(', ')}`));
    }
  }

  sections.push(separator());

  // Cross-area progress summary table (reuses pre-computed stats)
  const tableHeaders = ['Area', 'Patterns', 'Completed', 'Active', 'Planned'];
  const tableRows: string[][] = [];
  let totalPatterns = 0;
  let totalCompleted = 0;
  let totalActive = 0;
  let totalPlanned = 0;

  for (const config of configs) {
    const area = config.productArea;
    if (area === undefined) continue;

    const stats = areaStats.get(area) ?? { total: 0, completed: 0, active: 0, planned: 0 };

    tableRows.push([
      `[${area}](product-areas/${config.docsFilename})`,
      String(stats.total),
      String(stats.completed),
      String(stats.active),
      String(stats.planned),
    ]);

    totalPatterns += stats.total;
    totalCompleted += stats.completed;
    totalActive += stats.active;
    totalPlanned += stats.planned;
  }

  tableRows.push([
    '**Total**',
    `**${totalPatterns}**`,
    `**${totalCompleted}**`,
    `**${totalActive}**`,
    `**${totalPlanned}**`,
  ]);

  sections.push(heading(2, 'Progress Overview'));
  sections.push(table(tableHeaders, tableRows));
  sections.push(separator());

  // Live cross-area diagrams from annotation data
  // Collect key patterns from all areas for a curated cross-area view
  const allKeyPatterns: string[] = [];
  for (const config of configs) {
    const area = config.productArea;
    if (area === undefined) continue;
    const meta = PRODUCT_AREA_META[area];
    if (meta !== undefined) {
      allKeyPatterns.push(...meta.keyPatterns);
    }
  }

  // Diagram 1: C4Context cross-area system overview
  const c4Scope: DiagramScope = {
    title: 'System Architecture',
    diagramType: 'C4Context',
    patterns: allKeyPatterns,
  };
  sections.push(...buildScopedDiagram(dataset, c4Scope));

  // Diagram 2: Flowchart showing cross-area relationships
  const flowScope: DiagramScope = {
    title: 'Cross-Area Pattern Relationships',
    direction: 'LR',
    patterns: allKeyPatterns,
  };
  sections.push(...buildScopedDiagram(dataset, flowScope));

  const doc = document('Product Areas', sections, {
    purpose: 'Product area overview index',
    detailLevel: 'Full reference',
  });

  return renderToMarkdown(doc);
}

/**
 * Registers reference generators from the provided configs in the GeneratorRegistry.
 *
 * Partitions configs by `productArea` presence:
 * - Configs WITH `productArea` -> "product-area-docs" meta-generator
 * - Configs WITHOUT `productArea` -> "reference-docs" meta-generator
 * - Individual generators registered for all configs
 *
 * @param registry - The generator registry to register into
 * @param configs - Reference document configurations (from project config)
 */
export function registerReferenceGenerators(
  registry: GeneratorRegistry,
  configs: readonly ReferenceDocConfig[]
): void {
  // Partition configs by productArea presence
  const productAreaConfigs = configs.filter((c) => c.productArea !== undefined);
  const referenceConfigs = configs.filter((c) => c.productArea === undefined);

  // Product area meta-generator
  if (productAreaConfigs.length > 0) {
    registry.register(new ProductAreaDocsGenerator(productAreaConfigs));
  }

  // Standard reference-docs meta-generator
  if (referenceConfigs.length > 0) {
    registry.register(new ReferenceDocsGenerator(referenceConfigs));
  }

  // Individual generators: selective invocation per document
  for (const config of configs) {
    const kebabName = toGeneratorName(config.title);
    const docsPrefix = config.productArea !== undefined ? 'product-areas' : 'reference';

    registry.register(
      new ReferenceDocGenerator(
        `${kebabName}-reference`,
        `${config.title} (detailed)`,
        config,
        'detailed',
        `${docsPrefix}/${config.docsFilename}`
      )
    );

    registry.register(
      new ReferenceDocGenerator(
        `${kebabName}-reference-claude`,
        `${config.title} (summary)`,
        config,
        'summary',
        `_claude-md/${config.claudeMdSection}/${config.claudeMdFilename}`
      )
    );
  }
}
