/**
 * Universal Renderer Step Definitions
 *
 * BDD step definitions for testing the universal markdown renderer.
 * Tests block rendering, edge cases, and multi-file output.
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  renderToMarkdown,
  renderToClaudeContext,
  renderDocumentWithFiles,
  type OutputFile,
} from '../../../src/renderable/render.js';
import {
  type RenderableDocument,
  type SectionBlock,
  type ListItem,
  heading,
  paragraph,
  separator,
  table,
  list,
  code,
  mermaid,
  collapsible,
  linkOut,
  document,
} from '../../../src/renderable/schema.js';
import type { DataTableRow } from '../../support/world.js';

// =============================================================================
// State Types
// =============================================================================

interface RenderScenarioState {
  // Document building
  doc: RenderableDocument | null;
  sections: SectionBlock[];

  // Results
  markdown: string;
  claudeContext: string;
  outputFiles: OutputFile[];

  // Collapsible builder state
  collapsibleSummary: string;
  collapsibleContent: SectionBlock[];
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: RenderScenarioState | null = null;

function initState(): RenderScenarioState {
  return {
    doc: null,
    sections: [],
    markdown: '',
    claudeContext: '',
    outputFiles: [],
    collapsibleSummary: '',
    collapsibleContent: [],
  };
}

// =============================================================================
// Feature: Universal Markdown Renderer
// =============================================================================

const feature = await loadFeature('tests/features/behavior/render.feature');

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

  // ===========================================================================
  // Code and Mermaid Blocks
  // ===========================================================================

  Rule('Code blocks and mermaid diagrams render with fenced syntax', ({ RuleScenario }) => {
    RuleScenario('Render code block with language', ({ Given, When, Then }) => {
      Given(
        'a document with a code block in {string}:',
        (_ctx: unknown, language: string, docString: string) => {
          state!.doc = document('Doc', [code(docString.trim(), language)]);
        }
      );

      When('rendering to markdown', () => {
        state!.markdown = renderToMarkdown(state!.doc!);
      });

      Then('the output contains all of:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          expect(state!.markdown).toContain(row.text);
        }
      });
    });

    RuleScenario('Render code block without language', ({ Given, When, Then }) => {
      Given(
        'a document with a code block without language:',
        (_ctx: unknown, docString: string) => {
          state!.doc = document('Doc', [code(docString.trim())]);
        }
      );

      When('rendering to markdown', () => {
        state!.markdown = renderToMarkdown(state!.doc!);
      });

      Then('the output contains all of:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          expect(state!.markdown).toContain(row.text);
        }
      });
    });

    RuleScenario('Render mermaid diagram', ({ Given, When, Then }) => {
      Given('a document with a mermaid block:', (_ctx: unknown, docString: string) => {
        state!.doc = document('Doc', [mermaid(docString.trim())]);
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

  // ===========================================================================
  // Collapsible Blocks
  // ===========================================================================

  Rule('Collapsible blocks render as HTML details elements', ({ RuleScenario }) => {
    RuleScenario('Render collapsible block', ({ Given, When, Then, And }) => {
      Given(
        'a document with a collapsible block with summary {string}',
        (_ctx: unknown, summary: string) => {
          state!.collapsibleSummary = summary;
          state!.collapsibleContent = [];
        }
      );

      And('the collapsible contains a paragraph {string}', (_ctx: unknown, text: string) => {
        state!.collapsibleContent.push(paragraph(text));
        state!.doc = document('Doc', [
          collapsible(state!.collapsibleSummary, state!.collapsibleContent),
        ]);
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

    RuleScenario('Render collapsible with HTML entities in summary', ({ Given, When, Then }) => {
      Given(
        'a document with a collapsible block with summary {string}',
        (_ctx: unknown, summary: string) => {
          state!.doc = document('Doc', [collapsible(summary, [paragraph('content')])]);
        }
      );

      When('rendering to markdown', () => {
        state!.markdown = renderToMarkdown(state!.doc!);
      });

      Then('the output contains {string}', (_ctx: unknown, expected: string) => {
        expect(state!.markdown).toContain(expected);
      });
    });

    RuleScenario('Render nested collapsible content', ({ Given, When, Then, And }) => {
      Given('a document with a collapsible containing a table', () => {
        state!.doc = document('Doc', [collapsible('Expand', [table(['A', 'B'], [['1', '2']])])]);
      });

      When('rendering to markdown', () => {
        state!.markdown = renderToMarkdown(state!.doc!);
      });

      Then('the output contains {string}', (_ctx: unknown, expected: string) => {
        expect(state!.markdown).toContain(expected);
      });

      And('the output contains a table between details tags', () => {
        const detailsStart = state!.markdown.indexOf('<details>');
        const detailsEnd = state!.markdown.indexOf('</details>');
        const tableMarker = state!.markdown.indexOf('| A | B |');

        expect(tableMarker).toBeGreaterThan(detailsStart);
        expect(tableMarker).toBeLessThan(detailsEnd);
      });
    });
  });

  // ===========================================================================
  // Link-Out Blocks
  // ===========================================================================

  Rule('Link-out blocks render as markdown links with URL encoding', ({ RuleScenario }) => {
    RuleScenario('Render link-out block', ({ Given, When, Then }) => {
      Given(
        'a document with a link-out {string} to {string}',
        (_ctx: unknown, text: string, path: string) => {
          state!.doc = document('Doc', [linkOut(text, path)]);
        }
      );

      When('rendering to markdown', () => {
        state!.markdown = renderToMarkdown(state!.doc!);
      });

      Then('the output contains {string}', (_ctx: unknown, expected: string) => {
        expect(state!.markdown).toContain(expected);
      });
    });

    RuleScenario('Render link-out with spaces in path', ({ Given, When, Then }) => {
      Given(
        'a document with a link-out {string} to {string}',
        (_ctx: unknown, text: string, path: string) => {
          state!.doc = document('Doc', [linkOut(text, path)]);
        }
      );

      When('rendering to markdown', () => {
        state!.markdown = renderToMarkdown(state!.doc!);
      });

      Then('the output contains {string}', (_ctx: unknown, expected: string) => {
        expect(state!.markdown).toContain(expected);
      });
    });
  });

  // ===========================================================================
  // Multi-File Output
  // ===========================================================================

  Rule('Multi-file documents produce correct output file collections', ({ RuleScenario }) => {
    RuleScenario('Render document with additional files', ({ Given, When, Then, And }) => {
      Given(
        'a document with title {string} and {int} additional files',
        (_ctx: unknown, title: string, count: number) => {
          const additionalFiles: Record<string, RenderableDocument> = {};
          for (let i = 1; i <= count; i++) {
            additionalFiles[`detail-${i}.md`] = document(`Detail ${i}`, []);
          }
          state!.doc = document(title, [], { additionalFiles });
        }
      );

      When('rendering with files to {string}', (_ctx: unknown, basePath: string) => {
        state!.outputFiles = renderDocumentWithFiles(state!.doc!, basePath);
      });

      Then('{int} output files are returned', (_ctx: unknown, count: number) => {
        expect(state!.outputFiles.length).toBe(count);
      });

      And('the first output file path is {string}', (_ctx: unknown, path: string) => {
        expect(state!.outputFiles[0].path).toBe(path);
      });
    });

    RuleScenario('Render document without additional files', ({ Given, When, Then }) => {
      Given(
        'a document with title {string} and no additional files',
        (_ctx: unknown, title: string) => {
          state!.doc = document(title, []);
        }
      );

      When('rendering with files to {string}', (_ctx: unknown, basePath: string) => {
        state!.outputFiles = renderDocumentWithFiles(state!.doc!, basePath);
      });

      Then('{int} output file is returned', (_ctx: unknown, count: number) => {
        expect(state!.outputFiles.length).toBe(count);
      });
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  Rule('Complex documents render all block types in sequence', ({ RuleScenario }) => {
    RuleScenario(
      'Render complex document with multiple block types',
      ({ Given, When, Then, And }) => {
        Given('a document with:', (_ctx: unknown, dataTable: DataTableRow[]) => {
          const fields: Record<string, string> = {};
          for (const row of dataTable) {
            fields[row.field] = row.value;
          }
          state!.doc = document(fields.title, [], {
            purpose: fields.purpose,
          });
          state!.sections = [];
        });

        And('the document has sections:', (_ctx: unknown, dataTable: DataTableRow[]) => {
          for (const row of dataTable) {
            switch (row.type) {
              case 'heading':
                state!.sections.push(heading(2, row.content));
                break;
              case 'paragraph':
                state!.sections.push(paragraph(row.content));
                break;
              case 'separator':
                state!.sections.push(separator());
                break;
            }
          }
          state!.doc = document(state!.doc!.title, state!.sections, {
            purpose: state!.doc!.purpose,
          });
        });

        When('rendering to markdown', () => {
          state!.markdown = renderToMarkdown(state!.doc!);
        });

        Then('the output contains all of:', (_ctx: unknown, dataTable: DataTableRow[]) => {
          for (const row of dataTable) {
            expect(state!.markdown).toContain(row.text);
          }
        });
      }
    );
  });

  // ===========================================================================
  // Claude Context Renderer
  // ===========================================================================

  Rule('Claude context renderer produces compact AI-optimized output', ({ RuleScenario }) => {
    RuleScenario(
      'Claude context renders title and headings as section markers',
      ({ Given, When, Then, And }) => {
        Given('a document with title {string}', (_ctx: unknown, title: string) => {
          state!.sections = [];
          state!.doc = document(title, []);
        });

        And('the document has sections:', (_ctx: unknown, dataTable: DataTableRow[]) => {
          for (const row of dataTable) {
            switch (row.type) {
              case 'heading':
                state!.sections.push(heading(2, row.content));
                break;
              case 'paragraph':
                state!.sections.push(paragraph(row.content));
                break;
              case 'separator':
                state!.sections.push(separator());
                break;
            }
          }
          state!.doc = document(state!.doc!.title, state!.sections);
        });

        When('rendering to claude context', () => {
          state!.claudeContext = renderToClaudeContext(state!.doc!);
        });

        Then('the claude context output contains {string}', (_ctx: unknown, expected: string) => {
          expect(state!.claudeContext).toContain(expected);
        });

        And('the claude context output contains {string}', (_ctx: unknown, expected: string) => {
          expect(state!.claudeContext).toContain(expected);
        });

        And(
          'the claude context output does not contain {string}',
          (_ctx: unknown, notExpected: string) => {
            expect(state!.claudeContext).not.toContain(notExpected);
          }
        );
      }
    );

    RuleScenario(
      'Claude context renders sub-headings with different markers',
      ({ Given, When, Then, And }) => {
        Given('a document with title {string}', (_ctx: unknown, title: string) => {
          state!.doc = document(title, []);
        });

        And(
          'the document has a heading at level {int} with text {string}',
          (_ctx: unknown, level: number, text: string) => {
            state!.doc = document(state!.doc!.title, [{ type: 'heading', level, text }]);
          }
        );

        When('rendering to claude context', () => {
          state!.claudeContext = renderToClaudeContext(state!.doc!);
        });

        Then('the claude context output contains {string}', (_ctx: unknown, expected: string) => {
          expect(state!.claudeContext).toContain(expected);
        });

        And(
          'the claude context output does not contain {string}',
          (_ctx: unknown, notExpected: string) => {
            expect(state!.claudeContext).not.toContain(notExpected);
          }
        );
      }
    );

    RuleScenario('Claude context omits mermaid blocks', ({ Given, When, Then, And }) => {
      Given('a document with title {string}', (_ctx: unknown, title: string) => {
        state!.doc = document(title, []);
      });

      And('the document has a mermaid block:', (_ctx: unknown, docString: string) => {
        state!.doc = document(state!.doc!.title, [mermaid(docString.trim())]);
      });

      When('rendering to claude context', () => {
        state!.claudeContext = renderToClaudeContext(state!.doc!);
      });

      Then(
        'the claude context output does not contain any of:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          for (const row of dataTable) {
            expect(state!.claudeContext).not.toContain(row.text);
          }
        }
      );
    });

    RuleScenario('Claude context flattens collapsible blocks', ({ Given, When, Then, And }) => {
      Given('a document with title {string}', (_ctx: unknown, title: string) => {
        state!.doc = document(title, []);
      });

      And('a collapsible block with summary {string}', (_ctx: unknown, summary: string) => {
        state!.collapsibleSummary = summary;
        state!.collapsibleContent = [];
      });

      And('the collapsible contains a paragraph {string}', (_ctx: unknown, text: string) => {
        state!.collapsibleContent.push(paragraph(text));
        state!.doc = document(state!.doc!.title, [
          collapsible(state!.collapsibleSummary, state!.collapsibleContent),
        ]);
      });

      When('rendering to claude context', () => {
        state!.claudeContext = renderToClaudeContext(state!.doc!);
      });

      Then(
        'the claude context output contains all of:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          for (const row of dataTable) {
            expect(state!.claudeContext).toContain(row.text);
          }
        }
      );

      And(
        'the claude context output does not contain any of:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          for (const row of dataTable) {
            expect(state!.claudeContext).not.toContain(row.text);
          }
        }
      );
    });

    RuleScenario('Claude context renders link-out as plain text', ({ Given, When, Then, And }) => {
      Given('a document with title {string}', (_ctx: unknown, title: string) => {
        state!.doc = document(title, []);
      });

      And(
        'the document has a link-out {string} to {string}',
        (_ctx: unknown, text: string, path: string) => {
          state!.doc = document(state!.doc!.title, [linkOut(text, path)]);
        }
      );

      When('rendering to claude context', () => {
        state!.claudeContext = renderToClaudeContext(state!.doc!);
      });

      Then('the claude context output contains {string}', (_ctx: unknown, expected: string) => {
        expect(state!.claudeContext).toContain(expected);
      });

      And(
        'the claude context output does not contain {string}',
        (_ctx: unknown, notExpected: string) => {
          expect(state!.claudeContext).not.toContain(notExpected);
        }
      );
    });

    RuleScenario('Claude context omits separator tokens', ({ Given, When, Then, And }) => {
      Given('a document with title {string}', (_ctx: unknown, title: string) => {
        state!.sections = [];
        state!.doc = document(title, []);
      });

      And('the document has sections:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          switch (row.type) {
            case 'heading':
              state!.sections.push(heading(2, row.content));
              break;
            case 'paragraph':
              state!.sections.push(paragraph(row.content));
              break;
            case 'separator':
              state!.sections.push(separator());
              break;
          }
        }
        state!.doc = document(state!.doc!.title, state!.sections);
      });

      When('rendering to claude context', () => {
        state!.claudeContext = renderToClaudeContext(state!.doc!);
      });

      Then(
        'the claude context output contains all of:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          for (const row of dataTable) {
            expect(state!.claudeContext).toContain(row.text);
          }
        }
      );

      And(
        'the claude context output does not contain {string}',
        (_ctx: unknown, notExpected: string) => {
          expect(state!.claudeContext).not.toContain(notExpected);
        }
      );
    });

    RuleScenario(
      'Claude context produces fewer characters than markdown',
      ({ Given, When, Then, And }) => {
        Given(
          'a document with title {string} and a mermaid block and collapsible',
          (_ctx: unknown, title: string) => {
            // Build a document with content that the Claude context renderer
            // omits (mermaid) or simplifies (collapsible, separator, link-out),
            // ensuring the output is genuinely shorter than markdown.
            state!.doc = document(title, [
              heading(2, 'Architecture'),
              paragraph('System overview and component relationships.'),
              mermaid(
                'graph TD\n  A[Scanner] --> B[Extractor]\n  B --> C[Transformer]\n  C --> D[Codec]'
              ),
              separator(),
              collapsible('Implementation Details', [
                paragraph('Detailed implementation notes that are hidden by default.'),
              ]),
              linkOut('See full documentation', 'docs/REFERENCE.md'),
            ]);
          }
        );

        When('rendering to markdown', () => {
          state!.markdown = renderToMarkdown(state!.doc!);
        });

        And('rendering to claude context', () => {
          state!.claudeContext = renderToClaudeContext(state!.doc!);
        });

        Then('the claude context output is shorter than the markdown output', () => {
          expect(state!.claudeContext.length).toBeLessThan(state!.markdown.length);
        });
      }
    );
  });
});
