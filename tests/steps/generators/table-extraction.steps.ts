/**
 * Table Extraction Step Definitions
 *
 * BDD step definitions for testing table extraction and deduplication.
 * Tests that tables in business rule descriptions appear exactly once in output
 * and that stripMarkdownTables correctly removes table syntax from text.
 *
 * @architect
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { createBusinessRulesCodec } from '../../../src/renderable/codecs/business-rules.js';
import { stripMarkdownTables } from '../../../src/renderable/codecs/helpers.js';
import { renderToMarkdown } from '../../../src/renderable/render.js';
import type { RenderableDocument } from '../../../src/renderable/schema.js';
import type { RuntimePatternGraph } from '../../../src/generators/pipeline/transform-types.js';
import { transformToPatternGraph } from '../../../src/generators/pipeline/transform-dataset.js';
import { createDefaultTagRegistry } from '../../../src/validation-schemas/tag-registry.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/index.js';
import type { BusinessRule } from '../../../src/validation-schemas/extracted-pattern.js';
import { createTestPattern, resetPatternCounter } from '../../fixtures/pattern-factories.js';
import { findTables, findParagraphs } from '../../support/helpers/document-assertions.js';

// =============================================================================
// State Types
// =============================================================================

interface TableExtractionState {
  dataset: RuntimePatternGraph | null;
  document: RenderableDocument | null;
  markdown: string;
  patterns: ExtractedPattern[];
  inputText: string | null;
  strippedResult: string | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: TableExtractionState | null = null;

function initState(): TableExtractionState {
  resetPatternCounter();
  return {
    dataset: null,
    document: null,
    markdown: '',
    patterns: [],
    inputText: null,
    strippedResult: null,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a pattern with rules attached
 */
function createPatternWithRules(
  options: {
    name?: string;
    category?: string;
    phase?: number;
    filePath?: string;
  },
  rules: BusinessRule[]
): ExtractedPattern {
  const pattern = createTestPattern({
    name: options.name ?? 'TestPattern',
    category: options.category ?? 'core',
    phase: options.phase,
    filePath: options.filePath ?? 'test.feature',
  });

  // Add rules to the pattern (rules is an optional field on ExtractedPattern)
  return {
    ...pattern,
    rules,
    scenarios: rules.flatMap((r) =>
      r.scenarioNames.map((name, idx) => ({
        scenarioName: name,
        featureName: pattern.name,
        featureDescription: '',
        featureFile: options.filePath ?? 'test.feature',
        line: 50 + idx * 10,
        semanticTags: [],
        tags: [],
      }))
    ),
  };
}

/**
 * Build the dataset from patterns and run the generator
 */
function buildDataset(): void {
  state!.dataset = transformToPatternGraph({
    patterns: state!.patterns,
    tagRegistry: createDefaultTagRegistry(),
    workflow: undefined,
  });
}

function runGenerator(): void {
  buildDataset();
  const codec = createBusinessRulesCodec({ detailLevel: 'detailed', generateDetailFiles: false });
  state!.document = codec.decode(state!.dataset!);
  state!.markdown = renderToMarkdown(state!.document);
}

/**
 * Count tables with a specific header column
 */
function countTablesWithHeader(doc: RenderableDocument, header: string): number {
  const tables = findTables(doc);
  return tables.filter((t) => t.columns.includes(header)).length;
}

/**
 * Check if any paragraph contains raw pipe characters
 */
function hasRawPipeInParagraphs(doc: RenderableDocument): boolean {
  const paragraphs = findParagraphs(doc);
  for (const p of paragraphs) {
    // Check for pipe characters at start of lines (table syntax)
    const lines = p.text.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        return true;
      }
    }
  }
  return false;
}

// =============================================================================
// Feature: Table Extraction Without Duplication
// =============================================================================

