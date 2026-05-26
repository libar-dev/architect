/**
 * @architect
 * @architect-pattern MarkdownBlockParser
 * @architect-status active
 * @architect-role:codec
 * @architect-bounded-context:rendering
 *
 * ## MarkdownBlockParser - Markdown to Structured Blocks
 *
 * Parses markdown text into structured Section/Block content. Exports
 * `parseMarkdownToBlocks`, a line-driven state machine that recognizes
 * headings, code fences, tables, ordered/unordered lists, separators, and
 * paragraphs, emitting typed `SectionBlock` values for the rendering pipeline.
 */
import type { SectionBlock } from '../config/section-block.js';

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

const HEADING_REGEX = /^(#{1,6})\s+(.+)$/;
const SEPARATOR_REGEX = /^(---+|\*\*\*+|___+)$/;
const CODE_FENCE_OPEN_REGEX = /^```(.*)$/;
const CODE_FENCE_CLOSE_REGEX = /^```\s*$/;
const UNORDERED_LIST_REGEX = /^[-*]\s+(.*)$/;
const ORDERED_LIST_REGEX = /^\d+\.\s+(.*)$/;
const TABLE_SEPARATOR_REGEX = /^\|[\s:]*-+[\s:|-]*\|$/;

function isTableStart(line: string, nextLine: string | undefined): boolean {
  return line.startsWith('|') && nextLine !== undefined && TABLE_SEPARATOR_REGEX.test(nextLine);
}

function parseTableRow(line: string): string[] {
  const stripped = line.replace(/^\|/, '').replace(/\|$/, '');
  return stripped.split('|').map((cell) => cell.trim());
}

function isListItem(line: string): boolean {
  return UNORDERED_LIST_REGEX.test(line) || ORDERED_LIST_REGEX.test(line);
}

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

function isOrderedListItem(line: string): boolean {
  return ORDERED_LIST_REGEX.test(line);
}

function flushParagraph(paragraphLines: string[]): SectionBlock {
  return { type: 'paragraph', text: paragraphLines.join(' ') };
}

function flushCodeFence(acc: CodeFenceAccumulator): SectionBlock {
  const content = acc.lines.join('\n');
  if (acc.language === 'mermaid') {
    return { type: 'mermaid', content };
  }

  if (acc.language.length > 0) {
    return { type: 'code', language: acc.language, content };
  }

  return { type: 'code', content };
}

function flushTable(acc: TableAccumulator): SectionBlock {
  return { type: 'table', columns: acc.columns, rows: acc.rows };
}

function flushList(acc: ListAccumulator): SectionBlock {
  return { type: 'list', ordered: acc.ordered, items: acc.items };
}

/**
 * Parse markdown text into an ordered list of typed `SectionBlock` values.
 *
 * Runs a line-driven state machine that recognizes headings, code fences
 * (including mermaid), pipe tables, ordered/unordered lists, separators, and
 * paragraphs for the rendering pipeline.
 *
 * @architect-shape
 * @param content - Raw markdown text to parse.
 * @returns The recognized blocks in document order.
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

    if (state === 'in-table') {
      if (line.startsWith('|')) {
        if (!TABLE_SEPARATOR_REGEX.test(line)) {
          tableAcc.rows.push(parseTableRow(line));
        }
        continue;
      }
      blocks.push(flushTable(tableAcc));
      tableAcc = { columns: [], rows: [] };
      state = 'idle';
    }

    if (state === 'in-list') {
      if (isListItem(line)) {
        const currentOrdered = isOrderedListItem(line);
        if (currentOrdered !== listAcc.ordered) {
          blocks.push(flushList(listAcc));
          listAcc = { ordered: currentOrdered, items: [extractListItemText(line)] };
        } else {
          listAcc.items.push(extractListItemText(line));
        }
        continue;
      }
      blocks.push(flushList(listAcc));
      listAcc = { ordered: false, items: [] };
      state = 'idle';
    }

    if (state === 'in-paragraph') {
      if (line.trim() === '') {
        blocks.push(flushParagraph(paragraphLines));
        paragraphLines = [];
        state = 'idle';
        continue;
      }

      if (
        HEADING_REGEX.test(line) ||
        SEPARATOR_REGEX.test(line) ||
        CODE_FENCE_OPEN_REGEX.test(line) ||
        isTableStart(line, nextLine) ||
        isListItem(line)
      ) {
        blocks.push(flushParagraph(paragraphLines));
        paragraphLines = [];
        state = 'idle';
      } else {
        paragraphLines.push(line);
        continue;
      }
    }

    if (line.trim() === '') {
      continue;
    }

    const codeFenceMatch = CODE_FENCE_OPEN_REGEX.exec(line);
    if (codeFenceMatch !== null && !CODE_FENCE_CLOSE_REGEX.test(line)) {
      state = 'in-code-fence';
      codeFence = { language: (codeFenceMatch[1] ?? '').trim(), lines: [] };
      continue;
    }

    const headingMatch = HEADING_REGEX.exec(line);
    if (headingMatch?.[1] !== undefined && headingMatch[2] !== undefined) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        text: headingMatch[2],
      });
      continue;
    }

    if (SEPARATOR_REGEX.test(line)) {
      blocks.push({ type: 'separator' });
      continue;
    }

    if (isTableStart(line, nextLine)) {
      state = 'in-table';
      tableAcc = { columns: parseTableRow(line), rows: [] };
      i++;
      continue;
    }

    if (isListItem(line)) {
      state = 'in-list';
      listAcc = { ordered: isOrderedListItem(line), items: [extractListItemText(line)] };
      continue;
    }

    state = 'in-paragraph';
    paragraphLines = [line];
  }

  if (state === 'in-code-fence') {
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
