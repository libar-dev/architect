/**
 * RenderableDocument Assertion Helpers for Testing
 *
 * Provides assertion utilities for testing document codecs and the
 * universal renderer. These helpers enable expressive BDD-style
 * assertions on document structure and content.
 *
 * @libar-docs
 */

import { expect } from "vitest";
import type {
  RenderableDocument,
  SectionBlock,
  HeadingBlock,
  ParagraphBlock,
  TableBlock,
  ListBlock,
  CodeBlock,
  MermaidBlock,
  CollapsibleBlock,
  LinkOutBlock,
} from "../../../src/renderable/schema.js";

// ============================================================================
// Block Type Guards
// ============================================================================

/** Type guard for heading blocks */
export function isHeading(block: SectionBlock): block is HeadingBlock {
  return block.type === "heading";
}

/** Type guard for paragraph blocks */
export function isParagraph(block: SectionBlock): block is ParagraphBlock {
  return block.type === "paragraph";
}

/** Type guard for table blocks */
export function isTable(block: SectionBlock): block is TableBlock {
  return block.type === "table";
}

/** Type guard for list blocks */
export function isList(block: SectionBlock): block is ListBlock {
  return block.type === "list";
}

/** Type guard for code blocks */
export function isCode(block: SectionBlock): block is CodeBlock {
  return block.type === "code";
}

/** Type guard for mermaid blocks */
export function isMermaid(block: SectionBlock): block is MermaidBlock {
  return block.type === "mermaid";
}

/** Type guard for collapsible blocks */
export function isCollapsible(block: SectionBlock): block is CollapsibleBlock {
  return block.type === "collapsible";
}

/** Type guard for link-out blocks */
export function isLinkOut(block: SectionBlock): block is LinkOutBlock {
  return block.type === "link-out";
}

// ============================================================================
// Block Finders
// ============================================================================

/**
 * Find all blocks of a specific type in a document
 *
 * @param doc - Document to search
 * @param type - Block type to find
 * @returns Array of matching blocks
 */
export function findBlocksByType<T extends SectionBlock["type"]>(
  doc: RenderableDocument,
  type: T
): Array<Extract<SectionBlock, { type: T }>> {
  const results: Array<Extract<SectionBlock, { type: T }>> = [];

  function search(sections: SectionBlock[]): void {
    for (const block of sections) {
      if (block.type === type) {
        results.push(block as Extract<SectionBlock, { type: T }>);
      }
      // Search inside collapsibles
      if (isCollapsible(block)) {
        search(block.content);
      }
    }
  }

  search(doc.sections);
  return results;
}

/**
 * Find all heading blocks in a document
 */
export function findHeadings(doc: RenderableDocument): HeadingBlock[] {
  return findBlocksByType(doc, "heading");
}

/**
 * Find all table blocks in a document
 */
export function findTables(doc: RenderableDocument): TableBlock[] {
  return findBlocksByType(doc, "table");
}

/**
 * Find all list blocks in a document
 */
export function findLists(doc: RenderableDocument): ListBlock[] {
  return findBlocksByType(doc, "list");
}

/**
 * Find a table with a specific column header
 *
 * @param doc - Document to search
 * @param header - Column header to find (exact match)
 * @returns First matching table, or undefined
 */
export function findTableWithHeader(
  doc: RenderableDocument,
  header: string
): TableBlock | undefined {
  const tables = findTables(doc);
  return tables.find((t) => t.columns.includes(header));
}

/**
 * Find a table with columns matching a pattern
 *
 * @param doc - Document to search
 * @param columnPatterns - Array of patterns (strings or RegExps)
 * @returns First matching table, or undefined
 */
export function findTableWithColumns(
  doc: RenderableDocument,
  columnPatterns: Array<string | RegExp>
): TableBlock | undefined {
  const tables = findTables(doc);
  return tables.find((t) => {
    return columnPatterns.every((pattern) => {
      if (typeof pattern === "string") {
        return t.columns.includes(pattern);
      }
      return t.columns.some((col) => pattern.test(col));
    });
  });
}

/**
 * Find a heading with specific text
 *
 * @param doc - Document to search
 * @param text - Text to find (exact match or substring)
 * @returns First matching heading, or undefined
 */
export function findHeadingWithText(
  doc: RenderableDocument,
  text: string
): HeadingBlock | undefined {
  const headings = findHeadings(doc);
  return headings.find((h) => h.text.includes(text));
}

/**
 * Find all mermaid blocks in a document
 */
export function findMermaidBlocks(doc: RenderableDocument): MermaidBlock[] {
  return findBlocksByType(doc, "mermaid");
}

