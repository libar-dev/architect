/**
 * Renderer Output Formats Step Definitions
 *
 * BDD step definitions for testing output-level rendering:
 * code blocks, collapsible, link-out, multi-file, complex documents, and modular claude-md.
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  type RenderScenarioState,
  type RenderableDocument,
  initState,
  renderToMarkdown,
  renderToClaudeMdModule,
  renderDocumentWithFiles,
  heading,
  paragraph,
  separator,
  table,
  code,
  mermaid,
  collapsible,
  linkOut,
  document,
  type DataTableRow,
} from '../../support/helpers/render-state.js';

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: RenderScenarioState | null = null;

// =============================================================================
// Feature: Universal Markdown Renderer - Output Formats
// =============================================================================

const feature = await loadFeature('tests/features/behavior/render-output.feature');

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
        const tableMarker = state!.markdown.indexOf('| A   | B   |');

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
  // Claude MD Module Renderer
  // ===========================================================================

  Rule(
    'Claude MD module renderer produces modular-claude-md compatible output',
    ({ RuleScenario }) => {
      RuleScenario('Module title renders as H3', ({ Given, When, Then, And }) => {
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

        When('rendering to claude md module', () => {
          state!.claudeMdModule = renderToClaudeMdModule(state!.doc!);
        });

        Then('the claude md module output contains {string}', (_ctx: unknown, expected: string) => {
          expect(state!.claudeMdModule).toContain(expected);
        });

        And(
          'the claude md module output does not contain {string}',
          (_ctx: unknown, notExpected: string) => {
            // Check that the exact H1 form doesn't appear (but H3 does)
            // Use line-start matching to avoid substring false positives
            const lines = state!.claudeMdModule.split('\n');
            const hasExact = lines.some((line) => line.trim() === notExpected.trim());
            expect(hasExact).toBe(false);
          }
        );
      });

      RuleScenario('Module section headings offset by plus 2', ({ Given, When, Then, And }) => {
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

        When('rendering to claude md module', () => {
          state!.claudeMdModule = renderToClaudeMdModule(state!.doc!);
        });

        Then('the claude md module output contains {string}', (_ctx: unknown, expected: string) => {
          expect(state!.claudeMdModule).toContain(expected);
        });
      });

      RuleScenario('Module frontmatter is omitted', ({ Given, When, Then, And }) => {
        Given('a document with:', (_ctx: unknown, dataTable: DataTableRow[]) => {
          const fields: Record<string, string> = {};
          for (const row of dataTable) {
            fields[row.field] = row.value;
          }
          state!.doc = document(fields.title, [], {
            purpose: fields.purpose,
          });
        });

        When('rendering to claude md module', () => {
          state!.claudeMdModule = renderToClaudeMdModule(state!.doc!);
        });

        Then(
          'the claude md module output does not contain {string}',
          (_ctx: unknown, notExpected: string) => {
            expect(state!.claudeMdModule).not.toContain(notExpected);
          }
        );

        And(
          'the claude md module output does not contain {string}',
          (_ctx: unknown, notExpected: string) => {
            expect(state!.claudeMdModule).not.toContain(notExpected);
          }
        );
      });

      RuleScenario('Module mermaid blocks are omitted', ({ Given, When, Then, And }) => {
        Given('a document with title {string}', (_ctx: unknown, title: string) => {
          state!.doc = document(title, []);
        });

        And('the document has a mermaid block:', (_ctx: unknown, docString: string) => {
          state!.doc = document(state!.doc!.title, [mermaid(docString.trim())]);
        });

        When('rendering to claude md module', () => {
          state!.claudeMdModule = renderToClaudeMdModule(state!.doc!);
        });

        Then(
          'the claude md module output does not contain any of:',
          (_ctx: unknown, dataTable: DataTableRow[]) => {
            for (const row of dataTable) {
              expect(state!.claudeMdModule).not.toContain(row.text);
            }
          }
        );
      });

      RuleScenario('Module link-out blocks are omitted', ({ Given, When, Then, And }) => {
        Given('a document with title {string}', (_ctx: unknown, title: string) => {
          state!.doc = document(title, []);
        });

        And(
          'the document has a link-out {string} to {string}',
          (_ctx: unknown, text: string, path: string) => {
            state!.doc = document(state!.doc!.title, [linkOut(text, path)]);
          }
        );

        When('rendering to claude md module', () => {
          state!.claudeMdModule = renderToClaudeMdModule(state!.doc!);
        });

        Then(
          'the claude md module output does not contain {string}',
          (_ctx: unknown, notExpected: string) => {
            expect(state!.claudeMdModule).not.toContain(notExpected);
          }
        );

        And(
          'the claude md module output does not contain {string}',
          (_ctx: unknown, notExpected: string) => {
            expect(state!.claudeMdModule).not.toContain(notExpected);
          }
        );
      });

      RuleScenario(
        'Module collapsible blocks flatten to headings',
        ({ Given, When, Then, And }) => {
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

          When('rendering to claude md module', () => {
            state!.claudeMdModule = renderToClaudeMdModule(state!.doc!);
          });

          Then(
            'the claude md module output contains {string}',
            (_ctx: unknown, expected: string) => {
              expect(state!.claudeMdModule).toContain(expected);
            }
          );

          And(
            'the claude md module output contains {string}',
            (_ctx: unknown, expected: string) => {
              expect(state!.claudeMdModule).toContain(expected);
            }
          );

          And(
            'the claude md module output does not contain {string}',
            (_ctx: unknown, notExpected: string) => {
              expect(state!.claudeMdModule).not.toContain(notExpected);
            }
          );
        }
      );

      RuleScenario('Module heading level clamped at H6', ({ Given, When, Then, And }) => {
        Given('a document with title {string}', (_ctx: unknown, title: string) => {
          state!.doc = document(title, []);
        });

        And(
          'the document has a heading at level {int} with text {string}',
          (_ctx: unknown, level: number, text: string) => {
            state!.doc = document(state!.doc!.title, [{ type: 'heading', level, text }]);
          }
        );

        When('rendering to claude md module', () => {
          state!.claudeMdModule = renderToClaudeMdModule(state!.doc!);
        });

        Then('the claude md module output contains {string}', (_ctx: unknown, expected: string) => {
          expect(state!.claudeMdModule).toContain(expected);
        });
      });
    }
  );
});
