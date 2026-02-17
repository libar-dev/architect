/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern RenderableDocument
 * @libar-docs-status completed
 * @libar-docs-extract-shapes RenderableDocument, SectionBlock, HeadingBlock, TableBlock, ListBlock, CodeBlock, MermaidBlock, CollapsibleBlock
 * @libar-docs-arch-role read-model
 * @libar-docs-arch-context renderer
 * @libar-docs-arch-layer domain
 *
 * ## RenderableDocument Schema
 *
 * Universal intermediate format for all generated documentation.
 * Document codecs transform MasterDataset into this format,
 * then the universal renderer converts it to markdown.
 *
 * ### When to Use
 *
 * - When building documents using block builder functions
 * - When validating RenderableDocument structures
 * - When creating custom codecs that produce document output
 *
 * ### Block Vocabulary (9 types)
 *
 * - Structural: heading, paragraph, separator
 * - Content: table, list, code, mermaid
 * - Progressive: collapsible, link-out
 */
import { z } from 'zod';
/** Heading block - markdown headers */
export declare const HeadingBlockSchema: z.ZodObject<{
    type: z.ZodLiteral<"heading">;
    level: z.ZodNumber;
    text: z.ZodString;
}, z.core.$strip>;
/** Paragraph block - plain text content */
export declare const ParagraphBlockSchema: z.ZodObject<{
    type: z.ZodLiteral<"paragraph">;
    text: z.ZodString;
}, z.core.$strip>;
/** Separator block - horizontal rule */
export declare const SeparatorBlockSchema: z.ZodObject<{
    type: z.ZodLiteral<"separator">;
}, z.core.$strip>;
/** Table block - markdown tables */
export declare const TableBlockSchema: z.ZodObject<{
    type: z.ZodLiteral<"table">;
    columns: z.ZodArray<z.ZodString>;
    rows: z.ZodArray<z.ZodArray<z.ZodString>>;
    alignment: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        left: "left";
        center: "center";
        right: "right";
    }>>>;
}, z.core.$strip>;
/** List item - can be string or structured with checkbox */
export declare const ListItemSchema: z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
    text: z.ZodString;
    checked: z.ZodOptional<z.ZodBoolean>;
    children: z.ZodOptional<z.ZodArray<z.ZodLazy<z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>>>;
}, z.core.$strip>]>;
/** List block - ordered/unordered/checkbox lists */
export declare const ListBlockSchema: z.ZodObject<{
    type: z.ZodLiteral<"list">;
    ordered: z.ZodDefault<z.ZodBoolean>;
    items: z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        text: z.ZodString;
        checked: z.ZodOptional<z.ZodBoolean>;
        children: z.ZodOptional<z.ZodArray<z.ZodLazy<z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>>>;
    }, z.core.$strip>]>>;
}, z.core.$strip>;
/** Code block - fenced code with language */
export declare const CodeBlockSchema: z.ZodObject<{
    type: z.ZodLiteral<"code">;
    language: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
}, z.core.$strip>;
/** Mermaid block - diagrams */
export declare const MermaidBlockSchema: z.ZodObject<{
    type: z.ZodLiteral<"mermaid">;
    content: z.ZodString;
}, z.core.$strip>;
/** Collapsible block - details/summary for progressive disclosure */
export declare const CollapsibleBlockSchema: z.ZodType;
/** Link-out block - reference to external file */
export declare const LinkOutBlockSchema: z.ZodObject<{
    type: z.ZodLiteral<"link-out">;
    text: z.ZodString;
    path: z.ZodString;
}, z.core.$strip>;
/**
 * All block types that can appear in a document section.
 * Uses discriminated union on `type` field for type-safe switching.
 */
