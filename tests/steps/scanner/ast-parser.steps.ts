/**
 * AST Parser Step Definitions
 *
 * BDD step definitions for the AST parser tests. These tests verify
 * that the parseFileDirectives function correctly extracts @libar-docs-*
 * directives from TypeScript source files.
 *
 * @libar-docs
 */

import { expect } from 'vitest';
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';

import { parseFileDirectives } from '../../../src/scanner/ast-parser.js';
import { Result } from '../../../src/types/index.js';
import { createTempDir, writeTempFile } from '../../support/helpers/file-system.js';
import type {
  AstParserScenarioState,
  ParsedDirectiveResult,
  DataTableRow,
} from '../../support/world.js';
import { initAstParserState } from '../../support/world.js';

// =============================================================================
// Module-Level State
// =============================================================================

let state: AstParserScenarioState | null = null;

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/scanner/ast-parser.feature');

describeFeature(feature, ({ Rule, Background, AfterEachScenario }) => {
  // ---------------------------------------------------------------------------
  // Lifecycle Hooks
  // ---------------------------------------------------------------------------

  AfterEachScenario(async () => {
    // Clean up temp directory
    if (state?.cleanup) {
      await state.cleanup();
    }
    state = null;
  });

  // ---------------------------------------------------------------------------
  // Background
  // ---------------------------------------------------------------------------

  Background(({ Given }) => {
    Given('a scanner context with temp directory', async () => {
      const tempContext = await createTempDir({ prefix: 'ast-parser-test-' });
      state = {
        ...initAstParserState(),
        tempDir: tempContext.tempDir,
        cleanup: tempContext.cleanup,
      };
    });
  });

  // ---------------------------------------------------------------------------
  // Given Steps
  // ---------------------------------------------------------------------------

  const givenTypeScriptFileWithContent = async (_ctx: unknown, content: string) => {
    if (!state?.tempDir) throw new Error('State not initialized');

    // Trim the content and normalize line endings
    const normalizedContent = content.trim();
    state.fileContent = normalizedContent;
    state.filePath = await writeTempFile(state.tempDir, 'test.ts', normalizedContent);
  };

  const givenMalformedTypeScriptFile = async (_ctx: unknown, content: string) => {
    if (!state?.tempDir) throw new Error('State not initialized');

    // Keep malformed content as-is (don't trim - preserves broken syntax)
    const normalizedContent = content.trim();
    state.fileContent = normalizedContent;
    state.filePath = await writeTempFile(state.tempDir, 'malformed.ts', normalizedContent);
  };

  const givenEmptyTypeScriptFile = async () => {
    if (!state?.tempDir) throw new Error('State not initialized');

    state.fileContent = '';
    state.filePath = await writeTempFile(state.tempDir, 'empty.ts', '');
  };

  // ---------------------------------------------------------------------------
  // When Steps
  // ---------------------------------------------------------------------------

  const whenFileIsParsed = () => {
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

  // ---------------------------------------------------------------------------
  // Then Steps - Directive Count
  // ---------------------------------------------------------------------------

  const thenDirectiveCountShouldBe = (_ctx: unknown, count: number) => {
    if (!state) throw new Error('State not initialized');
    expect(state.directives).toHaveLength(count);
  };

  // ---------------------------------------------------------------------------
  // Then Steps - Tags
  // ---------------------------------------------------------------------------

  const thenDirectiveShouldHaveTag = (_ctx: unknown, tag: string) => {
    if (!state) throw new Error('State not initialized');
    expect(state.directives[0]?.directive.tags).toContain(tag);
  };

  const thenDirectiveShouldHaveTags = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state) throw new Error('State not initialized');
    const expectedTags = table.map((row) => row.value);
    for (const tag of expectedTags) {
      expect(state.directives[0]?.directive.tags).toContain(tag);
    }
  };

  const thenDirectiveShouldHaveTagCount = (_ctx: unknown, count: number) => {
    if (!state) throw new Error('State not initialized');
    expect(state.directives[0]?.directive.tags).toHaveLength(count);
  };

  const _thenDirectiveShouldNotHaveTag = (_ctx: unknown, tag: string) => {
    if (!state) throw new Error('State not initialized');
    expect(state.directives[0]?.directive.tags).not.toContain(tag);
  };

  const _thenDirectiveNShouldHaveTag = (_ctx: unknown, n: number, tag: string) => {
    if (!state) throw new Error('State not initialized');
    const index = n - 1; // Convert 1-based to 0-based
    expect(state.directives[index]?.directive.tags).toContain(tag);
  };

  const thenDirectivesShouldHaveDetails = (_ctx: unknown, table: DataTableRow[]) => {
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

  // ---------------------------------------------------------------------------
  // Then Steps - Description
  // ---------------------------------------------------------------------------

  const thenDescriptionShouldContain = (_ctx: unknown, text: string) => {
    if (!state) throw new Error('State not initialized');
    expect(state.directives[0]?.directive.description).toContain(text);
  };

  const thenDescriptionShouldBe = (_ctx: unknown, text: string) => {
    if (!state) throw new Error('State not initialized');
    expect(state.directives[0]?.directive.description).toBe(text);
  };

  const _thenDescriptionShouldNotContain = (_ctx: unknown, text: string) => {
    if (!state) throw new Error('State not initialized');
    expect(state.directives[0]?.directive.description).not.toContain(text);
  };

  const thenDescriptionShouldStartWith = (_ctx: unknown, text: string) => {
    if (!state) throw new Error('State not initialized');
    expect(state.directives[0]?.directive.description).toMatch(new RegExp(`^${escapeRegex(text)}`));
  };

  const _thenDescriptionShouldNotStartWith = (_ctx: unknown, text: string) => {
    if (!state) throw new Error('State not initialized');
    expect(state.directives[0]?.directive.description).not.toMatch(
      new RegExp(`^${escapeRegex(text)}`)
    );
  };

  const thenDescriptionShouldNotStartWithAny = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state) throw new Error('State not initialized');
    const description = state.directives[0]?.directive.description || '';
    for (const row of table) {
      expect(description).not.toMatch(new RegExp(`^${escapeRegex(row.value)}`));
    }
  };

  // ---------------------------------------------------------------------------
  // Then Steps - Exports
  // ---------------------------------------------------------------------------

  const thenFirstExportShouldBe = (_ctx: unknown, table: DataTableRow[]) => {
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

  const thenExportCountShouldBe = (_ctx: unknown, count: number) => {
    if (!state) throw new Error('State not initialized');
    expect(state.directives[0]?.exports).toHaveLength(count);
  };

  const thenExportsShouldIncludeNames = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state) throw new Error('State not initialized');
    const expectedNames = table.map((row) => row.value);
    const actualNames = state.directives[0]?.exports.map((e) => e.name) || [];

    for (const name of expectedNames) {
      expect(actualNames).toContain(name);
    }
  };

  const _thenDirectiveNExportNameShouldBe = (_ctx: unknown, n: number, name: string) => {
    if (!state) throw new Error('State not initialized');
    const index = n - 1;
    expect(state.directives[index]?.exports[0]?.name).toBe(name);
  };

  const thenFirstExportSignatureShouldContain = (_ctx: unknown, text: string) => {
    if (!state) throw new Error('State not initialized');
    expect(state.directives[0]?.exports[0]?.signature).toContain(text);
  };

  // ---------------------------------------------------------------------------
  // Then Steps - Code
  // ---------------------------------------------------------------------------

  const thenCodeShouldContain = (_ctx: unknown, text: string) => {
    if (!state) throw new Error('State not initialized');
    expect(state.directives[0]?.code).toContain(text);
  };

  // ---------------------------------------------------------------------------
  // Then Steps - Position
  // ---------------------------------------------------------------------------

  const thenPositionShouldBe = (_ctx: unknown, table: DataTableRow[]) => {
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

  // ---------------------------------------------------------------------------
  // Then Steps - Examples
  // ---------------------------------------------------------------------------

  const thenDirectiveShouldHaveExampleCount = (_ctx: unknown, count: number) => {
    if (!state) throw new Error('State not initialized');
    expect(state.directives[0]?.directive.examples).toHaveLength(count);
  };

  const _thenExampleNShouldContain = (_ctx: unknown, n: number, text: string) => {
    if (!state) throw new Error('State not initialized');
    const index = n - 1;
    expect(state.directives[0]?.directive.examples[index]).toContain(text);
  };

  const thenExamplesShouldContain = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state) throw new Error('State not initialized');
    const examples = state.directives[0]?.directive.examples || [];
    const expectedTexts = table.map((row) => row.value);

    for (const text of expectedTexts) {
      const found = examples.some((example) => example.includes(text));
      expect(found).toBe(true);
    }
  };

  // ---------------------------------------------------------------------------
  // Then Steps - Description (table variants)
  // ---------------------------------------------------------------------------

  const thenDescriptionShouldContainAll = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state) throw new Error('State not initialized');
    const description = state.directives[0]?.directive.description || '';
    const expectedTexts = table.map((row) => row.value);

    for (const text of expectedTexts) {
      expect(description).toContain(text);
    }
  };

  const thenDescriptionShouldNotContainAny = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state) throw new Error('State not initialized');
    const description = state.directives[0]?.directive.description || '';
    const forbiddenTexts = table.map((row) => row.value);

    for (const text of forbiddenTexts) {
      expect(description).not.toContain(text);
    }
  };

  // ---------------------------------------------------------------------------
  // Then Steps - Tags (table variants)
  // ---------------------------------------------------------------------------

  const thenDirectiveShouldNotHaveAnyTags = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state) throw new Error('State not initialized');
    const tags = state.directives[0]?.directive.tags || [];
    const forbiddenTags = table.map((row) => row.value);

    for (const tag of forbiddenTags) {
      expect(tags).not.toContain(tag);
    }
  };

  // ---------------------------------------------------------------------------
  // Then Steps - When to Use
  // ---------------------------------------------------------------------------

  const thenWhenToUseShouldHaveItemCount = (_ctx: unknown, count: number) => {
    if (!state) throw new Error('State not initialized');
    expect(state.directives[0]?.directive.whenToUse).toHaveLength(count);
  };

  const thenWhenToUseShouldContain = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state) throw new Error('State not initialized');
    const expectedItems = table.map((row) => row.value);
    const actual = state.directives[0]?.directive.whenToUse || [];

    for (const item of expectedItems) {
      expect(actual).toContain(item);
    }
  };

  const thenWhenToUseShouldBeUndefined = () => {
    if (!state) throw new Error('State not initialized');
    expect(state.directives[0]?.directive.whenToUse).toBeUndefined();
  };

  // ---------------------------------------------------------------------------
  // Then Steps - Relationships (uses/usedBy)
  // ---------------------------------------------------------------------------

  const thenUsesShouldContain = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state) throw new Error('State not initialized');
    const expectedItems = table.map((row) => row.value);
    const actual = state.directives[0]?.directive.uses || [];

    for (const item of expectedItems) {
      expect(actual).toContain(item);
    }
  };

  const thenUsesShouldHaveItemCount = (_ctx: unknown, count: number) => {
    if (!state) throw new Error('State not initialized');
    expect(state.directives[0]?.directive.uses).toHaveLength(count);
  };

  const thenUsesShouldBeUndefined = () => {
    if (!state) throw new Error('State not initialized');
    expect(state.directives[0]?.directive.uses).toBeUndefined();
  };

  const thenUsedByShouldContain = (_ctx: unknown, table: DataTableRow[]) => {
    if (!state) throw new Error('State not initialized');
    const expectedItems = table.map((row) => row.value);
    const actual = state.directives[0]?.directive.usedBy || [];

    for (const item of expectedItems) {
      expect(actual).toContain(item);
    }
  };

  const thenUsedByShouldHaveItemCount = (_ctx: unknown, count: number) => {
    if (!state) throw new Error('State not initialized');
    expect(state.directives[0]?.directive.usedBy).toHaveLength(count);
  };

  const thenUsedByShouldBeUndefined = () => {
    if (!state) throw new Error('State not initialized');
    expect(state.directives[0]?.directive.usedBy).toBeUndefined();
  };

  // ---------------------------------------------------------------------------
  // Then Steps - Error Handling
  // ---------------------------------------------------------------------------

  const thenParsingShouldFail = () => {
    if (!state) throw new Error('State not initialized');
    expect(state.parseError).not.toBeNull();
  };

  const thenParseErrorShouldContainFilePath = () => {
    if (!state) throw new Error('State not initialized');
    expect(state.parseError?.file).toBe(state.filePath);
  };

  // ---------------------------------------------------------------------------
  // Rule: Export types are correctly identified from TypeScript declarations
  // ---------------------------------------------------------------------------

  Rule('Export types are correctly identified from TypeScript declarations', ({ RuleScenario }) => {
    RuleScenario('Parse function export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive should have tag {string}', thenDirectiveShouldHaveTag);
      And('the directive description should contain {string}', thenDescriptionShouldContain);
      And('the first export should be:', thenFirstExportShouldBe);
    });

    RuleScenario('Parse type export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive should have tags:', thenDirectiveShouldHaveTags);
      And('the first export should be:', thenFirstExportShouldBe);
    });

    RuleScenario('Parse interface export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the first export should be:', thenFirstExportShouldBe);
    });

    RuleScenario('Parse const export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the first export should be:', thenFirstExportShouldBe);
    });

    RuleScenario('Parse class export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the first export should be:', thenFirstExportShouldBe);
    });

    RuleScenario('Parse enum export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the first export should be:', thenFirstExportShouldBe);
      And('the directive code should contain {string}', thenCodeShouldContain);
    });

    RuleScenario('Parse const enum export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the first export should be:', thenFirstExportShouldBe);
      And('the directive code should contain {string}', thenCodeShouldContain);
    });

    RuleScenario('Parse abstract class export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the first export should be:', thenFirstExportShouldBe);
    });

    RuleScenario('Parse arrow function export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the first export should be:', thenFirstExportShouldBe);
    });

    RuleScenario('Parse async function export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the first export should be:', thenFirstExportShouldBe);
      And('the directive code should contain {string}', thenCodeShouldContain);
    });

    RuleScenario('Parse generic function export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the first export should be:', thenFirstExportShouldBe);
      And('the directive code should contain {string}', thenCodeShouldContain);
    });

    RuleScenario('Parse default export with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the first export should be:', thenFirstExportShouldBe);
    });

    RuleScenario('Parse re-exports with directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('{int} exports should be found', thenExportCountShouldBe);
      And('the exports should include names:', thenExportsShouldIncludeNames);
    });

    RuleScenario('Parse multiple exports in single statement', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('{int} exports should be found', thenExportCountShouldBe);
      And('the exports should include names:', thenExportsShouldIncludeNames);
    });

    RuleScenario('Parse multiple directives in same file', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directives should be found', thenDirectiveCountShouldBe);
      And('the directives should have details:', thenDirectivesShouldHaveDetails);
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Metadata is correctly extracted from JSDoc comments
  // ---------------------------------------------------------------------------

  Rule('Metadata is correctly extracted from JSDoc comments', ({ RuleScenario }) => {
    RuleScenario('Extract examples from directive', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive should have {int} examples', thenDirectiveShouldHaveExampleCount);
      And('the examples should contain:', thenExamplesShouldContain);
    });

    RuleScenario('Extract multi-line description', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive description should contain all:', thenDescriptionShouldContainAll);
    });

    RuleScenario('Track line numbers correctly', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive position should be:', thenPositionShouldBe);
    });

    RuleScenario('Extract function signature information', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And(
        'the first export signature should contain {string}',
        thenFirstExportSignatureShouldContain
      );
    });

    RuleScenario('Ignore @param and @returns in description', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive description should be {string}', thenDescriptionShouldBe);
      And('the directive description should not contain any:', thenDescriptionShouldNotContainAny);
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Tags are extracted only from the directive section
  // ---------------------------------------------------------------------------

  Rule(
    'Tags are extracted only from the directive section, not from description or examples',
    ({ RuleScenario }) => {
      RuleScenario('Extract multiple tags from directive section', ({ Given, When, Then, And }) => {
        Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
        When('the file is parsed for directives', whenFileIsParsed);
        Then('{int} directive should be found', thenDirectiveCountShouldBe);
        And('the directive should have {int} tags', thenDirectiveShouldHaveTagCount);
        And('the directive should have tags:', thenDirectiveShouldHaveTags);
      });

      RuleScenario('Extract tag with description on same line', ({ Given, When, Then, And }) => {
        Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
        When('the file is parsed for directives', whenFileIsParsed);
        Then('{int} directive should be found', thenDirectiveCountShouldBe);
        And('the directive should have {int} tag', thenDirectiveShouldHaveTagCount);
        And('the directive should have tag {string}', thenDirectiveShouldHaveTag);
      });

      RuleScenario('NOT extract tags mentioned in description', ({ Given, When, Then, And }) => {
        Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
        When('the file is parsed for directives', whenFileIsParsed);
        Then('{int} directive should be found', thenDirectiveCountShouldBe);
        And('the directive should have {int} tag', thenDirectiveShouldHaveTagCount);
        And('the directive should have tag {string}', thenDirectiveShouldHaveTag);
        And('the directive should not have any tags:', thenDirectiveShouldNotHaveAnyTags);
      });

      RuleScenario(
        'NOT extract tags mentioned in @example sections',
        ({ Given, When, Then, And }) => {
          Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
          When('the file is parsed for directives', whenFileIsParsed);
          Then('{int} directive should be found', thenDirectiveCountShouldBe);
          And('the directive should have {int} tag', thenDirectiveShouldHaveTagCount);
          And('the directive should have tag {string}', thenDirectiveShouldHaveTag);
          And('the directive should not have any tags:', thenDirectiveShouldNotHaveAnyTags);
        }
      );
    }
  );

  // ---------------------------------------------------------------------------
  // Rule: When to Use sections are extracted in all supported formats
  // ---------------------------------------------------------------------------

  Rule('When to Use sections are extracted in all supported formats', ({ RuleScenario }) => {
    RuleScenario(
      'Extract When to Use heading format with bullet points',
      ({ Given, When, Then, And }) => {
        Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
        When('the file is parsed for directives', whenFileIsParsed);
        Then('{int} directive should be found', thenDirectiveCountShouldBe);
        And('the directive whenToUse should have {int} items', thenWhenToUseShouldHaveItemCount);
        And('the directive whenToUse should contain:', thenWhenToUseShouldContain);
      }
    );

    RuleScenario('Extract When to use inline format', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive whenToUse should have {int} item', thenWhenToUseShouldHaveItemCount);
      And('the directive whenToUse should contain:', thenWhenToUseShouldContain);
    });

    RuleScenario(
      'Extract asterisk bullets in When to Use section',
      ({ Given, When, Then, And }) => {
        Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
        When('the file is parsed for directives', whenFileIsParsed);
        Then('{int} directive should be found', thenDirectiveCountShouldBe);
        And('the directive whenToUse should contain:', thenWhenToUseShouldContain);
      }
    );

    RuleScenario('Not set whenToUse when section is missing', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive whenToUse should be undefined', thenWhenToUseShouldBeUndefined);
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Relationship tags extract uses and usedBy dependencies
  // ---------------------------------------------------------------------------

  Rule('Relationship tags extract uses and usedBy dependencies', ({ RuleScenario }) => {
    RuleScenario('Extract @libar-docs-uses with single value', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive uses should contain:', thenUsesShouldContain);
    });

    RuleScenario(
      'Extract @libar-docs-uses with comma-separated values',
      ({ Given, When, Then, And }) => {
        Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
        When('the file is parsed for directives', whenFileIsParsed);
        Then('{int} directive should be found', thenDirectiveCountShouldBe);
        And('the directive uses should have {int} items', thenUsesShouldHaveItemCount);
        And('the directive uses should contain:', thenUsesShouldContain);
      }
    );

    RuleScenario('Extract @libar-docs-used-by with single value', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive usedBy should contain:', thenUsedByShouldContain);
    });

    RuleScenario(
      'Extract @libar-docs-used-by with comma-separated values',
      ({ Given, When, Then, And }) => {
        Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
        When('the file is parsed for directives', whenFileIsParsed);
        Then('{int} directive should be found', thenDirectiveCountShouldBe);
        And('the directive usedBy should have {int} items', thenUsedByShouldHaveItemCount);
        And('the directive usedBy should contain:', thenUsedByShouldContain);
      }
    );

    RuleScenario(
      'Extract both uses and usedBy from same directive',
      ({ Given, When, Then, And }) => {
        Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
        When('the file is parsed for directives', whenFileIsParsed);
        Then('{int} directive should be found', thenDirectiveCountShouldBe);
        And('the directive uses should contain:', thenUsesShouldContain);
        And('the directive usedBy should contain:', thenUsedByShouldContain);
      }
    );

    RuleScenario('NOT capture uses/usedBy values in description', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive description should start with {string}', thenDescriptionShouldStartWith);
      And(
        'the directive description should not start with any:',
        thenDescriptionShouldNotStartWithAny
      );
      And('the directive uses should contain:', thenUsesShouldContain);
      And('the directive usedBy should contain:', thenUsedByShouldContain);
    });

    RuleScenario(
      'Not set uses/usedBy when no relationship tags exist',
      ({ Given, When, Then, And }) => {
        Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
        When('the file is parsed for directives', whenFileIsParsed);
        Then('{int} directive should be found', thenDirectiveCountShouldBe);
        And('the directive uses should be undefined', thenUsesShouldBeUndefined);
        And('the directive usedBy should be undefined', thenUsedByShouldBeUndefined);
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Rule: Edge cases and malformed input are handled gracefully
  // ---------------------------------------------------------------------------

  Rule('Edge cases and malformed input are handled gracefully', ({ RuleScenario }) => {
    RuleScenario('Skip comments without @libar-docs-* tags', ({ Given, When, Then }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directives should be found', thenDirectiveCountShouldBe);
    });

    RuleScenario('Skip invalid directive with incomplete tag', ({ Given, When, Then }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directives should be found', thenDirectiveCountShouldBe);
    });

    RuleScenario('Handle malformed TypeScript gracefully', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with malformed content:', givenMalformedTypeScriptFile);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('parsing should fail with error', thenParsingShouldFail);
      And('the parse error should contain the file path', thenParseErrorShouldContainFilePath);
    });

    RuleScenario('Handle empty file gracefully', ({ Given, When, Then }) => {
      Given('an empty TypeScript file', givenEmptyTypeScriptFile);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directives should be found', thenDirectiveCountShouldBe);
    });

    RuleScenario('Handle whitespace-only file', ({ Given, When, Then }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directives should be found', thenDirectiveCountShouldBe);
    });

    RuleScenario('Handle file with only comments and no exports', ({ Given, When, Then }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directives should be found', thenDirectiveCountShouldBe);
    });

    RuleScenario('Skip inline comments (non-block)', ({ Given, When, Then }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directives should be found', thenDirectiveCountShouldBe);
    });

    RuleScenario('Handle unicode characters in descriptions', ({ Given, When, Then, And }) => {
      Given('a TypeScript file with content:', givenTypeScriptFileWithContent);
      When('the file is parsed for directives', whenFileIsParsed);
      Then('{int} directive should be found', thenDirectiveCountShouldBe);
      And('the directive description should contain all:', thenDescriptionShouldContainAll);
    });
  });
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Escape special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
