import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  parseAndProjectDependencyContext,
  type DependencyContext,
  type ProjectionBundle,
  type ProjectionContext,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext, createRelationshipEntry } from './support.js';

interface DependencyContextState {
  context: ProjectionContext | null;
  bundle: ProjectionBundle<DependencyContext> | null;
}

const feature = await loadFeature(
  'tests/features/projections/pattern-relations/dependency-context.feature',
);

let state: DependencyContextState | null = null;

function createState(): DependencyContextState {
  return {
    context: null,
    bundle: null,
  };
}

/** RootLib <- MiddleService <- LeafConsumer, with reverse edges populated so the
 * closure walks upstream (dependsOn) and downstream (usedBy) deterministically. */
function buildChainContext(): ProjectionContext {
  return createProjectionContext({
    patterns: [
      createPattern('RootLib'),
      createPattern('MiddleService'),
      createPattern('LeafConsumer'),
    ],
    relationshipIndex: {
      RootLib: createRelationshipEntry({ usedBy: ['MiddleService'] }),
      MiddleService: createRelationshipEntry({
        dependsOn: ['RootLib'],
        usedBy: ['LeafConsumer'],
      }),
      LeafConsumer: createRelationshipEntry({ dependsOn: ['MiddleService'] }),
    },
  });
}

/** Exact chain plus decision graft: LeafConsumer -> MiddleService -> RootLib
 * and ADR009 --dependsOn--> MiddleService plus ADR009 --see-also--> ADR006
 * --see-also--> ADR005. Non-decision see-also must stay unfollowed. */
function buildChainAndGovernanceContext(): ProjectionContext {
  return createProjectionContext({
    patterns: [
      createPattern('RootLib'),
      createPattern('MiddleService'),
      createPattern('LeafConsumer'),
      createPattern('ADR009ProjectionTrustBoundary', { adr: '009' }),
      createPattern('ADR006SingleReadModelArchitecture', { adr: '006' }),
      createPattern('ADR005CodecBasedMarkdownRendering', { adr: '005' }),
      createPattern('McpOutputSchemaValidation'),
    ],
    relationshipIndex: {
      RootLib: createRelationshipEntry({ usedBy: ['MiddleService'] }),
      MiddleService: createRelationshipEntry({
        dependsOn: ['RootLib'],
        usedBy: ['LeafConsumer', 'ADR009ProjectionTrustBoundary'],
      }),
      LeafConsumer: createRelationshipEntry({ dependsOn: ['MiddleService'] }),
      ADR009ProjectionTrustBoundary: createRelationshipEntry({
        dependsOn: ['MiddleService'],
        seeAlso: ['ADR006SingleReadModelArchitecture', 'McpOutputSchemaValidation'],
      }),
      ADR006SingleReadModelArchitecture: createRelationshipEntry({
        seeAlso: ['ADR005CodecBasedMarkdownRendering'],
      }),
      ADR005CodecBasedMarkdownRendering: createRelationshipEntry({}),
      McpOutputSchemaValidation: createRelationshipEntry({}),
    },
  });
}

/** ADR009 --see-also--> ADR006 --see-also--> ADR005, with a non-decision
 * see-also link (McpOutputSchemaValidation) that must not be followed. */
function buildGovernanceChainContext(): ProjectionContext {
  return createProjectionContext({
    patterns: [
      createPattern('ADR009ProjectionTrustBoundary', { adr: '009' }),
      createPattern('ADR006SingleReadModelArchitecture', { adr: '006' }),
      createPattern('ADR005CodecBasedMarkdownRendering', { adr: '005' }),
      createPattern('McpOutputSchemaValidation'),
    ],
    relationshipIndex: {
      ADR009ProjectionTrustBoundary: createRelationshipEntry({
        seeAlso: ['ADR006SingleReadModelArchitecture', 'McpOutputSchemaValidation'],
      }),
      ADR006SingleReadModelArchitecture: createRelationshipEntry({
        seeAlso: ['ADR005CodecBasedMarkdownRendering'],
      }),
      ADR005CodecBasedMarkdownRendering: createRelationshipEntry({}),
      McpOutputSchemaValidation: createRelationshipEntry({}),
    },
  });
}

