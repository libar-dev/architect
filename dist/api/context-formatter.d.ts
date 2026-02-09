/**
 * @libar-docs
 * @libar-docs-pattern ContextFormatterImpl
 * @libar-docs-status active
 * @libar-docs-implements DataAPIContextAssembly
 * @libar-docs-uses ContextAssemblerImpl
 * @libar-docs-used-by ProcessAPICLIImpl
 * @libar-docs-arch-role service
 * @libar-docs-arch-context api
 * @libar-docs-arch-layer application
 *
 * ## ContextFormatter — Plain Text Renderer for Context Bundles
 *
 * First plain-text formatter in the codebase. All other rendering goes
 * through the Codec/RenderableDocument/UniversalRenderer markdown pipeline.
 * Context bundles are rendered as compact structured text with === section
 * markers for easy AI parsing (see ADR-008).
 */
import type { ContextBundle, DepTreeNode, FileReadingList, OverviewSummary } from './context-assembler.js';
export declare function formatContextBundle(bundle: ContextBundle): string;
export declare function formatDepTree(tree: DepTreeNode): string;
export declare function formatFileReadingList(list: FileReadingList): string;
export declare function formatOverview(overview: OverviewSummary): string;
//# sourceMappingURL=context-formatter.d.ts.map