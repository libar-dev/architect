/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern UniversalRenderer
 * @libar-docs-status completed
 * @libar-docs-arch-role service
 * @libar-docs-arch-context renderer
 * @libar-docs-arch-layer application
 *
 * ## Universal Renderer
 *
 * Converts RenderableDocument to output strings. Three renderers:
 * - `renderToMarkdown` — Full markdown for human documentation
 * - `renderToClaudeMdModule` — Standard markdown with H3-rooted headings for modular-claude-md
 * - `renderToClaudeContext` — Token-efficient format with section markers (legacy)
 *
 * All are "dumb printers" — they know nothing about patterns, phases,
 * or domain concepts. All logic lives in the codecs; these just render blocks.
 *
 * ### When to Use
 *
 * - `renderToMarkdown` for human-readable docs (`docs/` output)
 * - `renderToClaudeMdModule` for AI context (`_claude-md/` output)
 * - `renderToClaudeContext` for token-efficient AI context (legacy, not used by generators)
 * - `renderDocumentWithFiles` for multi-file output with detail files
 */
// ═══════════════════════════════════════════════════════════════════════════
// Escape Utilities
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Escape HTML entities to prevent injection in generated docs.
 */
function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
/**
 * Escape pipe characters and newlines for markdown table cells.
 * Newlines are converted to <br> for proper rendering.
 */
function escapeTableCell(cell) {
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
export function renderToMarkdown(doc) {
    const lines = [];
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
function renderBlock(block) {
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
            const _exhaustive = block;
            return [`<!-- Unknown block type: ${JSON.stringify(_exhaustive)} -->`];
    }
}
// ═══════════════════════════════════════════════════════════════════════════
// Claude Context Renderer
// ═══════════════════════════════════════════════════════════════════════════
/**
 * Render a RenderableDocument to token-efficient text for LLM consumption.
 *
 * Uses `=== SECTION ===` markers instead of markdown headers, omits
 * mermaid diagrams (LLMs cannot render them), flattens collapsible blocks,
 * and strips link-out URLs. Produces ~20-40% fewer tokens than markdown
 * for the same document.
 *
 * @param doc - The document to render
 * @returns Token-efficient string for AI context
 */
export function renderToClaudeContext(doc) {
    const lines = [];
    // Title as top-level marker
    lines.push(`=== ${doc.title.toUpperCase()} ===`, '');
    // Frontmatter as plain lines (no bold markers, no separator)
    if (doc.purpose) {
        lines.push(`Purpose: ${doc.purpose}`);
    }
    if (doc.detailLevel) {
        lines.push(`Detail Level: ${doc.detailLevel}`);
    }
    if (doc.purpose || doc.detailLevel) {
        lines.push('');
    }
    // Sections
    for (const block of doc.sections) {
        lines.push(...renderBlockClaudeContext(block));
    }
    // Ensure single trailing newline
    return lines.join('\n').trimEnd() + '\n';
}
/**
 * Render a single block to token-efficient lines for LLM consumption.
 */
function renderBlockClaudeContext(block) {
    switch (block.type) {
        case 'heading': {
            const text = block.text;
            // Top-level headings (1-2) use === MARKERS ===, sub-headings use --- markers ---
            if (block.level <= 2) {
                return [`=== ${text.toUpperCase()} ===`, ''];
            }
            return [`--- ${text} ---`, ''];
        }
        case 'paragraph':
            return [block.text, ''];
        case 'separator':
            // Omit horizontal rules — just a blank line saves tokens
            return [''];
        case 'table':
            // Tables are already compact in pipe-delimited format
            return renderTable(block);
        case 'list':
            // Lists are already compact
            return renderList(block);
        case 'code':
            // Preserve code blocks — LLMs need syntax context
            return [`\`\`\`${block.language ?? ''}`, block.content, '\`\`\`', ''];
        case 'mermaid':
            // Omit mermaid diagrams — LLMs cannot render visual diagrams
            return [];
        case 'collapsible':
            // Flatten: render inner blocks directly without <details> wrapper
            return renderCollapsibleClaudeContext(block);
        case 'link-out':
            // Plain text reference without URL (LLMs can't follow file links)
            return [`-> ${block.text}`, ''];
        default: {
            // Type-safe exhaustive check
            const _exhaustive = block;
            return [`[Unknown block type: ${JSON.stringify(_exhaustive)}]`];
        }
    }
}
/**
 * Flatten a collapsible block — render inner blocks directly.
 */
function renderCollapsibleClaudeContext(block) {
    const lines = [];
    // Render summary as a sub-heading marker
    lines.push(`--- ${block.summary} ---`, '');
    // Render nested content directly
    for (const contentBlock of block.content) {
        lines.push(...renderBlockClaudeContext(contentBlock));
    }
    return lines;
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
export function renderToClaudeMdModule(doc) {
    const lines = [];
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
function renderBlockClaudeMdModule(block) {
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
            const _exhaustive = block;
            return [`<!-- Unknown block type: ${JSON.stringify(_exhaustive)} -->`];
        }
    }
}
/**
 * Flatten a collapsible block — summary becomes a heading, inner blocks rendered directly.
 */
function renderCollapsibleClaudeMdModule(block) {
    const lines = [];
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
 * Render a table block to markdown.
 */
function renderTable(block) {
    if (block.columns.length === 0) {
        return [];
    }
    const lines = [];
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
function renderList(block) {
    const lines = [];
    for (let i = 0; i < block.items.length; i++) {
        const item = block.items[i];
        if (item === undefined)
            continue;
        const prefix = block.ordered ? `${i + 1}.` : '-';
        lines.push(...renderListItem(item, prefix, 0));
    }
    lines.push('');
    return lines;
}
/**
 * Render a single list item, handling nested items.
 */
function renderListItem(item, prefix, indent) {
    const lines = [];
    const indentStr = '  '.repeat(indent);
    if (typeof item === 'string') {
        lines.push(`${indentStr}${prefix} ${item}`);
    }
    else {
        // Structured item with optional checkbox
        const checkbox = item.checked !== undefined ? (item.checked ? '[x] ' : '[ ] ') : '';
        lines.push(`${indentStr}${prefix} ${checkbox}${item.text}`);
        // Render children
        if (item.children) {
            for (let i = 0; i < item.children.length; i++) {
                const child = item.children[i];
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
function renderCollapsible(block) {
    const lines = [];
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
/**
 * Render a document and all its additional files.
 *
 * @param doc - The document to render
 * @param basePath - Base path for the main document
 * @param renderer - Render function to use (defaults to renderToMarkdown)
 * @returns Array of output files
 */
export function renderDocumentWithFiles(doc, basePath, renderer = renderToMarkdown) {
    const files = [];
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
//# sourceMappingURL=render.js.map