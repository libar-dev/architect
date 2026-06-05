import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  detectAntiPatterns,
  detectDuplicateFeatureIdentities,
  detectFileChanges,
  detectProcessInCode,
  detectRemovedTags,
  runIdeaTierLint,
  runStepLint,
  validateChanges,
  IDEA_TIER_LINT_RULES,
  type ChangeDetection,
  type ProcessState,
} from '../../src/index.js';

const feature = await loadFeature('tests/features/guard-runtime.feature');

interface GuardRuntimeState {
  antiPatternViolations: ReturnType<typeof detectAntiPatterns> | null;
  changeDetectionResult: ReturnType<typeof detectFileChanges> | null;
  ideaTierSummary: ReturnType<typeof runIdeaTierLint> | null;
  processGuardOutput: ReturnType<typeof validateChanges> | null;
  processViolations: ReturnType<typeof detectProcessInCode> | null;
  removedTagViolations: ReturnType<typeof detectRemovedTags> | null;
  stepLintSummary: ReturnType<typeof runStepLint> | null;
  tempDirs: string[];
}

let state: GuardRuntimeState = createState();

function createState(): GuardRuntimeState {
  return {
    antiPatternViolations: null,
    changeDetectionResult: null,
    ideaTierSummary: null,
    processGuardOutput: null,
    processViolations: null,
    removedTagViolations: null,
    stepLintSummary: null,
    tempDirs: [],
  };
}

function createTempDir(prefix: string): string {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), prefix));
  state.tempDirs.push(tempDir);
  return tempDir;
}

const COMPLETED_SPEC = 'architect/specs/example.feature';
const ACTIVE_SPEC = 'architect/specs/active.feature';

function completedSpecState({ hasUnlockReason }: { hasUnlockReason: boolean }): ProcessState {
  return {
    derivedAt: '2026-01-01T00:00:00.000Z',
    files: new Map([
      [
        COMPLETED_SPEC,
        {
          path: '/tmp/example.feature',
          relativePath: COMPLETED_SPEC,
          status: 'completed',
          normalizedStatus: 'completed',
          protection: 'hard',
          deliverables: [],
          hasUnlockReason,
        },
      ],
    ]),
  };
}

function modifyCompletedSpecChanges(): ChangeDetection {
  return {
    modifiedFiles: [COMPLETED_SPEC],
    addedFiles: [],
    deletedFiles: [],
    statusTransitions: new Map(),
    deliverableChanges: new Map(),
  };
}

function activeSpecState(): ProcessState {
  return {
    derivedAt: '2026-01-01T00:00:00.000Z',
    files: new Map([
      [
        ACTIVE_SPEC,
        {
          path: '/tmp/active.feature',
          relativePath: ACTIVE_SPEC,
          status: 'active',
          normalizedStatus: 'active',
          protection: 'scope',
          deliverables: [],
          hasUnlockReason: false,
        },
      ],
    ]),
  };
}

function addDeliverableChanges({ pending }: { pending: boolean }): ChangeDetection {
  const added = ['src/new.ts'];
  return {
    modifiedFiles: [ACTIVE_SPEC],
    addedFiles: [],
    deletedFiles: [],
    statusTransitions: new Map(),
    deliverableChanges: new Map([
      [
        ACTIVE_SPEC,
        {
          added,
          addedPending: pending ? added : [],
          removed: [],
          modified: [],
        },
      ],
    ]),
  };
}