export declare const SectionBlockSchema: z.ZodDiscriminatedUnion<[z.ZodObject<{
    type: z.ZodLiteral<"heading">;
    level: z.ZodNumber;
    text: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"paragraph">;
    text: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"separator">;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"table">;
    columns: z.ZodArray<z.ZodString>;
    rows: z.ZodArray<z.ZodArray<z.ZodString>>;
    alignment: z.ZodOptional<z.ZodArray<z.ZodEnum<{
        left: "left";
        center: "center";
        right: "right";
    }>>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"list">;
    ordered: z.ZodDefault<z.ZodBoolean>;
    items: z.ZodArray<z.ZodUnion<readonly [z.ZodString, z.ZodObject<{
        text: z.ZodString;
        checked: z.ZodOptional<z.ZodBoolean>;
        children: z.ZodOptional<z.ZodArray<z.ZodLazy<z.ZodType<unknown, unknown, z.core.$ZodTypeInternals<unknown, unknown>>>>>;
    }, z.core.$strip>]>>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"code">;
    language: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"mermaid">;
    content: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"collapsible">;
    summary: z.ZodString;
    content: z.ZodArray<z.ZodType>;
}, z.core.$strip>, z.ZodObject<{
    type: z.ZodLiteral<"link-out">;
    text: z.ZodString;
    path: z.ZodString;
}, z.core.$strip>], "type">;
/**
 * RenderableDocument - The universal intermediate format.
 *
 * All document codecs output this format. The universal renderer
 * converts it to markdown without any domain knowledge.
 */
export declare const RenderableDocumentSchema: z.ZodType;
export type HeadingBlock = z.infer<typeof HeadingBlockSchema>;
export type ParagraphBlock = z.infer<typeof ParagraphBlockSchema>;
export type SeparatorBlock = z.infer<typeof SeparatorBlockSchema>;
export type TableBlock = z.infer<typeof TableBlockSchema>;
export type ListItem = z.infer<typeof ListItemSchema>;
export type ListBlock = z.infer<typeof ListBlockSchema>;
export type CodeBlock = z.infer<typeof CodeBlockSchema>;
export type MermaidBlock = z.infer<typeof MermaidBlockSchema>;
export type CollapsibleBlock = {
    type: 'collapsible';
    summary: string;
    content: SectionBlock[];
};
export type LinkOutBlock = z.infer<typeof LinkOutBlockSchema>;
/** @libar-docs-shape reference-sample */
export type SectionBlock = HeadingBlock | ParagraphBlock | SeparatorBlock | TableBlock | ListBlock | CodeBlock | MermaidBlock | CollapsibleBlock | LinkOutBlock;
export type RenderableDocument = {
    title: string;
    purpose?: string;
    detailLevel?: string;
    sections: SectionBlock[];
    additionalFiles?: Record<string, RenderableDocument>;
};
/** Create a heading block */
export declare const heading: (level: 1 | 2 | 3 | 4 | 5 | 6, text: string) => HeadingBlock;
/** Create a paragraph block */
export declare const paragraph: (text: string) => ParagraphBlock;
/** Create a separator block */
export declare const separator: () => SeparatorBlock;
/** Create a table block */
export declare const table: (columns: string[], rows: string[][], alignment?: Array<"left" | "center" | "right">) => TableBlock;
/** Create a list block */
export declare const list: (items: ListItem[], ordered?: boolean) => ListBlock;
/** Create a code block */
export declare const code: (content: string, language?: string) => CodeBlock;
/** Create a mermaid diagram block */
export declare const mermaid: (content: string) => MermaidBlock;
/** Create a collapsible block */
export declare const collapsible: (summary: string, content: SectionBlock[]) => CollapsibleBlock;
/** Create a link-out block */
export declare const linkOut: (text: string, path: string) => LinkOutBlock;
/** Create a document */
export declare const document: (title: string, sections: SectionBlock[], options?: {
    purpose?: string;
    detailLevel?: string;
    additionalFiles?: Record<string, RenderableDocument>;
}) => RenderableDocument;
//# sourceMappingURL=schema.d.ts.map