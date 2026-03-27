/**
 * AST Parser Shared State and Helpers
 *
 * Shared state management, step handler functions, and imports for the split
 * ast-parser test files (exports, metadata, relationships-edges).
 *
 * @architect
 */

import { expect } from 'vitest';

import { parseFileDirectives } from '../../../src/scanner/ast-parser.js';
import { Result } from '../../../src/types/index.js';
import { createTempDir, writeTempFile } from './file-system.js';
import type { AstParserScenarioState, ParsedDirectiveResult, DataTableRow } from '../world.js';
import { initAstParserState } from '../world.js';

// =============================================================================
// Re-exports for step files
// =============================================================================

export { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
export type { AstParserScenarioState, ParsedDirectiveResult, DataTableRow };

// =============================================================================
// Module-Level State
// =============================================================================

let state: AstParserScenarioState | null = null;

export function getState(): AstParserScenarioState {
  if (!state) throw new Error('State not initialized');
  return state;
}

export function clearState(): void {
  state = null;
}

// =============================================================================
// Lifecycle
// =============================================================================

export async function afterEachScenario(): Promise<void> {
  if (state?.cleanup) {
    await state.cleanup();
  }
  state = null;
}

// =============================================================================
// Background
// =============================================================================

export async function backgroundGiven(): Promise<void> {
  const tempContext = await createTempDir({ prefix: 'ast-parser-test-' });
  state = {
    ...initAstParserState(),
    tempDir: tempContext.tempDir,
    cleanup: tempContext.cleanup,
  };
}

// =============================================================================
// Given Steps
// =============================================================================

export const givenTypeScriptFileWithContent = async (
  _ctx: unknown,
  content: string
): Promise<void> => {
  if (!state?.tempDir) throw new Error('State not initialized');

  // Trim the content and normalize line endings
  const normalizedContent = content.trim();
  state.fileContent = normalizedContent;
  state.filePath = await writeTempFile(state.tempDir, 'test.ts', normalizedContent);
};

export const givenMalformedTypeScriptFile = async (
  _ctx: unknown,
  content: string
): Promise<void> => {
  if (!state?.tempDir) throw new Error('State not initialized');

  // Keep malformed content as-is (don't trim - preserves broken syntax)
  const normalizedContent = content.trim();
  state.fileContent = normalizedContent;
  state.filePath = await writeTempFile(state.tempDir, 'malformed.ts', normalizedContent);
};

export const givenEmptyTypeScriptFile = async (): Promise<void> => {
  if (!state?.tempDir) throw new Error('State not initialized');

  state.fileContent = '';
  state.filePath = await writeTempFile(state.tempDir, 'empty.ts', '');
};

// =============================================================================
// When Steps
// =============================================================================

export const whenFileIsParsed = (): void => {
  if (!state?.filePath) throw new Error('File path not set');

  const result = parseFileDirectives(state.fileContent, state.filePath);

  if (Result.isOk(result)) {
    state.directives = result.value.directives as ParsedDirectiveResult[];
    state.parseError = null;
  } else {
    state.directives = [];
    state.parseError = {
      file: result.error.file || state.filePath,
      message: result.error.message,
    };
  }
};

// =============================================================================
// Then Steps - Directive Count
// =============================================================================

export const thenDirectiveCountShouldBe = (_ctx: unknown, count: number): void => {
  if (!state) throw new Error('State not initialized');
  expect(state.directives).toHaveLength(count);
};

// =============================================================================
// Then Steps - Tags
// =============================================================================

export const thenDirectiveShouldHaveTag = (_ctx: unknown, tag: string): void => {
  if (!state) throw new Error('State not initialized');
  expect(state.directives[0]?.directive.tags).toContain(tag);
};

export const thenDirectiveShouldHaveTags = (_ctx: unknown, table: DataTableRow[]): void => {
  if (!state) throw new Error('State not initialized');
  const expectedTags = table.map((row) => row.value);
  for (const tag of expectedTags) {
    expect(state.directives[0]?.directive.tags).toContain(tag);
  }
};

export const thenDirectiveShouldHaveTagCount = (_ctx: unknown, count: number): void => {
  if (!state) throw new Error('State not initialized');
  expect(state.directives[0]?.directive.tags).toHaveLength(count);
};

export const thenDirectivesShouldHaveDetails = (_ctx: unknown, table: DataTableRow[]): void => {
  if (!state) throw new Error('State not initialized');

  for (const row of table) {
    const index = parseInt(row.index, 10) - 1; // Convert 1-based to 0-based
    const directive = state.directives[index];
    expect(directive).toBeDefined();

    if (row.tag) {
      expect(directive?.directive.tags).toContain(row.tag);
    }
    if (row.exportName) {
      expect(directive?.exports[0]?.name).toBe(row.exportName);
    }
  }
};

export const thenDirectiveShouldNotHaveAnyTags = (_ctx: unknown, table: DataTableRow[]): void => {
  if (!state) throw new Error('State not initialized');
  const tags = state.directives[0]?.directive.tags || [];
  const forbiddenTags = table.map((row) => row.value);

  for (const tag of forbiddenTags) {
    expect(tags).not.toContain(tag);
  }
};

// =============================================================================
// Then Steps - Description
// =============================================================================

export const thenDescriptionShouldContain = (_ctx: unknown, text: string): void => {
  if (!state) throw new Error('State not initialized');
  expect(state.directives[0]?.directive.description).toContain(text);
};

export const thenDescriptionShouldBe = (_ctx: unknown, text: string): void => {
  if (!state) throw new Error('State not initialized');
  expect(state.directives[0]?.directive.description).toBe(text);
};

export const thenDescriptionShouldStartWith = (_ctx: unknown, text: string): void => {
  if (!state) throw new Error('State not initialized');
  expect(state.directives[0]?.directive.description).toMatch(new RegExp(`^${escapeRegex(text)}`));
};

export const thenDescriptionShouldNotStartWithAny = (
  _ctx: unknown,
  table: DataTableRow[]
): void => {
  if (!state) throw new Error('State not initialized');
  const description = state.directives[0]?.directive.description || '';
  for (const row of table) {
    expect(description).not.toMatch(new RegExp(`^${escapeRegex(row.value)}`));
  }
};

export const thenDescriptionShouldContainAll = (_ctx: unknown, table: DataTableRow[]): void => {
  if (!state) throw new Error('State not initialized');
  const description = state.directives[0]?.directive.description || '';
  const expectedTexts = table.map((row) => row.value);

  for (const text of expectedTexts) {
    expect(description).toContain(text);
  }
};

export const thenDescriptionShouldNotContainAny = (_ctx: unknown, table: DataTableRow[]): void => {
  if (!state) throw new Error('State not initialized');
  const description = state.directives[0]?.directive.description || '';
  const forbiddenTexts = table.map((row) => row.value);

  for (const text of forbiddenTexts) {
    expect(description).not.toContain(text);
  }
};

// =============================================================================
// Then Steps - Exports
// =============================================================================

export const thenFirstExportShouldBe = (_ctx: unknown, table: DataTableRow[]): void => {
  if (!state) throw new Error('State not initialized');
  const expected: Record<string, string> = {};
  for (const row of table) {
    expected[row.field] = row.value;
  }

  const firstExport = state.directives[0]?.exports[0];
  expect(firstExport).toBeDefined();

  if (expected.type) {
    expect(firstExport?.type).toBe(expected.type);
  }
  if (expected.name) {
    expect(firstExport?.name).toBe(expected.name);
  }
};

export const thenExportCountShouldBe = (_ctx: unknown, count: number): void => {
  if (!state) throw new Error('State not initialized');
  expect(state.directives[0]?.exports).toHaveLength(count);
};

export const thenExportsShouldIncludeNames = (_ctx: unknown, table: DataTableRow[]): void => {
  if (!state) throw new Error('State not initialized');
  const expectedNames = table.map((row) => row.value);
  const actualNames = state.directives[0]?.exports.map((e) => e.name) || [];

  for (const name of expectedNames) {
    expect(actualNames).toContain(name);
  }
};

export const thenFirstExportSignatureShouldContain = (_ctx: unknown, text: string): void => {
  if (!state) throw new Error('State not initialized');
  expect(state.directives[0]?.exports[0]?.signature).toContain(text);
};

// =============================================================================
// Then Steps - Code
// =============================================================================

export const thenCodeShouldContain = (_ctx: unknown, text: string): void => {
  if (!state) throw new Error('State not initialized');
  expect(state.directives[0]?.code).toContain(text);
};

// =============================================================================
// Then Steps - Position
// =============================================================================

export const thenPositionShouldBe = (_ctx: unknown, table: DataTableRow[]): void => {
  if (!state) throw new Error('State not initialized');
  const expected: Record<string, number> = {};
  for (const row of table) {
    expected[row.field] = parseInt(row.value, 10);
  }

  const position = state.directives[0]?.directive.position;
  expect(position).toBeDefined();

  if (expected.startLine !== undefined) {
    expect(position?.startLine).toBe(expected.startLine);
  }
  if (expected.endLine !== undefined) {
    expect(position?.endLine).toBe(expected.endLine);
  }
};

// =============================================================================
// Then Steps - Examples
// =============================================================================

export const thenDirectiveShouldHaveExampleCount = (_ctx: unknown, count: number): void => {
  if (!state) throw new Error('State not initialized');
  expect(state.directives[0]?.directive.examples).toHaveLength(count);
};

export const thenExamplesShouldContain = (_ctx: unknown, table: DataTableRow[]): void => {
  if (!state) throw new Error('State not initialized');
  const examples = state.directives[0]?.directive.examples || [];
  const expectedTexts = table.map((row) => row.value);

  for (const text of expectedTexts) {
    const found = examples.some((example) => example.includes(text));
    expect(found).toBe(true);
  }
};

// =============================================================================
// Then Steps - When to Use
// =============================================================================

export const thenWhenToUseShouldHaveItemCount = (_ctx: unknown, count: number): void => {
  if (!state) throw new Error('State not initialized');
  expect(state.directives[0]?.directive.whenToUse).toHaveLength(count);
};

export const thenWhenToUseShouldContain = (_ctx: unknown, table: DataTableRow[]): void => {
  if (!state) throw new Error('State not initialized');
  const expectedItems = table.map((row) => row.value);
  const actual = state.directives[0]?.directive.whenToUse || [];

  for (const item of expectedItems) {
    expect(actual).toContain(item);
  }
};

export const thenWhenToUseShouldBeUndefined = (): void => {
  if (!state) throw new Error('State not initialized');
  expect(state.directives[0]?.directive.whenToUse).toBeUndefined();
};

// =============================================================================
// Then Steps - Relationships (uses/usedBy)
// =============================================================================

export const thenUsesShouldContain = (_ctx: unknown, table: DataTableRow[]): void => {
  if (!state) throw new Error('State not initialized');
  const expectedItems = table.map((row) => row.value);
  const actual = state.directives[0]?.directive.uses || [];

  for (const item of expectedItems) {
    expect(actual).toContain(item);
  }
};

export const thenUsesShouldHaveItemCount = (_ctx: unknown, count: number): void => {
  if (!state) throw new Error('State not initialized');
  expect(state.directives[0]?.directive.uses).toHaveLength(count);
};

export const thenUsesShouldBeUndefined = (): void => {
  if (!state) throw new Error('State not initialized');
  expect(state.directives[0]?.directive.uses).toBeUndefined();
};

export const thenUsedByShouldContain = (_ctx: unknown, table: DataTableRow[]): void => {
  if (!state) throw new Error('State not initialized');
  const expectedItems = table.map((row) => row.value);
  const actual = state.directives[0]?.directive.usedBy || [];

  for (const item of expectedItems) {
    expect(actual).toContain(item);
  }
};

export const thenUsedByShouldHaveItemCount = (_ctx: unknown, count: number): void => {
  if (!state) throw new Error('State not initialized');
  expect(state.directives[0]?.directive.usedBy).toHaveLength(count);
};

export const thenUsedByShouldBeUndefined = (): void => {
  if (!state) throw new Error('State not initialized');
  expect(state.directives[0]?.directive.usedBy).toBeUndefined();
};

// =============================================================================
// Then Steps - Error Handling
// =============================================================================

export const thenParsingShouldFail = (): void => {
  if (!state) throw new Error('State not initialized');
  expect(state.parseError).not.toBeNull();
};

export const thenParseErrorShouldContainFilePath = (): void => {
  if (!state) throw new Error('State not initialized');
  expect(state.parseError?.file).toBe(state.filePath);
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
