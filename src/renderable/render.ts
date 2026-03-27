/**
 * @architect
 * @architect-core
 * @architect-pattern UniversalRenderer
 * @architect-status completed
 * @architect-arch-role service
 * @architect-arch-context renderer
 * @architect-arch-layer application
 *
 * ## Universal Renderer
 *
 * Converts RenderableDocument to output strings. Three renderers:
 * - `renderToMarkdown` — Full markdown for human documentation
 * - `renderToClaudeMdModule` — Standard markdown with H3-rooted headings for modular-claude-md
 *
 * All are "dumb printers" — they know nothing about patterns, phases,
 * or domain concepts. All logic lives in the codecs; these just render blocks.
 *
 * ### When to Use
 *
 * - `renderToMarkdown` for human-readable docs (`docs/` output)
 * - `renderToClaudeMdModule` for AI context (`_claude-md/` output)
 * - `renderDocumentWithFiles` for multi-file output with detail files
 */

import type {
  RenderableDocument,
  SectionBlock,
  TableBlock,
  ListBlock,
  ListItem,
  CollapsibleBlock,
} from './schema.js';

// ═══════════════════════════════════════════════════════════════════════════
// Escape Utilities
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Escape HTML entities to prevent injection in generated docs.
 */
function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Escape pipe characters and newlines for markdown table cells.
 * Newlines are converted to <br> for proper rendering.
 */
