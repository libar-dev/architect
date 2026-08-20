import { Graph, createGraph } from '@libar-dev/architect-core/graph';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import { createMechanicalFixture, createPatternGraphFixture } from '../../graph/graph-fixture.js';

interface GraphTestState {
  readonly graph: Graph;
  mutationRejected: boolean;
}

let state: GraphTestState | null = null;

function graphState(): GraphTestState {
  if (state === null) {
    throw new TypeError('Graph test state is not initialized');
  }
  return state;
}

function graphHandleNode() {
  const node = graphState().graph.pattern('GraphHandle');
  if (node === undefined) {
    throw new TypeError('GraphHandle is missing from the test fixture');
  }
  return node;
}

const feature = await loadFeature('tests/features/graph/graph.feature');

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the smallest valid canonical and mechanical graph fixture', () => {
      state = {
        graph: createGraph(createPatternGraphFixture(), createMechanicalFixture()),
        mutationRejected: false,
      };
    });
  });

  Rule('The handle exposes canonical and need-shaped reads', ({ RuleScenario }) => {
    RuleScenario(
      'Exact lookup and FSM delegation use the frozen core contract',
      ({ Then, And }) => {
        Then('the canonical graph total is 5', () => {
          expect(graphState().graph.graph.counts.total).toBe(5);
        });
        And('exact lookup returns "GraphHandle"', () => {
          expect(graphState().graph.pattern('GraphHandle')?.name).toBe('GraphHandle');
        });
        And('file lookup returns "GraphHandle"', () => {
          expect(
            graphState().graph.fileToPattern('packages/architect-core/src/GraphHandle.ts'),
          ).toBe('GraphHandle');
        });
        And('roadmap to active is a valid FSM transition', () => {
          expect(graphState().graph.fsm.isValidTransition('roadmap', 'active')).toBe(true);
        });
      },
    );
  });

  Rule('Status maturity is total', ({ RuleScenario }) => {
    RuleScenario('All accepted statuses derive canonical maturity', ({ Then, And }) => {
      Then('candidate maturity is "idea"', () => {
        expect(graphState().graph.pattern('CandidateWork')?.maturity).toBe('idea');
      });
      And('roadmap maturity is "plan"', () => {
        expect(graphState().graph.pattern('RoadmapWork')?.maturity).toBe('plan');
      });
      And('active maturity is "design"', () => {
        expect(graphState().graph.pattern('ActiveWork')?.maturity).toBe('design');
      });
      And('completed maturity is "executable"', () => {
        expect(graphState().graph.pattern('GraphHandle')?.maturity).toBe('executable');
      });
      And('deferred maturity is "plan"', () => {
        expect(graphState().graph.pattern('DeferredWork')?.maturity).toBe('plan');
      });
    });
  });

  Rule('Public graph state is deeply immutable', ({ RuleScenario }) => {
    RuleScenario('Reachable public graph values resist mutation', ({ Then, When, And }) => {
      Then('every reachable public graph value is frozen', () => {
        const graph = graphState().graph;
        const relationship = graph.graph.relationshipIndex['GraphHandle'];
        const implementation = relationship?.implementedBy.at(0);

        expect(Object.isFrozen(graph)).toBe(true);
        expect(Object.isFrozen(graph.graph)).toBe(true);
        expect(Object.isFrozen(graph.authored)).toBe(true);
        expect(Object.isFrozen(graph.mech)).toBe(true);
        expect(Object.isFrozen(graph.patterns)).toBe(true);
        expect(Object.isFrozen(graphHandleNode())).toBe(true);
        expect(Object.isFrozen(graphHandleNode().uses)).toBe(true);
        expect(Object.isFrozen(relationship)).toBe(true);
        expect(Object.isFrozen(relationship?.uses)).toBe(true);
        expect(Object.isFrozen(implementation)).toBe(true);
      });
      When('I attempt to mutate the GraphHandle node and nested relationship', () => {
        const node = graphHandleNode();
        const relationship = graphState().graph.graph.relationshipIndex['GraphHandle'];
        state = {
          graph: graphState().graph,
          mutationRejected:
            Reflect.set(node, 'name', 'MutatedNode') === false &&
            relationship !== undefined &&
            Reflect.set(relationship.uses, '0', 'MutatedRelationship') === false,
        };
      });
      Then('the mutation is rejected', () => {
        expect(graphState().mutationRejected).toBe(true);
      });
      And('exact lookup still returns "GraphHandle"', () => {
        expect(graphState().graph.pattern('GraphHandle')?.name).toBe('GraphHandle');
      });
      And('the GraphHandle dependency is still "DeferredWork"', () => {
        expect(graphState().graph.graph.relationshipIndex['GraphHandle']?.uses).toEqual([
          'DeferredWork',
        ]);
      });
    });
  });
});
