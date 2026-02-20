/**
 * Renderer Block Types Step Definitions
 *
 * BDD step definitions for testing block-level rendering:
 * document metadata, headings, paragraphs, tables, and lists.
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  type RenderScenarioState,
  initState,
  renderToMarkdown,
  heading,
  paragraph,
  separator,
  table,
  list,
  document,
  type ListItem,
  type DataTableRow,
} from '../../support/helpers/render-state.js';

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: RenderScenarioState | null = null;

// =============================================================================
// Feature: Universal Markdown Renderer - Block Types
// =============================================================================

const feature = await loadFeature('tests/features/behavior/render-blocks.feature');

describeFeature(feature, ({ Rule, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a renderer test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Document Structure
  // ===========================================================================

  Rule('Document metadata renders as frontmatter before sections', ({ RuleScenario }) => {
    RuleScenario('Render minimal document with title only', ({ Given, When, Then, And }) => {
      Given('a document with title {string}', (_ctx: unknown, title: string) => {
        state!.doc = document(title, []);
      });

      When('rendering to markdown', () => {
        state!.markdown = renderToMarkdown(state!.doc!);
      });

      Then('the output starts with {string}', (_ctx: unknown, expected: string) => {
        expect(state!.markdown.startsWith(expected)).toBe(true);
      });

      And('the output ends with a single newline', () => {
        expect(state!.markdown.endsWith('\n')).toBe(true);
        expect(state!.markdown.endsWith('\n\n')).toBe(false);
      });
    });

    RuleScenario('Render document with purpose', ({ Given, When, Then, And }) => {
      Given(
        'a document with title {string} and purpose {string}',
        (_ctx: unknown, title: string, purpose: string) => {
          state!.doc = document(title, [], { purpose });
        }
      );

      When('rendering to markdown', () => {
        state!.markdown = renderToMarkdown(state!.doc!);
      });

      Then('the output contains {string}', (_ctx: unknown, expected: string) => {
        expect(state!.markdown).toContain(expected);
      });

      And('the output contains {string}', (_ctx: unknown, expected: string) => {
        expect(state!.markdown).toContain(expected);
      });
    });

    RuleScenario('Render document with detail level', ({ Given, When, Then }) => {
      Given(
        'a document with title {string} and detail level {string}',
        (_ctx: unknown, title: string, detailLevel: string) => {
          state!.doc = document(title, [], { detailLevel });
        }
      );

      When('rendering to markdown', () => {
        state!.markdown = renderToMarkdown(state!.doc!);
      });

      Then('the output contains {string}', (_ctx: unknown, expected: string) => {
        expect(state!.markdown).toContain(expected);
      });
    });

    RuleScenario('Render document with purpose and detail level', ({ Given, When, Then, And }) => {
      Given('a document with:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const fields: Record<string, string> = {};
        for (const row of dataTable) {
          fields[row.field] = row.value;
        }
        state!.doc = document(fields.title, [], {
          purpose: fields.purpose,
          detailLevel: fields.detailLevel,
        });
      });

      When('rendering to markdown', () => {
        state!.markdown = renderToMarkdown(state!.doc!);
      });

      Then('the output contains {string}', (_ctx: unknown, expected: string) => {
        expect(state!.markdown).toContain(expected);
      });

      And('the output contains {string}', (_ctx: unknown, expected: string) => {
        expect(state!.markdown).toContain(expected);
      });
    });
  });

  // ===========================================================================
  // Heading Blocks
  // ===========================================================================

  Rule(
    'Headings render at correct markdown levels with clamping',
    ({ RuleScenario, RuleScenarioOutline }) => {
      RuleScenarioOutline(
        'Render headings at different levels',
        ({ Given, When, Then }, variables: { level: string; text: string; expected: string }) => {
          Given('a document with heading level {string} and text {string}', () => {
            const level = parseInt(variables.level) as 1 | 2 | 3 | 4 | 5 | 6;
            state!.doc = document('Doc', [heading(level, variables.text)]);
          });

          When('rendering to markdown', () => {
            state!.markdown = renderToMarkdown(state!.doc!);
          });

          Then('the output contains {string}', () => {
            expect(state!.markdown).toContain(variables.expected);
          });
        }
      );

      RuleScenario('Clamp heading level 0 to 1', ({ Given, When, Then, And }) => {
        Given(
          'a document with a heading at level {int} with text {string}',
          (_ctx: unknown, level: number, text: string) => {
            // Create heading with level 0 (which will be clamped)
            state!.doc = document('Doc', [{ type: 'heading', level, text }]);
          }
        );

        When('rendering to markdown', () => {
          state!.markdown = renderToMarkdown(state!.doc!);
        });

        Then('the output contains {string}', (_ctx: unknown, expected: string) => {
          expect(state!.markdown).toContain(expected);
        });

        And('the output does not contain {string}', (_ctx: unknown, notExpected: string) => {
          expect(state!.markdown).not.toContain(notExpected);
        });
      });

      RuleScenario('Clamp heading level 7 to 6', ({ Given, When, Then, And }) => {
        Given(
          'a document with a heading at level {int} with text {string}',
          (_ctx: unknown, level: number, text: string) => {
            state!.doc = document('Doc', [{ type: 'heading', level, text }]);
          }
        );

        When('rendering to markdown', () => {
          state!.markdown = renderToMarkdown(state!.doc!);
        });

        Then('the output contains {string}', (_ctx: unknown, expected: string) => {
          expect(state!.markdown).toContain(expected);
        });

        And('the output does not contain {string}', (_ctx: unknown, notExpected: string) => {
          expect(state!.markdown).not.toContain(notExpected);
        });
      });
    }
  );

  // ===========================================================================
  // Paragraph and Separator Blocks
  // ===========================================================================

  Rule(
    'Paragraphs and separators render as plain text and horizontal rules',
    ({ RuleScenario }) => {
      RuleScenario('Render paragraph', ({ Given, When, Then }) => {
        Given('a document with a paragraph {string}', (_ctx: unknown, text: string) => {
          state!.doc = document('Doc', [paragraph(text)]);
        });

        When('rendering to markdown', () => {
          state!.markdown = renderToMarkdown(state!.doc!);
        });

        Then('the output contains {string}', (_ctx: unknown, expected: string) => {
          expect(state!.markdown).toContain(expected);
        });
      });

      RuleScenario('Render paragraph with special characters', ({ Given, When, Then }) => {
        Given('a document with a paragraph {string}', (_ctx: unknown, text: string) => {
          state!.doc = document('Doc', [paragraph(text)]);
        });

        When('rendering to markdown', () => {
          state!.markdown = renderToMarkdown(state!.doc!);
        });

        Then('the output contains {string}', (_ctx: unknown, expected: string) => {
          expect(state!.markdown).toContain(expected);
        });
      });

      RuleScenario('Render separator', ({ Given, When, Then }) => {
        Given('a document with a separator', () => {
          state!.doc = document('Doc', [separator()]);
        });

        When('rendering to markdown', () => {
          state!.markdown = renderToMarkdown(state!.doc!);
        });

        Then('the output contains {string}', (_ctx: unknown, expected: string) => {
          expect(state!.markdown).toContain(expected);
        });
      });
    }
  );

  // ===========================================================================
  // Table Blocks
  // ===========================================================================

  Rule('Tables render with headers, alignment, and cell escaping', ({ RuleScenario }) => {
    RuleScenario('Render basic table', ({ Given, When, Then }) => {
      Given('a document with a table:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const columns = Object.keys(dataTable[0]);
        const rows = dataTable.map((row) => columns.map((col) => row[col]));
        state!.doc = document('Doc', [table(columns, rows)]);
      });

      When('rendering to markdown', () => {
        state!.markdown = renderToMarkdown(state!.doc!);
      });

      Then('the output contains the table:', (_ctx: unknown, docString: string) => {
        // Each line of the expected table should appear in the output
        for (const line of docString.trim().split('\n')) {
          expect(state!.markdown).toContain(line.trim());
        }
      });
    });

    RuleScenario('Render table with alignment', ({ Given, When, Then }) => {
      Given(
        'a document with a table with alignments:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          const columns: string[] = [];
          const alignments: Array<'left' | 'center' | 'right'> = [];

          for (const row of dataTable) {
            columns.push(row.Column);
            alignments.push(row.Alignment as 'left' | 'center' | 'right');
          }

          state!.doc = document('Doc', [table(columns, [], alignments)]);
        }
      );

      When('rendering to markdown', () => {
        state!.markdown = renderToMarkdown(state!.doc!);
      });

      Then('the output contains {string}', (_ctx: unknown, expected: string) => {
        expect(state!.markdown).toContain(expected);
      });
    });

    RuleScenario('Render empty table (no columns)', ({ Given, When, Then }) => {
      Given('a document with a table with no columns', () => {
        state!.doc = document('Doc', [table([], [])]);
      });

      When('rendering to markdown', () => {
        state!.markdown = renderToMarkdown(state!.doc!);
      });

      Then('the table is not rendered', () => {
        // Empty table should not produce any table markdown
        expect(state!.markdown).not.toContain('|');
      });
    });

    RuleScenario('Render table with pipe character in cell', ({ Given, When, Then }) => {
      Given('a document with a table containing "|" in a cell', () => {
        state!.doc = document('Doc', [table(['Value'], [['a|b']])]);
      });

      When('rendering to markdown', () => {
        state!.markdown = renderToMarkdown(state!.doc!);
      });

      Then('the output contains {string}', (_ctx: unknown, expected: string) => {
        expect(state!.markdown).toContain(expected);
      });
    });

    RuleScenario('Render table with newline in cell', ({ Given, When, Then }) => {
      Given('a document with a table containing newline in a cell', () => {
        state!.doc = document('Doc', [table(['Value'], [['line1\nline2']])]);
      });

      When('rendering to markdown', () => {
        state!.markdown = renderToMarkdown(state!.doc!);
      });

      Then('the output contains {string}', (_ctx: unknown, expected: string) => {
        expect(state!.markdown).toContain(expected);
      });
    });

    RuleScenario(
      'Render table with short row (fewer cells than columns)',
      ({ Given, When, Then }) => {
        Given('a document with a table where a row has fewer cells than columns', () => {
          state!.doc = document('Doc', [table(['A', 'B', 'C'], [['only one']])]);
        });

        When('rendering to markdown', () => {
          state!.markdown = renderToMarkdown(state!.doc!);
        });

        Then('the row is padded with empty cells', () => {
          // Should have 3 columns worth of separators
          const lines = state!.markdown.split('\n');
          const dataRow = lines.find((l) => l.includes('only one'));
          expect(dataRow).toBeDefined();
          // Count pipe separators (should be 4 for 3 cells: | a | b | c |)
          const pipeCount = (dataRow?.match(/\|/g) ?? []).length;
          expect(pipeCount).toBe(4);
        });
      }
    );
  });

  // ===========================================================================
  // List Blocks
  // ===========================================================================

  Rule('Lists render in unordered, ordered, checkbox, and nested formats', ({ RuleScenario }) => {
    RuleScenario('Render unordered list', ({ Given, When, Then }) => {
      Given('a document with an unordered list:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const items = dataTable.map((row) => row.item);
        state!.doc = document('Doc', [list(items, false)]);
      });

      When('rendering to markdown', () => {
        state!.markdown = renderToMarkdown(state!.doc!);
      });

      Then('the output contains all of:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          expect(state!.markdown).toContain(row.text);
        }
      });
    });

    RuleScenario('Render ordered list', ({ Given, When, Then }) => {
      Given('a document with an ordered list:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const items = dataTable.map((row) => row.item);
        state!.doc = document('Doc', [list(items, true)]);
      });

      When('rendering to markdown', () => {
        state!.markdown = renderToMarkdown(state!.doc!);
      });

      Then('the output contains all of:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          expect(state!.markdown).toContain(row.text);
        }
      });
    });

    RuleScenario('Render checkbox list with checked items', ({ Given, When, Then }) => {
      Given('a document with a checkbox list:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const items: ListItem[] = dataTable.map((row) => ({
          text: row.text,
          checked: row.checked === 'true',
        }));
        state!.doc = document('Doc', [list(items, false)]);
      });

      When('rendering to markdown', () => {
        state!.markdown = renderToMarkdown(state!.doc!);
      });

      Then('the output contains all of:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          expect(state!.markdown).toContain(row.text);
        }
      });
    });

    RuleScenario('Render nested list', ({ Given, When, Then }) => {
      Given('a document with a nested list:', () => {
        const items: ListItem[] = [
          {
            text: 'Parent 1',
            children: [{ text: 'Child 1a' }, { text: 'Child 1b' }],
          },
          'Parent 2',
        ];
        state!.doc = document('Doc', [list(items, false)]);
      });

      When('rendering to markdown', () => {
        state!.markdown = renderToMarkdown(state!.doc!);
      });

      Then('the output contains all of:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          expect(state!.markdown).toContain(row.text);
        }
      });
    });
  });
});
