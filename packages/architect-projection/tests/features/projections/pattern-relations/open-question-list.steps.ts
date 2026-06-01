import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  projectOpenQuestionList,
  type OpenQuestionList,
  type ProjectionBundle,
  type ProjectionContext,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext } from './support.js';

interface OpenQuestionListState {
  context: ProjectionContext | null;
  bundle: ProjectionBundle<OpenQuestionList> | null;
  caughtError: unknown;
}

const feature = await loadFeature(
  'tests/features/projections/pattern-relations/open-question-list.feature',
);

let state: OpenQuestionListState | null = null;

function createState(): OpenQuestionListState {
  return {
    context: null,
    bundle: null,
    caughtError: null,
  };
}

function seedOpenQuestionContext(): ProjectionContext {
  return createProjectionContext({
    patterns: [
      createPattern('ParentEpic', {
        level: 'epic',
        children: ['ChildAlpha', 'ChildBeta'],
        // Qualified heading (parenthetical before the colon) exercises the
        // extractOpenQuestions regex tolerance — a literal `**Open Questions:**`
        // match would silently drop the epic's own gating questions.
        description:
          '**Open Questions (resolved per use-case):**\n- What is the parent-level gating decision?',
      }),
      createPattern('EmptyEpic', {
        level: 'epic',
        children: [],
      }),
      createPattern('ChildAlpha', {
        parent: 'ParentEpic',
        description:
          '**Problem:** Alpha needs a decision.\n\n**Open Questions:**\n- Who owns Alpha?\n- Which signal closes it?\n\n**Solution:** Keep the questions visible.',
      }),
      createPattern('ChildBeta', {
        parent: 'ParentEpic',
        description: '**Problem:** Beta is decided.\n\n**Solution:** No open questions remain.',
      }),
      createPattern('UnrelatedPattern', {
        description:
          '**Open Questions:**\n- Should unrelated work stay out of parent filtered results?',
      }),
    ],
  });
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the open question list projection state is initialized', () => {
      state = createState();
    });
  });

  Rule('Open questions are omitted unless real normalized prose exists', ({ RuleScenario }) => {
    RuleScenario('projecting all open questions', ({ Given, When, Then }) => {
      Given('an open question context with parent hierarchy', () => {
        state!.context = seedOpenQuestionContext();
      });

      When('I project open questions without filters', () => {
        state!.bundle = projectOpenQuestionList(state!.context!);
      });

      Then('the open question list includes only patterns with real questions', () => {
        expect(state!.bundle?.root).toEqual({
          kind: 'OpenQuestionList',
          filters: {},
          count: 3,
          items: [
            {
              pattern: 'ChildAlpha',
              status: 'active',
              file: 'packages/architect-projection/fixtures/ChildAlpha.ts',
              questions: ['Who owns Alpha?', 'Which signal closes it?'],
            },
            {
              // Matched despite the parenthetical-qualified heading (regex tolerance).
              pattern: 'ParentEpic',
              status: 'active',
              file: 'packages/architect-projection/fixtures/ParentEpic.ts',
              questions: ['What is the parent-level gating decision?'],
            },
            {
              pattern: 'UnrelatedPattern',
              status: 'active',
              file: 'packages/architect-projection/fixtures/UnrelatedPattern.ts',
              questions: ['Should unrelated work stay out of parent filtered results?'],
            },
          ],
        });
      });
    });

    RuleScenario('parent-filtering open questions', ({ Given, When, Then }) => {
      Given('an open question context with parent hierarchy', () => {
        state!.context = seedOpenQuestionContext();
      });

      When('I project open questions for parent "ParentEpic"', () => {
        state!.bundle = projectOpenQuestionList(state!.context!, { parent: 'ParentEpic' });
      });

      Then('the open question list includes only questioned descendants of "ParentEpic"', () => {
        expect(state!.bundle?.root).toMatchObject({
          filters: { parent: 'ParentEpic' },
          count: 1,
          items: [
            { pattern: 'ChildAlpha', questions: ['Who owns Alpha?', 'Which signal closes it?'] },
          ],
        });
      });
    });

    RuleScenario(
      'including the focal parent own questions with include-self',
      ({ Given, When, Then }) => {
        Given('an open question context with parent hierarchy', () => {
          state!.context = seedOpenQuestionContext();
        });

        When('I project open questions for parent "ParentEpic" including self', () => {
          state!.bundle = projectOpenQuestionList(state!.context!, {
            parent: 'ParentEpic',
            includeSelf: true,
          });
        });

        Then('the open question list includes "ParentEpic" alongside its questioned descendants', () => {
          expect(state!.bundle?.root).toMatchObject({
            filters: { parent: 'ParentEpic' },
            count: 2,
            items: [
              { pattern: 'ChildAlpha', questions: ['Who owns Alpha?', 'Which signal closes it?'] },
              { pattern: 'ParentEpic', questions: ['What is the parent-level gating decision?'] },
            ],
          });
        });
      },
    );

    RuleScenario(
      'returning an empty list for a parent without questioned descendants',
      ({ Given, When, Then }) => {
        Given('an open question context with parent hierarchy', () => {
          state!.context = seedOpenQuestionContext();
        });

        When('I project open questions for parent "EmptyEpic"', () => {
          state!.bundle = projectOpenQuestionList(state!.context!, { parent: 'EmptyEpic' });
        });

        Then('the open question list is empty', () => {
          expect(state!.bundle?.root).toEqual({
            kind: 'OpenQuestionList',
            filters: { parent: 'EmptyEpic' },
            count: 0,
            items: [],
          });
        });
      },
    );

    RuleScenario('rejecting an unknown parent', ({ Given, When, Then }) => {
      Given('an open question context with parent hierarchy', () => {
        state!.context = seedOpenQuestionContext();
      });

      When('I project open questions for parent "UnknownParent"', () => {
        try {
          state!.bundle = projectOpenQuestionList(state!.context!, { parent: 'UnknownParent' });
        } catch (error) {
          state!.caughtError = error;
        }
      });

      Then(
        'the open question projection fails with "Parent pattern not found: UnknownParent"',
        () => {
          expect(state!.caughtError).toBeInstanceOf(Error);
          expect((state!.caughtError as Error).message).toBe(
            'Parent pattern not found: UnknownParent',
          );
        },
      );
    });
  });
});
