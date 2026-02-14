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
import type { ShapeSelector } from './shape-matcher.js';
/**
 * Scoped diagram filter for dynamic mermaid generation from relationship metadata.
 *
 * Patterns matching the filter become diagram nodes. Immediate neighbors
 * (connected via relationship edges but not in scope) appear with a distinct style.
 */
export interface DiagramScope {
    /** Bounded contexts to include (matches pattern.archContext) */
    readonly archContext?: readonly string[];
    /** Explicit pattern names to include */
    readonly patterns?: readonly string[];
    /** Cross-cutting include tags (matches pattern.include entries) */
    readonly include?: readonly string[];
    /** Architectural layers to include (matches pattern.archLayer) */
    readonly archLayer?: readonly string[];
    /** Mermaid graph direction (default: 'TB') */
    readonly direction?: 'TB' | 'LR';
    /** Section heading for this diagram (default: 'Component Overview') */
    readonly title?: string;
    /** Mermaid diagram type (default: 'graph' for flowchart) */
    readonly diagramType?: 'graph' | 'sequenceDiagram' | 'stateDiagram-v2' | 'C4Context' | 'classDiagram';
    /** Show relationship type labels on edges (default: true) */
    readonly showEdgeLabels?: boolean;
}
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
    /** Categories to filter behavior patterns from MasterDataset */
    readonly behaviorCategories: readonly string[];
    /** Optional scoped diagram generation from relationship metadata */
    readonly diagramScope?: DiagramScope;
    /** Multiple scoped diagrams. Takes precedence over diagramScope. */
    readonly diagramScopes?: readonly DiagramScope[];
    /** Target _claude-md/ directory for summary output */
    readonly claudeMdSection: string;
    /** Output filename for detailed docs (in docs/) */
    readonly docsFilename: string;
    /** Output filename for summary _claude-md module */
    readonly claudeMdFilename: string;
    /** DD-3/DD-6: Fine-grained shape selectors for declaration-level filtering */
    readonly shapeSelectors?: readonly ShapeSelector[];
    /** DD-1 (CrossCuttingDocumentInclusion): Include-tag values for cross-cutting content routing */
    readonly includeTags?: readonly string[];
}
export interface ReferenceCodecOptions extends BaseCodecOptions {
    /** Override detail level (default: 'standard') */
    readonly detailLevel?: DetailLevel;
}
/**
 * Creates a reference document codec from configuration.
 *
 * The codec composes a RenderableDocument from up to four sources:
 * 1. Convention content from convention-tagged decision records
 * 2. Scoped relationship diagram (if diagramScope configured)
 * 3. TypeScript shapes from patterns matching shapeSources globs
 * 4. Behavior content from category-tagged patterns
 *
 * @param config - Reference document configuration
 * @param options - Codec options including DetailLevel
 */
export declare function createReferenceCodec(config: ReferenceDocConfig, options?: ReferenceCodecOptions): DocumentCodec;
//# sourceMappingURL=reference.d.ts.map