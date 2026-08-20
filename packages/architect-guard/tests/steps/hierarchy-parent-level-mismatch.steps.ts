import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import type { DocDirective, HierarchyLevel, LintViolation } from '@libar-dev/architect-core';

import { hierarchyParentLevelMismatch, type LintContext } from '../../src/lint/rules.js';

const feature = await loadFeature('tests/features/hierarchy-parent-level-mismatch.feature');

interface RuleHarnessState {
  directive: Partial<DocDirective> | null;
  patternLevels: Map<string, HierarchyLevel>;
  knownPatterns: Set<string>;
  result: LintViolation | LintViolation[] | null;
}

let state: RuleHarnessState = {
  directive: null,
  patternLevels: new Map(),
  knownPatterns: new Set(),
  result: null,
};

function resetState(): void {
  state = {
    directive: null,
    patternLevels: new Map(),
    knownPatterns: new Set(),
    result: null,
  };
}

describeFeature(feature, ({ AfterEachScenario, Rule }) => {
  AfterEachScenario((): void => {
    resetState();
  });

  Rule(
    'Parent target must carry @architect-level at strictly higher level',
    ({ RuleScenario }): void => {
      RuleScenario('Positive — task points at epic parent', ({ Given, And, When, Then }): void => {
        Given('a directive with parent target "RootEpic" and no declarer level', () => {
          state.directive = { parent: 'RootEpic' };
        });

        And('the registry maps "RootEpic" to level "epic"', () => {
          state.patternLevels.set('RootEpic', 'epic');
          state.knownPatterns.add('RootEpic');
        });

        When('I run the hierarchy-parent-level-mismatch check', () => {
          const ctx: LintContext = {
            knownPatterns: state.knownPatterns,
            patternLevels: state.patternLevels,
          };
          state.result = hierarchyParentLevelMismatch.check(
            state.directive as DocDirective,
            'fixture.feature',
            1,
            ctx,
          );
        });

        Then('no violation is reported', () => {
          expect(state.result).toBeNull();
        });
      });

      RuleScenario('Negative — task points at sibling task', ({ Given, And, When, Then }): void => {
        Given('a directive with parent target "SiblingTask" and no declarer level', () => {
          state.directive = { parent: 'SiblingTask' };
        });

        And('the registry maps "SiblingTask" to level "task"', () => {
          state.patternLevels.set('SiblingTask', 'task');
          state.knownPatterns.add('SiblingTask');
        });

        When('I run the hierarchy-parent-level-mismatch check', () => {
          const ctx: LintContext = {
            knownPatterns: state.knownPatterns,
            patternLevels: state.patternLevels,
          };
          state.result = hierarchyParentLevelMismatch.check(
            state.directive as DocDirective,
            'fixture.feature',
            1,
            ctx,
          );
        });

        Then('one hierarchy-parent-level-mismatch violation is reported', () => {
          const result = state.result;
          expect(result).not.toBeNull();
          const violations = Array.isArray(result) ? result : result === null ? [] : [result];
          expect(violations).toHaveLength(1);
          expect(violations[0]?.rule).toBe('hierarchy-parent-level-mismatch');
        });
      });
    },
  );
});
