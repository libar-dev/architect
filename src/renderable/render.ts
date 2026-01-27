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

    case 'code':
      return [`\`\`\`${block.language ?? ''}`, block.content, '\`\`\`', ''];

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
// Table Renderer
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Render a table block to markdown.
 */
function renderTable(block: TableBlock): string[] {
  if (block.columns.length === 0) {
    return [];
  }

  const lines: string[] = [];

  // Header row - escape pipes and newlines in column names
  const escapedColumns = block.columns.map(escapeTableCell);
  lines.push(`| ${escapedColumns.join(' | ')} |`);

  // Separator row with alignment
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
  lines.push(`| ${separators.join(' | ')} |`);

  // Data rows
  for (const row of block.rows) {
    // Pad row to match columns if needed
    const paddedRow = [...row];
    while (paddedRow.length < block.columns.length) {
      paddedRow.push('');
    }
    // Escape pipe characters and newlines in cell content
    const escapedRow = paddedRow.map(escapeTableCell);
    lines.push(`| ${escapedRow.join(' | ')} |`);
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
 * @returns Array of output files
 */
export function renderDocumentWithFiles(doc: RenderableDocument, basePath: string): OutputFile[] {
  const files: OutputFile[] = [];

  // Main document
  files.push({
    path: basePath,
    content: renderToMarkdown(doc),
  });

  // Additional files (progressive disclosure)
  if (doc.additionalFiles) {
    for (const [relativePath, subDoc] of Object.entries(doc.additionalFiles)) {
      files.push({
        path: relativePath,
        content: renderToMarkdown(subDoc),
      });
    }
  }

  return files;
}
