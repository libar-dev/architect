import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  parseAndProjectDependencyTree,
  type DependencyTree,
  type ProjectionBundle,
  type ProjectionContext,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext, createRelationshipEntry } from './support.js';

interface DependencyTreeState {
  context: ProjectionContext | null;
  bundle: ProjectionBundle<DependencyTree> | null;
}

const feature = await loadFeature(
  'tests/features/projections/pattern-relations/dependency-tree.feature',
);

let state: DependencyTreeState | null = null;

function createState(): DependencyTreeState {
  return {
    context: null,
    bundle: null,
  };
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given, And }) => {
    Given('the Pattern Relations dependency tree state is initialized', () => {
      state = createState();
    });
    And('the following deliverables:', () => void 0);
  });

  Rule(
    'Dependency trees keep the fragment contract while preserving legacy traversal semantics',
    ({ RuleScenario }) => {
      RuleScenario('maxDepth truncates deep dependency chains', ({ Given, When, Then }) => {
        Given('a dependency tree context with a five-level chain rooted at "PatternGraph"', () => {
          const patternNames = [
            'PatternGraph',
            'PatternHelpers',
            'ContextAssembler',
            'PatternGraphSearch',
            'PatternBrowserView',
          ];
          state!.context = createProjectionContext({
            patterns: patternNames.map((name) => createPattern(name)),
            relationshipIndex: {
              PatternGraph: createRelationshipEntry({ enables: ['PatternHelpers'] }),
              PatternHelpers: createRelationshipEntry({
                dependsOn: ['PatternGraph'],
                enables: ['ContextAssembler'],
              }),
              ContextAssembler: createRelationshipEntry({
                dependsOn: ['PatternHelpers'],
                enables: ['PatternGraphSearch'],
              }),
              PatternGraphSearch: createRelationshipEntry({
                dependsOn: ['ContextAssembler'],
                enables: ['PatternBrowserView'],
              }),
              PatternBrowserView: createRelationshipEntry({
                dependsOn: ['PatternGraphSearch'],
              }),
            },
          });
        });

        When('I project the dependency tree for "PatternGraphSearch" with max depth 2', () => {
          state!.bundle = parseAndProjectDependencyTree(state!.context!, {
            pattern: 'PatternGraphSearch',
            maxDepth: 2,
            includeImplementationDeps: false,
          });
        });

        Then('the dependency tree should truncate descendants at depth 2', () => {
          expect(state!.bundle?.root).toEqual({
            kind: 'DependencyTree',
            root: 'PatternGraph',
            nodes: [
              {
                name: 'PatternGraph',
                status: 'active',
                phase: 49,
                isFocal: false,
                truncated: false,
                children: [
                  {
                    name: 'PatternHelpers',
                    status: 'active',
                    phase: 49,
                    isFocal: false,
                    truncated: false,
                    children: [
                      {
                        name: 'ContextAssembler',
                        status: 'active',
                        phase: 49,
                        isFocal: false,
                        truncated: true,
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
            options: {
              maxDepth: 2,
              includeImplementationDeps: false,
            },
          });
        });
      });

      RuleScenario(
        'dependency cycles stop recursion without malformed output',
        ({ Given, When, Then }) => {
          Given('a dependency tree context with a dependency cycle', () => {
            state!.context = createProjectionContext({
              patterns: [createPattern('CycleRoot'), createPattern('CycleChild')],
              relationshipIndex: {
                CycleRoot: createRelationshipEntry({ enables: ['CycleChild'] }),
                CycleChild: createRelationshipEntry({
                  dependsOn: ['CycleRoot'],
                  enables: ['CycleRoot'],
                }),
              },
            });
          });

          When('I project the dependency tree for "CycleRoot" with max depth 5', () => {
            state!.bundle = parseAndProjectDependencyTree(state!.context!, {
              pattern: 'CycleRoot',
              maxDepth: 5,
              includeImplementationDeps: false,
            });
          });

          Then('the dependency tree should keep the cycle leaf childless', () => {
            expect(state!.bundle?.root.nodes[0]?.children[0]?.children[0]).toEqual({
              name: 'CycleRoot',
              status: 'active',
              phase: 49,
              isFocal: true,
              truncated: false,
              children: [],
            });
          });
        },
      );

      RuleScenario(
        'missing relationship indices fall back to a single focal root',
        ({ Given, When, Then }) => {
          Given('a dependency tree context without a relationship index', () => {
            state!.context = createProjectionContext({
              patterns: [createPattern('SoloPattern')],
            });
          });

          When('I project the dependency tree for "SoloPattern" with max depth 3', () => {
            state!.bundle = parseAndProjectDependencyTree(state!.context!, {
              pattern: 'SoloPattern',
              maxDepth: 3,
              includeImplementationDeps: true,
            });
          });

          Then('the dependency tree should keep only the focal root node', () => {
            expect(state!.bundle?.root).toEqual({
              kind: 'DependencyTree',
              root: 'SoloPattern',
              nodes: [
                {
                  name: 'SoloPattern',
                  status: 'active',
                  phase: 49,
                  isFocal: true,
                  truncated: false,
                  children: [],
                },
              ],
              options: {
                maxDepth: 3,
                includeImplementationDeps: true,
              },
            });
          });
        },
      );
    },
  );
});
