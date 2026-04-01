/**
 * Step definitions for Process API CLI Reference Generation tests (Phase 43)
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { CLI_SCHEMA, type CLIOptionGroup, type CLISchema } from '../../../../src/cli/cli-schema.js';
import { createCliReferenceGenerator } from '../../../../src/generators/built-in/cli-reference-generator.js';
import type { GeneratorContext } from '../../../../src/generators/types.js';

// ============================================================================
// State
// ============================================================================

interface TestState {
  generatedContent: string | null;
}

let state: TestState | null = null;

// ============================================================================
// Helpers
// ============================================================================

function getContent(): string {
  if (state?.generatedContent === null || state?.generatedContent === undefined) {
    throw new Error('Generated content not available — run generator first');
  }
  return state.generatedContent;
}

function createMockGeneratorContext(): GeneratorContext {
  return {
    baseDir: process.cwd(),
    outputDir: 'docs-live',
    registry: {} as GeneratorContext['registry'],
    patternGraph: {} as GeneratorContext['patternGraph'],
  } as GeneratorContext;
}

function extractTableRows(content: string, afterHeading: string): string[] {
  const lines = content.split('\n');
  let inSection = false;
  const rows: string[] = [];

  for (const line of lines) {
    if (line.startsWith('## ') && line.includes(afterHeading)) {
      inSection = true;
      continue;
    }
    if (inSection && line.startsWith('## ')) {
      break;
    }
    if (inSection && line.startsWith('| ') && !line.startsWith('| ---')) {
      rows.push(line);
    }
  }

  // First row is header, rest are data
  return rows.slice(1);
}

function schemaFlagsFor(
  group: 'globalOptions' | 'outputModifiers' | 'listFilters' | 'sessionOptions'
): string[] {
  return CLI_SCHEMA[group].options.map((opt) => {
    // Extract bare flag: '--input <pattern>' → '--input'
    const match = /^(--[\w-]+)/.exec(opt.flag);
    return match !== null ? match[1] : opt.flag;
  });
}

// ============================================================================
// Feature
// ============================================================================

const feature = await loadFeature('tests/features/behavior/cli/cli-reference.feature');

describeFeature(feature, ({ AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: Generated reference file contains all three table sections
  // ──────────────────────────────────────────────────────────────────────

  Rule('Generated reference file contains all three table sections', ({ RuleScenario }) => {
    RuleScenario('Generated file contains Global Options table', ({ Given, When, Then, And }) => {
      Given('the CLI schema is loaded', () => {
        state = { generatedContent: null };
        expect(CLI_SCHEMA).toBeDefined();
      });

      When('the CliReferenceGenerator produces output', async () => {
        const generator = createCliReferenceGenerator();
        const output = await generator.generate([], createMockGeneratorContext());
        state!.generatedContent = output.files[0].content;
      });

      Then('the output contains a {string} heading', (_ctx: unknown, heading: string) => {
        expect(getContent()).toContain(`## ${heading}`);
      });

      And(
        'the output contains a table with columns {string}, {string}, {string}, {string}',
        (_ctx: unknown, c1: string, c2: string, c3: string, c4: string) => {
          const content = getContent();
          // Check column names exist in header (padding-tolerant — no trailing ` |`)
          expect(content).toContain(`| ${c1}`);
          expect(content).toContain(`| ${c2}`);
          expect(content).toContain(`| ${c3}`);
          expect(content).toContain(`| ${c4}`);
        }
      );

      And('the table has {int} rows for global options', (_ctx: unknown, expectedCount: number) => {
        const rows = extractTableRows(getContent(), 'Global Options');
        expect(rows).toHaveLength(expectedCount);
      });
    });

    RuleScenario('Generated file contains Output Modifiers table', ({ Given, When, Then, And }) => {
      Given('the CLI schema is loaded', () => {
        state = { generatedContent: null };
      });

      When('the CliReferenceGenerator produces output', async () => {
        const generator = createCliReferenceGenerator();
        const output = await generator.generate([], createMockGeneratorContext());
        state!.generatedContent = output.files[0].content;
      });

      Then('the output contains an {string} heading', (_ctx: unknown, heading: string) => {
        expect(getContent()).toContain(`## ${heading}`);
      });

      And(
        'the output contains a table with columns {string}, {string}',
        (_ctx: unknown, c1: string, c2: string) => {
          const content = getContent();
          expect(content).toContain(`| ${c1}`);
          expect(content).toContain(`| ${c2}`);
        }
      );

      And(
        'the table has {int} rows for output modifiers',
        (_ctx: unknown, expectedCount: number) => {
          const rows = extractTableRows(getContent(), 'Output Modifiers');
          expect(rows).toHaveLength(expectedCount);
        }
      );
    });

    RuleScenario('Generated file contains List Filters table', ({ Given, When, Then, And }) => {
      Given('the CLI schema is loaded', () => {
        state = { generatedContent: null };
      });

      When('the CliReferenceGenerator produces output', async () => {
        const generator = createCliReferenceGenerator();
        const output = await generator.generate([], createMockGeneratorContext());
        state!.generatedContent = output.files[0].content;
      });

      Then('the output contains a {string} heading', (_ctx: unknown, heading: string) => {
        expect(getContent()).toContain(`## ${heading}`);
      });

      And(
        'the output contains a table with columns {string}, {string}',
        (_ctx: unknown, c1: string, c2: string) => {
          const content = getContent();
          expect(content).toContain(`| ${c1}`);
          expect(content).toContain(`| ${c2}`);
        }
      );

      And('the table has {int} rows for list filters', (_ctx: unknown, expectedCount: number) => {
        const rows = extractTableRows(getContent(), 'List Filters');
        expect(rows).toHaveLength(expectedCount);
      });
    });

    RuleScenario('Generated file includes inter-table prose', ({ Given, When, Then }) => {
      Given('the CLI schema is loaded', () => {
        state = { generatedContent: null };
      });

      When('the CliReferenceGenerator produces output', async () => {
        const generator = createCliReferenceGenerator();
        const output = await generator.generate([], createMockGeneratorContext());
        state!.generatedContent = output.files[0].content;
      });

      Then(
        'the output contains the following prose fragments:',
        (_ctx: unknown, table: Array<{ fragment: string }>) => {
          const content = getContent();
          for (const row of table) {
            expect(content).toContain(row.fragment);
          }
        }
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: CLI schema stays in sync with parser
  // ──────────────────────────────────────────────────────────────────────

  Rule('CLI schema stays in sync with parser', ({ RuleScenario }) => {
    RuleScenario('Schema covers all global option flags', ({ Given, Then }) => {
      Given('the CLI schema is loaded', () => {
        state = { generatedContent: null };
      });

      Then(
        'the schema global options include all expected flags:',
        (_ctx: unknown, table: Array<{ flag: string }>) => {
          const flags = schemaFlagsFor('globalOptions');
          for (const row of table) {
            expect(flags).toContain(row.flag);
          }
        }
      );
    });

    RuleScenario('Schema covers all output modifier flags', ({ Given, Then }) => {
      Given('the CLI schema is loaded', () => {
        state = { generatedContent: null };
      });

      Then(
        'the schema output modifiers include all expected flags:',
        (_ctx: unknown, table: Array<{ flag: string }>) => {
          const flags = schemaFlagsFor('outputModifiers');
          for (const row of table) {
            expect(flags).toContain(row.flag);
          }
        }
      );
    });

    RuleScenario('Schema covers all list filter flags', ({ Given, Then }) => {
      Given('the CLI schema is loaded', () => {
        state = { generatedContent: null };
      });

      Then(
        'the schema list filters include all expected flags:',
        (_ctx: unknown, table: Array<{ flag: string }>) => {
          const flags = schemaFlagsFor('listFilters');
          for (const row of table) {
            expect(flags).toContain(row.flag);
          }
        }
      );
    });

    RuleScenario('Schema covers session option', ({ Given, Then }) => {
      Given('the CLI schema is loaded', () => {
        state = { generatedContent: null };
      });

      Then(
        'the schema session options include all expected flags:',
        (_ctx: unknown, table: Array<{ flag: string }>) => {
          const flags = schemaFlagsFor('sessionOptions');
          for (const row of table) {
            expect(flags).toContain(row.flag);
          }
        }
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Rule: showHelp output reflects CLI schema
  // ──────────────────────────────────────────────────────────────────────

  Rule('showHelp output reflects CLI schema', ({ RuleScenario }) => {
    RuleScenario('Help text includes schema-defined options', ({ Given, Then }) => {
      Given('the CLI schema is loaded', () => {
        state = { generatedContent: null };
      });

      Then(
        'all schema groups contain at least one option:',
        (_ctx: unknown, table: Array<{ group: string }>) => {
          for (const row of table) {
            const group = row.group as keyof CLISchema;
            const section = CLI_SCHEMA[group] as CLIOptionGroup;
            expect(section.options.length).toBeGreaterThan(0);
          }
        }
      );
    });
  });
});
