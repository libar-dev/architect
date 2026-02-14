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
import { renderToMarkdown } from '../../renderable/render.js';
import { createReferenceCodec, } from '../../renderable/codecs/reference.js';
// ============================================================================
// Reference Document Configurations
// ============================================================================
/**
 * Built-in reference document configurations for the delivery-process package.
 *
 * Each entry defines one reference document's convention sources and shape globs.
 * Import this in your `delivery-process.config.ts` to use these configs,
 * or define your own `ReferenceDocConfig[]` for downstream repos.
 */
export const LIBAR_REFERENCE_CONFIGS = [
    {
        title: 'Process Guard Reference',
        conventionTags: ['fsm-rules'],
        shapeSources: ['src/lint/*.ts', 'src/validation/*.ts'],
        behaviorCategories: ['process-guard'],
        diagramScope: { archContext: ['lint', 'validation'] },
        // Note: Process Guard and Validation Reference share claudeMdSection 'validation'
        // — this is intentional as they use different filenames within the same directory.
        claudeMdSection: 'validation',
        docsFilename: 'PROCESS-GUARD-REFERENCE.md',
        claudeMdFilename: 'process-guard.md',
    },
    {
        title: 'Session Guides Reference',
        conventionTags: ['session-workflow', 'fsm-rules'],
        shapeSources: [],
        behaviorCategories: ['session-guides'],
        claudeMdSection: 'sessions',
        docsFilename: 'SESSION-GUIDES-REFERENCE.md',
        claudeMdFilename: 'session-guides.md',
    },
    {
        title: 'Architecture Reference',
        conventionTags: ['pipeline-architecture', 'output-format'],
        shapeSources: ['src/generators/types.ts', 'src/generators/pipeline/*.ts'],
        behaviorCategories: ['architecture'],
        diagramScope: { archContext: ['generator', 'renderer'] },
        claudeMdSection: 'architecture',
        docsFilename: 'ARCHITECTURE-REFERENCE.md',
        claudeMdFilename: 'architecture.md',
    },
    {
        title: 'Configuration Reference',
        conventionTags: ['config-presets', 'cli-patterns'],
        shapeSources: ['src/config/*.ts'],
        behaviorCategories: ['configuration'],
        diagramScope: { archContext: ['config'] },
        claudeMdSection: 'config',
        docsFilename: 'CONFIGURATION-REFERENCE.md',
        claudeMdFilename: 'configuration.md',
    },
    {
        title: 'Instructions Reference',
        conventionTags: ['annotation-system', 'pattern-naming', 'cli-patterns'],
        shapeSources: ['src/taxonomy/*.ts', 'src/cli/*.ts'],
        behaviorCategories: ['instructions'],
        claudeMdSection: 'reference',
        docsFilename: 'INSTRUCTIONS-REFERENCE.md',
        claudeMdFilename: 'instructions.md',
    },
    {
        title: 'Methodology Reference',
        conventionTags: ['session-workflow', 'annotation-system'],
        shapeSources: [],
        behaviorCategories: ['methodology'],
        claudeMdSection: 'methodology',
        docsFilename: 'METHODOLOGY-REFERENCE.md',
        claudeMdFilename: 'methodology.md',
    },
    {
        title: 'Gherkin Patterns Reference',
        conventionTags: ['testing-policy'],
        shapeSources: [],
        behaviorCategories: ['gherkin-patterns'],
        claudeMdSection: 'gherkin',
        docsFilename: 'GHERKIN-PATTERNS-REFERENCE.md',
        claudeMdFilename: 'gherkin-patterns.md',
    },
    {
        title: 'Taxonomy Reference',
        conventionTags: ['annotation-system'],
        shapeSources: ['src/taxonomy/*.ts'],
        behaviorCategories: ['taxonomy'],
        claudeMdSection: 'taxonomy',
        docsFilename: 'TAXONOMY-REFERENCE.md',
        claudeMdFilename: 'taxonomy.md',
    },
    {
        title: 'Validation Reference',
        conventionTags: ['fsm-rules', 'testing-policy'],
        shapeSources: ['src/validation/*.ts'],
        behaviorCategories: ['validation'],
        claudeMdSection: 'validation',
        docsFilename: 'VALIDATION-REFERENCE.md',
        claudeMdFilename: 'validation.md',
    },
    {
        title: 'Publishing Reference',
        conventionTags: ['publishing'],
        shapeSources: [],
        behaviorCategories: ['publishing'],
        claudeMdSection: 'publishing',
        docsFilename: 'PUBLISHING-REFERENCE.md',
        claudeMdFilename: 'publishing.md',
    },
    {
        title: 'Index Reference',
        conventionTags: ['doc-generation'],
        shapeSources: [],
        behaviorCategories: ['index'],
        claudeMdSection: 'index',
        docsFilename: 'INDEX-REFERENCE.md',
        claudeMdFilename: 'index.md',
    },
    {
        title: 'Pipeline Overview',
        conventionTags: ['pipeline-architecture'],
        shapeSources: [
            'src/renderable/schema.ts',
            'src/generators/types.ts',
            'src/validation-schemas/master-dataset.ts',
            'src/config/types.ts',
        ],
        behaviorCategories: [],
        diagramScopes: [
            { archView: ['codec-transformation'], title: 'Codec Transformation', direction: 'TB' },
            { archView: ['pipeline-stages'], title: 'Pipeline Data Flow', direction: 'LR' },
        ],
        claudeMdSection: 'architecture',
        docsFilename: 'PIPELINE-OVERVIEW.md',
        claudeMdFilename: 'pipeline-overview.md',
    },
    {
        title: 'Codec Architecture',
        conventionTags: [],
        shapeSources: ['src/renderable/schema.ts', 'src/validation-schemas/master-dataset.ts'],
        behaviorCategories: [],
        diagramScopes: [
            { archView: ['codec-transformation'], title: 'Codec Transformation', direction: 'TB' },
        ],
        claudeMdSection: 'architecture',
        docsFilename: 'CODEC-ARCHITECTURE.md',
        claudeMdFilename: 'codec-architecture.md',
    },
];
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
        const content = renderToMarkdown(doc);
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
                content: renderToMarkdown(summaryDoc),
            });
        }
        return Promise.resolve({ files });
    }
}
/**
 * Registers reference generators from the provided configs in the GeneratorRegistry.
 *
 * Registers:
 * - "reference-docs" meta-generator (produces all files at once)
 * - Individual generators for selective invocation:
 *   "{name}-reference" -> detailed, "{name}-reference-claude" -> summary
 *
 * @param registry - The generator registry to register into
 * @param configs - Reference document configurations (from project config)
 */
export function registerReferenceGenerators(registry, configs) {
    // Meta-generator: single -g reference-docs produces all files
    registry.register(new ReferenceDocsGenerator(configs));
    // Individual generators: selective invocation per document
    for (const config of configs) {
        const kebabName = toGeneratorName(config.title);
        registry.register(new ReferenceDocGenerator(`${kebabName}-reference`, `${config.title} (detailed)`, config, 'detailed', `docs/${config.docsFilename}`));
        registry.register(new ReferenceDocGenerator(`${kebabName}-reference-claude`, `${config.title} (summary)`, config, 'summary', `_claude-md/${config.claudeMdSection}/${config.claudeMdFilename}`));
    }
}
/** @deprecated Use LIBAR_REFERENCE_CONFIGS instead */
export const REFERENCE_CONFIGS = LIBAR_REFERENCE_CONFIGS;
//# sourceMappingURL=reference-generators.js.map