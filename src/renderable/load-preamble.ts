/**
 * @libar-docs
 * @libar-docs-implements ProceduralGuideCodec
 * @libar-docs-arch-context renderer
 * @libar-docs-arch-layer domain
 *
 * ## loadPreambleFromMarkdown — Shared Markdown-to-SectionBlock Parser
 *
 * Reads a markdown file via `readFileSync` and parses it into a
 * `readonly SectionBlock[]` array using a line-by-line state machine.
 *
 * **Design Decision DD-8:** Preamble content is naturally authored as
 * markdown. Converting to inline TypeScript `SectionBlock[]` literals
 * is verbose. This shared parser eliminates 540+ lines of inline
 * TypeScript per codec config while preserving the same shape.
 *
 * ### When to Use
 *
 * - In `delivery-process.config.ts` to load preamble markdown files
 * - At config import time (before any codec `decode()` call)
 * - When any codec needs static SectionBlock[] from a `.md` file
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { SectionBlock } from './schema.js';

// =============================================================================
// State Machine Types
// =============================================================================

type ParserState = 'idle' | 'in-code-fence' | 'in-table' | 'in-paragraph' | 'in-list';

interface CodeFenceAccumulator {
  language: string;
  lines: string[];
}

interface TableAccumulator {
  columns: string[];
  rows: string[][];
}

interface ListAccumulator {
  ordered: boolean;
  items: string[];
}

// =============================================================================
// Detection Helpers
// =============================================================================

const HEADING_REGEX = /^(#{1,6})\s+(.+)$/;
const SEPARATOR_REGEX = /^(---+|\*\*\*+|___+)$/;
const CODE_FENCE_OPEN_REGEX = /^```(.*)$/;
const CODE_FENCE_CLOSE_REGEX = /^```\s*$/;
const UNORDERED_LIST_REGEX = /^[-*]\s+(.*)$/;
const ORDERED_LIST_REGEX = /^\d+\.\s+(.*)$/;
const TABLE_SEPARATOR_REGEX = /^\|[\s:]*-+[\s:|-]*\|$/;

/**
 * Checks whether a line starts a table (line starts with `|` and the
 * following line is a separator row like `|---|---|`).
 */
function isTableStart(line: string, nextLine: string | undefined): boolean {
  return line.startsWith('|') && nextLine !== undefined && TABLE_SEPARATOR_REGEX.test(nextLine);
}

/**
 * Parses a table row into its cell values, trimming whitespace.
 * Strips leading and trailing `|` characters.
 */
function parseTableRow(line: string): string[] {
  // Remove leading and trailing `|`, split by `|`, trim each cell
  const stripped = line.replace(/^\|/, '').replace(/\|$/, '');
  return stripped.split('|').map((cell) => cell.trim());
}

/**
 * Checks whether a line is a list item (unordered or ordered).
 */
function isListItem(line: string): boolean {
  return UNORDERED_LIST_REGEX.test(line) || ORDERED_LIST_REGEX.test(line);
}

/**
 * Extracts the text content from a list item line.
 * For `- [ ] text`, returns `[ ] text` (preserves GFM checkbox).
 */
function extractListItemText(line: string): string {
  const unorderedMatch = UNORDERED_LIST_REGEX.exec(line);
  if (unorderedMatch?.[1] !== undefined) {
    return unorderedMatch[1];
  }
  const orderedMatch = ORDERED_LIST_REGEX.exec(line);
  if (orderedMatch?.[1] !== undefined) {
    return orderedMatch[1];
  }
  return line;
}

/**
 * Checks whether a list item line is ordered (starts with `\d+. `).
 */
function isOrderedListItem(line: string): boolean {
  return ORDERED_LIST_REGEX.test(line);
}

// =============================================================================
// Flush Helpers
// =============================================================================

function flushParagraph(paragraphLines: string[]): SectionBlock {
  return { type: 'paragraph', text: paragraphLines.join(' ') };
}

function flushCodeFence(acc: CodeFenceAccumulator): SectionBlock {
  const content = acc.lines.join('\n');
  if (acc.language === 'mermaid') {
    return { type: 'mermaid', content };
  }
  const block: SectionBlock = { type: 'code', content };
  if (acc.language.length > 0) {
    return { type: 'code', language: acc.language, content };
  }
  return block;
}

function flushTable(acc: TableAccumulator): SectionBlock {
  return { type: 'table', columns: acc.columns, rows: acc.rows };
}

function flushList(acc: ListAccumulator): SectionBlock {
  return { type: 'list', ordered: acc.ordered, items: acc.items };
}

// =============================================================================
// Core Parser
// =============================================================================

/**
 * Parses a markdown string into a `readonly SectionBlock[]` array.
 *
 * Uses a 5-state line-by-line state machine:
 * - `idle` — start state, entered after emitting a block
 * - `in-code-fence` — inside ``` delimiters
 * - `in-table` — accumulating table rows
 * - `in-paragraph` — accumulating paragraph text
 * - `in-list` — accumulating list items
 *
 * @param content - Raw markdown string to parse
 * @returns Parsed SectionBlock array
 */
