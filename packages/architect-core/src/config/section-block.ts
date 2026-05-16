import { z } from 'zod';

export interface HeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
}

export interface ParagraphBlock {
  type: 'paragraph';
  text: string;
}

export interface SeparatorBlock {
  type: 'separator';
}

export interface TableBlock {
  type: 'table';
  columns: string[];
  rows: string[][];
  alignment?: ('left' | 'center' | 'right')[] | undefined;
}

export type ListItem =
  | string
  | {
      text: string;
      checked?: boolean | undefined;
      children?: ListItem[] | undefined;
    };

export interface ListBlock {
  type: 'list';
  ordered: boolean;
  items: ListItem[];
}

export interface CodeBlock {
  type: 'code';
  language?: string | undefined;
  content: string;
}

export interface MermaidBlock {
  type: 'mermaid';
  content: string;
}

export interface CollapsibleBlock {
  type: 'collapsible';
  summary: string;
  content: SectionBlock[];
}

export interface LinkOutBlock {
  type: 'link-out';
  text: string;
  path: string;
}

export type SectionBlock =
  | HeadingBlock
  | ParagraphBlock
  | SeparatorBlock
  | TableBlock
  | ListBlock
  | CodeBlock
  | MermaidBlock
  | CollapsibleBlock
  | LinkOutBlock;

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

export const ParagraphBlockSchema = z.strictObject({
  type: z.literal('paragraph'),
  text: z.string(),
});

export const SeparatorBlockSchema = z.strictObject({
  type: z.literal('separator'),
});

export const TableBlockSchema = z.strictObject({
  type: z.literal('table'),
  columns: z.array(z.string()),
  rows: z.array(z.array(z.string())),
  alignment: z.array(z.enum(['left', 'center', 'right'])).optional(),
});

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

export const CodeBlockSchema = z.strictObject({
  type: z.literal('code'),
  language: z.string().optional(),
  content: z.string(),
});

export const MermaidBlockSchema = z.strictObject({
  type: z.literal('mermaid'),
  content: z.string(),
});

export const CollapsibleBlockSchema: z.ZodType<CollapsibleBlock> = z.lazy(() =>
  z.strictObject({
    type: z.literal('collapsible'),
    summary: z.string(),
    content: z.array(SectionBlockSchema),
  })
);

export const LinkOutBlockSchema = z.strictObject({
  type: z.literal('link-out'),
  text: z.string(),
  path: z.string(),
});

export const SectionBlockSchema: z.ZodType<SectionBlock> = z.lazy(() =>
  z.union([
    HeadingBlockSchema,
    ParagraphBlockSchema,
    SeparatorBlockSchema,
    TableBlockSchema,
    ListBlockSchema,
    CodeBlockSchema,
    MermaidBlockSchema,
    CollapsibleBlockSchema,
    LinkOutBlockSchema,
  ])
);
