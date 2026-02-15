/**
 * Lint Engine Step Definitions
 *
 * BDD step definitions for testing lint engine orchestration.
 * Tests directive linting, file batch processing, failure detection,
 * violation sorting, and output formatting.
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  lintDirective,
  lintFiles,
  hasFailures,
  sortViolationsBySeverity,
  formatPretty,
  formatJson,
  type DirectiveWithLocation,
  type LintSummary,
} from '../../../src/lint/engine.js';
import { defaultRules, type LintRule } from '../../../src/lint/rules.js';
import { type LintSeverity, type LintViolation } from '../../../src/validation-schemas/lint.js';
import type { DocDirective } from '../../../src/validation-schemas/doc-directive.js';
import { asDirectiveTag } from '../../../src/types/branded.js';
import type { DataTableRow } from '../../support/world.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface LintJsonOutput {
  results: Array<{
    file: string;
    violations: Array<{
      rule: string;
      severity: LintSeverity;
      message: string;
      line: number;
    }>;
  }>;
  summary: {
    errors: number;
    warnings: number;
    info: number;
    filesScanned: number;
    directivesChecked: number;
  };
}

interface LintEngineScenarioState {
  directive: DocDirective;
  filePath: string;
  lineNumber: number;
  customRules: LintRule[];
  violations: LintViolation[];
  originalViolations: LintViolation[];
  sortedViolations: LintViolation[];
  files: Map<string, DirectiveWithLocation[]>;
  summary: LintSummary;
  prettyOutput: string;
  jsonOutput: string;
  parsedJson: LintJsonOutput | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: LintEngineScenarioState | null = null;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a minimal valid DocDirective for testing
 */
function createTestDirective(overrides: Partial<DocDirective> = {}): DocDirective {
  return {
    tags: [asDirectiveTag('@libar-docs-test')],
    description: '',
    examples: [],
    position: { startLine: 1, endLine: 10 },
    ...overrides,
  };
}

/**
 * Create a complete "clean" directive that passes all default rules
 */
function createCleanDirective(): DocDirective {
  return createTestDirective({
    patternName: 'TestPattern',
    status: 'completed',
    whenToUse: ['When testing'],
    uses: ['OtherPattern'],
    description: 'Meaningful description here.',
  });
}

/**
 * Create a rule that always produces a violation
 */
function createAlwaysFailRule(id: string, severity: LintSeverity): LintRule {
  return {
    id,
    severity,
    description: `Test rule ${id}`,
    check: (_, file, line) => ({
      rule: id,
      severity,
      message: `${id} failed`,
      file,
      line,
    }),
  };
}

/**
 * Initialize fresh scenario state
 */
function initState(): LintEngineScenarioState {
  return {
    directive: createTestDirective(),
    filePath: '/test.ts',
    lineNumber: 1,
    customRules: [],
    violations: [],
    originalViolations: [],
    sortedViolations: [],
    files: new Map(),
    summary: {
      results: [],
      errorCount: 0,
      warningCount: 0,
      infoCount: 0,
      filesScanned: 0,
      directivesChecked: 0,
    },
    prettyOutput: '',
    jsonOutput: '',
    parsedJson: null,
  };
}

/**
 * Parse DataTable row to directive fields
 */
function parseDirectiveFromTable(table: DataTableRow[]): Partial<DocDirective> {
  const overrides: Partial<DocDirective> = {};

  for (const row of table) {
    const { field, value } = row;
    switch (field) {
      case 'patternName':
        overrides.patternName = value;
        break;
      case 'status':
        overrides.status = value as DocDirective['status'];
        break;
      case 'whenToUse':
        overrides.whenToUse = [value];
        break;
      case 'uses':
        overrides.uses = value.split(',').map((s) => s.trim());
        break;
      case 'description':
        overrides.description = value;
        break;
    }
  }

  return overrides;
}

// =============================================================================
// Feature: Lint Engine
// =============================================================================

const feature = await loadFeature('tests/features/lint/lint-engine.feature');

