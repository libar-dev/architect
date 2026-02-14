/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern UniversalRenderer
 * @libar-docs-status completed
 * @libar-docs-arch-role service
 * @libar-docs-arch-context renderer
 * @libar-docs-arch-layer application
 *
 * ## Universal Renderer
 *
 * Converts RenderableDocument to output strings. Two renderers:
 * - `renderToMarkdown` — Full markdown for human documentation
 * - `renderToClaudeContext` — Token-efficient format for LLM consumption
 *
 * Both are "dumb printers" — they know nothing about patterns, phases,
 * or domain concepts. All logic lives in the codecs; these just render blocks.
 *
 * ### When to Use
 *
 * - `renderToMarkdown` for human-readable docs (`docs/` output)
 * - `renderToClaudeContext` for AI context (`_claude-md/` output)
 * - `renderDocumentWithFiles` for multi-file output with detail files
 */
import type { RenderableDocument } from './schema.js';
/**
 * Render a RenderableDocument to markdown string.
 *
 * @param doc - The document to render
 * @returns Markdown string
 */
export declare function renderToMarkdown(doc: RenderableDocument): string;
/**
 * Render a RenderableDocument to token-efficient text for LLM consumption.
 *
 * Uses `=== SECTION ===` markers instead of markdown headers, omits
 * mermaid diagrams (LLMs cannot render them), flattens collapsible blocks,
 * and strips link-out URLs. Produces ~20-40% fewer tokens than markdown
 * for the same document.
 *
 * @param doc - The document to render
 * @returns Token-efficient string for AI context
 */
export declare function renderToClaudeContext(doc: RenderableDocument): string;
/**
 * Output file descriptor
 */
export interface OutputFile {
    path: string;
    content: string;
}
/**
 * Render a document and all its additional files.
 *
 * @param doc - The document to render
 * @param basePath - Base path for the main document
 * @param renderer - Render function to use (defaults to renderToMarkdown)
 * @returns Array of output files
 */
export declare function renderDocumentWithFiles(doc: RenderableDocument, basePath: string, renderer?: (d: RenderableDocument) => string): OutputFile[];
//# sourceMappingURL=render.d.ts.map