/**
 * @architect
 * @architect-core
 * @architect-pattern CompositeCodec
 * @architect-status active
 * @architect-implements ReferenceDocShowcase
 * @architect-arch-role projection
 * @architect-arch-context renderer
 * @architect-arch-layer application
 * @architect-convention codec-registry
 * @architect-product-area:Generation
 *
 * ## CompositeCodec
 *
 * Assembles reference documents from multiple codec outputs by concatenating
 * RenderableDocument sections. Enables building documents composed from any
 * combination of existing codecs.
 *
 * **Purpose:** Assembles documents from multiple child codecs into a single RenderableDocument.
 *
 * **Output Files:** Configured per-instance (composes child codec outputs)
 *
 * ### When to Use
 *
 * - When building reference docs from multiple codec outputs
 * - When composing session briefs from overview + current work + remaining work
 * - When referenceDocConfigs need content from arbitrary codecs
 *
 * ### Factory Pattern
 *
 * Use the factory function with child codecs and options:
 * ```typescript
 * const codec = createCompositeCodec(
 *   [OverviewCodec, CurrentWorkCodec, RemainingWorkCodec],
 *   { title: 'Session Brief' }
 * );
 * const doc = codec.decode(dataset);
 * ```
 *
 * Or use `composeDocuments` directly at the document level:
 * ```typescript
 * const doc = composeDocuments([docA, docB], { title: 'Combined' });
 * ```
 */

import { type RenderableDocument, type SectionBlock, separator, document } from '../schema.js';
import {
  type BaseCodecOptions,
  type DocumentCodec,
  DEFAULT_BASE_OPTIONS,
  createDecodeOnlyCodec,
} from './types/base.js';

// ═══════════════════════════════════════════════════════════════════════════
// Options
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Options for composing RenderableDocuments without the codec wrapper.
 */
export interface ComposeOptions {
  /** Document title for the composed output */
  readonly title: string;

  /** Optional purpose description */
  readonly purpose?: string;

  /** Optional detail level indicator */
  readonly detailLevel?: string;

  /** Insert separator blocks between document outputs (default: true) */
  readonly separateSections?: boolean;
}

/**
 * Options for createCompositeCodec factory.
 */
export interface CompositeCodecOptions extends BaseCodecOptions {
  /** Document title for the composite output */
  readonly title: string;

  /** Optional purpose description */
  readonly purpose?: string;

  /** Insert separator blocks between codec outputs (default: true) */
  readonly separateSections?: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// composeDocuments — Pure Document Composition
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Compose multiple RenderableDocuments into a single document.
 *
 * Concatenates sections in array order. Merges additionalFiles with
 * last-wins semantics on key collision. Inserts separator blocks
 * between non-empty document outputs by default.
 */
export function composeDocuments(
  documents: readonly RenderableDocument[],
  options: ComposeOptions
): RenderableDocument {
  const sections: SectionBlock[] = [];
  let mergedAdditionalFiles: Record<string, RenderableDocument> | undefined;
  let hasPreviousContent = false;

  for (const currentDoc of documents) {
    // Skip empty documents entirely (no separator emitted)
    if (currentDoc.sections.length === 0 && currentDoc.additionalFiles === undefined) {
      continue;
    }

    // Add separator between non-empty outputs
    if (
      options.separateSections !== false &&
      hasPreviousContent &&
      currentDoc.sections.length > 0
    ) {
      sections.push(separator());
    }

    if (currentDoc.sections.length > 0) {
      hasPreviousContent = true;
    }

    sections.push(...currentDoc.sections);

    // Merge additionalFiles (last-wins on key collision)
    if (currentDoc.additionalFiles !== undefined) {
      mergedAdditionalFiles ??= {};
      for (const [key, value] of Object.entries(currentDoc.additionalFiles)) {
        mergedAdditionalFiles[key] = value;
      }
    }
  }

  const docOptions: {
    purpose?: string;
    detailLevel?: string;
    additionalFiles?: Record<string, RenderableDocument>;
  } = {};
  if (options.purpose !== undefined) {
    docOptions.purpose = options.purpose;
  }
  if (options.detailLevel !== undefined) {
    docOptions.detailLevel = options.detailLevel;
  }
  if (mergedAdditionalFiles !== undefined) {
    docOptions.additionalFiles = mergedAdditionalFiles;
  }

  return document(options.title, sections, docOptions);
}

// ═══════════════════════════════════════════════════════════════════════════
// createCompositeCodec — Codec Factory
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a CompositeCodec that decodes each child codec against the same
 * PatternGraph and composes their outputs into a single RenderableDocument.
 */
export function createCompositeCodec(
  codecs: readonly DocumentCodec[],
  options: CompositeCodecOptions
): DocumentCodec {
  const separateSections = options.separateSections ?? true;
  const detailLevel = options.detailLevel ?? DEFAULT_BASE_OPTIONS.detailLevel;

  return createDecodeOnlyCodec(({ dataset }) => {
    const documents = codecs.map((codec) => codec.decode(dataset) as RenderableDocument);

    const composeOpts: ComposeOptions = {
      title: options.title,
      detailLevel,
      separateSections,
    };

    return composeDocuments(
      documents,
      options.purpose !== undefined ? { ...composeOpts, purpose: options.purpose } : composeOpts
    );
  });
}
