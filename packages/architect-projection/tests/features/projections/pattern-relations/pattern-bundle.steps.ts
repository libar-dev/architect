import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  projectPatternBundle,
  type PatternBundleEntry,
  type ProjectionBundle,
  type ProjectionContext,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext, createRelationshipEntry } from './support.js';

interface PatternBundleState {
  context: ProjectionContext | null;
  bundle: ProjectionBundle<PatternBundleEntry> | null;
  caughtError: unknown;
}

const feature = await loadFeature(
  'tests/features/projections/pattern-relations/pattern-bundle.feature',
);

let state: PatternBundleState | null = null;

function createState(): PatternBundleState {
  return {
    context: null,
    bundle: null,
    caughtError: null,
  };
}

function seedBundleContext(): ProjectionContext {
  return createProjectionContext({
    patterns: [
      createPattern('ParentEpic', {
        status: 'completed',
        level: 'epic',
        children: ['ChildAlpha', 'ChildBeta'],
        description:
          '**Problem:** Parent bundles need one query.\n\n**Solution:** Keep immediate child slices grouped under the epic.',
      }),
      createPattern('ChildAlpha', {
        parent: 'ParentEpic',
        uses: ['ChildBeta'],
        description:
          '**Problem:** Alpha needs a delivery owner.\n\n**Open Questions:**\n- Who owns the alpha follow-up?\n\n**Solution:** Keep alpha visible in bundle output.',
        rules: [
          {
            name: 'Alpha bundle data stays grouped',
            description:
              '**Invariant:** Alpha bundle data must keep its open questions and dependencies together.\n\n**Verified by:** Alpha child scenario',
            scenarioCount: 1,
            scenarioNames: ['Alpha child scenario'],
          },
        ],
      }),
      createPattern('ChildBeta', {
        parent: 'ParentEpic',
        description:
          '**Problem:** Beta still needs a rollout signal.\n\n**Open Questions:**\n- What beta rollout signal is durable?\n\n**Solution:** Preserve beta scenarios in bundle output.',
        rules: [
          {
            name: 'Beta scenarios remain visible',
            description:
              '**Invariant:** Bundle scenario extraction must preserve beta scenario names.\n\n**Verified by:** Beta child scenario',
            scenarioCount: 1,
            scenarioNames: ['Beta child scenario'],
          },
        ],
      }),
    ],
    relationshipIndex: {
      ParentEpic: createRelationshipEntry(),
      ChildAlpha: createRelationshipEntry({ uses: ['ChildBeta'] }),
      ChildBeta: createRelationshipEntry(),
    },
  });
}

const reverseTraceFeatureFile =
  'packages/architect-core/tests/features/read-api/reverse-trace-api.feature';

