/**
 * Step definitions for individual lint rule validation tests.
 * Tests: missing-pattern-name, missing-status, missing-when-to-use, missing-relationships.
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  type LintRulesScenarioState,
  initState,
  createTestDirective,
  parseDirectiveTable,
  missingPatternName,
  missingStatus,
  missingWhenToUse,
  missingRelationships,
  type DataTableRow,
} from '../../support/helpers/lint-rules-state.js';

let state: LintRulesScenarioState | null = null;

const feature = await loadFeature('tests/features/lint/lint-rules-individual.feature');

describeFeature(feature, ({ Rule, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a lint rule context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // missing-pattern-name rule
  // ===========================================================================

  Rule('Files must declare an explicit pattern name', ({ RuleScenario }) => {
    RuleScenario('Detect missing pattern name', ({ Given, When, Then, And }) => {
      Given('a directive without patternName', () => {
        state!.directive = createTestDirective();
      });

      When('I apply the missing-pattern-name rule', () => {
        state!.violation = missingPatternName.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('a violation should be detected', () => {
        expect(state!.violation).not.toBeNull();
      });

      And('the violation severity should be {string}', (_ctx: unknown, severity: string) => {
        expect(state!.violation?.severity).toBe(severity);
      });

      And('the violation message should contain {string}', (_ctx: unknown, text: string) => {
        expect(state!.violation?.message).toContain(text);
      });
    });

    RuleScenario('Detect empty string pattern name', ({ Given, When, Then, And }) => {
      Given('a directive with patternName {string}', (_ctx: unknown, patternName: string) => {
        state!.directive = createTestDirective({ patternName });
      });

      When('I apply the missing-pattern-name rule', () => {
        state!.violation = missingPatternName.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('a violation should be detected', () => {
        expect(state!.violation).not.toBeNull();
      });

      And('the violation severity should be {string}', (_ctx: unknown, severity: string) => {
        expect(state!.violation?.severity).toBe(severity);
      });
    });

    RuleScenario('Detect whitespace-only pattern name', ({ Given, When, Then, And }) => {
      Given('a directive with patternName {string}', (_ctx: unknown, patternName: string) => {
        state!.directive = createTestDirective({ patternName });
      });

      When('I apply the missing-pattern-name rule', () => {
        state!.violation = missingPatternName.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('a violation should be detected', () => {
        expect(state!.violation).not.toBeNull();
      });

      And('the violation severity should be {string}', (_ctx: unknown, severity: string) => {
        expect(state!.violation?.severity).toBe(severity);
      });
    });

    RuleScenario('Accept valid pattern name', ({ Given, When, Then }) => {
      Given('a directive with patternName {string}', (_ctx: unknown, patternName: string) => {
        state!.directive = createTestDirective({ patternName });
      });

      When('I apply the missing-pattern-name rule', () => {
        state!.violation = missingPatternName.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('no violation should be detected', () => {
        expect(state!.violation).toBeNull();
      });
    });

    RuleScenario('Include file and line in violation', ({ Given, When, Then, And }) => {
      Given('a directive without patternName', () => {
        state!.directive = createTestDirective();
      });

      And('the file path is {string}', (_ctx: unknown, filePath: string) => {
        state!.filePath = filePath;
      });

      And('the line number is {int}', (_ctx: unknown, lineNumber: number) => {
        state!.lineNumber = lineNumber;
      });

      When('I apply the missing-pattern-name rule', () => {
        state!.violation = missingPatternName.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('the violation should have file {string}', (_ctx: unknown, file: string) => {
        expect(state!.violation?.file).toBe(file);
      });

      And('the violation should have line {int}', (_ctx: unknown, line: number) => {
        expect(state!.violation?.line).toBe(line);
      });
    });
  });

  // ===========================================================================
  // missing-status rule
  // ===========================================================================

  Rule('Files should declare a lifecycle status', ({ RuleScenario }) => {
    RuleScenario('Detect missing status', ({ Given, When, Then, And }) => {
      Given('a directive without status', () => {
        state!.directive = createTestDirective();
      });

      When('I apply the missing-status rule', () => {
        state!.violation = missingStatus.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('a violation should be detected', () => {
        expect(state!.violation).not.toBeNull();
      });

      And('the violation severity should be {string}', (_ctx: unknown, severity: string) => {
        expect(state!.violation?.severity).toBe(severity);
      });

      And('the violation message should contain {string}', (_ctx: unknown, text: string) => {
        expect(state!.violation?.message).toContain(text);
      });
    });

    RuleScenario('Accept completed status', ({ Given, When, Then }) => {
      Given('a directive with status {string}', (_ctx: unknown, status: string) => {
        state!.directive = createTestDirective({
          status: status as 'roadmap' | 'active' | 'completed' | 'deferred',
        });
      });

      When('I apply the missing-status rule', () => {
        state!.violation = missingStatus.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('no violation should be detected', () => {
        expect(state!.violation).toBeNull();
      });
    });

    RuleScenario('Accept active status', ({ Given, When, Then }) => {
      Given('a directive with status {string}', (_ctx: unknown, status: string) => {
        state!.directive = createTestDirective({
          status: status as 'roadmap' | 'active' | 'completed' | 'deferred',
        });
      });

      When('I apply the missing-status rule', () => {
        state!.violation = missingStatus.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('no violation should be detected', () => {
        expect(state!.violation).toBeNull();
      });
    });

    RuleScenario('Accept roadmap status', ({ Given, When, Then }) => {
      Given('a directive with status {string}', (_ctx: unknown, status: string) => {
        state!.directive = createTestDirective({
          status: status as 'roadmap' | 'active' | 'completed' | 'deferred',
        });
      });

      When('I apply the missing-status rule', () => {
        state!.violation = missingStatus.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('no violation should be detected', () => {
        expect(state!.violation).toBeNull();
      });
    });

    RuleScenario('Accept deferred status', ({ Given, When, Then }) => {
      Given('a directive with status {string}', (_ctx: unknown, status: string) => {
        state!.directive = createTestDirective({
          status: status as 'roadmap' | 'active' | 'completed' | 'deferred',
        });
      });

      When('I apply the missing-status rule', () => {
        state!.violation = missingStatus.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('no violation should be detected', () => {
        expect(state!.violation).toBeNull();
      });
    });
  });

  // ===========================================================================
  // missing-when-to-use rule
  // ===========================================================================

  Rule('Files should document when to use the pattern', ({ RuleScenario }) => {
    RuleScenario('Detect missing whenToUse', ({ Given, When, Then, And }) => {
      Given('a directive without whenToUse', () => {
        state!.directive = createTestDirective();
      });

      When('I apply the missing-when-to-use rule', () => {
        state!.violation = missingWhenToUse.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('a violation should be detected', () => {
        expect(state!.violation).not.toBeNull();
      });

      And('the violation severity should be {string}', (_ctx: unknown, severity: string) => {
        expect(state!.violation?.severity).toBe(severity);
      });

      And('the violation message should contain {string}', (_ctx: unknown, text: string) => {
        expect(state!.violation?.message).toContain(text);
      });
    });

    RuleScenario('Detect empty whenToUse array', ({ Given, When, Then }) => {
      Given('a directive with empty whenToUse array', () => {
        state!.directive = createTestDirective({ whenToUse: [] });
      });

      When('I apply the missing-when-to-use rule', () => {
        state!.violation = missingWhenToUse.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('a violation should be detected', () => {
        expect(state!.violation).not.toBeNull();
      });
    });

    RuleScenario('Accept whenToUse with content', ({ Given, When, Then }) => {
      Given('a directive with whenToUse:', (_ctx: unknown, table: DataTableRow[]) => {
        const values = table.map((row) => row.value);
        state!.directive = createTestDirective({ whenToUse: values });
      });

      When('I apply the missing-when-to-use rule', () => {
        state!.violation = missingWhenToUse.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('no violation should be detected', () => {
        expect(state!.violation).toBeNull();
      });
    });
  });

  // ===========================================================================
  // missing-relationships rule
  // ===========================================================================

  Rule('Files should declare relationship tags', ({ RuleScenario }) => {
    RuleScenario('Detect missing relationship tags', ({ Given, When, Then, And }) => {
      Given('a directive without relationship tags', () => {
        state!.directive = createTestDirective();
      });

      When('I apply the missing-relationships rule', () => {
        state!.violation = missingRelationships.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('a violation should be detected', () => {
        expect(state!.violation).not.toBeNull();
      });

      And('the violation severity should be {string}', (_ctx: unknown, severity: string) => {
        expect(state!.violation?.severity).toBe(severity);
      });

      And('the violation message should contain {string}', (_ctx: unknown, text: string) => {
        expect(state!.violation?.message).toContain(text);
      });
    });

    RuleScenario('Detect empty uses array', ({ Given, When, Then }) => {
      Given('a directive with empty uses array', () => {
        state!.directive = createTestDirective({ uses: [] });
      });

      When('I apply the missing-relationships rule', () => {
        state!.violation = missingRelationships.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('a violation should be detected', () => {
        expect(state!.violation).not.toBeNull();
      });
    });

    RuleScenario('Accept uses with content', ({ Given, When, Then }) => {
      Given('a directive with uses:', (_ctx: unknown, table: DataTableRow[]) => {
        const values = table.map((row) => row.value);
        state!.directive = createTestDirective({ uses: values });
      });

      When('I apply the missing-relationships rule', () => {
        state!.violation = missingRelationships.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('no violation should be detected', () => {
        expect(state!.violation).toBeNull();
      });
    });

    RuleScenario('Accept usedBy with content', ({ Given, When, Then }) => {
      Given('a directive with usedBy:', (_ctx: unknown, table: DataTableRow[]) => {
        const values = table.map((row) => row.value);
        state!.directive = createTestDirective({ usedBy: values });
      });

      When('I apply the missing-relationships rule', () => {
        state!.violation = missingRelationships.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('no violation should be detected', () => {
        expect(state!.violation).toBeNull();
      });
    });

    RuleScenario('Accept both uses and usedBy', ({ Given, When, Then }) => {
      Given('a directive with:', (_ctx: unknown, table: DataTableRow[]) => {
        const overrides = parseDirectiveTable(table);
        state!.directive = createTestDirective(overrides);
      });

      When('I apply the missing-relationships rule', () => {
        state!.violation = missingRelationships.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('no violation should be detected', () => {
        expect(state!.violation).toBeNull();
      });
    });
  });
});
