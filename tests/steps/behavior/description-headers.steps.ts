/**
 * Description Headers Step Definitions
 *
 * BDD step definitions for testing description header normalization.
 * Tests the stripLeadingHeaders utility and its integration with pattern
 * detail document generation.
 *
 * @libar-docs
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { createPatternsCodec } from '../../../src/renderable/codecs/patterns.js';
import { stripLeadingHeaders } from '../../../src/renderable/utils.js';
import type { RenderableDocument } from '../../../src/renderable/schema.js';
import type { MasterDataset } from '../../../src/validation-schemas/master-dataset.js';
import {
  createTestMasterDataset,
  createTestPattern,
  resetPatternCounter,
} from '../../fixtures/dataset-factories.js';
import { findHeadings, isHeading, isParagraph } from '../../support/helpers/document-assertions.js';
import type { DataTableRow } from '../../support/world.js';

// =============================================================================
// State Types
// =============================================================================

interface DescriptionHeadersState {
  dataset: MasterDataset | null;
  document: RenderableDocument | null;
  patternDocument: RenderableDocument | null;
  inputText: string | null;
  strippedResult: string | null;
  directiveDescription: string | null;
  originalDescription: string | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: DescriptionHeadersState | null = null;

function initState(): DescriptionHeadersState {
  resetPatternCounter();
  return {
    dataset: null,
    document: null,
    patternDocument: null,
    inputText: null,
    strippedResult: null,
    directiveDescription: null,
    originalDescription: null,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Find the Description section content in a document
 */
function findDescriptionSection(doc: RenderableDocument): string | null {
  const sections = doc.sections;
  const descIdx = sections.findIndex((s) => isHeading(s) && s.text === 'Description');

  if (descIdx === -1) {
    return null;
  }

  // Find paragraph content after Description heading
  for (let i = descIdx + 1; i < sections.length; i++) {
    const section = sections[i];
    if (isHeading(section)) break;
    if (isParagraph(section)) {
      return section.text;
    }
  }

  return null;
}

/**
 * Check if a document has a Description section
 */
function hasDescriptionSection(doc: RenderableDocument): boolean {
  const headings = findHeadings(doc);
  return headings.some((h) => h.text === 'Description');
}

// =============================================================================
// Feature: Description Header Normalization
// =============================================================================

