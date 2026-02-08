/**
 * Scope Validator Step Definitions
 *
 * Tests for validateScope, formatScopeValidation, and composable check functions.
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  validateScope,
  formatScopeValidation,
  type ScopeValidationResult,
} from '../../../../src/api/scope-validator.js';
import { QueryApiError } from '../../../../src/api/types.js';
import { createTestPattern } from '../../../fixtures/pattern-factories.js';
import { createTestMasterDataset } from '../../../fixtures/dataset-factories.js';
import { createProcessStateAPI } from '../../../../src/api/process-state.js';
import type { ProcessStateAPI } from '../../../../src/api/process-state.js';
import type { ExtractedPattern } from '../../../../src/validation-schemas/index.js';
import type { MasterDataset } from '../../../../src/validation-schemas/master-dataset.js';

const feature = await loadFeature('tests/features/api/session-support/scope-validator.feature');

// =============================================================================
// Test State
// =============================================================================

interface ScopeValidatorTestState {
  api: ProcessStateAPI | null;
  dataset: MasterDataset | null;
  result: ScopeValidationResult | null;
  formattedOutput: string;
  thrownError: unknown;
}

let state: ScopeValidatorTestState | null = null;

function initState(): ScopeValidatorTestState {
  return {
    api: null,
    dataset: null,
    result: null,
    formattedOutput: '',
    thrownError: null,
  };
}

function buildApiAndDataset(patterns: ExtractedPattern[]): {
  api: ProcessStateAPI;
  dataset: MasterDataset;
} {
  const dataset = createTestMasterDataset({ patterns });
  const api = createProcessStateAPI(dataset);
  return { api, dataset };
}

// =============================================================================
// Feature
// =============================================================================

describeFeature(feature, ({ Rule }) => {
  // ===========================================================================
  // Rule 1: Implementation scope validation
  // ===========================================================================

  Rule('Implementation scope validation checks all prerequisites', ({ RuleScenario }) => {
    RuleScenario('All implementation checks pass', ({ Given, When, Then, And }) => {
      Given('a pattern with all implementation prerequisites met', () => {
        state = initState();
      });

      When('validating scope for implement session', () => {
        const depA = createTestPattern({
          name: 'DepA',
          status: 'completed',
          filePath: 'specs/dep-a.feature',
        });
        const depB = createTestPattern({
          name: 'DepB',
          status: 'completed',
          filePath: 'specs/dep-b.feature',
        });
        const stub = createTestPattern({
          name: 'MyStub',
          filePath: 'delivery-process/stubs/MyPattern/my-stub.ts',
          status: 'roadmap',
          implementsPatterns: ['MyPattern'],
          targetPath: 'src/api/my-impl.ts',
          description: 'AD-1: First decision (PDR-001)',
        });
        const focal = createTestPattern({
          name: 'MyPattern',
          status: 'roadmap',
          filePath: 'specs/my-pattern.feature',
          dependsOn: ['DepA', 'DepB'],
          deliverables: [
            { name: 'D1', status: 'planned', tests: 0, location: 'src/a.ts' },
            { name: 'D2', status: 'planned', tests: 0, location: 'src/b.ts' },
            { name: 'D3', status: 'planned', tests: 0, location: 'src/c.ts' },
          ],
          behaviorFile: 'tests/features/my-pattern.feature',
        });

        const { api, dataset } = buildApiAndDataset([focal, depA, depB, stub]);
        state!.api = api;
        state!.dataset = dataset;
        state!.result = validateScope(api, dataset, {
          patternName: 'MyPattern',
          scopeType: 'implement',
          baseDir: '/test',
        });
      });

      Then('the verdict is "ready"', () => {
        expect(state!.result!.verdict).toBe('ready');
      });

      And('all checks have severity PASS', () => {
        for (const check of state!.result!.checks) {
          expect(check.severity).toBe('PASS');
        }
      });
    });

    RuleScenario('Incomplete dependency blocks implementation', ({ Given, When, Then, And }) => {
      Given('a pattern depending on an incomplete dependency', () => {
        state = initState();
      });

      When('validating scope for implement session', () => {
        const depA = createTestPattern({
          name: 'DepA',
          status: 'roadmap',
          filePath: 'specs/dep-a.feature',
        });
        const focal = createTestPattern({
          name: 'BlockedPattern',
          status: 'roadmap',
          filePath: 'specs/blocked.feature',
          dependsOn: ['DepA'],
          deliverables: [{ name: 'D1', status: 'planned', tests: 0, location: 'src/a.ts' }],
        });

        const { api, dataset } = buildApiAndDataset([focal, depA]);
        state!.api = api;
        state!.dataset = dataset;
        state!.result = validateScope(api, dataset, {
          patternName: 'BlockedPattern',
          scopeType: 'implement',
          baseDir: '/test',
        });
      });

      Then('the verdict is "blocked"', () => {
        expect(state!.result!.verdict).toBe('blocked');
      });

      And('the dependencies check shows BLOCKED', () => {
        const depsCheck = state!.result!.checks.find((c) => c.id === 'dependencies-completed');
        expect(depsCheck).toBeDefined();
        expect(depsCheck!.severity).toBe('BLOCKED');
      });
    });

    RuleScenario(
      'FSM transition from completed blocks implementation',
      ({ Given, When, Then, And }) => {
        Given('a pattern with completed status', () => {
          state = initState();
        });

        When('validating scope for implement session', () => {
          const focal = createTestPattern({
            name: 'CompletedPattern',
            status: 'completed',
            filePath: 'specs/completed.feature',
            deliverables: [{ name: 'D1', status: 'Complete', tests: 1, location: 'src/a.ts' }],
          });

          const { api, dataset } = buildApiAndDataset([focal]);
          state!.api = api;
          state!.dataset = dataset;
          state!.result = validateScope(api, dataset, {
            patternName: 'CompletedPattern',
            scopeType: 'implement',
            baseDir: '/test',
          });
        });

        Then('the verdict is "blocked"', () => {
          expect(state!.result!.verdict).toBe('blocked');
        });

        And('the FSM check shows BLOCKED', () => {
          const fsmCheck = state!.result!.checks.find((c) => c.id === 'fsm-allows-transition');
          expect(fsmCheck).toBeDefined();
          expect(fsmCheck!.severity).toBe('BLOCKED');
        });
      }
    );

    RuleScenario('Missing PDR references produce WARN', ({ Given, When, Then, And }) => {
      Given('a pattern with no stubs or PDR references', () => {
        state = initState();
      });

      When('validating scope for implement session', () => {
        const focal = createTestPattern({
          name: 'NoPdrPattern',
          status: 'roadmap',
          filePath: 'specs/no-pdr.feature',
          deliverables: [{ name: 'D1', status: 'planned', tests: 0, location: 'src/a.ts' }],
        });

        const { api, dataset } = buildApiAndDataset([focal]);
        state!.api = api;
        state!.dataset = dataset;
        state!.result = validateScope(api, dataset, {
          patternName: 'NoPdrPattern',
          scopeType: 'implement',
          baseDir: '/test',
        });
      });

      Then('the design decisions check shows WARN', () => {
        const ddCheck = state!.result!.checks.find((c) => c.id === 'design-decisions-recorded');
        expect(ddCheck).toBeDefined();
        expect(ddCheck!.severity).toBe('WARN');
      });

      And('the verdict is not blocked', () => {
        expect(state!.result!.verdict).not.toBe('blocked');
      });
    });

    RuleScenario('No deliverables blocks implementation', ({ Given, When, Then }) => {
      Given('a pattern with no deliverables defined', () => {
        state = initState();
      });

      When('validating scope for implement session', () => {
        const focal = createTestPattern({
          name: 'EmptyPattern',
          status: 'roadmap',
          filePath: 'specs/empty.feature',
        });

        const { api, dataset } = buildApiAndDataset([focal]);
        state!.api = api;
        state!.dataset = dataset;
        state!.result = validateScope(api, dataset, {
          patternName: 'EmptyPattern',
          scopeType: 'implement',
          baseDir: '/test',
        });
      });

      Then('the deliverables check shows BLOCKED', () => {
        const delCheck = state!.result!.checks.find((c) => c.id === 'deliverables-defined');
        expect(delCheck).toBeDefined();
        expect(delCheck!.severity).toBe('BLOCKED');
      });
    });

    RuleScenario('Strict mode promotes WARN to BLOCKED', ({ Given, When, Then, And }) => {
      Given('a pattern with warnings but no blockers', () => {
        state = initState();
      });

      When('validating scope with strict mode', () => {
        // Pattern with deliverables but no PDR refs and no executable specs → 2 WARNs
        const focal = createTestPattern({
          name: 'WarnPattern',
          status: 'roadmap',
          filePath: 'specs/warn.feature',
          deliverables: [{ name: 'D1', status: 'planned', tests: 0, location: 'src/a.ts' }],
        });

        const { api, dataset } = buildApiAndDataset([focal]);
        state!.api = api;
        state!.dataset = dataset;
        state!.result = validateScope(api, dataset, {
          patternName: 'WarnPattern',
          scopeType: 'implement',
          baseDir: '/test',
          strict: true,
        });
      });

      Then('the verdict is "blocked"', () => {
        expect(state!.result!.verdict).toBe('blocked');
      });

      And('warnings are promoted to BLOCKED severity', () => {
        const warnChecks = state!.result!.checks.filter((c) => c.severity === 'WARN');
        expect(warnChecks).toHaveLength(0);
        const blockedChecks = state!.result!.checks.filter((c) => c.severity === 'BLOCKED');
        expect(blockedChecks.length).toBeGreaterThan(0);
      });
    });

    RuleScenario('Pattern not found throws error', ({ Given, When, Then }) => {
      Given('no patterns in the dataset', () => {
        state = initState();
        const { api, dataset } = buildApiAndDataset([]);
        state.api = api;
        state.dataset = dataset;
      });

      When('validating scope for a nonexistent pattern', () => {
        try {
          validateScope(state!.api!, state!.dataset!, {
            patternName: 'NonExistent',
            scopeType: 'implement',
            baseDir: '/test',
          });
        } catch (err) {
          state!.thrownError = err;
        }
      });

      Then('a PATTERN_NOT_FOUND error is thrown', () => {
        expect(state!.thrownError).toBeInstanceOf(QueryApiError);
        expect((state!.thrownError as QueryApiError).code).toBe('PATTERN_NOT_FOUND');
      });
    });
  });

  // ===========================================================================
  // Rule 2: Design scope validation
  // ===========================================================================

  Rule('Design scope validation checks dependency stubs', ({ RuleScenario }) => {
    RuleScenario('Design session with no dependencies passes', ({ Given, When, Then }) => {
      Given('a pattern with no dependencies', () => {
        state = initState();
      });

      When('validating scope for design session', () => {
        const focal = createTestPattern({
          name: 'NoDeps',
          status: 'roadmap',
          filePath: 'specs/no-deps.feature',
        });

        const { api, dataset } = buildApiAndDataset([focal]);
        state!.api = api;
        state!.dataset = dataset;
        state!.result = validateScope(api, dataset, {
          patternName: 'NoDeps',
          scopeType: 'design',
          baseDir: '/test',
        });
      });

      Then('the verdict is "ready"', () => {
        expect(state!.result!.verdict).toBe('ready');
      });
    });

    RuleScenario(
      'Design session with dependencies lacking stubs produces WARN',
      ({ Given, When, Then, And }) => {
        Given('a pattern with dependencies that have no stubs', () => {
          state = initState();
        });

        When('validating scope for design session', () => {
          const dep = createTestPattern({
            name: 'DepWithoutStubs',
            status: 'completed',
            filePath: 'specs/dep.feature',
          });
          const focal = createTestPattern({
            name: 'DesignTarget',
            status: 'roadmap',
            filePath: 'specs/design-target.feature',
            dependsOn: ['DepWithoutStubs'],
          });

          const { api, dataset } = buildApiAndDataset([focal, dep]);
          state!.api = api;
          state!.dataset = dataset;
          state!.result = validateScope(api, dataset, {
            patternName: 'DesignTarget',
            scopeType: 'design',
            baseDir: '/test',
          });
        });

        Then('the stubs check shows WARN', () => {
          const stubsCheck = state!.result!.checks.find((c) => c.id === 'stubs-from-deps-exist');
          expect(stubsCheck).toBeDefined();
          expect(stubsCheck!.severity).toBe('WARN');
        });

        And('the blocker names include the dependency without stubs', () => {
          const stubsCheck = state!.result!.checks.find((c) => c.id === 'stubs-from-deps-exist');
          expect(stubsCheck!.blockerNames).toBeDefined();
          expect(stubsCheck!.blockerNames).toContain('DepWithoutStubs');
        });
      }
    );
  });

  // ===========================================================================
  // Rule 3: Formatter
  // ===========================================================================

  Rule('Formatter produces structured text output', ({ RuleScenario }) => {
    RuleScenario('Formatter produces markers per ADR-008', ({ Given, When, Then, And }) => {
      Given('a scope validation result for pattern TestPattern', () => {
        state = initState();
        state.result = {
          pattern: 'TestPattern',
          scopeType: 'implement',
          checks: [
            {
              id: 'dependencies-completed',
              label: 'Dependencies completed',
              severity: 'PASS',
              detail: '2/2 completed',
            },
          ],
          verdict: 'ready',
          blockerCount: 0,
          warnCount: 0,
        };
      });

      When('formatting the scope validation result', () => {
        state!.formattedOutput = formatScopeValidation(state!.result!);
      });

      Then('the output contains the scope validation header', () => {
        expect(state!.formattedOutput).toContain(
          '=== SCOPE VALIDATION: TestPattern (implement) ==='
        );
      });

      And('the output contains the checklist marker', () => {
        expect(state!.formattedOutput).toContain('=== CHECKLIST ===');
      });

      And('the output contains the verdict marker', () => {
        expect(state!.formattedOutput).toContain('=== VERDICT ===');
      });
    });

    RuleScenario('Formatter shows warnings verdict text', ({ Given, When, Then }) => {
      Given('a scope validation result with warnings but no blockers', () => {
        state = initState();
        state.result = {
          pattern: 'WarnPattern',
          scopeType: 'implement',
          checks: [
            {
              id: 'dependencies-completed',
              label: 'Dependencies completed',
              severity: 'PASS',
              detail: '2/2 completed',
            },
            {
              id: 'design-decisions-recorded',
              label: 'Design decisions recorded',
              severity: 'WARN',
              detail: 'No PDR references found in stubs',
            },
          ],
          verdict: 'warnings',
          blockerCount: 0,
          warnCount: 1,
        };
      });

      When('formatting the scope validation result', () => {
        state!.formattedOutput = formatScopeValidation(state!.result!);
      });

      Then('the output contains READY with warning count', () => {
        expect(state!.formattedOutput).toContain('READY (with 1 warning(s))');
      });
    });

    RuleScenario(
      'Formatter shows blocker details for blocked verdict',
      ({ Given, When, Then, And }) => {
        Given('a scope validation result with blockers', () => {
          state = initState();
          state.result = {
            pattern: 'BlockedPattern',
            scopeType: 'implement',
            checks: [
              {
                id: 'dependencies-completed',
                label: 'Dependencies completed',
                severity: 'BLOCKED',
                detail: '0/2 completed',
                blockerNames: ['DepA (roadmap)', 'DepB (active)'],
              },
              {
                id: 'fsm-allows-transition',
                label: 'FSM allows transition',
                severity: 'PASS',
                detail: 'roadmap → active is valid',
              },
            ],
            verdict: 'blocked',
            blockerCount: 1,
            warnCount: 0,
          };
        });

        When('formatting the scope validation result', () => {
          state!.formattedOutput = formatScopeValidation(state!.result!);
        });

        Then('the output contains BLOCKED in the verdict section', () => {
          expect(state!.formattedOutput).toContain('BLOCKED:');
        });

        And('the output lists each blocker with its detail', () => {
          expect(state!.formattedOutput).toContain('Dependencies completed');
          expect(state!.formattedOutput).toContain('Blockers: DepA (roadmap), DepB (active)');
        });
      }
    );
  });
});
