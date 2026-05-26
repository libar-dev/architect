import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  projectArchitectureGraph,
  type ArchitectureGraph,
  type ProjectionContext,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext, createRelationshipEntry } from './support.js';

interface ArchitectureGraphState {
  context: ProjectionContext | null;
  graph: ArchitectureGraph | null;
}

const feature = await loadFeature(
  'tests/features/projections/pattern-relations/architecture-graph.feature',
);

let state: ArchitectureGraphState | null = null;

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the architecture graph projection state is initialized', () => {
      state = { context: null, graph: null };
    });
  });

  Rule(
    'The whole-graph dump carries nodes and typed edges with name endpoints',
    ({ RuleScenario }) => {
      RuleScenario(
        'projecting the architecture graph returns nodes and typed edges',
        ({ Given, When, Then, And }) => {
          Given('an architecture graph context with two connected patterns', () => {
            state!.context = createProjectionContext({
              patterns: [
                createPattern('Alpha', { archContext: 'rendering', role: 'codec' }),
                createPattern('Beta', { archContext: 'rendering', role: 'contract' }),
              ],
              relationshipIndex: {
                Alpha: createRelationshipEntry({ dependsOn: ['Beta'] }),
                Beta: createRelationshipEntry({ usedBy: ['Alpha'] }),
              },
            });
          });

          When('I project the architecture graph', () => {
            state!.graph = projectArchitectureGraph(state!.context!);
          });

          Then(
            'the architecture graph should carry both nodes with role, context, and package',
            () => {
              const graph = state!.graph;
              expect(graph?.kind).toBe('ArchitectureGraph');
              expect(graph?.scope).toBe('component');
              const alpha = graph?.nodes.find((node) => node.name === 'Alpha');
              expect(alpha).toMatchObject({ role: 'codec', boundedContext: 'rendering' });
              expect(typeof alpha?.package).toBe('string');
              expect((alpha?.package ?? '').length).toBeGreaterThan(0);
              expect(graph?.nodes.map((node) => node.name).sort()).toEqual(['Alpha', 'Beta']);
            },
          );

          And(
            'the architecture graph edges should reference patterns by name with typed kinds',
            () => {
              expect(state!.graph?.edges).toContainEqual({
                from: 'Alpha',
                to: 'Beta',
                kind: 'depends-on',
              });
            },
          );

          And('the architecture graph counts should match the node and edge arrays', () => {
            const graph = state!.graph;
            expect(graph?.nodeCount).toBe(graph?.nodes.length);
            expect(graph?.edgeCount).toBe(graph?.edges.length);
          });
        },
      );
    },
  );
});