function escapeTableCell(cell: string): string {
  return cell.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Render Function
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Render a RenderableDocument to markdown string.
 *
 * @param doc - The document to render
 * @returns Markdown string
 */
export function renderToMarkdown(doc: RenderableDocument): string {
  const lines: string[] = [];

  // Title (H1)
  lines.push(`# ${doc.title}`, '');

  // Frontmatter (purpose, detail level as plain text)
  if (doc.purpose || doc.detailLevel) {
    if (doc.purpose) {
      lines.push(`**Purpose:** ${doc.purpose}`);
    }
    if (doc.detailLevel) {
      lines.push(`**Detail Level:** ${doc.detailLevel}`);
    }
    lines.push('', '---', '');
  }

  // Sections
  for (const block of doc.sections) {
    lines.push(...renderBlock(block));
  }

  // Ensure single trailing newline
  return lines.join('\n').trimEnd() + '\n';
}

// ═══════════════════════════════════════════════════════════════════════════
// Block Renderer
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Render a single block to markdown lines.
 */
function renderBlock(block: SectionBlock): string[] {
  switch (block.type) {
    case 'heading': {
      // Clamp heading level to valid markdown range (1-6)
      const level = Math.max(1, Math.min(6, block.level));
      return [`${'#'.repeat(level)} ${block.text}`, ''];
    }

    case 'paragraph':
      return [block.text, ''];

    case 'separator':
      return ['---', ''];

    case 'table':
      return renderTable(block);

    case 'list':
      return renderList(block);

    case 'code': {
      // Use 4+ backtick fences when content contains triple backticks
      const fence = block.content.includes('```') ? '````' : '```';
      return [`${fence}${block.language ?? ''}`, block.content, fence, ''];
    }

    case 'mermaid':
      return ['\`\`\`mermaid', block.content, '\`\`\`', ''];

    case 'collapsible':
      return renderCollapsible(block);

    case 'link-out':
      // URL-encode path for links with spaces or special characters
      return [`[${block.text}](${encodeURI(block.path)})`, ''];

    default:
      // Type-safe exhaustive check
      const _exhaustive: never = block;
      return [`<!-- Unknown block type: ${JSON.stringify(_exhaustive)} -->`];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Claude MD Module Renderer
// ═══════════════════════════════════════════════════════════════════════════

/** Heading offset for modular-claude-md: H1 → H3, H2 → H4, etc. */
const CLAUDE_MD_MODULE_HEADING_OFFSET = 2;

/**
 * Render a RenderableDocument to a modular-claude-md compatible module.
 *
 * Uses standard markdown headings offset by +2 (H1→H3, H2→H4) so the
 * output plugs directly into modular-claude-md's H3-rooted module system.
 * Omits frontmatter, mermaid blocks, and link-out blocks. Flattens
 * collapsible blocks into headings.
 *
 * @param doc - The document to render
 * @returns Markdown string compatible with modular-claude-md
 */
export function renderToClaudeMdModule(doc: RenderableDocument): string {
  const lines: string[] = [];

  // Title as H3 (H1 + offset 2)
  const titleLevel = Math.min(1 + CLAUDE_MD_MODULE_HEADING_OFFSET, 6);
  lines.push(`${'#'.repeat(titleLevel)} ${doc.title}`, '');

  // Frontmatter intentionally omitted — no Purpose/Detail Level lines

  // Sections
  for (const block of doc.sections) {
    lines.push(...renderBlockClaudeMdModule(block));
  }

  // Ensure single trailing newline
  return lines.join('\n').trimEnd() + '\n';
}

/**
 * Render a single block for modular-claude-md output.
 */
function renderBlockClaudeMdModule(block: SectionBlock): string[] {
  switch (block.type) {
    case 'heading': {
      const level = Math.min(block.level + CLAUDE_MD_MODULE_HEADING_OFFSET, 6);
      return [`${'#'.repeat(level)} ${block.text}`, ''];
    }

    case 'paragraph':
      return [block.text, ''];

    case 'separator':
      return [''];

    case 'table':
      return renderTable(block);

    case 'list':
      return renderList(block);

    case 'code': {
      const fence = block.content.includes('```') ? '````' : '```';
      return [`${fence}${block.language ?? ''}`, block.content, fence, ''];
    }

    case 'mermaid':
      // Omit mermaid — modular-claude-md targets LLM context
      return [];

    case 'collapsible':
      return renderCollapsibleClaudeMdModule(block);

    case 'link-out':
      // Omit link-out — file links not useful in CLAUDE.md context
      return [];

    default: {
      const _exhaustive: never = block;
      return [`<!-- Unknown block type: ${JSON.stringify(_exhaustive)} -->`];
    }
  }
}

/**
 * Flatten a collapsible block — summary becomes a heading, inner blocks rendered directly.
 */
function renderCollapsibleClaudeMdModule(block: CollapsibleBlock): string[] {
  const lines: string[] = [];

  // Summary becomes a heading at offset level (clamped to 6)
  const level = Math.min(2 + CLAUDE_MD_MODULE_HEADING_OFFSET, 6);
  lines.push(`${'#'.repeat(level)} ${block.summary}`, '');

  // Render nested content directly
  for (const contentBlock of block.content) {
    lines.push(...renderBlockClaudeMdModule(contentBlock));
  }

  return lines;
}

// ═══════════════════════════════════════════════════════════════════════════
// Table Renderer
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Render a table block to markdown with column-width padding.
 * Produces prettier-compatible aligned tables.
 */
function renderTable(block: TableBlock): string[] {
  if (block.columns.length === 0) {
    return [];
  }

  // Escape all cells first
  const escapedColumns = block.columns.map(escapeTableCell);
  const escapedRows = block.rows.map((row) => {
    const paddedRow = [...row];
    while (paddedRow.length < block.columns.length) {
      paddedRow.push('');
    }
    return paddedRow.map(escapeTableCell);
  });

  // Build separators
  const separators = block.columns.map((_, i) => {
    const align = block.alignment?.[i] ?? 'left';
    switch (align) {
      case 'center':
        return ':---:';
      case 'right':
        return '---:';
      default:
        return '---';
    }
  });

  // Compute max width per column (header, separator, and all data rows)
  const colWidths = block.columns.map((_, i) => {
    const headerWidth = escapedColumns[i]?.length ?? 0;
    const sepWidth = separators[i]?.length ?? 3;
    const dataWidth = Math.max(0, ...escapedRows.map((row) => row[i]?.length ?? 0));
    return Math.max(headerWidth, sepWidth, dataWidth);
  });

  // Pad and join
  const padCell = (cell: string, width: number): string => cell.padEnd(width);
  const padSep = (sep: string, width: number, colIndex: number): string => {
    const align = block.alignment?.[colIndex] ?? 'left';
    const fill = width - sep.length;
    if (fill <= 0) return sep;
    switch (align) {
      case 'center':
        return `:${'-'.repeat(width - 2)}:`;
      case 'right':
        return `${'-'.repeat(width - 1)}:`;
      default:
        return sep + '-'.repeat(fill);
    }
  };

  const lines: string[] = [];

  // Header row
  const headerCells = escapedColumns.map((col, i) => padCell(col, colWidths[i] ?? 0));
  lines.push(`| ${headerCells.join(' | ')} |`);

  // Separator row
  const sepCells = separators.map((sep, i) => padSep(sep, colWidths[i] ?? 0, i));
  lines.push(`| ${sepCells.join(' | ')} |`);

  // Data rows
  for (const row of escapedRows) {
    const dataCells = row.map((cell, i) => padCell(cell, colWidths[i] ?? 0));
    lines.push(`| ${dataCells.join(' | ')} |`);
  }

  lines.push('');
  return lines;
}

// ═══════════════════════════════════════════════════════════════════════════
// List Renderer
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Render a list block to markdown.
 */
function renderList(block: ListBlock): string[] {
  const lines: string[] = [];

  for (let i = 0; i < block.items.length; i++) {
    const item = block.items[i];
    if (item === undefined) continue;
    const prefix = block.ordered ? `${i + 1}.` : '-';
    lines.push(...renderListItem(item, prefix, 0));
  }

  lines.push('');
  return lines;
}

/**
 * Render a single list item, handling nested items.
 */
function renderListItem(item: ListItem, prefix: string, indent: number): string[] {
  const lines: string[] = [];
  const indentStr = '  '.repeat(indent);

  if (typeof item === 'string') {
    lines.push(`${indentStr}${prefix} ${item}`);
  } else {
    // Structured item with optional checkbox
    const checkbox = item.checked !== undefined ? (item.checked ? '[x] ' : '[ ] ') : '';
    lines.push(`${indentStr}${prefix} ${checkbox}${item.text}`);

    // Render children
    if (item.children) {
      for (let i = 0; i < item.children.length; i++) {
        const child = item.children[i] as ListItem;
        const childPrefix = /^\d/.exec(prefix) !== null ? `${i + 1}.` : '-';
        lines.push(...renderListItem(child, childPrefix, indent + 1));
      }
    }
  }

  return lines;
}

// ═══════════════════════════════════════════════════════════════════════════
// Collapsible Renderer
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Render a collapsible block using HTML details/summary.
 */
function renderCollapsible(block: CollapsibleBlock): string[] {
  const lines: string[] = [];

  lines.push('<details>');
  // Escape HTML entities in summary to prevent injection
  lines.push(`<summary>${escapeHtml(block.summary)}</summary>`);
  lines.push('');

  // Render nested content
  for (const contentBlock of block.content) {
    lines.push(...renderBlock(contentBlock));
  }

  lines.push('</details>');
  lines.push('');

  return lines;
}

// ═══════════════════════════════════════════════════════════════════════════
// Multi-File Output
// ═══════════════════════════════════════════════════════════════════════════

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
export function renderDocumentWithFiles(
  doc: RenderableDocument,
  basePath: string,
  renderer: (d: RenderableDocument) => string = renderToMarkdown
): OutputFile[] {
  const files: OutputFile[] = [];

  // Main document
  files.push({
    path: basePath,
    content: renderer(doc),
  });

  // Additional files (progressive disclosure)
  if (doc.additionalFiles) {
    for (const [relativePath, subDoc] of Object.entries(doc.additionalFiles)) {
      files.push({
        path: relativePath,
        content: renderer(subDoc),
      });
    }
  }

  return files;
}
