/**
 * Lint Rules Step Definitions
 *
 * BDD step definitions for testing pattern annotation lint rules.
 * Tests pure TypeScript functions - no infrastructure required.
 *
 * These tests validate rule logic in isolation:
 * - Given: Create directive objects
 * - When: Call rule check functions
 * - Then: Assert on violations
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  missingPatternName,
  missingStatus,
  missingWhenToUse,
  tautologicalDescription,
  missingRelationships,
  defaultRules,
  filterRulesBySeverity,
  type LintRule,
} from '../../../src/lint/rules.js';
import type { DocDirective } from '../../../src/validation-schemas/doc-directive.js';
import type { LintViolation, LintSeverity } from '../../../src/validation-schemas/lint.js';
import { asDirectiveTag } from '../../../src/types/branded.js';
import type { DataTableRow } from '../../support/world.js';

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

interface LintRulesScenarioState {
  directive: DocDirective;
  violation: LintViolation | null;
  filePath: string;
  lineNumber: number;
  rules: readonly LintRule[];
  filteredRules: LintRule[];
}

let state: LintRulesScenarioState | null = null;

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
 * Initialize fresh scenario state
 */
function initState(): LintRulesScenarioState {
  return {
    directive: createTestDirective(),
    violation: null,
    filePath: '/test/file.ts',
    lineNumber: 1,
    rules: defaultRules,
    filteredRules: [],
  };
}

/**
 * Parse field/value DataTable into directive overrides
 */
function parseDirectiveTable(table: DataTableRow[]): Partial<DocDirective> {
  const overrides: Partial<DocDirective> = {};

  for (const row of table) {
    const { field, value } = row;

    switch (field) {
      case 'patternName':
        overrides.patternName = value;
        break;
      case 'description':
        // Handle escaped newlines
        overrides.description = value.replace(/\\n/g, '\n');
        break;
      case 'status':
        overrides.status = value as 'roadmap' | 'active' | 'completed' | 'deferred';
        break;
      case 'uses':
        overrides.uses = value.split(',').map((s) => s.trim());
        break;
      case 'usedBy':
        overrides.usedBy = value.split(',').map((s) => s.trim());
        break;
      case 'whenToUse':
        overrides.whenToUse = value.split(',').map((s) => s.trim());
        break;
    }
  }

  return overrides;
}

// =============================================================================
// Feature: Lint Rules
// =============================================================================

const feature = await loadFeature('tests/features/lint/lint-rules.feature');

