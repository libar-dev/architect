/**
 * @libar-docs
 * @libar-docs-pattern ReferenceGeneratorRegistration
 * @libar-docs-status active
 * @libar-docs-implements CodecDrivenReferenceGeneration
 *
 * ## Reference Generator Registrations
 *
 * Registers all reference document generators. Each config produces
 * TWO generators: detailed (docs/) and summary (_claude-md/).
 */
import { heading, paragraph, separator, table, document } from '../../renderable/schema.js';
import { renderToMarkdown, renderToClaudeContext } from '../../renderable/render.js';
import { createReferenceCodec, PRODUCT_AREA_META, buildScopedDiagram, } from '../../renderable/codecs/reference.js';
import { toKebabCase } from '../../utils/string-utils.js';
import { normalizeStatus } from '../../taxonomy/normalized-status.js';
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
];
/**
 * Creates reference document configs for all canonical product areas.
 *
 * Each config uses `productArea` as the primary filter — the codec
 * auto-derives all content sources from the filtered pattern set.
 * Explicit `conventionTags`, `shapeSources`, and `behaviorCategories`
 * are left empty because the product-area decode path ignores them.
 *
 * @param options - Optional customization for output filenames
 */
export function createProductAreaConfigs(options) {
    const suffix = options?.docsFilenameSuffix ?? '.md';
    return PRODUCT_AREA_VALUES.map((area) => {
        const kebab = toKebabCase(area);
        return {
            title: `${area} Overview`,
            productArea: area,
            conventionTags: [],
            shapeSources: [],
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
class ReferenceDocGenerator {
    name;
    description;
    config;
    detailLevel;
    outputPath;
    constructor(name, description, config, detailLevel, outputPath) {
        this.name = name;
        this.description = description;
        this.config = config;
        this.detailLevel = detailLevel;
        this.outputPath = outputPath;
    }
    generate(_patterns, context) {
        if (!context.masterDataset) {
            return Promise.resolve({
                files: [],
                errors: [
                    {
                        type: 'generator',
                        message: `Generator "${this.name}" requires MasterDataset but none was provided.`,
                    },
                ],
            });
        }
        const codec = createReferenceCodec(this.config, {
            detailLevel: this.detailLevel,
            generateDetailFiles: false,
        });
        // Cast needed: Zod codec infers optional props as `T | undefined`,
        // but RenderableDocument uses exactOptionalPropertyTypes
        const doc = codec.decode(context.masterDataset);
        // Summary-level output (for _claude-md/) uses token-efficient renderer
        const render = this.detailLevel === 'summary' ? renderToClaudeContext : renderToMarkdown;
        const content = render(doc);
        return Promise.resolve({
            files: [{ path: this.outputPath, content }],
        });
    }
}
// ============================================================================
// Registration
// ============================================================================
/**
 * Derive a kebab-case name from a title like "Process Guard Reference".
 */
function toGeneratorName(title) {
    return title
        .replace(/ Reference$/, '')
        .toLowerCase()
        .replace(/\s+/g, '-');
}
/**
 * Meta-generator that produces all reference documents (detailed + summary per config)
 * from a single `-g reference-docs` invocation.
 *
 * Only handles configs WITHOUT `productArea` set. Product-area configs
 * are handled by `ProductAreaDocsGenerator` instead.
 */
class ReferenceDocsGenerator {
    configs;
    name = 'reference-docs';
    description;
    constructor(configs) {
        this.configs = configs;
        this.description = `All reference documents (${configs.length} detailed + ${configs.length} summary)`;
    }
    generate(_patterns, context) {
        if (!context.masterDataset) {
            return Promise.resolve({
                files: [],
                errors: [
                    {
                        type: 'generator',
                        message: `Generator "${this.name}" requires MasterDataset but none was provided.`,
                    },
                ],
            });
        }
        const files = [];
        for (const config of this.configs) {
            // Detailed output -> docs/{docsFilename}
            const detailedCodec = createReferenceCodec(config, {
                detailLevel: 'detailed',
                generateDetailFiles: false,
            });
            const detailedDoc = detailedCodec.decode(context.masterDataset);
            files.push({ path: `docs/${config.docsFilename}`, content: renderToMarkdown(detailedDoc) });
            // Summary output -> _claude-md/{section}/{filename}
            const summaryCodec = createReferenceCodec(config, {
                detailLevel: 'summary',
                generateDetailFiles: false,
            });
            const summaryDoc = summaryCodec.decode(context.masterDataset);
            files.push({
                path: `_claude-md/${config.claudeMdSection}/${config.claudeMdFilename}`,
                content: renderToClaudeContext(summaryDoc),
            });
        }
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
class ProductAreaDocsGenerator {
    configs;
    name = 'product-area-docs';
    description;
    constructor(configs) {
        this.configs = configs;
        this.description = `Product area overview documents (${configs.length} areas)`;
    }
    generate(_patterns, context) {
        if (!context.masterDataset) {
            return Promise.resolve({
                files: [],
                errors: [
                    {
                        type: 'generator',
                        message: `Generator "${this.name}" requires MasterDataset but none was provided.`,
                    },
                ],
            });
        }
        const files = [];
        for (const config of this.configs) {
            // Detailed output -> product-areas/{docsFilename}
            const detailedCodec = createReferenceCodec(config, {
                detailLevel: 'detailed',
                generateDetailFiles: false,
            });
            const detailedDoc = detailedCodec.decode(context.masterDataset);
            files.push({
                path: `product-areas/${config.docsFilename}`,
                content: renderToMarkdown(detailedDoc),
            });
            // Summary output -> _claude-md/{section}/{filename}
            const summaryCodec = createReferenceCodec(config, {
                detailLevel: 'summary',
                generateDetailFiles: false,
            });
            const summaryDoc = summaryCodec.decode(context.masterDataset);
            files.push({
                path: `_claude-md/${config.claudeMdSection}/${config.claudeMdFilename}`,
                content: renderToClaudeContext(summaryDoc),
            });
        }
        // Progressive disclosure index
        files.push({
            path: 'PRODUCT-AREAS.md',
            content: buildProductAreaIndex(this.configs, context.masterDataset),
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
function buildProductAreaIndex(configs, dataset) {
    const sections = [];
    // Per-area sections with intro prose and live statistics
    for (const config of configs) {
        const area = config.productArea;
        if (area === undefined)
            continue;
        const meta = PRODUCT_AREA_META[area];
        if (meta === undefined)
            continue;
        sections.push(heading(2, `[${area}](product-areas/${config.docsFilename})`));
        sections.push(paragraph(`> **${meta.question}**`));
        sections.push(paragraph(meta.intro));
        // Live per-area statistics
        const areaPatterns = dataset.patterns.filter((p) => p.productArea === area);
        if (areaPatterns.length > 0) {
            const completed = areaPatterns.filter((p) => normalizeStatus(p.status) === 'completed').length;
            const active = areaPatterns.filter((p) => normalizeStatus(p.status) === 'active').length;
            const planned = areaPatterns.filter((p) => normalizeStatus(p.status) === 'planned').length;
            sections.push(paragraph(`**${areaPatterns.length} patterns** — ${completed} completed, ${active} active, ${planned} planned`));
        }
        // Key patterns from curated list
        if (meta.keyPatterns.length > 0) {
            sections.push(paragraph(`**Key patterns:** ${meta.keyPatterns.join(', ')}`));
        }
    }
    sections.push(separator());
    // Cross-area progress summary table
    const tableHeaders = ['Area', 'Patterns', 'Completed', 'Active', 'Planned'];
    const tableRows = [];
    let totalPatterns = 0;
    let totalCompleted = 0;
    let totalActive = 0;
    let totalPlanned = 0;
    for (const config of configs) {
        const area = config.productArea;
        if (area === undefined)
            continue;
        const areaPatterns = dataset.patterns.filter((p) => p.productArea === area);
        const completed = areaPatterns.filter((p) => normalizeStatus(p.status) === 'completed').length;
        const active = areaPatterns.filter((p) => normalizeStatus(p.status) === 'active').length;
        const planned = areaPatterns.filter((p) => normalizeStatus(p.status) === 'planned').length;
        tableRows.push([
            `[${area}](product-areas/${config.docsFilename})`,
            String(areaPatterns.length),
            String(completed),
            String(active),
            String(planned),
        ]);
        totalPatterns += areaPatterns.length;
        totalCompleted += completed;
        totalActive += active;
        totalPlanned += planned;
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
    const allKeyPatterns = [];
    for (const config of configs) {
        const area = config.productArea;
        if (area === undefined)
            continue;
        const meta = PRODUCT_AREA_META[area];
        if (meta !== undefined) {
            allKeyPatterns.push(...meta.keyPatterns);
        }
    }
    // Diagram 1: C4Context cross-area system overview
    const c4Scope = {
        title: 'System Architecture',
        diagramType: 'C4Context',
        patterns: allKeyPatterns,
    };
    sections.push(...buildScopedDiagram(dataset, c4Scope));
    // Diagram 2: Flowchart showing cross-area relationships
    const flowScope = {
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
export function registerReferenceGenerators(registry, configs) {
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
        const docsPrefix = config.productArea !== undefined ? 'product-areas' : 'docs';
        registry.register(new ReferenceDocGenerator(`${kebabName}-reference`, `${config.title} (detailed)`, config, 'detailed', `${docsPrefix}/${config.docsFilename}`));
        registry.register(new ReferenceDocGenerator(`${kebabName}-reference-claude`, `${config.title} (summary)`, config, 'summary', `_claude-md/${config.claudeMdSection}/${config.claudeMdFilename}`));
    }
}
//# sourceMappingURL=reference-generators.js.map