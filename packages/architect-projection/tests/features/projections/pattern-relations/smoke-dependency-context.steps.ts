import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  DependencyContextSchema,
  parseAndProjectDependencyContext,
  type DependencyContext,
  type ProjectionBundle,
  type ProjectionContext,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext, createRelationshipEntry } from './support.js';

interface SmokeState {
  context: ProjectionContext | null;
  bundle: ProjectionBundle<DependencyContext> | null;
}

const feature = await loadFeature(
  'tests/features/projections/pattern-relations/smoke-dependency-context.feature',
);

let state: SmokeState | null = null;

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the Pattern Relations smoke test state is initialized', () => {
      state = { context: null, bundle: null };
    });
  });

  Rule(
    'Dependency context runs against a minimal graph and produces a valid fragment',
    ({ RuleScenario }) => {
      RuleScenario(
        'smoke test projects a valid dependency context from a small graph with relationships',
        ({ Given, When, Then, And }) => {
          Given('a Pattern Relations context with three patterns and a dependency chain', () => {
            state!.context = createProjectionContext({
              patterns: [
                createPattern('RootLib'),
                createPattern('MiddleService'),
                createPattern('LeafConsumer'),
              ],
              relationshipIndex: {
                RootLib: createRelationshipEntry({ enables: ['MiddleService'] }),
                MiddleService: createRelationshipEntry({
                  dependsOn: ['RootLib'],
                  enables: ['LeafConsumer'],
                }),
                LeafConsumer: createRelationshipEntry({ dependsOn: ['MiddleService'] }),
              },
            });
          });

          When('I project the dependency context for the middle pattern', () => {
            state!.bundle = parseAndProjectDependencyContext(state!.context!, {
              pattern: 'MiddleService',
              maxDepth: 3,
            });
          });

          Then('the dependency context should validate against its Zod schema', () => {
            DependencyContextSchema.parse(state!.bundle!.root);
          });

          And('the dependency context should be focal-rooted at the middle pattern', () => {
            const fragment = state!.bundle!.root;
            expect(fragment.kind).toBe('DependencyContext');
            expect(fragment.focal).toBe('MiddleService');
            // upstream = prerequisites (what MiddleService needs)
            expect(fragment.upstream.map((node) => node.name)).toEqual(['RootLib']);
            // downstream = blast radius (what needs MiddleService)
            expect(fragment.downstream.map((node) => node.name)).toEqual(['LeafConsumer']);
          });
        },
      );
    },
  );
});
