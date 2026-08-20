import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  ProjectionError,
  projectDependencyEdges,
  type DependencyEdge,
  type ProjectionContext,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext, createRelationshipEntry } from './support.js';

interface DependencyEdgeState {
  context: ProjectionContext | null;
  edges: DependencyEdge[];
  error: unknown;
}

const feature = await loadFeature(
  'tests/features/projections/pattern-relations/dependency-edges.feature',
);

let state: DependencyEdgeState | null = null;

function createState(): DependencyEdgeState {
  return {
    context: null,
    edges: [],
    error: null,
  };
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given, And }) => {
    Given('the Pattern Relations dependency edge state is initialized', () => {
      state = createState();
    });
    And('the following deliverables:', () => void 0);
  });

  Rule('Dependency edges use normalized relationKind payloads only', ({ RuleScenario }) => {
    RuleScenario(
      'dependency edges project every outgoing relation kind',
      ({ Given, When, Then }) => {
        Given('a dependency edge context with rich outgoing relationships', () => {
          state!.context = createProjectionContext({
            patterns: [createPattern('WidgetService')],
            relationshipIndex: {
              WidgetService: createRelationshipEntry({
                dependsOn: ['PatternGraph'],
                uses: ['PatternHelpers'],
                enables: ['ArchitectMcpServer'],
                implementsPatterns: ['PatternGraphReadModel'],
                extendsPattern: 'QuerySurface',
                seeAlso: ['ContextAssemblerImpl'],
                apiRef: ['architect_pattern'],
              }),
            },
          });
        });

        When('I project the dependency edges for "WidgetService"', () => {
          state!.edges = projectDependencyEdges(state!.context!, 'WidgetService').root.items;
        });

        Then('the dependency edges should expose stable relationKind values', () => {
          expect(state!.edges).toEqual([
            {
              kind: 'DependencyEdge',
              from: 'WidgetService',
              to: 'PatternGraph',
              relationKind: 'depends-on',
            },
            {
              kind: 'DependencyEdge',
              from: 'WidgetService',
              to: 'PatternHelpers',
              relationKind: 'uses',
            },
            {
              kind: 'DependencyEdge',
              from: 'WidgetService',
              to: 'ArchitectMcpServer',
              relationKind: 'enables',
            },
            {
              kind: 'DependencyEdge',
              from: 'WidgetService',
              to: 'PatternGraphReadModel',
              relationKind: 'implements',
            },
            {
              kind: 'DependencyEdge',
              from: 'WidgetService',
              to: 'ContextAssemblerImpl',
              relationKind: 'see-also',
            },
            {
              kind: 'DependencyEdge',
              from: 'WidgetService',
              to: 'architect_pattern',
              relationKind: 'api-ref',
            },
            {
              kind: 'DependencyEdge',
              from: 'WidgetService',
              to: 'QuerySurface',
              relationKind: 'extends',
            },
          ]);
        });
      },
    );

    RuleScenario(
      'dependency edges fall back to raw pattern arrays when the relationship index is missing',
      ({ Given, When, Then }) => {
        Given('a dependency edge context without a relationship index', () => {
          state!.context = createProjectionContext({
            patterns: [
              createPattern('FallbackEdges', {
                dependsOn: ['PatternGraph'],
                uses: ['PatternHelpers'],
                enables: ['ArchitectMcpServer'],
                implementsPatterns: ['PatternGraphReadModel'],
                extendsPattern: 'QuerySurface',
                seeAlso: ['ContextAssemblerImpl'],
                apiRef: ['architect_pattern'],
              }),
            ],
          });
        });

        When('I project the dependency edges for "FallbackEdges"', () => {
          state!.edges = projectDependencyEdges(state!.context!, 'FallbackEdges').root.items;
        });

        Then('the dependency edges should use the raw pattern relationship arrays', () => {
          expect(state!.edges.map((edge) => edge.relationKind)).toEqual([
            'depends-on',
            'uses',
            'enables',
            'implements',
            'see-also',
            'api-ref',
            'extends',
          ]);
        });
      },
    );

    RuleScenario(
      'missing patterns return a suggested match for dependency edges',
      ({ Given, When, Then }) => {
        Given('a dependency edge context with a pattern named "WidgetService"', () => {
          state!.context = createProjectionContext({
            patterns: [createPattern('WidgetService')],
          });
        });

        When('I project the dependency edges for the missing pattern "WidgetServic"', () => {
          try {
            state!.edges = projectDependencyEdges(state!.context!, 'WidgetServic').root.items;
          } catch (error) {
            state!.error = error;
          }
        });

        Then(
          'the dependency edge projection should fail with a suggestion for "WidgetService"',
          () => {
            expect(state!.error).toBeInstanceOf(ProjectionError);
            expect((state!.error as Error).message).toContain('Did you mean: WidgetService?');
          },
        );
      },
    );
  });
});
