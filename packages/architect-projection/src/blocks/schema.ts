import { z } from 'zod';

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

export const ParagraphBlockSchema = z.strictObject({
  type: z.literal('paragraph'),
  text: z.string(),
});
export type ParagraphBlock = z.infer<typeof ParagraphBlockSchema>;

export const SeparatorBlockSchema = z.strictObject({
  type: z.literal('separator'),
});
export type SeparatorBlock = z.infer<typeof SeparatorBlockSchema>;

export const TableBlockSchema = z.strictObject({
  type: z.literal('table'),
  columns: z.array(z.string()),
  rows: z.array(z.array(z.string())),
  alignment: z.array(z.enum(['left', 'center', 'right'])).optional(),
});
export type TableBlock = z.infer<typeof TableBlockSchema>;

// Recursive: ListItem references itself. Zod cannot infer recursive lazy unions,
// so the type is hand-written and the schema carries an explicit z.ZodType annotation.
export type ListItem =
  | string
  | {
      text: string;
      checked?: boolean | undefined;
      children?: ListItem[] | undefined;
    };
export const ListItemSchema: z.ZodType<ListItem> = z.lazy(() =>
  z.union([
    z.string(),
    z.strictObject({
      text: z.string(),
      checked: z.boolean().optional(),
      children: z.array(ListItemSchema).optional(),
    }),
  ])
);

export const ListBlockSchema = z.strictObject({
  type: z.literal('list'),
  ordered: z.boolean().default(false),
  items: z.array(ListItemSchema),
});
export type ListBlock = z.infer<typeof ListBlockSchema>;

export const CodeBlockSchema = z.strictObject({
  type: z.literal('code'),
  language: z.string().optional(),
  content: z.string(),
});
export type CodeBlock = z.infer<typeof CodeBlockSchema>;

export const MermaidBlockSchema = z.strictObject({
  type: z.literal('mermaid'),
  content: z.string(),
});
export type MermaidBlock = z.infer<typeof MermaidBlockSchema>;

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
export interface CollapsibleBlock {
  type: 'collapsible';
  summary: string;
  content: Block[];
}
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

export const CollapsibleBlockSchema = z.strictObject({
  type: z.literal('collapsible'),
  summary: z.string(),
  content: z.lazy(() => z.array(BlockSchema)),
});

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

export type BlockType = Block['type'];

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

export function isBlock(value: unknown): value is Block {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    BLOCK_TYPES.has((value as { type: BlockType }).type)
  );
}

export const heading = (level: 1 | 2 | 3 | 4 | 5 | 6, text: string): HeadingBlock => ({
  type: 'heading',
  level,
  text,
});

export const paragraph = (text: string): ParagraphBlock => ({
  type: 'paragraph',
  text,
});

export const separator = (): SeparatorBlock => ({
  type: 'separator',
});

export const table = (
  columns: string[],
  rows: string[][],
  alignment?: ('left' | 'center' | 'right')[]
): TableBlock => ({
  type: 'table',
  columns,
  rows,
  ...(alignment && { alignment }),
});

export const list = (items: ListItem[], ordered = false): ListBlock => ({
  type: 'list',
  ordered,
  items,
});

export const code = (content: string, language?: string): CodeBlock => ({
  type: 'code',
  content,
  ...(language && { language }),
});

export const mermaid = (content: string): MermaidBlock => ({
  type: 'mermaid',
  content,
});

export const collapsible = (summary: string, content: Block[]): CollapsibleBlock => ({
  type: 'collapsible',
  summary,
  content,
});

export const linkOut = (text: string, path: string): LinkOutBlock => ({
  type: 'link-out',
  text,
  path,
});