function seedReverseTraceBundleContext(): ProjectionContext {
  return createProjectionContext({
    patterns: [
      createPattern('ReverseTraceApi', {
        file: 'packages/architect-core/src/read-api/reverse-trace-api.ts',
        description:
          '**Problem:** A TS pattern owns no inline rules.\n\n**Solution:** Follow implementedBy.',
      }),
      createPattern('ReverseTraceApiExecutableTests', {
        file: reverseTraceFeatureFile,
        implementsPatterns: ['ReverseTraceApi'],
        rules: [
          {
            name: 'Reverse trace surfaces realizing rules',
            description:
              '**Invariant:** The realizing feature owns the rule.\n\n**Verified by:** Reverse trace scenario',
            scenarioCount: 1,
            scenarioNames: ['Reverse trace scenario'],
          },
        ],
      }),
    ],
    relationshipIndex: {
      ReverseTraceApi: createRelationshipEntry({
        implementedBy: [{ name: 'ReverseTraceApiExecutableTests', file: reverseTraceFeatureFile }],
      }),
      ReverseTraceApiExecutableTests: createRelationshipEntry({
        implementsPatterns: ['ReverseTraceApi'],
      }),
    },
  });
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the pattern bundle projection state is initialized', () => {
      state = createState();
    });
  });

  Rule('Bundles compose summaries plus explicitly requested member blocks', ({ RuleScenario }) => {
    RuleScenario(
      'projecting a bundle with explicit include blocks',
      ({ Given, When, Then, And }) => {
        Given('a pattern bundle context with parent hierarchy', () => {
          state!.context = seedBundleContext();
        });

        When('I project the pattern bundle for "ParentEpic" with explicit includes', () => {
          state!.bundle = projectPatternBundle(state!.context!, {
            pattern: 'ParentEpic',
            include: ['rules', 'scenarios', 'deps', 'open-questions'],
          });
        });

        Then('the bundle root should list the immediate members', () => {
          expect(state!.bundle?.root.members).toEqual(['ChildAlpha', 'ChildBeta']);
          expect(Object.keys(state!.bundle?.children ?? {})).toEqual(['ChildAlpha', 'ChildBeta']);
        });

        And(
          'the child bundle entries should include rules scenarios dependencies and open questions',
          () => {
            expect(state!.bundle?.children['ChildAlpha']).toMatchObject({
              includes: ['rules', 'scenarios', 'deps', 'open-questions'],
              blocks: {
                rules: [{ ruleName: 'Alpha bundle data stays grouped' }],
                scenarios: [
                  {
                    ruleName: 'Alpha bundle data stays grouped',
                    scenarios: ['Alpha child scenario'],
                  },
                ],
                deps: { uses: ['ChildBeta'] },
                openQuestions: ['Who owns the alpha follow-up?'],
              },
            });
            expect(state!.bundle?.children['ChildBeta']).toMatchObject({
              blocks: {
                rules: [{ ruleName: 'Beta scenarios remain visible' }],
                scenarios: [
                  { ruleName: 'Beta scenarios remain visible', scenarios: ['Beta child scenario'] },
                ],
                openQuestions: ['What beta rollout signal is durable?'],
              },
            });
          },
        );
      },
    );

    RuleScenario('mode defaults populate implement includes', ({ Given, When, Then, And }) => {
      Given('a pattern bundle context with parent hierarchy', () => {
        state!.context = seedBundleContext();
      });

      When(
        'I project the pattern bundle for "ParentEpic" in implement mode with token estimates',
        () => {
          state!.bundle = projectPatternBundle(state!.context!, {
            pattern: 'ParentEpic',
            mode: 'implement',
            estimateTokens: true,
          });
        },
      );

      Then('the bundle root should use the implement default includes', () => {
        expect(state!.bundle?.root.includes).toEqual([
          'docstring',
          'rules',
          'scenarios',
          'deps',
          'open-questions',
        ]);
      });

      And('the bundle token estimates should use the char/4 heuristic', () => {
        expect(state!.bundle?.root.bundleTokenEstimate?.method).toBe('char/4');
        expect(state!.bundle?.root.tokenEstimate?.method).toBe('char/4');
        for (const child of Object.values(
          (state!.bundle?.children ?? {}) as Record<string, PatternBundleEntry>,
        )) {
          expect(child.tokenEstimate?.method).toBe('char/4');
          expect(
            child.blockTokenEstimates?.every(
              (entry: { estimate: { method?: string } }) => entry.estimate.method === 'char/4',
            ),
          ).toBe(true);
        }
      });
    });

    RuleScenario('rejecting an unknown bundle root', ({ Given, When, Then }) => {
      Given('a pattern bundle context with parent hierarchy', () => {
        state!.context = seedBundleContext();
      });

      When('I project the pattern bundle for "UnknownParent" with explicit includes', () => {
        try {
          state!.bundle = projectPatternBundle(state!.context!, {
            pattern: 'UnknownParent',
            include: ['rules'],
          });
        } catch (error) {
          state!.caughtError = error;
        }
      });

      Then(
        'the pattern bundle projection fails with "Pattern not found: \\"UnknownParent\\""',
        () => {
          expect(state!.caughtError).toBeInstanceOf(Error);
          expect((state!.caughtError as Error).message).toContain(
            'Pattern not found: "UnknownParent"',
          );
        },
      );
    });
  });

  Rule(
    "Review bundles surface a TS pattern's rules via the implementedBy edge",
    ({ RuleScenario }) => {
      RuleScenario(
        'review bundle for a TS pattern surfaces the realizing feature rules',
        ({ Given, When, Then }) => {
          Given(
            'a pattern bundle context where a TS pattern is realized by a rule-owning feature',
            () => {
              state!.context = seedReverseTraceBundleContext();
            },
          );

          When('I project the review-mode pattern bundle for "ReverseTraceApi"', () => {
            state!.bundle = projectPatternBundle(state!.context!, {
              pattern: 'ReverseTraceApi',
              mode: 'review',
            });
          });

          Then(
            "the bundle root blocks should include the realizing feature's rules and scenarios",
            () => {
              expect(state!.bundle?.root.blocks.rules).toEqual([
                expect.objectContaining({
                  ruleName: 'Reverse trace surfaces realizing rules',
                  feature: 'ReverseTraceApiExecutableTests',
                }),
              ]);
              expect(state!.bundle?.root.blocks.scenarios).toEqual([
                {
                  ruleName: 'Reverse trace surfaces realizing rules',
                  scenarios: ['Reverse trace scenario'],
                  count: 1,
                },
              ]);
            },
          );
        },
      );
    },
  );
});
