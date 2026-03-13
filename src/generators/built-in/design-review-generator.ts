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

import type { DocumentGenerator, GeneratorContext, GeneratorOutput, OutputFile } from '../types.js';
import type { ExtractedPattern } from '../../validation-schemas/index.js';
import type { RenderableDocument } from '../../renderable/schema.js';
import { createDesignReviewCodec } from '../../renderable/codecs/design-review.js';
import { renderToMarkdown } from '../../renderable/render.js';
import { toKebabCase } from '../../utils/string-utils.js';

// =============================================================================
// Design Review Generator
// =============================================================================

class DesignReviewGeneratorImpl implements DocumentGenerator {
  readonly name = 'design-review';
  readonly description = 'Design review diagrams from sequence annotations';

  generate(
    _patterns: readonly ExtractedPattern[],
    context: GeneratorContext
  ): Promise<GeneratorOutput> {
    const files: OutputFile[] = [];
    const dataset = context.masterDataset;

    if (!dataset?.sequenceIndex) {
      return Promise.resolve({ files });
    }

    const sequenceIndex = dataset.sequenceIndex;

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

    return Promise.resolve({ files });
  }
}

/**
 * Create design review generator instance
 */
export function createDesignReviewGenerator(): DocumentGenerator {
  return new DesignReviewGeneratorImpl();
}
