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
import { renderToMarkdown, renderToClaudeContext } from '../../renderable/render.js';
import { createReferenceCodec, PRODUCT_AREA_META, } from '../../renderable/codecs/reference.js';
import { toKebabCase } from '../../utils/string-utils.js';
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
            content: buildProductAreaIndex(this.configs),
        });
        return Promise.resolve({ files });
    }
}
/**
 * Builds a progressive disclosure index for product area documents.
 *
 * Includes per-area intros from PRODUCT_AREA_META and two cross-area
 * Mermaid diagrams showing pipeline data flow and dependency layers.
 */
function buildProductAreaIndex(configs) {
    const lines = [
        '# Product Areas',
        '',
        '**Purpose:** Product area overview index',
        '',
        '---',
        '',
    ];
    // Per-area sections with intro prose
    for (const config of configs) {
        const area = config.productArea;
        if (area === undefined)
            continue;
        const meta = PRODUCT_AREA_META[area];
        if (meta === undefined)
            continue;
        lines.push(`## [${area}](product-areas/${config.docsFilename})`);
        lines.push('');
        lines.push(`> **${meta.question}**`);
        lines.push('');
        lines.push(meta.intro);
        lines.push('');
    }
    // Cross-area relationship diagrams
    lines.push('---');
    lines.push('');
    lines.push('## Pipeline Data Flow');
    lines.push('');
    lines.push('Shows the 4-stage transformation pipeline and which product areas participate at each stage:');
    lines.push('');
    lines.push('```mermaid');
    lines.push('graph LR');
    lines.push('    CFG[Configuration] --> ANN');
    lines.push('    subgraph ANN[Annotation]');
    lines.push('        S[Scanner] -->|ScannedFile| E[Extractor]');
    lines.push('    end');
    lines.push('    E -->|ExtractedPattern| GEN');
    lines.push('    subgraph GEN[Generation]');
    lines.push('        P[Pipeline] -->|MasterDataset| C[Codecs]');
    lines.push('    end');
    lines.push('    C --> MD((Markdown))');
    lines.push('    CT[CoreTypes] -.-> S & E & P');
    lines.push('    VAL[Validation] -.-> P');
    lines.push('    API[DataAPI] -.-> C');
    lines.push('```');
    lines.push('');
    lines.push('## Product Area Dependency Layers');
    lines.push('');
    lines.push('Shows the layered architecture — arrows mean "depends on" (bottom-up):');
    lines.push('');
    lines.push('```mermaid');
    lines.push('graph BT');
    lines.push('    CT[CoreTypes] --> CFG[Configuration]');
    lines.push('    CT --> ANN[Annotation]');
    lines.push('    CT --> VAL[Validation]');
    lines.push('    CT --> GEN[Generation]');
    lines.push('    CFG --> ANN');
    lines.push('    CFG --> GEN');
    lines.push('    CFG --> VAL');
    lines.push('    ANN --> GEN');
    lines.push('    ANN --> VAL');
    lines.push('    VAL -.->|FSM rules| GEN');
    lines.push('    API[DataAPI] -.->|queries| GEN');
    lines.push('    PRO[Process] -.->|sessions| API');
    lines.push('```');
    lines.push('');
    return lines.join('\n');
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