describeFeature(feature, ({ Scenario, Background, AfterEachScenario }) => {
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

  Scenario('Detect missing pattern name', ({ Given, When, Then, And }) => {
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

  Scenario('Detect empty string pattern name', ({ Given, When, Then, And }) => {
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

  Scenario('Detect whitespace-only pattern name', ({ Given, When, Then, And }) => {
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

  Scenario('Accept valid pattern name', ({ Given, When, Then }) => {
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

  Scenario('Include file and line in violation', ({ Given, When, Then, And }) => {
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

  // ===========================================================================
  // missing-status rule
  // ===========================================================================

  Scenario('Detect missing status', ({ Given, When, Then, And }) => {
    Given('a directive without status', () => {
      state!.directive = createTestDirective();
    });

    When('I apply the missing-status rule', () => {
      state!.violation = missingStatus.check(state!.directive, state!.filePath, state!.lineNumber);
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

  Scenario('Accept completed status', ({ Given, When, Then }) => {
    Given('a directive with status {string}', (_ctx: unknown, status: string) => {
      state!.directive = createTestDirective({
        status: status as 'roadmap' | 'active' | 'completed' | 'deferred',
      });
    });

    When('I apply the missing-status rule', () => {
      state!.violation = missingStatus.check(state!.directive, state!.filePath, state!.lineNumber);
    });

    Then('no violation should be detected', () => {
      expect(state!.violation).toBeNull();
    });
  });

  Scenario('Accept active status', ({ Given, When, Then }) => {
    Given('a directive with status {string}', (_ctx: unknown, status: string) => {
      state!.directive = createTestDirective({
        status: status as 'roadmap' | 'active' | 'completed' | 'deferred',
      });
    });

    When('I apply the missing-status rule', () => {
      state!.violation = missingStatus.check(state!.directive, state!.filePath, state!.lineNumber);
    });

    Then('no violation should be detected', () => {
      expect(state!.violation).toBeNull();
    });
  });

  Scenario('Accept roadmap status', ({ Given, When, Then }) => {
    Given('a directive with status {string}', (_ctx: unknown, status: string) => {
      state!.directive = createTestDirective({
        status: status as 'roadmap' | 'active' | 'completed' | 'deferred',
      });
    });

    When('I apply the missing-status rule', () => {
      state!.violation = missingStatus.check(state!.directive, state!.filePath, state!.lineNumber);
    });

    Then('no violation should be detected', () => {
      expect(state!.violation).toBeNull();
    });
  });

  Scenario('Accept deferred status', ({ Given, When, Then }) => {
    Given('a directive with status {string}', (_ctx: unknown, status: string) => {
      state!.directive = createTestDirective({
        status: status as 'roadmap' | 'active' | 'completed' | 'deferred',
      });
    });

    When('I apply the missing-status rule', () => {
      state!.violation = missingStatus.check(state!.directive, state!.filePath, state!.lineNumber);
    });

    Then('no violation should be detected', () => {
      expect(state!.violation).toBeNull();
    });
  });

  // ===========================================================================
  // missing-when-to-use rule
  // ===========================================================================

  Scenario('Detect missing whenToUse', ({ Given, When, Then, And }) => {
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

  Scenario('Detect empty whenToUse array', ({ Given, When, Then }) => {
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

  Scenario('Accept whenToUse with content', ({ Given, When, Then }) => {
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

  // ===========================================================================
  // tautological-description rule
  // ===========================================================================

  Scenario('Detect description that equals pattern name', ({ Given, When, Then, And }) => {
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

  Scenario(
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

  Scenario('Detect short description starting with pattern name', ({ Given, When, Then }) => {
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

  Scenario('Accept description with substantial content after name', ({ Given, When, Then }) => {
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

  Scenario('Accept meaningfully different description', ({ Given, When, Then }) => {
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

  Scenario('Ignore empty descriptions', ({ Given, When, Then }) => {
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

  Scenario('Ignore missing pattern name', ({ Given, When, Then }) => {
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

  Scenario('Skip headings when finding first line', ({ Given, When, Then }) => {
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

  Scenario('Skip "When to use" sections when finding first line', ({ Given, When, Then }) => {
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

  // ===========================================================================
  // missing-relationships rule
  // ===========================================================================

  Scenario('Detect missing relationship tags', ({ Given, When, Then, And }) => {
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

  Scenario('Detect empty uses array', ({ Given, When, Then }) => {
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

  Scenario('Accept uses with content', ({ Given, When, Then }) => {
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

  Scenario('Accept usedBy with content', ({ Given, When, Then }) => {
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

  Scenario('Accept both uses and usedBy', ({ Given, When, Then }) => {
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

  // ===========================================================================
  // Default Rules Collection
  // ===========================================================================

  Scenario('Default rules contains all 8 rules', ({ When, Then }) => {
    When('I check the default rules collection', () => {
      state!.rules = defaultRules;
    });

    Then('it should contain {int} rules', (_ctx: unknown, count: number) => {
      expect(state!.rules).toHaveLength(count);
    });
  });

  Scenario('Default rules have unique IDs', ({ When, Then }) => {
    When('I check the default rules collection', () => {
      state!.rules = defaultRules;
    });

    Then('all rule IDs should be unique', () => {
      const ids = state!.rules.map((r) => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  Scenario('Default rules are ordered by severity', ({ When, Then, And }) => {
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

  Scenario('Default rules include all named rules', ({ When, Then }) => {
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

  // ===========================================================================
  // Filter by Severity
  // ===========================================================================

  Scenario('Filter returns all rules for info severity', ({ When, Then }) => {
    When('I filter rules by minimum severity {string}', (_ctx: unknown, severity: string) => {
      state!.filteredRules = filterRulesBySeverity(defaultRules, severity as LintSeverity);
    });

    Then('I should get {int} rules', (_ctx: unknown, count: number) => {
      expect(state!.filteredRules).toHaveLength(count);
    });
  });

  Scenario('Filter excludes info rules for warning severity', ({ When, Then, And }) => {
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

  Scenario('Filter returns only errors for error severity', ({ When, Then, And }) => {
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