describeFeature(feature, ({ AfterEachScenario, Rule }) => {
  AfterEachScenario((): void => {
    for (const tempDir of state.tempDirs) {
      rmSync(tempDir, { recursive: true, force: true });
    }
    state = createState();
  });

  Rule('Guard runtime APIs preserve process enforcement behavior', ({ RuleScenario }): void => {
    RuleScenario(
      'Detect process metadata leaking into TypeScript annotations',
      ({ When, Then }): void => {
        When('I detect process metadata in TypeScript annotations', () => {
          state.processViolations = detectProcessInCode([
            {
              filePath: 'src/example.ts',
              directives: [
                {
                  directive: {
                    tags: ['@architect-team'],
                    position: { startLine: 12 },
                  },
                },
              ],
            },
          ] as never);
        });

        Then('one process metadata violation should be reported', () => {
          expect(state.processViolations).toHaveLength(1);
          expect(state.processViolations?.[0]?.id).toBe('process-in-code');
        });
      },
    );

    RuleScenario(
      'Pass custom tag prefixes through anti-pattern detection',
      ({ When, Then }): void => {
        When('I detect anti-patterns with a custom tag prefix', () => {
          state.antiPatternViolations = detectAntiPatterns(
            [
              {
                filePath: 'src/example.ts',
                directives: [
                  {
                    directive: {
                      tags: ['@acme-team'],
                      position: { startLine: 5 },
                    },
                  },
                ],
              },
            ] as never,
            [],
            {
              registry: { tagPrefix: '@acme-' } as never,
            },
          );
        });

        Then('one custom-prefix violation should mention {string}', (_ctx, tag: string) => {
          expect(state.antiPatternViolations).toHaveLength(1);
          expect(state.antiPatternViolations?.[0]?.message).toContain(tag);
        });
      },
    );

    RuleScenario(
      'Do not emit the removed historical tag-duplication anti-pattern id',
      ({ When, Then }): void => {
        When('I detect anti-patterns for architect process metadata', () => {
          state.antiPatternViolations = detectAntiPatterns(
            [
              {
                filePath: 'src/example.ts',
                directives: [
                  {
                    directive: {
                      tags: ['@architect-team'],
                      position: { startLine: 12 },
                    },
                  },
                ],
              },
            ] as never,
            [],
          );
        });

        Then('the removed tag-duplication anti-pattern id should not be reported', () => {
          expect(state.antiPatternViolations?.map((violation) => violation.id)).not.toContain(
            'tag-duplication',
          );
          expect(state.antiPatternViolations?.[0]?.id).toBe('process-in-code');
        });
      },
    );

    RuleScenario(
      'Flag the same @architect-pattern identity declared in two feature files',
      ({ When, Then }): void => {
        When('I detect anti-patterns for two features sharing one pattern identity', () => {
          // extractProcessMetadata reads feature.feature.tags (pattern: required),
          // so these fixtures exercise feature-LEVEL identity only — the same path the graph
          // builder uses, immune to @architect-pattern tokens inside scenario docstrings.
          state.antiPatternViolations = detectDuplicateFeatureIdentities([
            { filePath: 'cli/core.feature', feature: { tags: ['pattern:DupCli'] } },
            { filePath: 'cli/query.feature', feature: { tags: ['pattern:DupCli'] } },
          ] as never);
        });

        Then('a duplicate-pattern-identity violation is reported for each file', () => {
          const dups = state.antiPatternViolations?.filter(
            (violation) => violation.id === 'duplicate-pattern-identity',
          );
          expect(dups).toHaveLength(2);
          expect(dups?.every((violation) => violation.severity === 'error')).toBe(true);
          expect(dups?.map((violation) => violation.file).sort()).toEqual([
            'cli/core.feature',
            'cli/query.feature',
          ]);
        });
      },
    );

    RuleScenario(
      'Allow distinct pattern identities across feature files',
      ({ When, Then }): void => {
        When('I detect anti-patterns for two features with distinct pattern identities', () => {
          state.antiPatternViolations = detectDuplicateFeatureIdentities([
            { filePath: 'cli/core.feature', feature: { tags: ['pattern:AlphaCli'] } },
            { filePath: 'cli/query.feature', feature: { tags: ['pattern:BetaCli'] } },
          ] as never);
        });

        Then('no duplicate-pattern-identity violation is reported', () => {
          expect(
            state.antiPatternViolations?.some(
              (violation) => violation.id === 'duplicate-pattern-identity',
            ),
          ).toBe(false);
        });
      },
    );

    RuleScenario('Flag retired taxonomy tags as removed tags', ({ When, Then, And }): void => {
      When('I detect removed tags in a feature using retired ADR-013 taxonomy tags', () => {
        const baseDir = createTempDir('architect-guard-removed-tags-');
        const filePath = path.join(baseDir, 'retired.feature');
        // The retired ADR-013 tags must flag; the status/level look-alikes
        // (@architect-status:completed, @architect-level:phase) must NOT —
        // matching is on the full <prefix><suffix> token, not a substring.
        writeFileSync(
          filePath,
          [
            '@architect-quarter:2026-Q1',
            '@architect-phase:2',
            '@architect-release:v1.0.0',
            '@architect-completed:2026-01-07',
            '@architect-effort:1w',
            '@architect-effort-actual:2w',
            '@architect-risk:high',
            '@architect-priority:critical',
            '@architect-since:design-session-1',
            '@architect-user-role:developer',
            '@architect-business-value:eliminate-context-loss',
            '@architect-status:completed',
            '@architect-level:phase',
            'Feature: Retired tag usage',
            '',
            '  Scenario: Placeholder',
            '    Given a step',
          ].join('\n'),
        );

        state.removedTagViolations = detectRemovedTags([{ filePath }] as never);
      });

      Then('a removed-tag violation is reported for each retired tag', () => {
        const flaggedTokens = (state.removedTagViolations ?? []).map((v) =>
          v.message.split('"')[1]?.toLowerCase(),
        );
        expect(state.removedTagViolations?.every((v) => v.id === 'removed-tag')).toBe(true);
        expect(flaggedTokens).toContain('@architect-quarter:2026-q1');
        expect(flaggedTokens).toContain('@architect-phase:2');
        expect(flaggedTokens).toContain('@architect-release:v1.0.0');
        expect(flaggedTokens).toContain('@architect-completed:2026-01-07');
        expect(flaggedTokens).toContain('@architect-effort:1w');
        expect(flaggedTokens).toContain('@architect-effort-actual:2w');
        expect(flaggedTokens).toContain('@architect-risk:high');
        expect(flaggedTokens).toContain('@architect-priority:critical');
        expect(flaggedTokens).toContain('@architect-since:design-session-1');
        expect(flaggedTokens).toContain('@architect-user-role:developer');
        expect(flaggedTokens).toContain('@architect-business-value:eliminate-context-loss');
      });

      And('no removed-tag violation is reported for the status or level look-alikes', () => {
        const flaggedTokens = (state.removedTagViolations ?? []).map((v) =>
          v.message.split('"')[1]?.toLowerCase(),
        );
        expect(flaggedTokens).not.toContain('@architect-status:completed');
        expect(flaggedTokens).not.toContain('@architect-level:phase');
      });
    });

    RuleScenario(
      'Warn on completed spec edits without unlock reason',
      ({ When, Then, And }): void => {
        When('I validate a completed spec edit without unlock reason', () => {
          state.processGuardOutput = validateChanges({
            state: completedSpecState({ hasUnlockReason: false }),
            changes: modifyCompletedSpecChanges(),
            options: { strict: false, ignoreSession: false },
          });
        });

        Then('the process guard should warn for completed protection', () => {
          expect(state.processGuardOutput?.result.warnings[0]?.rule).toBe('completed-protection');
          expect(state.processGuardOutput?.result.warnings[0]?.severity).toBe('warning');
        });

        And('the process guard should not block the change', () => {
          expect(state.processGuardOutput?.result.valid).toBe(true);
          expect(state.processGuardOutput?.result.violations).toHaveLength(0);
        });
      },
    );

    RuleScenario(
      'Suppress completed-protection warning with unlock reason',
      ({ When, Then, And }): void => {
        When('I validate a completed spec edit with an unlock reason', () => {
          state.processGuardOutput = validateChanges({
            state: completedSpecState({ hasUnlockReason: true }),
            changes: modifyCompletedSpecChanges(),
            options: { strict: false, ignoreSession: false },
          });
        });

        Then('the process guard should not warn for completed protection', () => {
          expect(
            state.processGuardOutput?.result.warnings.some(
              (w) => w.rule === 'completed-protection',
            ),
          ).toBe(false);
        });

        And('the process guard should not block the change', () => {
          expect(state.processGuardOutput?.result.valid).toBe(true);
          expect(state.processGuardOutput?.result.violations).toHaveLength(0);
        });
      },
    );

    RuleScenario('Warn on pending scope added to an active spec', ({ When, Then, And }): void => {
      When('I validate a pending deliverable added to an active spec', () => {
        state.processGuardOutput = validateChanges({
          state: activeSpecState(),
          changes: addDeliverableChanges({ pending: true }),
          options: { strict: false, ignoreSession: false },
        });
      });

      Then('the process guard should warn for scope creep', () => {
        expect(state.processGuardOutput?.result.warnings[0]?.rule).toBe('scope-creep');
        expect(state.processGuardOutput?.result.warnings[0]?.severity).toBe('warning');
      });

      And('the process guard should not block the change', () => {
        expect(state.processGuardOutput?.result.valid).toBe(true);
        expect(state.processGuardOutput?.result.violations).toHaveLength(0);
      });
    });

    RuleScenario(
      'Stay silent on real-progress scope added to an active spec',
      ({ When, Then, And }): void => {
        When('I validate an in-progress deliverable added to an active spec', () => {
          state.processGuardOutput = validateChanges({
            state: activeSpecState(),
            changes: addDeliverableChanges({ pending: false }),
            options: { strict: false, ignoreSession: false },
          });
        });

        Then('the process guard should not warn for scope creep', () => {
          expect(
            state.processGuardOutput?.result.warnings.some((w) => w.rule === 'scope-creep'),
          ).toBe(false);
        });

        And('the process guard should not block the change', () => {
          expect(state.processGuardOutput?.result.valid).toBe(true);
          expect(state.processGuardOutput?.result.violations).toHaveLength(0);
        });
      },
    );

    RuleScenario(
      'Strict mode promotes the completed-protection warning to a blocking error',
      ({ When, Then }): void => {
        When('I validate a completed spec edit without unlock reason in strict mode', () => {
          state.processGuardOutput = validateChanges({
            state: completedSpecState({ hasUnlockReason: false }),
            changes: modifyCompletedSpecChanges(),
            options: { strict: true, ignoreSession: false },
          });
        });

        Then('the process guard should block the change for completed protection', () => {
          expect(state.processGuardOutput?.result.valid).toBe(false);
          expect(state.processGuardOutput?.result.violations[0]?.rule).toBe('completed-protection');
          expect(state.processGuardOutput?.result.violations[0]?.severity).toBe('error');
        });
      },
    );

    RuleScenario('Run step lint from the guard package', ({ When, Then }): void => {
      When('I run step lint against a temporary feature pair', () => {
        const baseDir = createTempDir('architect-guard-step-lint-');
        mkdirSync(path.join(baseDir, 'tests', 'features'), { recursive: true });
        mkdirSync(path.join(baseDir, 'tests', 'steps'), { recursive: true });

        writeFileSync(
          path.join(baseDir, 'tests', 'features', 'demo.feature'),
          ['Feature: Demo', '', '  Scenario: Success', '    Given the demo is ready'].join('\n'),
        );
        writeFileSync(
          path.join(baseDir, 'tests', 'steps', 'demo.steps.ts'),
          [
            "import { defineFeature, loadFeature } from '@amiceli/vitest-cucumber';",
            '',
            "const feature = loadFeature('tests/features/demo.feature');",
            '',
            'defineFeature(feature, (test) => {',
            "  test('Success', ({ given }) => {",
            "    given('the demo is ready', () => {});",
            '  });',
            '});',
          ].join('\n'),
        );

        state.stepLintSummary = runStepLint({ baseDir });
      });

      Then('the step-lint summary should have no errors', () => {
        expect(state.stepLintSummary?.errorCount).toBe(0);
      });
    });

    RuleScenario(
      'Detect status transitions for added files in files mode',
      ({ When, Then }): void => {
        When('I detect file changes for a newly added active spec', () => {
          const baseDir = createTempDir('architect-guard-added-file-');
          execFileSync('git', ['init'], { cwd: baseDir, stdio: 'ignore' });
          mkdirSync(path.join(baseDir, 'architect', 'specs'), { recursive: true });

          const relativePath = 'architect/specs/new-pattern.feature';
          writeFileSync(
            path.join(baseDir, relativePath),
            [
              '@architect-status:active',
              'Feature: Added pattern',
              '',
              '  Background:',
              '    | Deliverable | Status |',
              '    | src/example.ts | pending |',
            ].join('\n'),
          );

          state.changeDetectionResult = detectFileChanges(baseDir, [relativePath], {
            featurePatterns: ['architect/specs/**/*.feature'],
          });
        });

        Then('the file-change result should include a roadmap to active transition', () => {
          expect(state.changeDetectionResult?.ok).toBe(true);
          if (state.changeDetectionResult?.ok !== true) {
            return;
          }

          expect(state.changeDetectionResult.value.addedFiles).toContain(
            'architect/specs/new-pattern.feature',
          );
          expect(
            state.changeDetectionResult.value.statusTransitions.get(
              'architect/specs/new-pattern.feature',
            ),
          ).toMatchObject({
            from: 'roadmap',
            to: 'active',
            isNewFile: true,
          });
          expect(
            state.changeDetectionResult.value.deliverableChanges.get(
              'architect/specs/new-pattern.feature',
            )?.added,
          ).toContain('src/example.ts');
        });
      },
    );

    RuleScenario('Idea-tier soft lint passes on a clean idea-tier spec', ({ When, Then }): void => {
      When('I run idea-tier lint against a clean idea-tier spec', () => {
        const baseDir = createTempDir('architect-guard-idea-tier-clean-');
        mkdirSync(path.join(baseDir, 'architect', 'specs'), { recursive: true });

        writeFileSync(
          path.join(baseDir, 'architect', 'specs', 'clean-idea.feature'),
          [
            '@architect',
            '@architect-pattern:CleanIdea',
            '@architect-status:candidate',
            '@architect-maturity:idea',
            '@architect-product-area:Desktop',
            '@architect-parent:DesktopShell',
            'Feature: CleanIdea - tightly scoped idea',
            '',
            '  **Idea:** Capture a small idea worth exploring.',
            '',
            '  Rule: Idea has a single load-bearing constraint',
            '',
            '    **Invariant:** The idea must remain expressible in one sentence.',
          ].join('\n'),
        );

        state.ideaTierSummary = runIdeaTierLint({ baseDir });
      });

      Then('the idea-tier summary should have no warnings', () => {
        expect(state.ideaTierSummary?.warningCount).toBe(0);
        expect(state.ideaTierSummary?.errorCount).toBe(0);
      });
    });

    RuleScenario(
      'Idea-tier soft lint warns on scenarios in an idea-tier spec',
      ({ When, Then, And }): void => {
        When('I run idea-tier lint against an idea-tier spec containing a scenario', () => {
          const baseDir = createTempDir('architect-guard-idea-tier-warn-');
          mkdirSync(path.join(baseDir, 'architect', 'specs'), { recursive: true });

          writeFileSync(
            path.join(baseDir, 'architect', 'specs', 'with-scenario.feature'),
            [
              '@architect',
              '@architect-pattern:WithScenario',
              '@architect-status:candidate',
              '@architect-maturity:idea',
              '@architect-product-area:Desktop',
              '@architect-parent:DesktopShell',
              'Feature: WithScenario - idea with premature scenario',
              '',
              '  **Idea:** Catch this — scenarios should not appear at idea-tier.',
              '',
              '  Rule: Scenarios belong at plan-level',
              '',
              '    **Invariant:** Idea-tier captures rules-with-invariants only.',
              '',
              '    Scenario: Premature scenario',
              '      Given the user opens the spec',
              '      Then the system should warn about the early scenario',
            ].join('\n'),
          );

          state.ideaTierSummary = runIdeaTierLint({ baseDir });
        });

        Then('the idea-tier summary should report a no-scenarios warning', () => {
          const ruleIds = (state.ideaTierSummary?.results ?? []).flatMap((r) =>
            r.violations.map((v) => v.rule),
          );
          expect(ruleIds).toContain(IDEA_TIER_LINT_RULES.noScenarios.id);
        });

        And('the idea-tier summary should have no errors', () => {
          expect(state.ideaTierSummary?.errorCount).toBe(0);
        });
      },
    );

    RuleScenario(
      'Idea-tier soft lint skips legacy candidate specs without explicit maturity',
      ({ When, Then, And }): void => {
        When('I run idea-tier lint against a candidate spec without explicit maturity', () => {
          const baseDir = createTempDir('architect-guard-idea-tier-legacy-');
          mkdirSync(path.join(baseDir, 'architect', 'specs'), { recursive: true });

          writeFileSync(
            path.join(baseDir, 'architect', 'specs', 'legacy-candidate.feature'),
            [
              '@architect',
              '@architect-pattern:LegacyCandidate',
              '@architect-status:candidate',
              '@architect-product-area:Desktop',
              'Feature: LegacyCandidate - plan-tier candidate without explicit maturity',
              '',
              '  Background:',
              '    | Deliverable | Status |',
              '    | src/legacy.ts | pending |',
              '',
              '  Scenario: Legacy plan-tier scenario',
              '    Given the user opens the spec',
              '    Then the system should accept it',
            ].join('\n'),
          );

          state.ideaTierSummary = runIdeaTierLint({ baseDir });
        });

        Then('the idea-tier summary should have no warnings', () => {
          expect(state.ideaTierSummary?.warningCount).toBe(0);
        });

        And('the idea-tier summary should have no errors', () => {
          expect(state.ideaTierSummary?.errorCount).toBe(0);
        });
      },
    );

    RuleScenario(
      'Idea-tier soft lint waives parent requirement for epic-level specs',
      ({ When, Then, And }): void => {
        When('I run idea-tier lint against an epic-level idea-tier spec without parent', () => {
          const baseDir = createTempDir('architect-guard-idea-tier-epic-');
          mkdirSync(path.join(baseDir, 'architect', 'specs'), { recursive: true });

          writeFileSync(
            path.join(baseDir, 'architect', 'specs', 'epic-idea.feature'),
            [
              '@architect',
              '@architect-pattern:LifecycleMvpEpic',
              '@architect-status:candidate',
              '@architect-maturity:idea',
              '@architect-product-area:Process',
              '@architect-level:epic',
              'Feature: LifecycleMvpEpic - top-of-chain epic idea',
              '',
              '  **Idea:** Group lifecycle MVP work as a single epic.',
              '',
              '  Rule: Epic groups related ideas',
              '',
              '    **Invariant:** Members are listed under **Members:**.',
            ].join('\n'),
          );

          state.ideaTierSummary = runIdeaTierLint({ baseDir });
        });

        Then('the idea-tier summary should not report an insufficient-tags warning', () => {
          const ruleIds = (state.ideaTierSummary?.results ?? []).flatMap((r) =>
            r.violations.map((v) => v.rule),
          );
          expect(ruleIds).not.toContain(IDEA_TIER_LINT_RULES.insufficientTags.id);
        });

        And('the idea-tier summary should have no errors', () => {
          expect(state.ideaTierSummary?.errorCount).toBe(0);
        });
      },
    );

    RuleScenario(
      'Idea-tier soft lint waives parent requirement for slice-level specs',
      ({ When, Then, And }): void => {
        When('I run idea-tier lint against a slice-level idea-tier spec without parent', () => {
          const baseDir = createTempDir('architect-guard-idea-tier-slice-');
          mkdirSync(path.join(baseDir, 'architect', 'specs'), { recursive: true });

          writeFileSync(
            path.join(baseDir, 'architect', 'specs', 'slice-idea.feature'),
            [
              '@architect',
              '@architect-pattern:LifecycleMvpSlice',
              '@architect-status:candidate',
              '@architect-maturity:idea',
              '@architect-product-area:Process',
              '@architect-level:slice',
              'Feature: LifecycleMvpSlice - cross-cutting slice idea',
              '',
              '  **Idea:** A view across patterns, not delivery work.',
              '',
              '  Rule: Slice describes a cross-cutting view',
              '',
              '    **Invariant:** Slices are exempt from the parent requirement.',
            ].join('\n'),
          );

          state.ideaTierSummary = runIdeaTierLint({ baseDir });
        });

        Then('the idea-tier summary should not report an insufficient-tags warning', () => {
          const ruleIds = (state.ideaTierSummary?.results ?? []).flatMap((r) =>
            r.violations.map((v) => v.rule),
          );
          expect(ruleIds).not.toContain(IDEA_TIER_LINT_RULES.insufficientTags.id);
        });

        And('the idea-tier summary should have no errors', () => {
          expect(state.ideaTierSummary?.errorCount).toBe(0);
        });
      },
    );
  });
});
