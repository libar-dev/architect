/**
 * @architect
 *
 * Auto-splitting for oversized documents at heading boundaries.
 * Used by renderDocumentWithFiles() when sizeBudget is configured.
 */

import type { RenderableDocument, SectionBlock } from './schema.js';
import { heading, paragraph, linkOut, document } from './schema.js';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface H2Group {
  readonly heading: string;
  readonly sections: SectionBlock[];
}

interface SplitResult {
  readonly parent: RenderableDocument;
  readonly subFiles: Record<string, RenderableDocument>;
}

// ═══════════════════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Split an oversized document into smaller sub-documents at H2 boundaries.
 *
 * Algorithm:
 * 1. Group sections by H2 headings
 * 2. Each H2 group that fits within budget is extracted to a sub-file
 * 3. Groups that still exceed the budget remain inline (future: H3 sub-splitting)
 * 4. A sub-index is built in the parent with LinkOutBlocks
 * 5. Each sub-file gets a back-link to the parent
 *
 * @param doc - The oversized RenderableDocument
 * @param budget - Maximum lines per file
 * @param basePath - Full file path for generating sub-file paths
 * @param renderFn - Render function for measuring sub-document sizes
 * @param generateBackLinks - Whether to prepend back-links in sub-files (default: true)
 * @returns Modified parent document and a record of sub-file paths to sub-documents
 */
export function splitOversizedDocument(
  doc: RenderableDocument,
  budget: number,
  basePath: string,
  renderFn: (d: RenderableDocument) => string,
  generateBackLinks = true
): SplitResult {
  const groups = groupByH2(doc.sections);

  if (groups.length <= 1) {
    // Can't meaningfully split a single-section document
    return { parent: doc, subFiles: {} };
  }

  const subFiles: Record<string, RenderableDocument> = {};
  const parentSections: SectionBlock[] = [];
  const dir = extractDirectory(basePath);
  const parentFileName = extractFileName(basePath);

  for (const group of groups) {
    // Preamble content (before first H2) stays in the parent
    if (group.heading === '_preamble') {
      parentSections.push(...group.sections);
      continue;
    }

    const subDoc = document(group.heading, group.sections);
    const subRendered = renderFn(subDoc);
    const subLineCount = subRendered.split('\n').length;

    if (subLineCount <= budget) {
      // Under budget — extract to sub-file
      const subFileName = `${toKebabCase(group.heading)}.md`;
      const subPath = dir ? `${dir}/${subFileName}` : subFileName;

      // Build sub-file sections
      const subSections: SectionBlock[] = [];
      if (generateBackLinks) {
        subSections.push(createBackLink(doc.title, parentFileName));
      }
      subSections.push(...group.sections);

      subFiles[subPath] = document(group.heading, subSections);

      // Add link-out in parent
      parentSections.push(heading(2, group.heading), linkOut(`See ${group.heading}`, subFileName));
    } else {
      // Over budget even as single H2 group — keep inline
      // (future enhancement: try H3 sub-splitting)
      parentSections.push(heading(2, group.heading), ...group.sections);
    }
  }

  const parentOptions: { purpose?: string; detailLevel?: string } = {};
  if (doc.purpose !== undefined) parentOptions.purpose = doc.purpose;
  if (doc.detailLevel !== undefined) parentOptions.detailLevel = doc.detailLevel;

  const parent = document(doc.title, parentSections, parentOptions);

  return { parent, subFiles };
}

/**
 * Measure rendered document size in lines.
 */
export function measureDocumentSize(
  doc: RenderableDocument,
  renderFn: (d: RenderableDocument) => string
): number {
  return renderFn(doc).split('\n').length;
}

// ═══════════════════════════════════════════════════════════════════════════
// Internal Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Group sections by H2 headings.
 *
 * Content before the first H2 is placed in a "_preamble" group.
 * Each subsequent H2 starts a new group. Non-heading content is
 * appended to the current group.
 */
function groupByH2(sections: readonly SectionBlock[]): H2Group[] {
  const groups: H2Group[] = [];
  let current: { heading: string; sections: SectionBlock[] } | undefined;

  for (const block of sections) {
    if (block.type === 'heading' && block.level === 2) {
      if (current) groups.push(current);
      current = { heading: block.text, sections: [] };
    } else if (current) {
      current.sections.push(block);
    } else {
      // Content before first H2 — create a preamble group
      current = { heading: '_preamble', sections: [block] };
    }
  }

  if (current) groups.push(current);

  return groups;
}

/**
 * Convert heading text to kebab-case for file paths.
 */
function toKebabCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Create a back-link paragraph pointing to the parent document.
 */
function createBackLink(parentTitle: string, parentFileName: string): SectionBlock {
  return paragraph(`[← Back to ${parentTitle}](${parentFileName})`);
}

/**
 * Extract the directory portion of a file path.
 * Returns empty string for bare filenames.
 */
function extractDirectory(filePath: string): string {
  const lastSlash = filePath.lastIndexOf('/');
  return lastSlash >= 0 ? filePath.slice(0, lastSlash) : '';
}

/**
 * Extract the filename portion of a file path.
 */
function extractFileName(filePath: string): string {
  const lastSlash = filePath.lastIndexOf('/');
  return lastSlash >= 0 ? filePath.slice(lastSlash + 1) : filePath;
}