const feature = await loadFeature('tests/features/generators/table-extraction.feature');

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a business rules codec test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Rule 1: Tables in rule descriptions render exactly once
  // ===========================================================================

  Rule('Tables in rule descriptions render exactly once', ({ RuleScenario }) => {
    RuleScenario('Single table renders once in detailed mode', ({ Given, When, Then, And }) => {
      Given(
        'a pattern with a rule named {string} and description:',
        (_ctx: unknown, ruleName: string, docString: string) => {
          const rule: BusinessRule = {
            name: ruleName,
            description: docString,
            scenarioNames: [],
            scenarioCount: 0,
          };

          state!.patterns.push(
            createPatternWithRules({ name: 'TestPattern', category: 'core', phase: 1 }, [rule])
          );
        }
      );

      When('decoding with BusinessRulesCodec in detailed mode', () => {
        runGenerator();
      });

      Then(
        'the document contains exactly {int} table with header {string}',
        (_ctx: unknown, count: number, header: string) => {
          expect(state!.document).toBeDefined();
          const tableCount = countTablesWithHeader(state!.document!, header);
          expect(tableCount).toBe(count);
        }
      );

      And('the document does not contain raw pipe characters in text paragraphs', () => {
        expect(hasRawPipeInParagraphs(state!.document!)).toBe(false);
      });
    });

    RuleScenario('Table is extracted and properly formatted', ({ Given, When, Then, And }) => {
      Given(
        'a pattern with a rule containing a markdown table with columns {string} and {string}',
        (_ctx: unknown, col1: string, col2: string) => {
          const description = `**Invariant:** Data transformation must be valid.

| ${col1} | ${col2} |
| --- | --- |
| value1 | result1 |
| value2 | result2 |`;

          const rule: BusinessRule = {
            name: 'Transform Rule',
            description,
            scenarioNames: [],
            scenarioCount: 0,
          };

          state!.patterns.push(
            createPatternWithRules({ name: 'TransformPattern', category: 'core', phase: 1 }, [rule])
          );
        }
      );

      When('decoding with BusinessRulesCodec in detailed mode', () => {
        runGenerator();
      });

      Then(
        'the document contains a table block with headers {string} and {string}',
        (_ctx: unknown, col1: string, col2: string) => {
          expect(state!.document).toBeDefined();
          const tables = findTables(state!.document!);
          expect(tables.length).toBeGreaterThan(0);

          const hasExpectedHeaders = tables.some(
            (t) => t.columns.includes(col1) && t.columns.includes(col2)
          );
          expect(hasExpectedHeaders).toBe(true);
        }
      );

      And('the table rows are properly aligned', () => {
        const tables = findTables(state!.document!);
        expect(tables.length).toBeGreaterThan(0);

        // Each table should have rows
        for (const tbl of tables) {
          expect(tbl.rows.length).toBeGreaterThan(0);
          // Each row should have the same number of cells as columns
          for (const row of tbl.rows) {
            expect(row.length).toBe(tbl.columns.length);
          }
        }
      });
    });
  });

  // ===========================================================================
  // Rule 2: Multiple tables each render once
  // ===========================================================================

  Rule('Multiple tables in description each render exactly once', ({ RuleScenario }) => {
    RuleScenario(
      'Two tables in description render as two separate tables',
      ({ Given, When, Then, And }) => {
        Given(
          'a pattern with a rule named {string} and description:',
          (_ctx: unknown, ruleName: string, docString: string) => {
            const rule: BusinessRule = {
              name: ruleName,
              description: docString,
              scenarioNames: [],
              scenarioCount: 0,
            };

            state!.patterns.push(
              createPatternWithRules({ name: 'TestPattern', category: 'core', phase: 1 }, [rule])
            );
          }
        );

        When('decoding with BusinessRulesCodec in detailed mode', () => {
          runGenerator();
        });

        Then('the document contains exactly {int} tables', (_ctx: unknown, count: number) => {
          expect(state!.document).toBeDefined();
          const tables = findTables(state!.document!);
          expect(tables.length).toBe(count);
        });

        And('the first table has header {string}', (_ctx: unknown, header: string) => {
          const tables = findTables(state!.document!);
          expect(tables[0]?.columns).toContain(header);
        });

        And('the second table has header {string}', (_ctx: unknown, header: string) => {
          const tables = findTables(state!.document!);
          expect(tables[1]?.columns).toContain(header);
        });
      }
    );
  });

  // ===========================================================================
  // Rule 3: stripMarkdownTables helper function
  // ===========================================================================

  Rule('stripMarkdownTables removes table syntax from text', ({ RuleScenario }) => {
    RuleScenario('Strips single table from text', ({ Given, When, Then }) => {
      Given('text containing a markdown table:', (_ctx: unknown, docString: string) => {
        state!.inputText = docString;
      });

      When('stripMarkdownTables is called', () => {
        state!.strippedResult = stripMarkdownTables(state!.inputText!);
      });

      Then('the result is:', (_ctx: unknown, expected: string) => {
        expect(state!.strippedResult).toBe(expected.trim());
      });
    });

    RuleScenario('Strips multiple tables from text', ({ Given, When, Then }) => {
      Given('text containing two markdown tables', () => {
        state!.inputText = `Introduction text.

| A | B |
| --- | --- |
| 1 | 2 |

Middle text.

| X | Y |
| --- | --- |
| 3 | 4 |

Conclusion text.`;
      });

      When('stripMarkdownTables is called', () => {
        state!.strippedResult = stripMarkdownTables(state!.inputText!);
      });

      Then('the result contains no pipe characters at line starts', () => {
        const lines = state!.strippedResult!.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          expect(trimmed.startsWith('|') && trimmed.endsWith('|')).toBe(false);
        }
      });
    });

    RuleScenario('Preserves text without tables', ({ Given, When, Then }) => {
      Given('text without any markdown tables', () => {
        state!.inputText = `This is plain text.

It has multiple paragraphs.

But no tables.`;
      });

      When('stripMarkdownTables is called', () => {
        state!.strippedResult = stripMarkdownTables(state!.inputText!);
      });

      Then('the result is unchanged', () => {
        expect(state!.strippedResult).toBe(state!.inputText);
      });
    });
  });
});
