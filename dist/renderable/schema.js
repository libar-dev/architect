/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern RenderableDocument
 * @libar-docs-status completed
 *
 * ## RenderableDocument Schema
 *
 * Universal intermediate format for all generated documentation.
 * Document codecs transform MasterDataset into this format,
 * then the universal renderer converts it to markdown.
 *
 * ### Block Vocabulary (9 types)
 *
 * - Structural: heading, paragraph, separator
 * - Content: table, list, code, mermaid
 * - Progressive: collapsible, link-out
 */
import { z } from "zod";
// ═══════════════════════════════════════════════════════════════════════════
// Block Schemas
// ═══════════════════════════════════════════════════════════════════════════
/** Heading block - markdown headers */
export const HeadingBlockSchema = z.object({
    type: z.literal("heading"),
    level: z.number().int().min(1).max(6),
    text: z.string(),
});
/** Paragraph block - plain text content */
export const ParagraphBlockSchema = z.object({
    type: z.literal("paragraph"),
    text: z.string(),
});
/** Separator block - horizontal rule */
export const SeparatorBlockSchema = z.object({
    type: z.literal("separator"),
});
/** Table block - markdown tables */
export const TableBlockSchema = z.object({
    type: z.literal("table"),
    columns: z.array(z.string()),
    rows: z.array(z.array(z.string())),
    alignment: z.array(z.enum(["left", "center", "right"])).optional(),
});
/** List item - can be string or structured with checkbox */
export const ListItemSchema = z.union([
    z.string(),
    z.object({
        text: z.string(),
        checked: z.boolean().optional(),
        children: z.array(z.lazy(() => ListItemSchema)).optional(),
    }),
]);
/** List block - ordered/unordered/checkbox lists */
export const ListBlockSchema = z.object({
    type: z.literal("list"),
    ordered: z.boolean().default(false),
    items: z.array(ListItemSchema),
});
/** Code block - fenced code with language */
export const CodeBlockSchema = z.object({
    type: z.literal("code"),
    language: z.string().optional(),
    content: z.string(),
});
/** Mermaid block - diagrams */
export const MermaidBlockSchema = z.object({
    type: z.literal("mermaid"),
    content: z.string(),
});
/** Collapsible block - details/summary for progressive disclosure */
export const CollapsibleBlockSchema = z.object({
    type: z.literal("collapsible"),
    summary: z.string(),
    content: z.array(z.lazy(() => SectionBlockSchema)),
});
/** Link-out block - reference to external file */
export const LinkOutBlockSchema = z.object({
    type: z.literal("link-out"),
    text: z.string(),
    path: z.string(),
});
// ═══════════════════════════════════════════════════════════════════════════
// Section Block (Discriminated Union)
// ═══════════════════════════════════════════════════════════════════════════
/**
 * All block types that can appear in a document section.
 * Uses discriminated union on `type` field for type-safe switching.
 */
export const SectionBlockSchema = z.discriminatedUnion("type", [
    // Structural
    HeadingBlockSchema,
    ParagraphBlockSchema,
    SeparatorBlockSchema,
    // Content
    TableBlockSchema,
    ListBlockSchema,
    CodeBlockSchema,
    MermaidBlockSchema,
    // Progressive Disclosure
    CollapsibleBlockSchema,
    LinkOutBlockSchema,
]);
// ═══════════════════════════════════════════════════════════════════════════
// Document Schema
// ═══════════════════════════════════════════════════════════════════════════
/**
 * RenderableDocument - The universal intermediate format.
 *
 * All document codecs output this format. The universal renderer
 * converts it to markdown without any domain knowledge.
 */
export const RenderableDocumentSchema = z.object({
    /** Document title (becomes H1) */
    title: z.string(),
    /** Optional purpose description (rendered as blockquote) */
    purpose: z.string().optional(),
    /** Optional detail level indicator */
    detailLevel: z.string().optional(),
    /** Document content blocks */
    sections: z.array(SectionBlockSchema),
    /** Additional files for progressive disclosure (path -> document) */
    additionalFiles: z
        .record(z.string(), z.lazy(() => RenderableDocumentSchema))
        .optional(),
});
// ═══════════════════════════════════════════════════════════════════════════
// Block Builders (Convenience Functions)
// ═══════════════════════════════════════════════════════════════════════════
/** Create a heading block */
export const heading = (level, text) => ({
    type: "heading",
    level,
    text,
});
/** Create a paragraph block */
export const paragraph = (text) => ({
    type: "paragraph",
    text,
});
/** Create a separator block */
export const separator = () => ({
    type: "separator",
});
/** Create a table block */
export const table = (columns, rows, alignment) => ({
    type: "table",
    columns,
    rows,
    ...(alignment && { alignment }),
});
/** Create a list block */
export const list = (items, ordered = false) => ({
    type: "list",
    ordered,
    items,
});
/** Create a code block */
export const code = (content, language) => ({
    type: "code",
    content,
    ...(language && { language }),
});
/** Create a mermaid diagram block */
export const mermaid = (content) => ({
    type: "mermaid",
    content,
});
/** Create a collapsible block */
export const collapsible = (summary, content) => ({
    type: "collapsible",
    summary,
    content,
});
/** Create a link-out block */
export const linkOut = (text, path) => ({
    type: "link-out",
    text,
    path,
});
/** Create a document */
export const document = (title, sections, options) => ({
    title,
    sections,
    ...options,
});
//# sourceMappingURL=schema.js.map