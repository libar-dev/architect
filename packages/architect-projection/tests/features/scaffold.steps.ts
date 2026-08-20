import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import type { PatternGraph } from '@libar-dev/architect-core';
import { expect } from 'vitest';

import {
  BlockSchema,
  code,
  collapsible,
  heading,
  linkOut,
  list,
  mermaid,
  paragraph,
  separator,
  table,
  type Block,
} from '@libar-dev/architect-core';
import type { Fragment, ProjectionContext, TagExampleOverrides } from '../../src/index.js';
import { createTestPackageResolver } from '../support/test-package-resolver.js';

interface ScaffoldState {
  blocks: Block[];
  results: { success: boolean }[];
  context: ProjectionContext | null;
  emptyChildren: Record<string, Fragment>;
}

let state: ScaffoldState | null = null;

function createState(): ScaffoldState {
  return {
    blocks: [],
    results: [],
    context: null,
    emptyChildren: {},
  };
}

const feature = await loadFeature('tests/features/scaffold.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the projection scaffold state is initialized', () => {
      state = createState();
    });
  });

  Rule('Canonical block vocabulary is available in the new package', ({ RuleScenario }) => {
    RuleScenario(
      'Canonical blocks parse and explicit projection context can be created',
      ({ Given, When, Then, And }) => {
        Given('all canonical block builders are used', () => {
          state!.blocks = [
            heading(2, 'Projection foundations'),
            paragraph('Wave 1 establishes the package scaffold.'),
            separator(),
            table(
              ['Artifact', 'Status'],
              [
                ['blocks/schema.ts', 'scaffolded'],
                ['context/projection-context.ts', 'scaffolded'],
              ],
              ['left', 'left'],
            ),
            list(['heading', { text: 'collapsible', checked: true }]),
            code('export type Fragment = never;', 'ts'),
            mermaid('graph TD; A[ProjectionContext] --> B[Renderers]'),
            collapsible('Future work', [paragraph('Wave 2 will extend the fragment union.')]),
            linkOut(
              'Projection plan',
              '.sisyphus/plans/ddd-projections-refactoring-opus-4.7-bkp-rtry.md',
            ),
          ];
        });

        When('the blocks are validated against the canonical schema', () => {
          state!.results = state!.blocks.map((block) => BlockSchema.safeParse(block));
        });

        And('an explicit projection context is created', () => {
          const tagExampleOverrides: TagExampleOverrides = {};

          state!.context = {
            graph: {} as PatternGraph,
            packageResolver: createTestPackageResolver(),
            tagExampleOverrides,
          };
        });

        Then('every canonical block should validate successfully', () => {
          expect(state!.results.every((result) => result.success)).toBe(true);
        });

        And('the projection context should keep runtime inputs local', () => {
          expect(state!.context).toMatchObject({
            tagExampleOverrides: {},
          });
          expect(state!.emptyChildren).toEqual({});
        });
      },
    );
  });
});