/**
 * Find all collapsible blocks in a document
 */
export function findCollapsibles(doc: RenderableDocument): CollapsibleBlock[] {
  return findBlocksByType(doc, "collapsible");
}

/**
 * Find all link-out blocks in a document
 */
export function findLinkOuts(doc: RenderableDocument): LinkOutBlock[] {
  return findBlocksByType(doc, "link-out");
}

// ============================================================================
// Block Counters
// ============================================================================

/**
 * Count blocks of a specific type in a document
 *
 * @param doc - Document to search
 * @param type - Block type to count
 * @returns Number of matching blocks
 */
export function countBlocksOfType(doc: RenderableDocument, type: SectionBlock["type"]): number {
  return findBlocksByType(doc, type).length;
}

/**
 * Count total sections (top-level only)
 */
export function countSections(doc: RenderableDocument): number {
  return doc.sections.length;
}

/**
 * Count additional files
 */
export function countAdditionalFiles(doc: RenderableDocument): number {
  return Object.keys(doc.additionalFiles ?? {}).length;
}

// ============================================================================
// Document Structure Assertions
// ============================================================================

/**
 * Expected document structure for assertDocumentStructure
 */
export interface ExpectedDocumentStructure {
  title?: string | RegExp;
  purpose?: string | RegExp;
  sectionCount?: number | { min?: number; max?: number };
  additionalFileCount?: number | { min?: number; max?: number };
  hasBlockTypes?: Array<SectionBlock["type"]>;
  blockCounts?: Partial<Record<SectionBlock["type"], number>>;
}

/**
 * Assert a document matches expected structure
 *
 * @param doc - Document to check (can be null for safety)
 * @param expected - Expected structure
 *
 * @example
 * ```typescript
 * assertDocumentStructure(doc, {
 *   title: "Pattern Registry",
 *   sectionCount: { min: 5 },
 *   hasBlockTypes: ["table", "heading", "list"],
 *   blockCounts: { table: 2, heading: 5 },
 * });
 * ```
 */
export function assertDocumentStructure(
  doc: RenderableDocument | null,
  expected: ExpectedDocumentStructure
): asserts doc is RenderableDocument {
  expect(doc).not.toBeNull();

  const document = doc!;

  // Title assertion
  if (expected.title !== undefined) {
    if (typeof expected.title === "string") {
      expect(document.title).toBe(expected.title);
    } else {
      expect(document.title).toMatch(expected.title);
    }
  }

  // Purpose assertion
  if (expected.purpose !== undefined) {
    if (typeof expected.purpose === "string") {
      expect(document.purpose).toBe(expected.purpose);
    } else {
      expect(document.purpose).toMatch(expected.purpose);
    }
  }

  // Section count assertion
  if (expected.sectionCount !== undefined) {
    if (typeof expected.sectionCount === "number") {
      expect(document.sections.length).toBe(expected.sectionCount);
    } else {
      if (expected.sectionCount.min !== undefined) {
        expect(document.sections.length).toBeGreaterThanOrEqual(expected.sectionCount.min);
      }
      if (expected.sectionCount.max !== undefined) {
        expect(document.sections.length).toBeLessThanOrEqual(expected.sectionCount.max);
      }
    }
  }

  // Additional file count assertion
  if (expected.additionalFileCount !== undefined) {
    const fileCount = countAdditionalFiles(document);
    if (typeof expected.additionalFileCount === "number") {
      expect(fileCount).toBe(expected.additionalFileCount);
    } else {
      if (expected.additionalFileCount.min !== undefined) {
        expect(fileCount).toBeGreaterThanOrEqual(expected.additionalFileCount.min);
      }
      if (expected.additionalFileCount.max !== undefined) {
        expect(fileCount).toBeLessThanOrEqual(expected.additionalFileCount.max);
      }
    }
  }

  // Has block types assertion
  if (expected.hasBlockTypes !== undefined) {
    for (const blockType of expected.hasBlockTypes) {
      const count = countBlocksOfType(document, blockType);
      expect(count, `Expected at least one '${blockType}' block`).toBeGreaterThan(0);
    }
  }

  // Block counts assertion
  if (expected.blockCounts !== undefined) {
    for (const [blockType, expectedCount] of Object.entries(expected.blockCounts)) {
      const actualCount = countBlocksOfType(document, blockType as SectionBlock["type"]);
      expect(actualCount, `Expected ${expectedCount} '${blockType}' blocks`).toBe(expectedCount);
    }
  }
}

// ============================================================================
// Content Assertions
// ============================================================================

/**
 * Assert that a document contains text somewhere in its content
 *
 * @param doc - Document to search
 * @param text - Text to find (substring match)
 */
