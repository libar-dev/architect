/**
 * @libar-docs
 * @libar-docs-pattern ReferenceGeneratorRegistration
 * @libar-docs-status active
 * @libar-docs-implements CodecDrivenReferenceGeneration
 *
 * ## Reference Generator Registrations
 *
 * Registers all 11 reference document generators. Each config produces
 * TWO generators: detailed (docs/) and summary (_claude-md/).
 */

import type { DocumentGenerator, GeneratorContext, GeneratorOutput } from '../types.js';
import type { ExtractedPattern } from '../../validation-schemas/index.js';
import type { DetailLevel } from '../../renderable/codecs/types/base.js';
import type { RenderableDocument } from '../../renderable/schema.js';
import type { GeneratorRegistry } from '../registry.js';
import { renderToMarkdown } from '../../renderable/render.js';
import {
  createReferenceCodec,
  type ReferenceDocConfig,
} from '../../renderable/codecs/reference.js';

// ============================================================================
// Reference Document Configurations
// ============================================================================

/**
 * All reference document configurations.
 *
 * Each entry defines one reference document's convention sources and shape globs.
 */
export const REFERENCE_CONFIGS: readonly ReferenceDocConfig[] = [
  {
    title: 'Process Guard Reference',
    conventionTags: ['fsm-rules'],
    shapeSources: ['src/lint/*.ts', 'src/validation/*.ts'],
    behaviorCategories: ['process-guard'],
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
    claudeMdSection: 'architecture',
    docsFilename: 'ARCHITECTURE-REFERENCE.md',
    claudeMdFilename: 'architecture.md',
  },
  {
    title: 'Configuration Reference',
    conventionTags: ['config-presets', 'cli-patterns'],
    shapeSources: ['src/config/*.ts'],
    behaviorCategories: ['configuration'],
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
] as const;

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
    if (!context.masterDataset) {
      return Promise.resolve({
        files: [],
        errors: [
          {
            type: 'generator' as const,
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
    const doc = codec.decode(context.masterDataset) as RenderableDocument;
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
function toGeneratorName(title: string): string {
  return title
    .replace(/ Reference$/, '')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

/**
 * Meta-generator that produces all 22 reference documents (11 detailed + 11 summary)
 * from a single `-g reference-docs` invocation.
 */
class ReferenceDocsGenerator implements DocumentGenerator {
  readonly name = 'reference-docs';
  readonly description = 'All reference documents (11 detailed + 11 summary)';

  generate(
    _patterns: readonly ExtractedPattern[],
    context: GeneratorContext
  ): Promise<GeneratorOutput> {
    if (!context.masterDataset) {
      return Promise.resolve({
        files: [],
        errors: [
          {
            type: 'generator' as const,
            message: `Generator "${this.name}" requires MasterDataset but none was provided.`,
          },
        ],
      });
    }

    const files: Array<{ path: string; content: string }> = [];

    for (const config of REFERENCE_CONFIGS) {
      // Detailed output -> docs/{docsFilename}
      const detailedCodec = createReferenceCodec(config, {
        detailLevel: 'detailed',
        generateDetailFiles: false,
      });
      const detailedDoc = detailedCodec.decode(context.masterDataset) as RenderableDocument;
      files.push({ path: `docs/${config.docsFilename}`, content: renderToMarkdown(detailedDoc) });

      // Summary output -> _claude-md/{section}/{filename}
      const summaryCodec = createReferenceCodec(config, {
        detailLevel: 'summary',
        generateDetailFiles: false,
      });
      const summaryDoc = summaryCodec.decode(context.masterDataset) as RenderableDocument;
      files.push({
        path: `_claude-md/${config.claudeMdSection}/${config.claudeMdFilename}`,
        content: renderToMarkdown(summaryDoc),
      });
    }

    return Promise.resolve({ files });
  }
}

/**
 * Registers all reference generators in the GeneratorRegistry.
 *
 * Registers:
 * - "reference-docs" meta-generator (produces all 22 files at once)
 * - 22 individual generators for selective invocation:
 *   "{name}-reference" -> detailed, "{name}-reference-claude" -> summary
 */
export function registerReferenceGenerators(registry: GeneratorRegistry): void {
  // Meta-generator: single -g reference-docs produces all 22 files
  registry.register(new ReferenceDocsGenerator());

  // Individual generators: selective invocation per document
  for (const config of REFERENCE_CONFIGS) {
    const kebabName = toGeneratorName(config.title);

    registry.register(
      new ReferenceDocGenerator(
        `${kebabName}-reference`,
        `${config.title} (detailed)`,
        config,
        'detailed',
        `docs/${config.docsFilename}`
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
