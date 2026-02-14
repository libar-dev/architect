/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern CompositeCodec
 * @libar-docs-status active
 * @libar-docs-implements ReferenceDocShowcase
 * @libar-docs-arch-role projection
 * @libar-docs-arch-context renderer
 * @libar-docs-arch-layer application
 *
 * ## Composite Document Codec
 *
 * Assembles reference documents from multiple codec outputs by concatenating
 * RenderableDocument sections. Enables building documents composed from any
 * combination of existing codecs.
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
import { z } from 'zod';
import { MasterDatasetSchema, } from '../../validation-schemas/master-dataset.js';
import { separator, document } from '../schema.js';
import { DEFAULT_BASE_OPTIONS } from './types/base.js';
import { RenderableDocumentOutputSchema } from './shared-schema.js';
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
export function composeDocuments(documents, options) {
    const sections = [];
    let mergedAdditionalFiles;
    let hasPreviousContent = false;
    for (const currentDoc of documents) {
        // Skip empty documents entirely (no separator emitted)
        if (currentDoc.sections.length === 0 && currentDoc.additionalFiles === undefined) {
            continue;
        }
        // Add separator between non-empty outputs
        if (options.separateSections !== false &&
            hasPreviousContent &&
            currentDoc.sections.length > 0) {
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
    const docOptions = {};
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
 * MasterDataset and composes their outputs into a single RenderableDocument.
 */
export function createCompositeCodec(codecs, options) {
    const separateSections = options.separateSections ?? true;
    const detailLevel = options.detailLevel ?? DEFAULT_BASE_OPTIONS.detailLevel;
    return z.codec(MasterDatasetSchema, RenderableDocumentOutputSchema, {
        decode: (dataset) => {
            const documents = codecs.map((codec) => codec.decode(dataset));
            const composeOpts = {
                title: options.title,
                detailLevel,
                separateSections,
            };
            return composeDocuments(documents, options.purpose !== undefined ? { ...composeOpts, purpose: options.purpose } : composeOpts);
        },
        encode: () => {
            throw new Error('CompositeCodec is decode-only');
        },
    });
}
//# sourceMappingURL=composite.js.map