export function assertDocumentContainsText(doc: RenderableDocument | null, text: string): void {
  expect(doc).not.toBeNull();

  const document = doc!;
  const allText = collectAllText(document);

  expect(allText).toContain(text);
}

/**
 * Assert that a table contains a row with specific values
 *
 * @param table - Table to check
 * @param expectedValues - Values to find in any row (can be partial)
 */
export function assertTableContainsRow(table: TableBlock | null, expectedValues: string[]): void {
  expect(table).not.toBeNull();

  const found = table!.rows.some((row) =>
    expectedValues.every((val) => row.some((cell) => cell.includes(val)))
  );

  expect(found, `Expected table to contain row with: ${expectedValues.join(", ")}`).toBe(true);
}

/**
 * Assert that a document has an additional file at the specified path
 *
 * @param doc - Document to check
 * @param path - File path to find
 */
export function assertHasAdditionalFile(doc: RenderableDocument | null, path: string): void {
  expect(doc).not.toBeNull();

  const files = doc!.additionalFiles ?? {};
  expect(Object.keys(files)).toContain(path);
}

/**
 * Assert that a document has no additional files
 */
export function assertNoAdditionalFiles(doc: RenderableDocument | null): void {
  expect(doc).not.toBeNull();

  const fileCount = countAdditionalFiles(doc!);
  expect(fileCount).toBe(0);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Collect all text content from a document (for searching)
 */
function collectAllText(doc: RenderableDocument): string {
  const parts: string[] = [doc.title];

  if (doc.purpose) parts.push(doc.purpose);

  function collectFromBlocks(sections: SectionBlock[]): void {
    for (const block of sections) {
      switch (block.type) {
        case "heading":
        case "paragraph":
          parts.push(block.text);
          break;
        case "table":
          parts.push(...block.columns);
          for (const row of block.rows) {
            parts.push(...row);
          }
          break;
        case "list":
          for (const item of block.items) {
            if (typeof item === "string") {
              parts.push(item);
            } else {
              parts.push(item.text);
            }
          }
          break;
        case "code":
        case "mermaid":
          parts.push(block.content);
          break;
        case "collapsible":
          parts.push(block.summary);
          collectFromBlocks(block.content);
          break;
        case "link-out":
          parts.push(block.text, block.path);
          break;
      }
    }
  }

  collectFromBlocks(doc.sections);

  // Also check additional files
  if (doc.additionalFiles) {
    for (const file of Object.values(doc.additionalFiles)) {
      parts.push(collectAllText(file));
    }
  }

  return parts.join(" ");
}

// ============================================================================
// Markdown Output Assertions
// ============================================================================

/**
 * Assert that rendered markdown contains expected patterns
 *
 * @param markdown - Rendered markdown string
 * @param patterns - Patterns to find (strings or RegExps)
 */
export function assertMarkdownContains(
  markdown: string | null,
  ...patterns: Array<string | RegExp>
): void {
  expect(markdown).not.toBeNull();

  for (const pattern of patterns) {
    if (typeof pattern === "string") {
      expect(markdown).toContain(pattern);
    } else {
      expect(markdown).toMatch(pattern);
    }
  }
}

/**
 * Assert that rendered markdown does NOT contain patterns
 *
 * @param markdown - Rendered markdown string
 * @param patterns - Patterns that should NOT be present
 */
export function assertMarkdownDoesNotContain(
  markdown: string | null,
  ...patterns: Array<string | RegExp>
): void {
  expect(markdown).not.toBeNull();

  for (const pattern of patterns) {
    if (typeof pattern === "string") {
      expect(markdown).not.toContain(pattern);
    } else {
      expect(markdown).not.toMatch(pattern);
    }
  }
}

/**
 * Assert that markdown has expected heading structure
 *
 * @param markdown - Rendered markdown string
 * @param expectedHeadings - Array of { level, text } to find in order
 */
export function assertMarkdownHeadings(
  markdown: string | null,
  expectedHeadings: Array<{ level: number; text: string | RegExp }>
): void {
  expect(markdown).not.toBeNull();

  const md = markdown!;

  for (const { level, text } of expectedHeadings) {
    const prefix = "#".repeat(level) + " ";
    const lines = md.split("\n");

    const found = lines.some((line) => {
      if (!line.startsWith(prefix)) return false;
      const headingText = line.slice(prefix.length);
      if (typeof text === "string") {
        return headingText.includes(text);
      }
      return text.test(headingText);
    });

    expect(found, `Expected heading level ${level} with text matching: ${String(text)}`).toBe(true);
  }
}