const feature = await loadFeature('tests/features/behavior/description-headers.feature');

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a patterns codec test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Rule 1: Leading headers are stripped from pattern descriptions
  // ===========================================================================

  Rule('Leading headers are stripped from pattern descriptions', ({ RuleScenario }) => {
    RuleScenario('Strip single leading markdown header', ({ Given, When, Then, And }) => {
      Given('a pattern with directive description:', (_ctx: unknown, docString: string) => {
        state!.originalDescription = docString;
        state!.directiveDescription = docString;
        const pattern = createTestPattern({
          name: 'TestPattern',
          description: docString,
        });
        state!.dataset = createTestMasterDataset({ patterns: [pattern] });
      });

      When('the pattern detail document is generated', () => {
        const codec = createPatternsCodec({ generateDetailFiles: true });
        state!.document = codec.decode(state!.dataset!);
        // Get the individual pattern document from additionalFiles
        const files = state!.document.additionalFiles;
        if (files) {
          const patternFile = Object.values(files)[0];
          state!.patternDocument = patternFile;
        }
      });

      Then('the output contains {string}', (_ctx: unknown, expected: string) => {
        expect(state!.patternDocument).toBeDefined();
        const headings = findHeadings(state!.patternDocument!);
        const hasHeading = headings.some((h) => h.text === expected.replace('## ', ''));
        expect(hasHeading, `Document should contain heading "${expected}"`).toBe(true);
      });

      And('the Description section contains {string}', (_ctx: unknown, expected: string) => {
        const descContent = findDescriptionSection(state!.patternDocument!);
        expect(descContent).toBeDefined();
        expect(descContent).toContain(expected);
      });

      And('the output does not contain {string}', (_ctx: unknown, notExpected: string) => {
        const descContent = findDescriptionSection(state!.patternDocument!);
        // The header should be stripped from the description
        expect(descContent).not.toContain(notExpected);
      });
    });

    RuleScenario('Strip multiple leading headers', ({ Given, When, Then, And }) => {
      Given('a pattern with directive description:', (_ctx: unknown, docString: string) => {
        state!.originalDescription = docString;
        state!.directiveDescription = docString;
        const pattern = createTestPattern({
          name: 'TestPattern',
          description: docString,
        });
        state!.dataset = createTestMasterDataset({ patterns: [pattern] });
      });

      When('the pattern detail document is generated', () => {
        const codec = createPatternsCodec({ generateDetailFiles: true });
        state!.document = codec.decode(state!.dataset!);
        const files = state!.document.additionalFiles;
        if (files) {
          const patternFile = Object.values(files)[0];
          state!.patternDocument = patternFile;
        }
      });

      Then('the Description section contains {string}', (_ctx: unknown, expected: string) => {
        const descContent = findDescriptionSection(state!.patternDocument!);
        expect(descContent).toBeDefined();
        expect(descContent).toContain(expected);
      });

      And(
        'the Description section does not contain any of:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          const descContent = findDescriptionSection(state!.patternDocument!);
          for (const row of dataTable) {
            const header = row.header ?? '';
            expect(descContent).not.toContain(header);
          }
        }
      );
    });

    RuleScenario('Preserve description without leading header', ({ Given, When, Then, And }) => {
      Given('a pattern with directive description:', (_ctx: unknown, docString: string) => {
        state!.originalDescription = docString;
        state!.directiveDescription = docString;
        const pattern = createTestPattern({
          name: 'TestPattern',
          description: docString,
        });
        state!.dataset = createTestMasterDataset({ patterns: [pattern] });
      });

      When('the pattern detail document is generated', () => {
        const codec = createPatternsCodec({ generateDetailFiles: true });
        state!.document = codec.decode(state!.dataset!);
        const files = state!.document.additionalFiles;
        if (files) {
          const patternFile = Object.values(files)[0];
          state!.patternDocument = patternFile;
        }
      });

      Then('the Description section contains {string}', (_ctx: unknown, expected: string) => {
        const descContent = findDescriptionSection(state!.patternDocument!);
        expect(descContent).toBeDefined();
        expect(descContent).toContain(expected);
      });

      And('no headers were stripped', () => {
        // The description should be the same as original (minus trimming)
        const descContent = findDescriptionSection(state!.patternDocument!);
        const originalTrimmed = state!.originalDescription!.trim();
        expect(descContent?.trim()).toBe(originalTrimmed);
      });
    });
  });

  // ===========================================================================
  // Rule 2: Edge cases are handled correctly
  // ===========================================================================

  Rule('Edge cases are handled correctly', ({ RuleScenario }) => {
    RuleScenario('Empty description after stripping headers', ({ Given, When, Then }) => {
      Given('a pattern with directive description:', (_ctx: unknown, docString: string) => {
        state!.directiveDescription = docString;
        const pattern = createTestPattern({
          name: 'TestPattern',
          description: docString,
        });
        state!.dataset = createTestMasterDataset({ patterns: [pattern] });
      });

      When('the pattern detail document is generated', () => {
        const codec = createPatternsCodec({ generateDetailFiles: true });
        state!.document = codec.decode(state!.dataset!);
        const files = state!.document.additionalFiles;
        if (files) {
          const patternFile = Object.values(files)[0];
          state!.patternDocument = patternFile;
        }
      });

      Then('no Description section is rendered', () => {
        expect(state!.patternDocument).toBeDefined();
        const hasDesc = hasDescriptionSection(state!.patternDocument!);
        expect(hasDesc).toBe(false);
      });
    });

    RuleScenario('Description with only whitespace and headers', ({ Given, When, Then }) => {
      Given('a pattern with directive description:', (_ctx: unknown, docString: string) => {
        state!.directiveDescription = docString;
        const pattern = createTestPattern({
          name: 'TestPattern',
          description: docString,
        });
        state!.dataset = createTestMasterDataset({ patterns: [pattern] });
      });

      When('the pattern detail document is generated', () => {
        const codec = createPatternsCodec({ generateDetailFiles: true });
        state!.document = codec.decode(state!.dataset!);
        const files = state!.document.additionalFiles;
        if (files) {
          const patternFile = Object.values(files)[0];
          state!.patternDocument = patternFile;
        }
      });

      Then('no Description section is rendered', () => {
        expect(state!.patternDocument).toBeDefined();
        const hasDesc = hasDescriptionSection(state!.patternDocument!);
        expect(hasDesc).toBe(false);
      });
    });

    RuleScenario('Header in middle of description is preserved', ({ Given, When, Then, And }) => {
      Given('a pattern with description containing middle header', () => {
        // Use hardcoded description to avoid Gherkin parser stripping markdown headers from docstrings
        const descWithMiddleHeader =
          'Introduction paragraph.\n\n## Section Header\n\nMore content after header.';
        state!.directiveDescription = descWithMiddleHeader;
        state!.originalDescription = descWithMiddleHeader;
        const pattern = createTestPattern({
          name: 'TestPattern',
          description: descWithMiddleHeader,
        });
        state!.dataset = createTestMasterDataset({ patterns: [pattern] });
      });

      When('the pattern detail document is generated', () => {
        const codec = createPatternsCodec({ generateDetailFiles: true });
        state!.document = codec.decode(state!.dataset!);
        const files = state!.document.additionalFiles;
        if (files) {
          const patternFile = Object.values(files)[0];
          state!.patternDocument = patternFile;
        }
      });

      // First: "Introduction paragraph"
      Then('the Description section contains {string}', (_ctx: unknown, expected: string) => {
        const descContent = findDescriptionSection(state!.patternDocument!);
        expect(descContent).toBeDefined();
        expect(descContent).toContain(expected);
      });

      // Verify middle header is preserved
      And('the Description section contains middle header text', () => {
        const descContent = findDescriptionSection(state!.patternDocument!);
        expect(descContent).toBeDefined();
        expect(descContent).toContain('## Section Header');
      });
    });
  });

  // ===========================================================================
  // Rule 3: stripLeadingHeaders helper function
  // ===========================================================================

  Rule('stripLeadingHeaders removes only leading headers', ({ RuleScenario }) => {
    RuleScenario('Strips h1 header', ({ Given, When, Then }) => {
      Given('text {string}', (_ctx: unknown, text: string) => {
        // Handle escaped newlines in the Gherkin text
        state!.inputText = text.replace(/\\n/g, '\n');
      });

      When('stripLeadingHeaders is called', () => {
        state!.strippedResult = stripLeadingHeaders(state!.inputText!);
      });

      Then('the result is {string}', (_ctx: unknown, expected: string) => {
        expect(state!.strippedResult).toBe(expected);
      });
    });

    RuleScenario('Strips h2 through h6 headers', ({ Given, When, Then }) => {
      Given('text {string}', (_ctx: unknown, text: string) => {
        state!.inputText = text.replace(/\\n/g, '\n');
      });

      When('stripLeadingHeaders is called', () => {
        state!.strippedResult = stripLeadingHeaders(state!.inputText!);
      });

      Then('the result is {string}', (_ctx: unknown, expected: string) => {
        expect(state!.strippedResult).toBe(expected);
      });
    });

    RuleScenario('Strips leading empty lines before header', ({ Given, When, Then }) => {
      Given('text {string}', (_ctx: unknown, text: string) => {
        state!.inputText = text.replace(/\\n/g, '\n');
      });

      When('stripLeadingHeaders is called', () => {
        state!.strippedResult = stripLeadingHeaders(state!.inputText!);
      });

      Then('the result is {string}', (_ctx: unknown, expected: string) => {
        expect(state!.strippedResult).toBe(expected);
      });
    });

    RuleScenario('Preserves content starting with text', ({ Given, When, Then }) => {
      Given('text {string}', (_ctx: unknown, text: string) => {
        state!.inputText = text.replace(/\\n/g, '\n');
      });

      When('stripLeadingHeaders is called', () => {
        state!.strippedResult = stripLeadingHeaders(state!.inputText!);
      });

      Then('the result is {string}', (_ctx: unknown, expected: string) => {
        expect(state!.strippedResult).toBe(expected);
      });
    });

    RuleScenario('Returns empty string for header-only input', ({ Given, When, Then }) => {
      Given('text {string}', (_ctx: unknown, text: string) => {
        state!.inputText = text.replace(/\\n/g, '\n');
      });

      When('stripLeadingHeaders is called', () => {
        state!.strippedResult = stripLeadingHeaders(state!.inputText!);
      });

      Then('the result is {string}', (_ctx: unknown, expected: string) => {
        expect(state!.strippedResult).toBe(expected);
      });
    });

    RuleScenario('Handles null/undefined input', ({ Given, When, Then }) => {
      Given('null text', () => {
        state!.inputText = null;
      });

      When('stripLeadingHeaders is called', () => {
        // @ts-expect-error Testing null handling
        state!.strippedResult = stripLeadingHeaders(state!.inputText);
      });

      Then('the result is null', () => {
        expect(state!.strippedResult).toBeNull();
      });
    });
  });
});
