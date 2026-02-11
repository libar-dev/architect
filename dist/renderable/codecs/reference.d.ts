/**
 * @libar-docs
 * @libar-docs-pattern ReferenceDocumentCodec
 * @libar-docs-status active
 * @libar-docs-implements CodecDrivenReferenceGeneration
 *
 * ## Parameterized Reference Document Codec
 *
 * A single codec factory that creates reference document codecs from
 * configuration objects. Convention content is sourced from
 * decision records tagged with @libar-docs-convention.
 *
 * ### When to Use
 *
 * - When generating reference documentation from convention-tagged decisions
 * - When creating both detailed (docs/) and summary (_claude-md/) outputs
 *
 * ### Factory Pattern
 *
 * ```typescript
 * const codec = createReferenceCodec(config, { detailLevel: 'detailed' });
 * const doc = codec.decode(dataset);
 * ```
 */
import { type BaseCodecOptions, type DetailLevel, type DocumentCodec } from './types/base.js';
/**
 * Configuration for a reference document type.
 *
 * Each config object defines one reference document's composition.
 * Convention tags, shape sources, and behavior tags control content assembly.
 */
export interface ReferenceDocConfig {
    /** Document title (e.g., "Process Guard Reference") */
    readonly title: string;
    /** Convention tag values to extract from decision records */
    readonly conventionTags: readonly string[];
    /**
     * Glob patterns for TypeScript shape extraction sources.
     * Resolved via in-memory matching against pattern.source.file (AD-6).
     */
    readonly shapeSources: readonly string[];
    /** Tags to filter behavior patterns from MasterDataset */
    readonly behaviorTags: readonly string[];
    /** Target _claude-md/ directory for summary output */
    readonly claudeMdSection: string;
    /** Output filename for detailed docs (in docs/) */
    readonly docsFilename: string;
    /** Output filename for summary _claude-md module */
    readonly claudeMdFilename: string;
}
export interface ReferenceCodecOptions extends BaseCodecOptions {
    /** Override detail level (default: 'standard') */
    readonly detailLevel?: DetailLevel;
}
/**
 * Creates a reference document codec from configuration.
 *
 * The codec composes a RenderableDocument from three sources:
 * 1. Convention content from convention-tagged decision records
 * 2. TypeScript shapes from patterns matching shapeSources globs
 * 3. Behavior content from category-tagged patterns
 *
 * @param config - Reference document configuration
 * @param options - Codec options including DetailLevel
 */
export declare function createReferenceCodec(config: ReferenceDocConfig, options?: ReferenceCodecOptions): DocumentCodec;
//# sourceMappingURL=reference.d.ts.map