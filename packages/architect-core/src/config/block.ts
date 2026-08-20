/**
 * @architect
 * @architect-pattern BlockSchema
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:rendering
 *
 * Inline content primitives (heading, paragraph, separator, table, list, code,
 * mermaid, link-out, collapsible) used inside prose-carrying projection fragments
 * — e.g. DecisionRecord carries ADR prose as `Block[]` rather than a raw string,
 * and the markdown / UI renderers consume these primitives directly.
 *
 * This is the single canonical block vocabulary for the workspace. It lives in
 * `architect-core` (the lower layer) so both core consumers — `markdown-parser.ts`
 * and the config `presentation-contracts.ts` — and every `architect-projection`
 * renderer / fragment validate against one schema. (Reconciled from the former
 * `architect-projection` `blocks/schema.ts`; No-BC, DOCS-IA-FINDINGS §6 R8.)
 */
import { z } from 'zod';

/**
 * A heading block carrying a level (1-6) and its text.
 *
 * @architect-shape
 */
export const HeadingBlockSchema = z.strictObject({
  type: z.literal('heading'),
  level: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
  ]),
  text: z.string(),
});
export type HeadingBlock = z.infer<typeof HeadingBlockSchema>;

/**
 * A paragraph block carrying a single run of prose text.
 *
 * @architect-shape
 */
export const ParagraphBlockSchema = z.strictObject({
  type: z.literal('paragraph'),
  text: z.string(),
});
export type ParagraphBlock = z.infer<typeof ParagraphBlockSchema>;

/**
 * A horizontal-rule separator block with no payload beyond its discriminant.
 *
 * @architect-shape
 */
export const SeparatorBlockSchema = z.strictObject({
  type: z.literal('separator'),
});
export type SeparatorBlock = z.infer<typeof SeparatorBlockSchema>;

/**
 * A table block carrying column headers, row cells, and optional per-column
 * alignment.
 *
 * @architect-shape
 */
export const TableBlockSchema = z.strictObject({
  type: z.literal('table'),
  columns: z.array(z.string()),
  rows: z.array(z.array(z.string())),
  alignment: z.array(z.enum(['left', 'center', 'right'])).optional(),
});
export type TableBlock = z.infer<typeof TableBlockSchema>;

/**
 * A single list entry — either a bare string or an object carrying text, an
 * optional checkbox state, and optional nested child items. Recursive: a
 * `ListItem` may contain further `ListItem`s, so the type is hand-written
 * because Zod cannot infer recursive lazy unions.
 *
 * @architect-shape
 */
export type ListItem =
  | string
  | {
      text: string;
      checked?: boolean | undefined;
      children?: ListItem[] | undefined;
    };
/**
 * Runtime schema for a {@link ListItem}; uses `z.lazy` so it can reference
 * itself for nested children, and carries an explicit `z.ZodType` annotation
 * because the recursive lazy union cannot be inferred.
 *
 * @architect-shape
 */
export const ListItemSchema: z.ZodType<ListItem> = z.lazy(() =>
  z.union([
    z.string(),
    z.strictObject({
      text: z.string(),
      checked: z.boolean().optional(),
      children: z.array(ListItemSchema).optional(),
    }),
  ]),
);

/**
 * A list block carrying its ordered/unordered flag and its {@link ListItem}
 * entries.
 *
 * @architect-shape
 */
export const ListBlockSchema = z.strictObject({
  type: z.literal('list'),
  ordered: z.boolean().default(false),
  items: z.array(ListItemSchema),
});
export type ListBlock = z.infer<typeof ListBlockSchema>;

/**
 * A code block carrying source content and an optional identifier-shaped
 * language hint.
 *
 * @architect-shape
 */
export const CodeBlockSchema = z.strictObject({
  type: z.literal('code'),
  language: z
    .string()
    .regex(/^[A-Za-z0-9_+\-.]*$/u, 'language must be identifier-shaped')
    .max(64)
    .optional(),
  content: z.string(),
});
export type CodeBlock = z.infer<typeof CodeBlockSchema>;

/**
 * A Mermaid diagram block carrying raw Mermaid source as its content.
 *
 * @architect-shape
 */
export const MermaidBlockSchema = z.strictObject({
  type: z.literal('mermaid'),
  content: z.string(),
});
export type MermaidBlock = z.infer<typeof MermaidBlockSchema>;

/**
 * A link-out block carrying display text and a target path to another document
 * or anchor.
 *
 * @architect-shape
 */
export const LinkOutBlockSchema = z.strictObject({
  type: z.literal('link-out'),
  text: z.string(),
  path: z.string(),
});
export type LinkOutBlock = z.infer<typeof LinkOutBlockSchema>;

// Recursive: CollapsibleBlock contains Block[], which can contain more CollapsibleBlocks.
// The `content` field uses z.lazy so it can reference BlockSchema (declared below).
// Block is hand-written and BlockSchema carries an explicit z.ZodType annotation
// because Zod cannot infer recursive lazy unions.
/**
 * A collapsible block that nests further blocks behind a summary label.
 * Hand-written (rather than inferred) because its `content` is recursive and
 * Zod cannot infer recursive lazy unions.
 *
 * @architect-shape
 */
export interface CollapsibleBlock {
  /** Discriminant tag identifying this as a collapsible block. */
  type: 'collapsible';
  /** The always-visible summary label shown above the collapsed content. */
  summary: string;
  /** The nested blocks revealed when the block is expanded. */
  content: Block[];
}
/**
 * The discriminated union of every inline content primitive — the building
 * block type that prose-carrying projection fragments compose into.
 *
 * @architect-shape
 */
