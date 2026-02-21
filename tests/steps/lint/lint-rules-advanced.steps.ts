/**
 * Step definitions for advanced lint rule logic tests.
 * Tests: tautological-description, default rules collection, severity filtering.
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  type LintRulesScenarioState,
  initState,
  createTestDirective,
  parseDirectiveTable,
  tautologicalDescription,
  defaultRules,
  filterRulesBySeverity,
  type DataTableRow,
  type LintSeverity,
} from '../../support/helpers/lint-rules-state.js';

let state: LintRulesScenarioState | null = null;

const feature = await loadFeature('tests/features/lint/lint-rules-advanced.feature');

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
  // tautological-description rule
  // ===========================================================================

  Rule('Descriptions must not repeat the pattern name', ({ RuleScenario }) => {
    RuleScenario('Detect description that equals pattern name', ({ Given, When, Then, And }) => {
      Given('a directive with:', (_ctx: unknown, table: DataTableRow[]) => {
        const overrides = parseDirectiveTable(table);
        state!.directive = createTestDirective(overrides);
      });

      When('I apply the tautological-description rule', () => {
        state!.violation = tautologicalDescription.check(
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

    RuleScenario(
      'Detect description that is pattern name with punctuation',
      ({ Given, When, Then, And }) => {
        Given('a directive with:', (_ctx: unknown, table: DataTableRow[]) => {
          const overrides = parseDirectiveTable(table);
          state!.directive = createTestDirective(overrides);
        });

        When('I apply the tautological-description rule', () => {
          state!.violation = tautologicalDescription.check(
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
      }
    );

    RuleScenario('Detect short description starting with pattern name', ({ Given, When, Then }) => {
      Given('a directive with:', (_ctx: unknown, table: DataTableRow[]) => {
        const overrides = parseDirectiveTable(table);
        state!.directive = createTestDirective(overrides);
      });

      When('I apply the tautological-description rule', () => {
        state!.violation = tautologicalDescription.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('a violation should be detected', () => {
        expect(state!.violation).not.toBeNull();
      });
    });

    RuleScenario(
      'Accept description with substantial content after name',
      ({ Given, When, Then }) => {
        Given('a directive with:', (_ctx: unknown, table: DataTableRow[]) => {
          const overrides = parseDirectiveTable(table);
          state!.directive = createTestDirective(overrides);
        });

        When('I apply the tautological-description rule', () => {
          state!.violation = tautologicalDescription.check(
            state!.directive,
            state!.filePath,
            state!.lineNumber
          );
        });

        Then('no violation should be detected', () => {
          expect(state!.violation).toBeNull();
        });
      }
    );

    RuleScenario('Accept meaningfully different description', ({ Given, When, Then }) => {
      Given('a directive with:', (_ctx: unknown, table: DataTableRow[]) => {
        const overrides = parseDirectiveTable(table);
        state!.directive = createTestDirective(overrides);
      });

      When('I apply the tautological-description rule', () => {
        state!.violation = tautologicalDescription.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('no violation should be detected', () => {
        expect(state!.violation).toBeNull();
      });
    });

    RuleScenario('Ignore empty descriptions', ({ Given, When, Then }) => {
      Given('a directive with:', (_ctx: unknown, table: DataTableRow[]) => {
        const overrides = parseDirectiveTable(table);
        state!.directive = createTestDirective(overrides);
      });

      When('I apply the tautological-description rule', () => {
        state!.violation = tautologicalDescription.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('no violation should be detected', () => {
        expect(state!.violation).toBeNull();
      });
    });

    RuleScenario('Ignore missing pattern name', ({ Given, When, Then }) => {
      Given('a directive with description {string}', (_ctx: unknown, description: string) => {
        state!.directive = createTestDirective({ description });
      });

      When('I apply the tautological-description rule', () => {
        state!.violation = tautologicalDescription.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('no violation should be detected', () => {
        expect(state!.violation).toBeNull();
      });
    });

    RuleScenario('Skip headings when finding first line', ({ Given, When, Then }) => {
      Given('a directive with:', (_ctx: unknown, table: DataTableRow[]) => {
        const overrides = parseDirectiveTable(table);
        state!.directive = createTestDirective(overrides);
      });

      When('I apply the tautological-description rule', () => {
        state!.violation = tautologicalDescription.check(
          state!.directive,
          state!.filePath,
          state!.lineNumber
        );
      });

      Then('no violation should be detected', () => {
        expect(state!.violation).toBeNull();
      });
    });

    RuleScenario('Skip "When to use" sections when finding first line', ({ Given, When, Then }) => {
      Given('a directive with:', (_ctx: unknown, table: DataTableRow[]) => {
        const overrides = parseDirectiveTable(table);
        state!.directive = createTestDirective(overrides);
      });

      When('I apply the tautological-description rule', () => {
        state!.violation = tautologicalDescription.check(
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
  // Default Rules Collection
  // ===========================================================================

  Rule('Default rules collection is complete and well-ordered', ({ RuleScenario }) => {
    RuleScenario('Default rules contains all 8 rules', ({ When, Then }) => {
      When('I check the default rules collection', () => {
        state!.rules = defaultRules;
      });

      Then('it should contain {int} rules', (_ctx: unknown, count: number) => {
        expect(state!.rules).toHaveLength(count);
      });
    });

    RuleScenario('Default rules have unique IDs', ({ When, Then }) => {
      When('I check the default rules collection', () => {
        state!.rules = defaultRules;
      });

      Then('all rule IDs should be unique', () => {
        const ids = state!.rules.map((r) => r.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      });
    });

    RuleScenario('Default rules are ordered by severity', ({ When, Then, And }) => {
      When('I check the default rules collection', () => {
        state!.rules = defaultRules;
      });

      Then('errors should come before warnings', () => {
        const severities = state!.rules.map((r) => r.severity);
        const lastError = severities.lastIndexOf('error');
        const firstWarning = severities.indexOf('warning');
        expect(lastError).toBeLessThan(firstWarning);
      });

      And('warnings should come before info', () => {
        const severities = state!.rules.map((r) => r.severity);
        const lastWarning = severities.lastIndexOf('warning');
        const firstInfo = severities.indexOf('info');
        expect(lastWarning).toBeLessThan(firstInfo);
      });
    });

    RuleScenario('Default rules include all named rules', ({ When, Then }) => {
      When('I check the default rules collection', () => {
        state!.rules = defaultRules;
      });

      Then('it should include all rules:', (_ctx: unknown, table: DataTableRow[]) => {
        const ruleIds = state!.rules.map((r) => r.id);
        for (const row of table) {
          expect(ruleIds).toContain(row.ruleId);
        }
      });
    });
  });

  // ===========================================================================
  // Filter by Severity
  // ===========================================================================

  Rule('Rules can be filtered by minimum severity', ({ RuleScenario }) => {
    RuleScenario('Filter returns all rules for info severity', ({ When, Then }) => {
      When('I filter rules by minimum severity {string}', (_ctx: unknown, severity: string) => {
        state!.filteredRules = filterRulesBySeverity(defaultRules, severity as LintSeverity);
      });

      Then('I should get {int} rules', (_ctx: unknown, count: number) => {
        expect(state!.filteredRules).toHaveLength(count);
      });
    });

    RuleScenario('Filter excludes info rules for warning severity', ({ When, Then, And }) => {
      When('I filter rules by minimum severity {string}', (_ctx: unknown, severity: string) => {
        state!.filteredRules = filterRulesBySeverity(defaultRules, severity as LintSeverity);
      });

      Then('I should get {int} rules', (_ctx: unknown, count: number) => {
        expect(state!.filteredRules).toHaveLength(count);
      });

      And('none should have severity {string}', (_ctx: unknown, severity: string) => {
        expect(state!.filteredRules.every((r) => r.severity !== severity)).toBe(true);
      });
    });

    RuleScenario('Filter returns only errors for error severity', ({ When, Then, And }) => {
      When('I filter rules by minimum severity {string}', (_ctx: unknown, severity: string) => {
        state!.filteredRules = filterRulesBySeverity(defaultRules, severity as LintSeverity);
      });

      Then('I should get {int} rules', (_ctx: unknown, count: number) => {
        expect(state!.filteredRules).toHaveLength(count);
      });

      And('all should have severity {string}', (_ctx: unknown, severity: string) => {
        expect(state!.filteredRules.every((r) => r.severity === severity)).toBe(true);
      });
    });
  });
});