/** Collects every node name appearing anywhere in a forest, depth-first. */
function flattenNames(nodes: DependencyContext['upstream']): string[] {
  const names: string[] = [];
  for (const node of nodes) {
    names.push(node.name);
    names.push(...flattenNames(node.children));
  }
  return names;
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given, And }) => {
    Given('the Pattern Relations dependency context state is initialized', () => {
      state = createState();
    });
    And('the following deliverables:', () => void 0);
  });

  Rule('Dependency context is focal-rooted and bidirectional', ({ RuleScenario }) => {
    RuleScenario('focal is the root of both forests', ({ Given, When, Then, And }) => {
      Given('a dependency context with a three-level chain rooted at "MiddleService"', () => {
        state!.context = buildChainContext();
      });

      When('I project the dependency context for "MiddleService" with max depth 10', () => {
        state!.bundle = parseAndProjectDependencyContext(state!.context!, {
          pattern: 'MiddleService',
          maxDepth: 10,
        });
      });

      Then('the dependency context focal should be "MiddleService"', () => {
        expect(state!.bundle!.root.focal).toBe('MiddleService');
        // focal is the root of both forests, never a node in either forest.
        const allNames = [
          ...flattenNames(state!.bundle!.root.upstream),
          ...flattenNames(state!.bundle!.root.downstream),
        ];
        expect(allNames).not.toContain('MiddleService');
      });

      And('no node should carry a focal flag', () => {
        const allNodes = [...state!.bundle!.root.upstream, ...state!.bundle!.root.downstream];
        for (const node of allNodes) {
          expect(node).not.toHaveProperty('isFocal');
        }
      });
    });

    RuleScenario(
      'upstream lists the transitive dependsOn closure',
      ({ Given, When, Then, And }) => {
        Given('a dependency context with a three-level chain rooted at "MiddleService"', () => {
          state!.context = buildChainContext();
        });

        When('I project the dependency context for "LeafConsumer" with max depth 10', () => {
          state!.bundle = parseAndProjectDependencyContext(state!.context!, {
            pattern: 'LeafConsumer',
            maxDepth: 10,
          });
        });

        Then('the dependency context upstream should expand "MiddleService" then "RootLib"', () => {
          const upstream = state!.bundle!.root.upstream;
          expect(upstream).toHaveLength(1);
          expect(upstream[0]!.name).toBe('MiddleService');
          expect(upstream[0]!.children).toHaveLength(1);
          expect(upstream[0]!.children[0]!.name).toBe('RootLib');
          expect(upstream[0]!.children[0]!.children).toHaveLength(0);
        });

        And(
          'the dependency context summary should report 1 direct and 2 transitive upstream',
          () => {
            expect(state!.bundle!.root.summary.upstreamDirect).toBe(1);
            expect(state!.bundle!.root.summary.upstreamTransitive).toBe(2);
          },
        );
      },
    );

    RuleScenario('downstream lists the transitive dependents', ({ Given, When, Then, And }) => {
      Given('a dependency context with a three-level chain rooted at "MiddleService"', () => {
        state!.context = buildChainContext();
      });

      When('I project the dependency context for "RootLib" with max depth 10', () => {
        state!.bundle = parseAndProjectDependencyContext(state!.context!, {
          pattern: 'RootLib',
          maxDepth: 10,
        });
      });

      Then(
        'the dependency context downstream should expand "MiddleService" then "LeafConsumer"',
        () => {
          const downstream = state!.bundle!.root.downstream;
          expect(downstream).toHaveLength(1);
          expect(downstream[0]!.name).toBe('MiddleService');
          expect(downstream[0]!.children).toHaveLength(1);
          expect(downstream[0]!.children[0]!.name).toBe('LeafConsumer');
        },
      );

      And(
        'the dependency context summary should report 1 direct and 2 transitive downstream',
        () => {
          expect(state!.bundle!.root.summary.downstreamDirect).toBe(1);
          expect(state!.bundle!.root.summary.downstreamTransitive).toBe(2);
        },
      );
    });

    RuleScenario('maxDepth truncates both directions with markers', ({ Given, When, Then }) => {
      Given('a dependency context with a three-level chain rooted at "MiddleService"', () => {
        state!.context = buildChainContext();
      });

      When('I project the dependency context for "LeafConsumer" with max depth 1', () => {
        state!.bundle = parseAndProjectDependencyContext(state!.context!, {
          pattern: 'LeafConsumer',
          maxDepth: 1,
        });
      });

      Then('the dependency context upstream should truncate at "MiddleService"', () => {
        const upstream = state!.bundle!.root.upstream;
        expect(upstream).toHaveLength(1);
        expect(upstream[0]!.name).toBe('MiddleService');
        expect(upstream[0]!.truncated).toBe(true);
        expect(upstream[0]!.children).toHaveLength(0);
      });
    });

    RuleScenario(
      'cycles stop recursion in both directions without malformed output',
      ({ Given, When, Then }) => {
        Given('a dependency context with a dependency cycle', () => {
          state!.context = createProjectionContext({
            patterns: [createPattern('CycleRoot'), createPattern('CycleChild')],
            relationshipIndex: {
              CycleRoot: createRelationshipEntry({ dependsOn: ['CycleChild'] }),
              CycleChild: createRelationshipEntry({ dependsOn: ['CycleRoot'] }),
            },
          });
        });

        When('I project the dependency context for "CycleRoot" with max depth 5', () => {
          state!.bundle = parseAndProjectDependencyContext(state!.context!, {
            pattern: 'CycleRoot',
            maxDepth: 5,
          });
        });

        Then('the dependency context upstream should not revisit "CycleRoot"', () => {
          const upstream = state!.bundle!.root.upstream;
          expect(upstream).toHaveLength(1);
          expect(upstream[0]!.name).toBe('CycleChild');
          // CycleChild would point back at CycleRoot, but the focal is never revisited.
          expect(flattenNames(upstream)).not.toContain('CycleRoot');
        });
      },
    );

    RuleScenario(
      'a pattern with no relationship entry yields empty forests',
      ({ Given, When, Then, And }) => {
        Given('a dependency context without a relationship index', () => {
          state!.context = createProjectionContext({
            patterns: [createPattern('SoloPattern')],
          });
        });

        When('I project the dependency context for "SoloPattern" with max depth 3', () => {
          state!.bundle = parseAndProjectDependencyContext(state!.context!, {
            pattern: 'SoloPattern',
            maxDepth: 3,
          });
        });

        Then('the dependency context should have empty upstream and downstream', () => {
          expect(state!.bundle!.root.focal).toBe('SoloPattern');
          expect(state!.bundle!.root.upstream).toEqual([]);
          expect(state!.bundle!.root.downstream).toEqual([]);
        });

        And('the dependency context summary should be zeroed', () => {
          expect(state!.bundle!.root.summary).toEqual({
            upstreamDirect: 0,
            upstreamTransitive: 0,
            downstreamDirect: 0,
            downstreamTransitive: 0,
          });
        });
      },
    );
  });

  Rule('Decision patterns surface their see-also governance chain upstream', ({ RuleScenario }) => {
    RuleScenario(
      'a decision focal expands its see-also decision chain upstream',
      ({ Given, When, Then, And }) => {
        Given('a dependency context with a three-decision governance chain', () => {
          state!.context = buildGovernanceChainContext();
        });

        When(
          'I project the dependency context for "ADR009ProjectionTrustBoundary" with max depth 10',
          () => {
            state!.bundle = parseAndProjectDependencyContext(state!.context!, {
              pattern: 'ADR009ProjectionTrustBoundary',
              maxDepth: 10,
            });
          },
        );

        Then(
          'the dependency context upstream should expand "ADR006SingleReadModelArchitecture" then "ADR005CodecBasedMarkdownRendering"',
          () => {
            const upstream = state!.bundle!.root.upstream;
            expect(upstream).toHaveLength(1);
            expect(upstream[0]!.name).toBe('ADR006SingleReadModelArchitecture');
            expect(upstream[0]!.children).toHaveLength(1);
            expect(upstream[0]!.children[0]!.name).toBe('ADR005CodecBasedMarkdownRendering');
          },
        );

        And(
          'the dependency context summary should report 1 direct and 2 transitive upstream',
          () => {
            expect(state!.bundle!.root.summary.upstreamDirect).toBe(1);
            expect(state!.bundle!.root.summary.upstreamTransitive).toBe(2);
          },
        );
      },
    );

    RuleScenario(
      'non-decision see-also links are not followed for a decision focal',
      ({ Given, When, Then }) => {
        Given('a dependency context with a three-decision governance chain', () => {
          state!.context = buildGovernanceChainContext();
        });

        When(
          'I project the dependency context for "ADR009ProjectionTrustBoundary" with max depth 10',
          () => {
            state!.bundle = parseAndProjectDependencyContext(state!.context!, {
              pattern: 'ADR009ProjectionTrustBoundary',
              maxDepth: 10,
            });
          },
        );

        Then(
          'the dependency context upstream should not include "McpOutputSchemaValidation"',
          () => {
            expect(flattenNames(state!.bundle!.root.upstream)).not.toContain(
              'McpOutputSchemaValidation',
            );
          },
        );
      },
    );

    RuleScenario(
      'a decision focal with a dependency chain also grafts its see-also lineage',
      ({ Given, When, Then, And }) => {
        Given(
          'a dependency context with a three-level chain and a three-decision governance chain',
          () => {
            state!.context = buildChainAndGovernanceContext();
          },
        );

        When(
          'I project the dependency context for "ADR009ProjectionTrustBoundary" with max depth 10',
          () => {
            state!.bundle = parseAndProjectDependencyContext(state!.context!, {
              pattern: 'ADR009ProjectionTrustBoundary',
              maxDepth: 10,
            });
          },
        );

        Then(
          'the dependency context upstream should expand the chain "MiddleService" then "RootLib" and the graft "ADR006SingleReadModelArchitecture" then "ADR005CodecBasedMarkdownRendering"',
          () => {
            const upstream = state!.bundle!.root.upstream;
            expect(upstream.map((node) => node.name)).toEqual([
              'MiddleService',
              'ADR006SingleReadModelArchitecture',
            ]);
            expect(upstream[0]?.children.map((node) => node.name)).toEqual(['RootLib']);
            expect(upstream[1]?.children.map((node) => node.name)).toEqual([
              'ADR005CodecBasedMarkdownRendering',
            ]);
          },
        );

        And(
          'the dependency context summary should report 2 direct and 4 transitive upstream',
          () => {
            expect(state!.bundle!.root.summary.upstreamDirect).toBe(2);
            expect(state!.bundle!.root.summary.upstreamTransitive).toBe(4);
          },
        );
      },
    );
  });
});
