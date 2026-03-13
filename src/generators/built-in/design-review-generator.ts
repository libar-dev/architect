/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern DesignReviewGenerator
 * @libar-docs-status active
 * @libar-docs-implements DesignReviewGeneration
 * @libar-docs-arch-role service
 * @libar-docs-arch-context generator
 * @libar-docs-arch-layer application
 * @libar-docs-uses DesignReviewCodec, MasterDataset, SequenceIndex
 * @libar-docs-product-area:Generation
 *
 * ## DesignReviewGenerator
 *
 * Generates design review documents for patterns with sequence annotations.
 * Auto-discovers annotated patterns from MasterDataset.sequenceIndex and
 * produces one design review per entry.
 *
 * Output: `delivery-process/design-reviews/{pattern-name}.md`
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { DocumentGenerator, GeneratorContext, GeneratorOutput, OutputFile } from '../types.js';
import type { ExtractedPattern } from '../../validation-schemas/index.js';
import type { RenderableDocument } from '../../renderable/schema.js';
import { createDesignReviewCodec } from '../../renderable/codecs/design-review.js';
import { renderToMarkdown } from '../../renderable/render.js';
import { toKebabCase } from '../../utils/string-utils.js';

// =============================================================================
// Design Review Generator
// =============================================================================

async function listExistingDesignReviewFiles(
  baseDir: string,
  outputDir: string
): Promise<string[]> {
  const outputRoot = path.isAbsolute(outputDir) ? outputDir : path.join(baseDir, outputDir);
  const reviewsDir = path.join(outputRoot, 'design-reviews');

  try {
    const entries = await fs.readdir(reviewsDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => `design-reviews/${entry.name}`)
      .sort();
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }

    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[design-review] Skipping orphan cleanup scan: ${message}`);
    return [];
  }
}

class DesignReviewGeneratorImpl implements DocumentGenerator {
  readonly name = 'design-review';
  readonly description = 'Design review diagrams from sequence annotations';

  async generate(
    _patterns: readonly ExtractedPattern[],
    context: GeneratorContext
  ): Promise<GeneratorOutput> {
    const files: OutputFile[] = [];
    const dataset = context.masterDataset;

    if (!dataset) {
      return { files };
    }

    const sequenceIndex = dataset.sequenceIndex;
    if (!sequenceIndex || Object.keys(sequenceIndex).length === 0) {
      return { files };
    }

    const expectedFiles = new Set(
      Object.keys(sequenceIndex).map(
        (patternName) => `design-reviews/${toKebabCase(patternName)}.md`
      )
    );
    const existingFiles = await listExistingDesignReviewFiles(context.baseDir, context.outputDir);
    const filesToDelete = existingFiles.filter((filePath) => !expectedFiles.has(filePath));

    for (const patternName of Object.keys(sequenceIndex)) {
      try {
        const codec = createDesignReviewCodec({ patternName });
        // Cast needed: RenderableDocumentOutputSchema uses z.string().optional() for purpose/detailLevel
        // which under exactOptionalPropertyTypes produces `string | undefined`, not compatible with
        // RenderableDocument's `purpose?: string` (absent-or-string, not present-as-undefined).
        // The codec always provides these values, so the cast is safe at runtime.
        const doc = codec.decode(dataset) as RenderableDocument;
        const markdown = renderToMarkdown(doc);

        const filename = `design-reviews/${toKebabCase(patternName)}.md`;
        files.push({ path: filename, content: markdown });
      } catch (error: unknown) {
        // Keep generating remaining design reviews even if one annotated pattern is invalid.
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`[design-review] Skipping ${patternName}: ${message}`);
      }
    }

    return {
      files,
      ...(filesToDelete.length > 0 && { filesToDelete }),
    };
  }
}

/**
 * Create design review generator instance
 */
export function createDesignReviewGenerator(): DocumentGenerator {
  return new DesignReviewGeneratorImpl();
}
