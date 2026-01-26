/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern UniversalRenderer
 * @libar-docs-status completed
 *
 * ## Universal Renderer
 *
 * Converts RenderableDocument to Markdown. This is the "dumb printer" -
 * it knows nothing about patterns, phases, or domain concepts.
 * All logic lives in the codecs; this just renders blocks.
 */
import type { RenderableDocument } from "./schema.js";
/**
 * Render a RenderableDocument to markdown string.
 *
 * @param doc - The document to render
 * @returns Markdown string
 */
export declare function renderToMarkdown(doc: RenderableDocument): string;
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
 * @returns Array of output files
 */
export declare function renderDocumentWithFiles(doc: RenderableDocument, basePath: string): OutputFile[];
//# sourceMappingURL=render.d.ts.map