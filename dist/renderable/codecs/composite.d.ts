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
import { type RenderableDocument } from '../schema.js';
import { type BaseCodecOptions, type DocumentCodec } from './types/base.js';
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
/**
 * Compose multiple RenderableDocuments into a single document.
 *
 * Concatenates sections in array order. Merges additionalFiles with
 * last-wins semantics on key collision. Inserts separator blocks
 * between non-empty document outputs by default.
 */
export declare function composeDocuments(documents: readonly RenderableDocument[], options: ComposeOptions): RenderableDocument;
/**
 * Create a CompositeCodec that decodes each child codec against the same
 * MasterDataset and composes their outputs into a single RenderableDocument.
 */
export declare function createCompositeCodec(codecs: readonly DocumentCodec[], options: CompositeCodecOptions): DocumentCodec;
//# sourceMappingURL=composite.d.ts.map