export type Block =
  | HeadingBlock
  | ParagraphBlock
  | SeparatorBlock
  | TableBlock
  | ListBlock
  | CodeBlock
  | MermaidBlock
  | CollapsibleBlock
  | LinkOutBlock;

/**
 * Runtime schema for a {@link CollapsibleBlock}; its `content` uses `z.lazy` to
 * reference {@link BlockSchema} (declared below) for recursive nesting.
 *
 * @architect-shape
 */
export const CollapsibleBlockSchema = z.strictObject({
  type: z.literal('collapsible'),
  summary: z.string(),
  content: z.lazy(() => z.array(BlockSchema)),
});

/**
 * Runtime schema for any {@link Block}; a discriminated union over every block
 * primitive keyed on `type`, with an explicit `z.ZodType` annotation because the
 * recursive collapsible branch cannot be inferred.
 *
 * @architect-shape
 */
export const BlockSchema: z.ZodType<Block> = z.discriminatedUnion('type', [
  HeadingBlockSchema,
  ParagraphBlockSchema,
  SeparatorBlockSchema,
  TableBlockSchema,
  ListBlockSchema,
  CodeBlockSchema,
  MermaidBlockSchema,
  CollapsibleBlockSchema,
  LinkOutBlockSchema,
]);

/**
 * The set of valid block discriminant strings — the `type` literal of every
 * {@link Block} variant.
 *
 * @architect-shape
 */
export type BlockType = Block['type'];

/**
 * Runtime set of every valid {@link BlockType}, used to test whether an unknown
 * value carries a recognized block discriminant.
 *
 * @architect-shape
 */
export const BLOCK_TYPES = new Set<BlockType>([
  'heading',
  'paragraph',
  'separator',
  'table',
  'list',
  'code',
  'mermaid',
  'collapsible',
  'link-out',
]);

/**
 * Type guard narrowing an unknown value to a {@link Block} via a cheap shape
 * check on its `type` discriminant.
 *
 * @architect-shape
 * @param value - The unknown value to test.
 * @returns `true` when `value` is an object whose `type` is a known block kind.
 */
export function isBlock(value: unknown): value is Block {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    BLOCK_TYPES.has((value as { type: BlockType }).type)
  );
}

/**
 * Constructs a {@link HeadingBlock}.
 *
 * @architect-shape
 * @param level - The heading level, 1 through 6.
 * @param text - The heading text.
 * @returns The constructed heading block.
 */
export const heading = (level: 1 | 2 | 3 | 4 | 5 | 6, text: string): HeadingBlock => ({
  type: 'heading',
  level,
  text,
});

/**
 * Constructs a {@link ParagraphBlock}.
 *
 * @architect-shape
 * @param text - The paragraph prose.
 * @returns The constructed paragraph block.
 */
export const paragraph = (text: string): ParagraphBlock => ({
  type: 'paragraph',
  text,
});

/**
 * Constructs a {@link SeparatorBlock}.
 *
 * @architect-shape
 * @returns The constructed separator block.
 */
export const separator = (): SeparatorBlock => ({
  type: 'separator',
});

/**
 * Constructs a {@link TableBlock}, omitting `alignment` when not supplied.
 *
 * @architect-shape
 * @param columns - The column header labels.
 * @param rows - The row cells, each an array of column values.
 * @param alignment - Optional per-column alignment.
 * @returns The constructed table block.
 */
export const table = (
  columns: string[],
  rows: string[][],
  alignment?: ('left' | 'center' | 'right')[],
): TableBlock => ({
  type: 'table',
  columns,
  rows,
  ...(alignment && { alignment }),
});

/**
 * Constructs a {@link ListBlock}.
 *
 * @architect-shape
 * @param items - The list entries.
 * @param ordered - Whether the list is ordered; defaults to `false`.
 * @returns The constructed list block.
 */
export const list = (items: ListItem[], ordered = false): ListBlock => ({
  type: 'list',
  ordered,
  items,
});

/**
 * Constructs a {@link CodeBlock}, omitting `language` when not supplied.
 *
 * @architect-shape
 * @param content - The source code content.
 * @param language - Optional language hint for syntax highlighting.
 * @returns The constructed code block.
 */
export const code = (content: string, language?: string): CodeBlock => ({
  type: 'code',
  content,
  ...(language && { language }),
});

/**
 * Constructs a {@link MermaidBlock}.
 *
 * @architect-shape
 * @param content - The raw Mermaid diagram source.
 * @returns The constructed Mermaid block.
 */
export const mermaid = (content: string): MermaidBlock => ({
  type: 'mermaid',
  content,
});

/**
 * Constructs a {@link CollapsibleBlock}.
 *
 * @architect-shape
 * @param summary - The always-visible summary label.
 * @param content - The nested blocks revealed on expand.
 * @returns The constructed collapsible block.
 */
export const collapsible = (summary: string, content: Block[]): CollapsibleBlock => ({
  type: 'collapsible',
  summary,
  content,
});

/**
 * Constructs a {@link LinkOutBlock}.
 *
 * @architect-shape
 * @param text - The display text for the link.
 * @param path - The target path the link points to.
 * @returns The constructed link-out block.
 */
export const linkOut = (text: string, path: string): LinkOutBlock => ({
  type: 'link-out',
  text,
  path,
});
