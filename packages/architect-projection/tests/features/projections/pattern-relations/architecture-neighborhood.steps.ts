import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  projectArchitectureComparison,
  projectBoundedContext,
  projectArchitectureNeighborhood,
  projectOrphanPatternList,
  type ArchitectureComparison,
  type BoundedContext,
  type ArchitectureNeighborhood,
  type OrphanPatternList,
  type ProjectionBundle,
  type ProjectionContext,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext, createRelationshipEntry } from './support.js';

interface ArchitectureNeighborhoodState {
  comparison: ArchitectureComparison | null;
  boundedContextProjection: BoundedContext | null;
  context: ProjectionContext | null;
  orphanPatternList: OrphanPatternList | null;
  bundle: ProjectionBundle<ArchitectureNeighborhood> | null;
}

const feature = await loadFeature(
  'tests/features/projections/pattern-relations/architecture-neighborhood.feature'
);

let state: ArchitectureNeighborhoodState | null = null;

function createState(): ArchitectureNeighborhoodState {
  return {
    comparison: null,
    boundedContextProjection: null,
    context: null,
    orphanPatternList: null,
    bundle: null,
  };
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given, And }) => {
    Given('the Pattern Relations architecture neighborhood state is initialized', () => {
      state = createState();
    });
    And('the following deliverables:', () => void 0);
  });

  Rule(
    'Architecture neighborhoods preserve directional coverage without leaking raw DTOs',
    ({ RuleScenario }) => {
      RuleScenario(
        'architecture neighborhoods include all relationship directions',
        ({ Given, When, Then }) => {
          Given('an architecture neighborhood context with full direction coverage', () => {
            state!.context = createProjectionContext({
              patterns: [
                createPattern('PatternGraphAPI', {
                  archContext: 'api',
                  archLayer: 'application',
                }),
                createPattern('ContextAssemblerImpl', {
                  archContext: 'api',
                  archLayer: 'application',
                }),
              ],
              relationshipIndex: {
                PatternGraphAPI: createRelationshipEntry({
                  uses: ['PatternHelpers'],
                  usedBy: ['PatternBrowserView'],
                  dependsOn: ['PatternGraph'],
                  enables: ['ArchitectMcpServer'],
                  implementsPatterns: ['PatternGraphReadModel'],
                  implementedBy: [
                    {
                      name: 'PatternGraphAPIImpl',
                      file: 'packages/architect-query/src/pattern-graph-api.ts',
                      description: 'Concrete API adapter',
                    },
                  ],
                }),
              },
              includeArchIndex: true,
            });
          });

          When('I project the architecture neighborhood for "PatternGraphAPI"', () => {
            state!.bundle = projectArchitectureNeighborhood(state!.context!, 'PatternGraphAPI');
          });

          Then(
            'the architecture neighborhood should include all direction buckets and structured implementation refs',
            () => {
              expect(state!.bundle?.root).toEqual({
                kind: 'ArchitectureNeighborhood',
                pattern: 'PatternGraphAPI',
                context: 'api',
                role: 'service',
                layer: 'application',
                uses: ['PatternHelpers'],
                usedBy: ['PatternBrowserView'],
                dependsOn: ['PatternGraph'],
                enables: ['ArchitectMcpServer'],
                sameContext: ['ContextAssemblerImpl'],
                implements: ['PatternGraphReadModel'],
                implementedBy: [
                  {
                    name: 'PatternGraphAPIImpl',
                    file: 'packages/architect-query/src/pattern-graph-api.ts',
                    description: 'Concrete API adapter',
                  },
                ],
              });
            }
          );
        }
      );

      RuleScenario(
        'missing relationship indices keep neighborhood metadata but empty directional arrays',
        ({ Given, When, Then }) => {
          Given('an architecture neighborhood context without a relationship index', () => {
            state!.context = createProjectionContext({
              patterns: [
                createPattern('PatternGraphAPI', {
                  archContext: 'api',
                  archLayer: 'application',
                }),
                createPattern('ContextAssemblerImpl', {
                  archContext: 'api',
                  archLayer: 'application',
                }),
              ],
              includeArchIndex: true,
            });
          });

          When('I project the architecture neighborhood for "PatternGraphAPI"', () => {
            state!.bundle = projectArchitectureNeighborhood(state!.context!, 'PatternGraphAPI');
          });

          Then(
            'the architecture neighborhood should keep empty directional arrays and preserve same-context neighbors',
            () => {
              expect(state!.bundle?.root).toMatchObject({
                pattern: 'PatternGraphAPI',
                context: 'api',
                sameContext: ['ContextAssemblerImpl'],
                uses: [],
                usedBy: [],
                dependsOn: [],
                enables: [],
                implements: [],
                implementedBy: [],
              });
            }
          );
        }
      );

      RuleScenario(
        'missing architecture indices remove same-context neighbors only',
        ({ Given, When, Then }) => {
          Given('an architecture neighborhood context without an architecture index', () => {
            state!.context = createProjectionContext({
              patterns: [
                createPattern('PatternGraphAPI', {
                  archContext: 'api',
                  archLayer: 'application',
                }),
                createPattern('ContextAssemblerImpl', {
                  archContext: 'api',
                  archLayer: 'application',
                }),
              ],
              relationshipIndex: {
                PatternGraphAPI: createRelationshipEntry({ uses: ['PatternHelpers'] }),
              },
            });
          });

          When('I project the architecture neighborhood for "PatternGraphAPI"', () => {
            state!.bundle = projectArchitectureNeighborhood(state!.context!, 'PatternGraphAPI');
          });

          Then('the architecture neighborhood should keep sameContext empty', () => {
            expect(state!.bundle?.root.sameContext).toEqual([]);
            expect(state!.bundle?.root.uses).toEqual(['PatternHelpers']);
          });
        }
      );
    }
  );

  Rule('Bounded-context navigation stays projection-owned', ({ RuleScenario }) => {
    const buildNavigationContext = (): void => {
      state!.context = createProjectionContext({
        patterns: [
          createPattern('ScannerFormatter', {
            archContext: 'scanner',
            archLayer: 'application',
            role: 'service',
          }),
          createPattern('ScannerAssembler', {
            archContext: 'scanner',
            archLayer: 'domain',
            role: 'service',
          }),
          createPattern('CodecFormatter', {
            archContext: 'codec',
            archLayer: 'application',
            role: 'projection',
          }),
          createPattern('SharedUtil', {
            archContext: 'shared',
            archLayer: 'infrastructure',
            role: 'infra',
          }),
        ],
        relationshipIndex: {
          ScannerFormatter: createRelationshipEntry({
            uses: ['SharedUtil'],
            dependsOn: ['CodecFormatter'],
          }),
          ScannerAssembler: createRelationshipEntry({
            uses: ['SharedUtil'],
          }),
          CodecFormatter: createRelationshipEntry({
            uses: ['SharedUtil'],
            dependsOn: ['ScannerAssembler'],
          }),
          SharedUtil: createRelationshipEntry({
            usedBy: ['ScannerFormatter', 'ScannerAssembler', 'CodecFormatter'],
          }),
        },
        includeArchIndex: true,
      });
    };

    RuleScenario(
      'bounded-context catalog groups patterns by bounded context',
      ({ Given, When, Then }) => {
        Given('an architecture navigation context with multiple contexts and layers', () => {
          buildNavigationContext();
        });

        When('I project the bounded-context catalog', () => {
          state!.boundedContextProjection = projectBoundedContext(state!.context!).root;
        });

        Then('the bounded-context catalog should summarize each bounded context', () => {
          expect(state!.boundedContextProjection).toEqual({
            kind: 'BoundedContext',
            entries: [
              {
                name: 'codec',
                patternCount: 1,
                patterns: ['CodecFormatter'],
                layers: ['application'],
                roles: ['projection'],
              },
              {
                name: 'scanner',
                patternCount: 2,
                patterns: ['ScannerAssembler', 'ScannerFormatter'],
                layers: ['application', 'domain'],
                roles: ['service'],
              },
              {
                name: 'shared',
                patternCount: 1,
                patterns: ['SharedUtil'],
                layers: ['infrastructure'],
                roles: ['infra'],
              },
            ],
          });
        });
      }
    );

    RuleScenario(
      'bounded-context catalog derives layers without per-context layer scans',
      ({ Given, When, Then }) => {
        Given('an architecture navigation context with guarded layer buckets', () => {
          buildNavigationContext();

          const byLayer = state!.context?.graph.archIndex?.byLayer ?? {};
          for (const layerPatterns of Object.values(byLayer)) {
            Object.defineProperty(layerPatterns, 'some', {
              configurable: true,
              value: () => {
                throw new Error(
                  'layer bucket some() should not be used during bounded-context assembly'
                );
              },
            });
          }
        });

        When('I project the bounded-context catalog', () => {
          state!.boundedContextProjection = projectBoundedContext(state!.context!).root;
        });

        Then('the bounded-context catalog should summarize each bounded context', () => {
          expect(state!.boundedContextProjection).toEqual({
            kind: 'BoundedContext',
            entries: [
              {
                name: 'codec',
                patternCount: 1,
                patterns: ['CodecFormatter'],
                layers: ['application'],
                roles: ['projection'],
              },
              {
                name: 'scanner',
                patternCount: 2,
                patterns: ['ScannerAssembler', 'ScannerFormatter'],
                layers: ['application', 'domain'],
                roles: ['service'],
              },
              {
                name: 'shared',
                patternCount: 1,
                patterns: ['SharedUtil'],
                layers: ['infrastructure'],
                roles: ['infra'],
              },
            ],
          });
        });
      }
    );

    RuleScenario(
      'orphan pattern lists include only disconnected patterns',
      ({ Given, When, Then }) => {
        Given('an architecture navigation context with connected and orphaned patterns', () => {
          state!.context = createProjectionContext({
            patterns: [
              createPattern('ConnectedSource'),
              createPattern('ConnectedTarget'),
              createPattern('ExtendedPattern'),
              createPattern('OrphanAlpha', {
                status: 'roadmap',
                file: 'packages/architect-projection/fixtures/orphan-alpha.ts',
              }),
              createPattern('OrphanBeta', {
                status: 'completed',
                file: 'packages/architect-projection/fixtures/orphan-beta.ts',
              }),
            ],
            relationshipIndex: {
              ConnectedSource: createRelationshipEntry({
                dependsOn: ['ConnectedTarget'],
              }),
              ConnectedTarget: createRelationshipEntry({
                usedBy: ['ConnectedSource'],
              }),
              ExtendedPattern: createRelationshipEntry({
                extendsPattern: 'ConnectedTarget',
              }),
            },
          });
        });

        When('I project the orphan pattern list', () => {
          state!.orphanPatternList = projectOrphanPatternList(state!.context!).root;
        });

        Then('the orphan pattern list should include only disconnected patterns', () => {
          expect(state!.orphanPatternList).toEqual({
            kind: 'OrphanPatternList',
            items: [
              {
                pattern: 'OrphanAlpha',
                status: 'roadmap',
                file: 'packages/architect-projection/fixtures/orphan-alpha.ts',
              },
              {
                pattern: 'OrphanBeta',
                status: 'completed',
                file: 'packages/architect-projection/fixtures/orphan-beta.ts',
              },
            ],
          });
        });
      }
    );

    RuleScenario(
      'architecture comparison highlights shared dependencies and cross-context edges',
      ({ Given, When, Then }) => {
        Given('an architecture navigation context with multiple contexts and layers', () => {
          buildNavigationContext();
        });

        When('I project the architecture comparison for "scanner" and "codec"', () => {
          state!.comparison = projectArchitectureComparison(
            state!.context!,
            'scanner',
            'codec'
          ).root;
        });

        Then(
          'the architecture comparison should expose shared dependencies and integration points',
          () => {
            expect(state!.comparison).toEqual({
              kind: 'ArchitectureComparison',
              context1: {
                name: 'scanner',
                patternCount: 2,
                patterns: ['ScannerAssembler', 'ScannerFormatter'],
                allDependencies: ['CodecFormatter', 'SharedUtil'],
              },
              context2: {
                name: 'codec',
                patternCount: 1,
                patterns: ['CodecFormatter'],
                allDependencies: ['ScannerAssembler', 'SharedUtil'],
              },
              sharedDependencies: ['SharedUtil'],
              uniqueToContext1: ['CodecFormatter'],
              uniqueToContext2: ['ScannerAssembler'],
              integrationPoints: [
                {
                  from: 'CodecFormatter',
                  fromContext: 'codec',
                  to: 'ScannerAssembler',
                  toContext: 'scanner',
                  relationship: 'dependsOn',
                },
                {
                  from: 'ScannerFormatter',
                  fromContext: 'scanner',
                  to: 'CodecFormatter',
                  toContext: 'codec',
                  relationship: 'dependsOn',
                },
              ],
            });
          }
        );
      }
    );
  });
});