describeFeature(feature, ({ Rule, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a lint engine context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // lintDirective
  // ===========================================================================

  Rule('Single directive linting validates annotations against rules', ({ RuleScenario }) => {
    RuleScenario('Return empty array when all rules pass', ({ Given, When, Then }) => {
      Given('a directive with all required fields:', (_ctx: unknown, table: DataTableRow[]) => {
        const overrides = parseDirectiveFromTable(table);
        // Handle whenToUse as array
        if (overrides.whenToUse && !Array.isArray(overrides.whenToUse)) {
          overrides.whenToUse = [overrides.whenToUse];
        }
        state!.directive = createTestDirective(overrides);
      });

      When('I lint the directive with default rules', () => {
        state!.violations = lintDirective(
          state!.directive,
          state!.filePath,
          state!.lineNumber,
          defaultRules
        );
      });

      Then('the violation count should be {int}', (_ctx: unknown, count: number) => {
        expect(state!.violations).toHaveLength(count);
      });
    });

    RuleScenario('Return violations for failing rules', ({ Given, When, Then, And }) => {
      Given('a directive with no fields set', () => {
        state!.directive = createTestDirective();
      });

      When('I lint the directive with default rules', () => {
        state!.violations = lintDirective(
          state!.directive,
          state!.filePath,
          state!.lineNumber,
          defaultRules
        );
      });

      Then('the violation count should be greater than {int}', (_ctx: unknown, count: number) => {
        expect(state!.violations.length).toBeGreaterThan(count);
      });

      And('the violations should include rule {string}', (_ctx: unknown, ruleId: string) => {
        expect(state!.violations.some((v) => v.rule === ruleId)).toBe(true);
      });
    });

    RuleScenario('Run all provided rules', ({ Given, When, Then, And }) => {
      Given('a directive with no fields set', () => {
        state!.directive = createTestDirective();
      });

      And('custom rules:', (_ctx: unknown, table: DataTableRow[]) => {
        state!.customRules = table.map((row) =>
          createAlwaysFailRule(row.id, row.severity as LintSeverity)
        );
      });

      When('I lint the directive with custom rules', () => {
        state!.violations = lintDirective(
          state!.directive,
          state!.filePath,
          state!.lineNumber,
          state!.customRules
        );
      });

      Then('the violation count should be {int}', (_ctx: unknown, count: number) => {
        expect(state!.violations).toHaveLength(count);
      });

      And('the violations should have rules:', (_ctx: unknown, table: DataTableRow[]) => {
        const expectedRules = table.map((row) => row.ruleId);
        const actualRules = state!.violations.map((v) => v.rule);
        expect(actualRules).toEqual(expectedRules);
      });
    });

    RuleScenario('Include correct file and line in violations', ({ Given, When, Then, And }) => {
      Given('a directive with no fields set', () => {
        state!.directive = createTestDirective();
      });

      And(
        'a custom rule {string} with severity {string}',
        (_ctx: unknown, ruleId: string, severity: string) => {
          state!.customRules = [createAlwaysFailRule(ruleId, severity as LintSeverity)];
        }
      );

      And(
        'the directive location is {string} at line {int}',
        (_ctx: unknown, filePath: string, line: number) => {
          state!.filePath = filePath;
          state!.lineNumber = line;
        }
      );

      When('I lint the directive with custom rules', () => {
        state!.violations = lintDirective(
          state!.directive,
          state!.filePath,
          state!.lineNumber,
          state!.customRules
        );
      });

      Then('the first violation should have file {string}', (_ctx: unknown, file: string) => {
        expect(state!.violations[0].file).toBe(file);
      });

      And('the first violation should have line {int}', (_ctx: unknown, line: number) => {
        expect(state!.violations[0].line).toBe(line);
      });
    });
  });

  // ===========================================================================
  // lintFiles
  // ===========================================================================

  Rule('Multi-file batch linting aggregates results across files', ({ RuleScenario }) => {
    RuleScenario('Return empty results for clean files', ({ Given, When, Then, And }) => {
      Given('clean directives in files:', (_ctx: unknown, table: DataTableRow[]) => {
        for (const row of table) {
          const cleanDirective = createCleanDirective();
          state!.files.set(row.file, [{ directive: cleanDirective, line: 1 }]);
        }
      });

      When('I lint all files with default rules', () => {
        state!.summary = lintFiles(state!.files, defaultRules);
      });

      Then('the result count should be {int}', (_ctx: unknown, count: number) => {
        expect(state!.summary.results).toHaveLength(count);
      });

      And('the error count should be {int}', (_ctx: unknown, count: number) => {
        expect(state!.summary.errorCount).toBe(count);
      });

      And('the warning count should be {int}', (_ctx: unknown, count: number) => {
        expect(state!.summary.warningCount).toBe(count);
      });

      And('the info count should be {int}', (_ctx: unknown, count: number) => {
        expect(state!.summary.infoCount).toBe(count);
      });

      And('the files scanned should be {int}', (_ctx: unknown, count: number) => {
        expect(state!.summary.filesScanned).toBe(count);
      });

      And('the directives checked should be {int}', (_ctx: unknown, count: number) => {
        expect(state!.summary.directivesChecked).toBe(count);
      });
    });

    RuleScenario('Collect violations by file', ({ Given, When, Then, And }) => {
      Given('dirty directives in files:', (_ctx: unknown, table: DataTableRow[]) => {
        for (const row of table) {
          const dirtyDirective = createTestDirective(); // Missing everything
          state!.files.set(row.file, [{ directive: dirtyDirective, line: parseInt(row.line) }]);
        }
      });

      When('I lint all files with default rules', () => {
        state!.summary = lintFiles(state!.files, defaultRules);
      });

      Then('the result count should be {int}', (_ctx: unknown, count: number) => {
        expect(state!.summary.results).toHaveLength(count);
      });

      And('results should include files:', (_ctx: unknown, table: DataTableRow[]) => {
        for (const row of table) {
          expect(state!.summary.results.some((r) => r.file === row.file)).toBe(true);
        }
      });
    });

    RuleScenario('Count violations by severity', ({ Given, When, Then, And }) => {
      Given('a directive with no fields set', () => {
        state!.directive = createTestDirective();
      });

      And('custom rules:', (_ctx: unknown, table: DataTableRow[]) => {
        state!.customRules = table.map((row) =>
          createAlwaysFailRule(row.id, row.severity as LintSeverity)
        );
      });

      And('the directive is in file {string}', (_ctx: unknown, file: string) => {
        state!.files.set(file, [{ directive: state!.directive, line: 1 }]);
      });

      When('I lint all files with custom rules', () => {
        state!.summary = lintFiles(state!.files, state!.customRules);
      });

      Then('the error count should be {int}', (_ctx: unknown, count: number) => {
        expect(state!.summary.errorCount).toBe(count);
      });

      And('the warning count should be {int}', (_ctx: unknown, count: number) => {
        expect(state!.summary.warningCount).toBe(count);
      });

      And('the info count should be {int}', (_ctx: unknown, count: number) => {
        expect(state!.summary.infoCount).toBe(count);
      });
    });

    RuleScenario('Handle multiple directives per file', ({ Given, When, Then, And }) => {
      Given(
        'multiple directives in {string}:',
        (_ctx: unknown, file: string, table: DataTableRow[]) => {
          const directives: DirectiveWithLocation[] = table.map((row) => ({
            directive: createTestDirective({
              patternName: row.patternName,
              status: row.status ? (row.status as DocDirective['status']) : undefined,
            }),
            line: parseInt(row.line),
          }));
          state!.files.set(file, directives);
        }
      );

      When('I lint all files with default rules', () => {
        state!.summary = lintFiles(state!.files, defaultRules);
      });

      Then('the directives checked should be {int}', (_ctx: unknown, count: number) => {
        expect(state!.summary.directivesChecked).toBe(count);
      });

      And('the result count should be {int}', (_ctx: unknown, count: number) => {
        expect(state!.summary.results).toHaveLength(count);
      });

      And(
        'the first result should have more than {int} violation',
        (_ctx: unknown, count: number) => {
          expect(state!.summary.results[0].violations.length).toBeGreaterThan(count);
        }
      );
    });
  });

  // ===========================================================================
  // hasFailures
  // ===========================================================================

  Rule('Failure detection respects strict mode for severity escalation', ({ RuleScenario }) => {
    RuleScenario('Return true when there are errors', ({ Given, Then, And }) => {
      Given('a lint summary with:', (_ctx: unknown, table: DataTableRow[]) => {
        const row = table[0];
        state!.summary = {
          results: [],
          errorCount: parseInt(row.errorCount),
          warningCount: parseInt(row.warningCount),
          infoCount: parseInt(row.infoCount),
          filesScanned: 1,
          directivesChecked: 1,
        };
      });

      Then('hasFailures should return true in normal mode', () => {
        expect(hasFailures(state!.summary, false)).toBe(true);
      });

      And('hasFailures should return true in strict mode', () => {
        expect(hasFailures(state!.summary, true)).toBe(true);
      });
    });

    RuleScenario('Return false for warnings only in non-strict mode', ({ Given, Then }) => {
      Given('a lint summary with:', (_ctx: unknown, table: DataTableRow[]) => {
        const row = table[0];
        state!.summary = {
          results: [],
          errorCount: parseInt(row.errorCount),
          warningCount: parseInt(row.warningCount),
          infoCount: parseInt(row.infoCount),
          filesScanned: 1,
          directivesChecked: 1,
        };
      });

      Then('hasFailures should return false in normal mode', () => {
        expect(hasFailures(state!.summary, false)).toBe(false);
      });
    });

    RuleScenario('Return true for warnings in strict mode', ({ Given, Then }) => {
      Given('a lint summary with:', (_ctx: unknown, table: DataTableRow[]) => {
        const row = table[0];
        state!.summary = {
          results: [],
          errorCount: parseInt(row.errorCount),
          warningCount: parseInt(row.warningCount),
          infoCount: parseInt(row.infoCount),
          filesScanned: 1,
          directivesChecked: 1,
        };
      });

      Then('hasFailures should return true in strict mode', () => {
        expect(hasFailures(state!.summary, true)).toBe(true);
      });
    });

    RuleScenario('Return false for info only', ({ Given, Then, And }) => {
      Given('a lint summary with:', (_ctx: unknown, table: DataTableRow[]) => {
        const row = table[0];
        state!.summary = {
          results: [],
          errorCount: parseInt(row.errorCount),
          warningCount: parseInt(row.warningCount),
          infoCount: parseInt(row.infoCount),
          filesScanned: 1,
          directivesChecked: 1,
        };
      });

      Then('hasFailures should return false in normal mode', () => {
        expect(hasFailures(state!.summary, false)).toBe(false);
      });

      And('hasFailures should return false in strict mode', () => {
        expect(hasFailures(state!.summary, true)).toBe(false);
      });
    });

    RuleScenario('Return false when no violations', ({ Given, Then, And }) => {
      Given('a lint summary with:', (_ctx: unknown, table: DataTableRow[]) => {
        const row = table[0];
        state!.summary = {
          results: [],
          errorCount: parseInt(row.errorCount),
          warningCount: parseInt(row.warningCount),
          infoCount: parseInt(row.infoCount),
          filesScanned: parseInt(row.filesScanned),
          directivesChecked: parseInt(row.directivesChecked),
        };
      });

      Then('hasFailures should return false in normal mode', () => {
        expect(hasFailures(state!.summary, false)).toBe(false);
      });

      And('hasFailures should return false in strict mode', () => {
        expect(hasFailures(state!.summary, true)).toBe(false);
      });
    });
  });

  // ===========================================================================
  // sortViolationsBySeverity
  // ===========================================================================

  Rule('Violation sorting orders by severity then by line number', ({ RuleScenario }) => {
    RuleScenario('Sort errors first then warnings then info', ({ Given, When, Then }) => {
      Given('violations:', (_ctx: unknown, table: DataTableRow[]) => {
        state!.originalViolations = table.map((row) => ({
          rule: row.rule,
          severity: row.severity as LintSeverity,
          message: '',
          file: '/f.ts',
          line: parseInt(row.line),
        }));
      });

      When('I sort violations by severity', () => {
        state!.sortedViolations = sortViolationsBySeverity(state!.originalViolations);
      });

      Then('the severity order should be:', (_ctx: unknown, table: DataTableRow[]) => {
        const expectedSeverities = table.map((row) => row.severity);
        const actualSeverities = state!.sortedViolations.map((v) => v.severity);
        expect(actualSeverities).toEqual(expectedSeverities);
      });
    });

    RuleScenario('Sort by line number within same severity', ({ Given, When, Then }) => {
      Given('violations:', (_ctx: unknown, table: DataTableRow[]) => {
        state!.originalViolations = table.map((row) => ({
          rule: row.rule,
          severity: row.severity as LintSeverity,
          message: '',
          file: '/f.ts',
          line: parseInt(row.line),
        }));
      });

      When('I sort violations by severity', () => {
        state!.sortedViolations = sortViolationsBySeverity(state!.originalViolations);
      });

      Then('the line order should be:', (_ctx: unknown, table: DataTableRow[]) => {
        const expectedLines = table.map((row) => parseInt(row.line));
        const actualLines = state!.sortedViolations.map((v) => v.line);
        expect(actualLines).toEqual(expectedLines);
      });
    });

    RuleScenario('Not mutate original array', ({ Given, When, Then, And }) => {
      Given('violations:', (_ctx: unknown, table: DataTableRow[]) => {
        state!.originalViolations = table.map((row) => ({
          rule: row.rule,
          severity: row.severity as LintSeverity,
          message: '',
          file: '/f.ts',
          line: parseInt(row.line),
        }));
      });

      When('I sort violations by severity', () => {
        state!.sortedViolations = sortViolationsBySeverity(state!.originalViolations);
      });

      Then(
        'the original first violation should have severity {string}',
        (_ctx: unknown, severity: string) => {
          expect(state!.originalViolations[0].severity).toBe(severity);
        }
      );

      And(
        'the sorted first violation should have severity {string}',
        (_ctx: unknown, severity: string) => {
          expect(state!.sortedViolations[0].severity).toBe(severity);
        }
      );
    });
  });

  // ===========================================================================
  // formatPretty
  // ===========================================================================

  Rule(
    'Pretty formatting produces human-readable output with severity counts',
    ({ RuleScenario }) => {
      RuleScenario('Show success message when no violations', ({ Given, When, Then }) => {
        Given('a lint summary with:', (_ctx: unknown, table: DataTableRow[]) => {
          const row = table[0];
          state!.summary = {
            results: [],
            errorCount: parseInt(row.errorCount),
            warningCount: parseInt(row.warningCount),
            infoCount: parseInt(row.infoCount),
            filesScanned: parseInt(row.filesScanned),
            directivesChecked: parseInt(row.directivesChecked),
          };
        });

        When('I format the summary as pretty', () => {
          state!.prettyOutput = formatPretty(state!.summary);
        });

        Then('the output should contain:', (_ctx: unknown, table: DataTableRow[]) => {
          for (const row of table) {
            expect(state!.prettyOutput).toContain(row.text);
          }
        });
      });

      RuleScenario(
        'Format violations with file line severity and message',
        ({ Given, When, Then }) => {
          Given('a lint summary with violations:', (_ctx: unknown, table: DataTableRow[]) => {
            const violations = table.map((row) => ({
              rule: row.rule,
              severity: row.severity as LintSeverity,
              message: row.message,
              file: row.file,
              line: parseInt(row.line),
            }));

            const results = [
              {
                file: table[0].file,
                violations,
              },
            ];

            state!.summary = {
              results,
              errorCount: violations.filter((v) => v.severity === 'error').length,
              warningCount: violations.filter((v) => v.severity === 'warning').length,
              infoCount: violations.filter((v) => v.severity === 'info').length,
              filesScanned: 1,
              directivesChecked: 1,
            };
          });

          When('I format the summary as pretty', () => {
            state!.prettyOutput = formatPretty(state!.summary);
          });

          Then('the output should contain:', (_ctx: unknown, table: DataTableRow[]) => {
            for (const row of table) {
              expect(state!.prettyOutput).toContain(row.text);
            }
          });
        }
      );

      RuleScenario('Show summary line with counts', ({ Given, When, Then }) => {
        Given('a lint summary with violations:', (_ctx: unknown, table: DataTableRow[]) => {
          const violations = table.map((row) => ({
            rule: row.rule,
            severity: row.severity as LintSeverity,
            message: row.message,
            file: row.file,
            line: parseInt(row.line),
          }));

          const results = [
            {
              file: '/f.ts',
              violations,
            },
          ];

          state!.summary = {
            results,
            errorCount: violations.filter((v) => v.severity === 'error').length,
            warningCount: violations.filter((v) => v.severity === 'warning').length,
            infoCount: violations.filter((v) => v.severity === 'info').length,
            filesScanned: 1,
            directivesChecked: 1,
          };
        });

        When('I format the summary as pretty', () => {
          state!.prettyOutput = formatPretty(state!.summary);
        });

        Then('the output should contain:', (_ctx: unknown, table: DataTableRow[]) => {
          for (const row of table) {
            expect(state!.prettyOutput).toContain(row.text);
          }
        });
      });

      RuleScenario('Filter out warnings and info in quiet mode', ({ Given, When, Then, And }) => {
        Given('a lint summary with violations:', (_ctx: unknown, table: DataTableRow[]) => {
          const violations = table.map((row) => ({
            rule: row.rule,
            severity: row.severity as LintSeverity,
            message: row.message,
            file: row.file,
            line: parseInt(row.line),
          }));

          const results = [
            {
              file: '/f.ts',
              violations,
            },
          ];

          state!.summary = {
            results,
            errorCount: violations.filter((v) => v.severity === 'error').length,
            warningCount: violations.filter((v) => v.severity === 'warning').length,
            infoCount: violations.filter((v) => v.severity === 'info').length,
            filesScanned: 1,
            directivesChecked: 1,
          };
        });

        When('I format the summary as pretty with quiet mode', () => {
          state!.prettyOutput = formatPretty(state!.summary, { quiet: true });
        });

        Then('the output should contain {string}', (_ctx: unknown, text: string) => {
          expect(state!.prettyOutput).toContain(text);
        });

        And('the output should not contain:', (_ctx: unknown, table: DataTableRow[]) => {
          for (const row of table) {
            expect(state!.prettyOutput).not.toContain(row.text);
          }
        });
      });
    }
  );

  // ===========================================================================
  // formatJson
  // ===========================================================================

  Rule('JSON formatting produces machine-readable output with full details', ({ RuleScenario }) => {
    RuleScenario('Return valid JSON', ({ Given, When, Then, And }) => {
      Given('a lint summary with violations:', (_ctx: unknown, table: DataTableRow[]) => {
        const violations = table.map((row) => ({
          rule: row.rule,
          severity: row.severity as LintSeverity,
          message: row.message,
          file: row.file,
          line: parseInt(row.line),
        }));

        const results = [
          {
            file: table[0].file,
            violations,
          },
        ];

        state!.summary = {
          results,
          errorCount: violations.filter((v) => v.severity === 'error').length,
          warningCount: violations.filter((v) => v.severity === 'warning').length,
          infoCount: violations.filter((v) => v.severity === 'info').length,
          filesScanned: 1,
          directivesChecked: 1,
        };
      });

      When('I format the summary as JSON', () => {
        const result = formatJson(state!.summary);
        expect(result.ok).toBe(true);
        if (result.ok) {
          state!.jsonOutput = result.value;
          state!.parsedJson = JSON.parse(result.value) as LintJsonOutput;
        }
      });

      Then('the JSON should be valid', () => {
        expect(state!.parsedJson).toBeDefined();
      });

      And('the JSON results count should be {int}', (_ctx: unknown, count: number) => {
        expect(state!.parsedJson!.results).toHaveLength(count);
      });

      And('the JSON summary errors should be {int}', (_ctx: unknown, count: number) => {
        expect(state!.parsedJson!.summary.errors).toBe(count);
      });
    });

    RuleScenario('Include all summary fields', ({ Given, When, Then }) => {
      Given('a lint summary with:', (_ctx: unknown, table: DataTableRow[]) => {
        const row = table[0];
        state!.summary = {
          results: [],
          errorCount: parseInt(row.errorCount),
          warningCount: parseInt(row.warningCount),
          infoCount: parseInt(row.infoCount),
          filesScanned: parseInt(row.filesScanned),
          directivesChecked: parseInt(row.directivesChecked),
        };
      });

      When('I format the summary as JSON', () => {
        const result = formatJson(state!.summary);
        expect(result.ok).toBe(true);
        if (result.ok) {
          state!.jsonOutput = result.value;
          state!.parsedJson = JSON.parse(result.value) as LintJsonOutput;
        }
      });

      Then('the JSON summary should match:', (_ctx: unknown, table: DataTableRow[]) => {
        for (const row of table) {
          const field = row.field as keyof LintJsonOutput['summary'];
          expect(state!.parsedJson!.summary[field]).toBe(parseInt(row.value));
        }
      });
    });

    RuleScenario('Include violation details', ({ Given, When, Then }) => {
      Given('a lint summary with violations:', (_ctx: unknown, table: DataTableRow[]) => {
        const violations = table.map((row) => ({
          rule: row.rule,
          severity: row.severity as LintSeverity,
          message: row.message,
          file: row.file,
          line: parseInt(row.line),
        }));

        const results = [
          {
            file: table[0].file,
            violations,
          },
        ];

        state!.summary = {
          results,
          errorCount: violations.filter((v) => v.severity === 'error').length,
          warningCount: violations.filter((v) => v.severity === 'warning').length,
          infoCount: violations.filter((v) => v.severity === 'info').length,
          filesScanned: 1,
          directivesChecked: 1,
        };
      });

      When('I format the summary as JSON', () => {
        const result = formatJson(state!.summary);
        expect(result.ok).toBe(true);
        if (result.ok) {
          state!.jsonOutput = result.value;
          state!.parsedJson = JSON.parse(result.value) as LintJsonOutput;
        }
      });

      Then('the first JSON violation should have:', (_ctx: unknown, table: DataTableRow[]) => {
        const violation = state!.parsedJson!.results[0].violations[0];
        for (const row of table) {
          const field = row.field as keyof typeof violation;
          const expectedValue = field === 'line' ? parseInt(row.value) : row.value;
          expect(violation[field]).toBe(expectedValue);
        }
      });
    });
  });
});
