import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  DependencyTreeSchema,
  parseAndProjectDependencyTree,
  type DependencyTree,
  type ProjectionBundle,
  type ProjectionContext,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext, createRelationshipEntry } from './support.js';

interface SmokeState {
  context: ProjectionContext | null;
  bundle: ProjectionBundle<DependencyTree> | null;
}

const feature = await loadFeature(
  'tests/features/projections/pattern-relations/smoke-dependency-tree.feature',
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
    'Dependency tree runs against a minimal graph and produces a valid fragment',
    ({ RuleScenario }) => {
      RuleScenario(
        'smoke test projects a valid dependency tree from a small graph with relationships',
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

          When('I project the dependency tree for the middle pattern', () => {
            state!.bundle = parseAndProjectDependencyTree(state!.context!, {
              pattern: 'MiddleService',
              maxDepth: 3,
              includeImplementationDeps: false,
            });
          });

          Then('the dependency tree should validate against its Zod schema', () => {
            DependencyTreeSchema.parse(state!.bundle!.root);
          });

          And('the dependency tree root should be the ancestor of the chain', () => {
            expect(state!.bundle!.root.kind).toBe('DependencyTree');
            expect(state!.bundle!.root.root).toBe('RootLib');
            expect(state!.bundle!.root.nodes).toHaveLength(1);
            expect(state!.bundle!.root.nodes[0]!.name).toBe('RootLib');
          });
        },
      );
    },
  );
});
