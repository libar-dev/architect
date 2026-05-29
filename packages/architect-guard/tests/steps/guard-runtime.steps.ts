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
  runIdeaTierLint,
  runStepLint,
  validateChanges,
  validateDoDForPhase,
  IDEA_TIER_LINT_RULES,
  type ChangeDetection,
  type ProcessState,
} from '../../src/index.js';

const feature = await loadFeature('tests/features/guard-runtime.feature');

interface GuardRuntimeState {
  antiPatternViolations: ReturnType<typeof detectAntiPatterns> | null;
  changeDetectionResult: ReturnType<typeof detectFileChanges> | null;
  dodResult: ReturnType<typeof validateDoDForPhase> | null;
  ideaTierSummary: ReturnType<typeof runIdeaTierLint> | null;
  processGuardOutput: ReturnType<typeof validateChanges> | null;
  processViolations: ReturnType<typeof detectProcessInCode> | null;
  stepLintSummary: ReturnType<typeof runStepLint> | null;
  tempDirs: string[];
}

let state: GuardRuntimeState = createState();

function createState(): GuardRuntimeState {
  return {
    antiPatternViolations: null,
    changeDetectionResult: null,
    dodResult: null,
    ideaTierSummary: null,
    processGuardOutput: null,
    processViolations: null,
    stepLintSummary: null,
    tempDirs: [],
  };
}

function createTempDir(prefix: string): string {
  const tempDir = mkdtempSync(path.join(os.tmpdir(), prefix));
  state.tempDirs.push(tempDir);
  return tempDir;
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
      'Validate DoD deliverables and acceptance criteria',
      ({ When, Then, And }): void => {
        When('I validate DoD deliverables and acceptance criteria', () => {
          state.dodResult = validateDoDForPhase('ExamplePattern', 9, {
            deliverables: [{ name: 'src/example.ts', status: 'complete' }],
            scenarios: [
              {
                scenarioName: 'happy path',
                semanticTags: ['acceptance-criteria'],
                tags: [],
              },
            ],
          } as never);
        });

        Then('the DoD result should be met', () => {
          expect(state.dodResult?.isDoDMet).toBe(true);
        });

        And('the DoD result should not report missing acceptance criteria', () => {
          expect(state.dodResult?.missingAcceptanceCriteria).toBe(false);
        });
      },
    );

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
                    tags: ['@architect-quarter'],
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
                      tags: ['@acme-quarter'],
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
                      tags: ['@architect-quarter'],
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
          // extractProcessMetadata reads feature.feature.tags (pattern: + phase: required),
          // so these fixtures exercise feature-LEVEL identity only — the same path the graph
          // builder uses, immune to @architect-pattern tokens inside scenario docstrings.
          state.antiPatternViolations = detectDuplicateFeatureIdentities([
            { filePath: 'cli/core.feature', feature: { tags: ['pattern:DupCli', 'phase:24'] } },
            { filePath: 'cli/query.feature', feature: { tags: ['pattern:DupCli', 'phase:24'] } },
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
            { filePath: 'cli/core.feature', feature: { tags: ['pattern:AlphaCli', 'phase:24'] } },
            { filePath: 'cli/query.feature', feature: { tags: ['pattern:BetaCli', 'phase:24'] } },
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

    RuleScenario('Block completed spec edits without unlock reason', ({ When, Then }): void => {
      When('I validate a completed spec edit without unlock reason', () => {
        const processState: ProcessState = {
          derivedAt: '2026-01-01T00:00:00.000Z',
          files: new Map([
            [
              'architect/specs/example.feature',
              {
                path: '/tmp/example.feature',
                relativePath: 'architect/specs/example.feature',
                status: 'completed',
                normalizedStatus: 'completed',
                protection: 'hard',
                deliverables: [],
                hasUnlockReason: false,
              },
            ],
          ]),
        };
        const changes: ChangeDetection = {
          modifiedFiles: ['architect/specs/example.feature'],
          addedFiles: [],
          deletedFiles: [],
          statusTransitions: new Map(),
          deliverableChanges: new Map(),
        };

        state.processGuardOutput = validateChanges({
          state: processState,
          changes,
          options: { strict: false, ignoreSession: false },
        });
      });

      Then('the process guard should reject the change for completed protection', () => {
        expect(state.processGuardOutput?.result.valid).toBe(false);
        expect(state.processGuardOutput?.result.violations[0]?.rule).toBe('completed-protection');
      });
    });

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
