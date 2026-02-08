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
}

let state: ScopeValidatorTestState | null = null;

function initState(): ScopeValidatorTestState {
  return {
    api: null,
    dataset: null,
    result: null,
    formattedOutput: '',
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
  });
});
