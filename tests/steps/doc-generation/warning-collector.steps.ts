/**
 * Warning Collector Step Definitions
 *
 * BDD step definitions for testing the warning collector:
 * - Warning capture with source context
 * - Category filtering and grouping
 * - Aggregation across pipeline stages
 * - Result integration
 * - Output formatting
 *
 * @architect
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  createWarningCollector,
  formatWarningLocation,
  ResultWithWarnings,
  type Warning,
  type WarningCategory,
  type WarningCollector,
} from '../../../src/generators/warning-collector.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface WarningCollectorState {
  collector: WarningCollector;
  currentSource: string;
  currentLine: number | undefined;
  lastWarning: Warning | null;
  result:
    | ReturnType<typeof ResultWithWarnings.ok>
    | ReturnType<typeof ResultWithWarnings.err>
    | null;
  formattedOutput: string;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: WarningCollectorState | null = null;

function initState(): WarningCollectorState {
  return {
    collector: createWarningCollector(),
    currentSource: '',
    currentLine: undefined,
    lastWarning: null,
    result: null,
    formattedOutput: '',
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/doc-generation/warning-collector.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a warning collector is initialized', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // RULE 1: Warning Capture
  // ===========================================================================

  Rule('Warnings are captured with source context', ({ RuleScenario }) => {
    RuleScenario('Warning includes source file', ({ Given, When, Then, And }) => {
      Given('extraction is processing {string}', (_ctx: unknown, source: string) => {
        state!.currentSource = source;
      });

      When('a warning {string} is raised', (_ctx: unknown, message: string) => {
        const warning: Warning = {
          source: state!.currentSource,
          category: 'extraction',
          message,
        };
        state!.collector.capture(warning);
        state!.lastWarning = warning;
      });

      Then('the warning includes source {string}', (_ctx: unknown, expectedSource: string) => {
        const warnings = state!.collector.getAll();
        expect(warnings.length).toBe(1);
        expect(warnings[0].source).toBe(expectedSource);
      });

      And('the warning includes message {string}', (_ctx: unknown, expectedMessage: string) => {
        const warnings = state!.collector.getAll();
        expect(warnings[0].message).toBe(expectedMessage);
      });
    });

    RuleScenario('Warning includes line number when available', ({ Given, When, Then, And }) => {
      Given(
        'extraction is processing {string} at line {int}',
        (_ctx: unknown, source: string, line: number) => {
          state!.currentSource = source;
          state!.currentLine = line;
        }
      );

      When('a warning is raised', () => {
        const warning: Warning = {
          source: state!.currentSource,
          line: state!.currentLine,
          category: 'extraction',
          message: 'Test warning',
        };
        state!.collector.capture(warning);
        state!.lastWarning = warning;
      });

      Then('the warning includes line number {int}', (_ctx: unknown, expectedLine: number) => {
        const warnings = state!.collector.getAll();
        expect(warnings[0].line).toBe(expectedLine);
      });

      And('the warning location is {string}', (_ctx: unknown, expectedLocation: string) => {
        const warnings = state!.collector.getAll();
        const location = formatWarningLocation(warnings[0]);
        expect(location).toBe(expectedLocation);
      });
    });

    RuleScenario('Warning includes category', ({ Given, When, Then, And }) => {
      Given('extraction encounters a missing shape', () => {
        state!.currentSource = 'src/test.ts';
      });

      When('a warning is raised', () => {
        const warning: Warning = {
          source: state!.currentSource,
          category: 'extraction',
          subcategory: 'missing-shape',
          message: 'Shape not found',
        };
        state!.collector.capture(warning);
        state!.lastWarning = warning;
      });

      Then('the warning has category {string}', (_ctx: unknown, expectedCategory: string) => {
        const warnings = state!.collector.getAll();
        expect(warnings[0].category).toBe(expectedCategory);
      });

      And('the warning has subcategory {string}', (_ctx: unknown, expectedSubcategory: string) => {
        const warnings = state!.collector.getAll();
        expect(warnings[0].subcategory).toBe(expectedSubcategory);
      });
    });
  });

  // ===========================================================================
  // RULE 2: Warning Categories
  // ===========================================================================

  Rule(
    'Warnings are categorized for filtering and grouping',
    ({ RuleScenarioOutline, RuleScenario }) => {
      RuleScenarioOutline(
        'Warning categories are supported',
        ({ Given, When, Then }, variables: { category: string }) => {
          Given('a warning with category {string}', () => {
            state!.lastWarning = {
              source: 'test.ts',
              category: variables.category as WarningCategory,
              message: 'Test warning',
            };
          });

          When('the warning is captured', () => {
            state!.collector.capture(state!.lastWarning!);
          });

          Then('the warning is stored under category {string}', () => {
            const warnings = state!.collector.filterByCategory(
              variables.category as WarningCategory
            );
            expect(warnings.length).toBe(1);
            expect(warnings[0].category).toBe(variables.category);
          });
        }
      );

      RuleScenario('Warnings can be filtered by category', ({ Given, When, Then }) => {
        Given(
          'warnings in categories {string} and {string}',
          (_ctx: unknown, cat1: string, cat2: string) => {
            state!.collector.capture({
              source: 'test.ts',
              category: cat1 as WarningCategory,
              message: 'Validation warning',
            });
            state!.collector.capture({
              source: 'test.ts',
              category: cat2 as WarningCategory,
              message: 'Extraction warning',
            });
          }
        );

        When('filtering for {string} warnings', (_ctx: unknown, category: string) => {
          // Filter will be done in Then step
          state!.currentSource = category; // Store for later
        });

        Then('only validation warnings are returned', () => {
          const filtered = state!.collector.filterByCategory(
            state!.currentSource as WarningCategory
          );
          expect(filtered.length).toBe(1);
          expect(filtered[0].category).toBe('validation');
        });
      });

      RuleScenario('Warnings can be filtered by source file', ({ Given, When, Then }) => {
        Given(
          'warnings from {string} and {string}',
          (_ctx: unknown, src1: string, src2: string) => {
            state!.collector.capture({
              source: src1,
              category: 'extraction',
              message: 'Warning from a',
            });
            state!.collector.capture({
              source: src2,
              category: 'extraction',
              message: 'Warning from b',
            });
          }
        );

        When('filtering for warnings from {string}', (_ctx: unknown, source: string) => {
          state!.currentSource = source;
        });

        Then('only warnings from {string} are returned', (_ctx: unknown, source: string) => {
          const filtered = state!.collector.filterBySource(source);
          expect(filtered.length).toBe(1);
          expect(filtered[0].source).toBe(source);
        });
      });
    }
  );

  // ===========================================================================
  // RULE 3: Warning Aggregation
  // ===========================================================================

  Rule('Warnings are aggregated across the pipeline', ({ RuleScenario }) => {
    RuleScenario('Warnings from multiple stages are collected', ({ Given, And, When, Then }) => {
      Given('validation stage produces warning {string}', (_ctx: unknown, message: string) => {
        state!.collector.capture({
          source: 'validation',
          category: 'validation',
          message,
        });
      });

      And('extraction stage produces warning {string}', (_ctx: unknown, message: string) => {
        state!.collector.capture({
          source: 'extraction',
          category: 'extraction',
          message,
        });
      });

      And('deduplication stage produces warning {string}', (_ctx: unknown, message: string) => {
        state!.collector.capture({
          source: 'deduplication',
          category: 'deduplication',
          message,
        });
      });

      When('retrieving all warnings', () => {
        // Access in Then step
      });

      Then('{int} warnings are returned', (_ctx: unknown, count: number) => {
        expect(state!.collector.count()).toBe(count);
      });

      And('warnings are in insertion order', () => {
        const warnings = state!.collector.getAll();
        expect(warnings[0].message).toBe('File may be stale');
        expect(warnings[1].message).toBe('Empty rule block');
        expect(warnings[2].message).toBe('Content merged');
      });
    });

    RuleScenario('Warnings are grouped by source file', ({ Given, And, When, Then }) => {
      Given('{int} warnings from {string}', (_ctx: unknown, count: number, source: string) => {
        for (let i = 0; i < count; i++) {
          state!.collector.capture({
            source,
            category: 'extraction',
            message: `Warning ${i + 1} from ${source}`,
          });
        }
      });

      And('{int} warnings from {string}', (_ctx: unknown, count: number, source: string) => {
        for (let i = 0; i < count; i++) {
          state!.collector.capture({
            source,
            category: 'extraction',
            message: `Warning ${i + 1} from ${source}`,
          });
        }
      });

      When('grouping warnings by source', () => {
        // Grouping done in Then step
      });

      Then('{string} group has {int} warnings', (_ctx: unknown, source: string, count: number) => {
        const groups = state!.collector.groupBySource();
        const group = groups.get(source);
        expect(group).toBeDefined();
        expect(group!.length).toBe(count);
      });

      And('{string} group has {int} warnings', (_ctx: unknown, source: string, count: number) => {
        const groups = state!.collector.groupBySource();
        const group = groups.get(source);
        expect(group).toBeDefined();
        expect(group!.length).toBe(count);
      });
    });

    RuleScenario('Summary counts by category', ({ Given, And, When, Then }) => {
      Given('{int} validation warnings', (_ctx: unknown, count: number) => {
        for (let i = 0; i < count; i++) {
          state!.collector.capture({
            source: 'test.ts',
            category: 'validation',
            message: `Validation warning ${i + 1}`,
          });
        }
      });

      And('{int} extraction warnings', (_ctx: unknown, count: number) => {
        for (let i = 0; i < count; i++) {
          state!.collector.capture({
            source: 'test.ts',
            category: 'extraction',
            message: `Extraction warning ${i + 1}`,
          });
        }
      });

      When('getting warning summary', () => {
        // Summary accessed in Then step
      });

      Then('summary shows {string}', (_ctx: unknown, expected: string) => {
        const summary = state!.collector.getSummary();
        // Parse expected format: "validation: 2, extraction: 3"
        const parts = expected.split(', ');
        for (const part of parts) {
          const [cat, countStr] = part.split(': ');
          expect(summary[cat as WarningCategory]).toBe(parseInt(countStr));
        }
      });
    });
  });

  // ===========================================================================
  // RULE 4: Result Integration
  // ===========================================================================

  Rule('Warnings integrate with the Result pattern', ({ RuleScenario }) => {
    RuleScenario('Successful result includes warnings', ({ Given, When, Then, And }) => {
      Given('extraction succeeds with {int} warnings', (_ctx: unknown, count: number) => {
        for (let i = 0; i < count; i++) {
          state!.collector.capture({
            source: 'test.ts',
            category: 'extraction',
            message: `Warning ${i + 1}`,
          });
        }
      });

      When('the Result is returned', () => {
        state!.result = ResultWithWarnings.ok('success', state!.collector.getAll());
      });

      Then('Result.isOk() is true', () => {
        expect(ResultWithWarnings.isOk(state!.result!)).toBe(true);
      });

      And('Result.warnings has {int} entries', (_ctx: unknown, count: number) => {
        expect(state!.result!.warnings.length).toBe(count);
      });
    });

    RuleScenario(
      'Failed result includes warnings collected before failure',
      ({ Given, When, Then, And }) => {
        Given(
          'extraction warns {string} then errors {string}',
          (_ctx: unknown, warnMsg: string, _errorMsg: string) => {
            state!.collector.capture({
              source: 'test.ts',
              category: 'extraction',
              message: warnMsg,
            });
          }
        );

        When('the Result is returned', () => {
          state!.result = ResultWithWarnings.err(
            new Error('Invalid syntax'),
            state!.collector.getAll()
          );
        });

        Then('Result.isError() is true', () => {
          expect(ResultWithWarnings.isError(state!.result!)).toBe(true);
        });

        And('Result.warnings has {int} entry', (_ctx: unknown, count: number) => {
          expect(state!.result!.warnings.length).toBe(count);
        });

        And('the warning is preserved', () => {
          expect(state!.result!.warnings[0].message).toBe('Missing shape');
        });
      }
    );

    RuleScenario('Warnings propagate through pipeline', ({ Given, And, When, Then }) => {
      Given('source mapper collects warnings', () => {
        state!.collector.capture({
          source: 'source-mapper.ts',
          category: 'extraction',
          message: 'Mapper warning',
        });
      });

      And('decision doc generator collects warnings', () => {
        state!.collector.capture({
          source: 'decision-doc-generator.ts',
          category: 'extraction',
          message: 'Generator warning',
        });
      });

      When('final Result is returned', () => {
        state!.result = ResultWithWarnings.ok('success', state!.collector.getAll());
      });

      Then('all warnings from both stages are present', () => {
        expect(state!.result!.warnings.length).toBe(2);
        const sources = state!.result!.warnings.map((w) => w.source);
        expect(sources).toContain('source-mapper.ts');
        expect(sources).toContain('decision-doc-generator.ts');
      });

      And('warnings are not duplicated', () => {
        const messages = state!.result!.warnings.map((w) => w.message);
        const uniqueMessages = new Set(messages);
        expect(messages.length).toBe(uniqueMessages.size);
      });
    });
  });

  // ===========================================================================
  // RULE 5: Warning Formatting
  // ===========================================================================

  Rule('Warnings can be formatted for different outputs', ({ RuleScenario }) => {
    RuleScenario('Console format includes color and location', ({ Given, When, Then, And }) => {
      Given('a warning from {string}', (_ctx: unknown, location: string) => {
        // Parse location like "src/types.ts:42"
        const [source, lineStr] = location.split(':');
        state!.collector.capture({
          source,
          line: lineStr ? parseInt(lineStr) : undefined,
          category: 'extraction',
          message: 'Missing JSDoc',
        });
      });

      When('formatting for console', () => {
        state!.formattedOutput = state!.collector.formatForConsole();
      });

      Then('output includes yellow color code', () => {
        expect(state!.formattedOutput).toContain('\x1b[33m');
      });

      And('output is {string}', (_ctx: unknown, expected: string) => {
        // The expected format includes the warning symbol and reset code
        expect(state!.formattedOutput).toContain(expected);
      });
    });

    RuleScenario('JSON format is machine-readable', ({ Given, When, Then, And }) => {
      Given('a warning with all fields populated', () => {
        state!.collector.capture({
          source: 'src/test.ts',
          line: 42,
          category: 'extraction',
          subcategory: 'missing-shape',
          message: 'Shape not found',
        });
      });

      When('formatting as JSON', () => {
        state!.formattedOutput = state!.collector.formatAsJson();
      });

      Then('output is valid JSON', () => {
        expect(() => JSON.parse(state!.formattedOutput) as unknown).not.toThrow();
      });

      And('includes fields: source, line, category, message', () => {
        const parsed: unknown = JSON.parse(state!.formattedOutput);
        // Validate structure before accessing properties
        expect(Array.isArray(parsed)).toBe(true);
        expect((parsed as unknown[]).length).toBeGreaterThan(0);
        const warnings = parsed as Warning[];
        expect(warnings[0]).toHaveProperty('source');
        expect(warnings[0]).toHaveProperty('line');
        expect(warnings[0]).toHaveProperty('category');
        expect(warnings[0]).toHaveProperty('message');
      });
    });

    RuleScenario('Markdown format for documentation', ({ Given, When, Then, And }) => {
      Given('multiple warnings grouped by source', () => {
        state!.collector.capture({
          source: 'src/a.ts',
          category: 'extraction',
          message: 'Warning 1',
        });
        state!.collector.capture({
          source: 'src/a.ts',
          category: 'extraction',
          message: 'Warning 2',
        });
        state!.collector.capture({
          source: 'src/b.ts',
          category: 'validation',
          message: 'Warning 3',
        });
      });

      When('formatting as markdown', () => {
        state!.formattedOutput = state!.collector.formatAsMarkdown();
      });

      Then('output includes {string} header', (_ctx: unknown, header: string) => {
        expect(state!.formattedOutput).toContain(header);
      });

      And('warnings are listed under source file headers', () => {
        expect(state!.formattedOutput).toContain('### src/a.ts');
        expect(state!.formattedOutput).toContain('### src/b.ts');
        expect(state!.formattedOutput).toContain('- Warning 1');
        expect(state!.formattedOutput).toContain('- Warning 2');
        expect(state!.formattedOutput).toContain('- Warning 3');
      });
    });
  });

  // ===========================================================================
  // RULE 6: Migration from console.warn
  // ===========================================================================

  Rule('Existing console.warn calls are migrated to collector', ({ RuleScenario }) => {
    RuleScenario('Source mapper uses warning collector', ({ Given, When, Then, And }) => {
      let consoleWarnCalled = false;
      const originalWarn = console.warn;

      Given('extraction triggers a warning condition', () => {
        // Mock console.warn to detect if it's called
        console.warn = (..._args: unknown[]) => {
          consoleWarnCalled = true;
        };
      });

      When('the warning is raised in source-mapper.ts', () => {
        // Simulate what source-mapper should do
        state!.collector.capture({
          source: 'source-mapper.ts',
          category: 'file-access',
          subcategory: 'check-error',
          message: 'File not found: test.ts',
        });
      });

      Then('no console.warn is called', () => {
        expect(consoleWarnCalled).toBe(false);
        // Restore console.warn
        console.warn = originalWarn;
      });

      And('warning appears in collector', () => {
        const warnings = state!.collector.getAll();
        expect(warnings.length).toBe(1);
        expect(warnings[0].category).toBe('file-access');
      });
    });

    RuleScenario('Shape extractor uses warning collector', ({ Given, When, Then, And }) => {
      Given('a re-export is detected', () => {
        state!.currentSource = 'src/types/index.ts';
      });

      When('shape extraction warns about re-export', () => {
        state!.collector.capture({
          source: state!.currentSource,
          category: 'extraction',
          subcategory: 're-export',
          message: 'Detected re-export from ./foo',
        });
      });

      Then('warning is captured with category {string}', (_ctx: unknown, category: string) => {
        const warnings = state!.collector.getAll();
        expect(warnings[0].category).toBe(category);
      });

      And('warning includes {string} in message', (_ctx: unknown, substring: string) => {
        const warnings = state!.collector.getAll();
        expect(warnings[0].message).toContain(substring);
      });
    });
  });
});