export function parseMarkdownToBlocks(content: string): readonly SectionBlock[] {
  const lines = content.split('\n');
  const blocks: SectionBlock[] = [];

  let state: ParserState = 'idle';
  let paragraphLines: string[] = [];
  let codeFence: CodeFenceAccumulator = { language: '', lines: [] };
  let tableAcc: TableAccumulator = { columns: [], rows: [] };
  let listAcc: ListAccumulator = { ordered: false, items: [] };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? '';
    const nextLine = i + 1 < lines.length ? lines[i + 1] : undefined;

    // -----------------------------------------------------------------
    // State: in-code-fence — collect lines until closing ```
    // -----------------------------------------------------------------
    if (state === 'in-code-fence') {
      if (CODE_FENCE_CLOSE_REGEX.test(line)) {
        blocks.push(flushCodeFence(codeFence));
        codeFence = { language: '', lines: [] };
        state = 'idle';
      } else {
        codeFence.lines.push(line);
      }
      continue;
    }

    // -----------------------------------------------------------------
    // State: in-table — collect rows until line doesn't start with |
    // -----------------------------------------------------------------
    if (state === 'in-table') {
      if (line.startsWith('|')) {
        // Skip separator rows
        if (!TABLE_SEPARATOR_REGEX.test(line)) {
          tableAcc.rows.push(parseTableRow(line));
        }
        continue;
      }
      // Line doesn't start with | — flush table
      blocks.push(flushTable(tableAcc));
      tableAcc = { columns: [], rows: [] };
      state = 'idle';
      // Fall through to process current line in idle
    }

    // -----------------------------------------------------------------
    // State: in-list — collect items until line doesn't match list pattern
    // -----------------------------------------------------------------
    if (state === 'in-list') {
      if (isListItem(line)) {
        // Check for list type change (ordered vs unordered)
        const currentOrdered = isOrderedListItem(line);
        if (currentOrdered !== listAcc.ordered) {
          // Flush the current list and start a new one
          blocks.push(flushList(listAcc));
          listAcc = { ordered: currentOrdered, items: [extractListItemText(line)] };
        } else {
          listAcc.items.push(extractListItemText(line));
        }
        continue;
      }
      // Not a list item — flush list
      blocks.push(flushList(listAcc));
      listAcc = { ordered: false, items: [] };
      state = 'idle';
      // Fall through to process current line in idle
    }

    // -----------------------------------------------------------------
    // State: in-paragraph — collect lines until blank line
    // -----------------------------------------------------------------
    if (state === 'in-paragraph') {
      if (line.trim() === '') {
        blocks.push(flushParagraph(paragraphLines));
        paragraphLines = [];
        state = 'idle';
        continue;
      }
      // Check if this line starts a new construct (heading, code fence, etc.)
      if (
        HEADING_REGEX.test(line) ||
        SEPARATOR_REGEX.test(line) ||
        CODE_FENCE_OPEN_REGEX.test(line) ||
        isTableStart(line, nextLine) ||
        isListItem(line)
      ) {
        // Flush paragraph first
        blocks.push(flushParagraph(paragraphLines));
        paragraphLines = [];
        state = 'idle';
        // Fall through to idle processing
      } else {
        paragraphLines.push(line);
        continue;
      }
    }

    // -----------------------------------------------------------------
    // State: idle — detect what the current line is
    // -----------------------------------------------------------------

    // Blank line — skip
    if (line.trim() === '') {
      continue;
    }

    // Code fence opening
    const codeFenceMatch = CODE_FENCE_OPEN_REGEX.exec(line);
    if (codeFenceMatch !== null && !CODE_FENCE_CLOSE_REGEX.test(line)) {
      state = 'in-code-fence';
      codeFence = { language: (codeFenceMatch[1] ?? '').trim(), lines: [] };
      continue;
    }

    // Heading
    const headingMatch = HEADING_REGEX.exec(line);
    if (headingMatch?.[1] !== undefined && headingMatch[2] !== undefined) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        text: headingMatch[2],
      });
      continue;
    }

    // Separator
    if (SEPARATOR_REGEX.test(line)) {
      blocks.push({ type: 'separator' });
      continue;
    }

    // Table start
    if (isTableStart(line, nextLine)) {
      state = 'in-table';
      tableAcc = { columns: parseTableRow(line), rows: [] };
      // Skip the separator row (next line)
      i++;
      continue;
    }

    // List item
    if (isListItem(line)) {
      state = 'in-list';
      listAcc = { ordered: isOrderedListItem(line), items: [extractListItemText(line)] };
      continue;
    }

    // Paragraph (default)
    state = 'in-paragraph';
    paragraphLines = [line];
  }

  // -----------------------------------------------------------------
  // Flush any remaining state
  // -----------------------------------------------------------------
  if (state === 'in-code-fence') {
    // Unterminated code fence — still emit what we have
    blocks.push(flushCodeFence(codeFence));
  } else if (state === 'in-table') {
    blocks.push(flushTable(tableAcc));
  } else if (state === 'in-list') {
    blocks.push(flushList(listAcc));
  } else if (state === 'in-paragraph' && paragraphLines.length > 0) {
    blocks.push(flushParagraph(paragraphLines));
  }

  return blocks;
}

// =============================================================================
// File Loader
// =============================================================================

/**
 * Reads a markdown file and parses it into a `readonly SectionBlock[]` array.
 *
 * Uses `readFileSync` (synchronous) — intended to run at config import time,
 * not during codec decode. Resolves `filePath` relative to project root
 * (`process.cwd()`).
 *
 * @param filePath - Path to markdown file, relative to project root
 * @returns Parsed SectionBlock array suitable for ReferenceDocConfig.preamble
 *
 * @example
 * ```typescript
 * const preamble = loadPreambleFromMarkdown('docs-sources/session-workflow-guide.md');
 * // Returns: readonly SectionBlock[] with HeadingBlock, ParagraphBlock,
 * //          CodeBlock, MermaidBlock, TableBlock, ListBlock, SeparatorBlock
 * ```
 */
export function loadPreambleFromMarkdown(filePath: string): readonly SectionBlock[] {
  const absolutePath = resolve(process.cwd(), filePath);
  const content = readFileSync(absolutePath, 'utf-8');
  return parseMarkdownToBlocks(content);
}
