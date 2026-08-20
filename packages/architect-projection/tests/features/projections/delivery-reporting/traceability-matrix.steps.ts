import type { RelationshipEntry } from '@libar-dev/architect-core';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  projectTraceabilityMatrix,
  type ProjectionBundle,
  type ProjectionContext,
  type TraceabilityMatrix,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext } from './support.js';

interface TraceabilityState {
  context: ProjectionContext | null;
  bundle: ProjectionBundle<TraceabilityMatrix> | null;
}

const feature = await loadFeature(
  'tests/features/projections/delivery-reporting/traceability-matrix.feature',
);

let state: TraceabilityState | null = null;

function createState(): TraceabilityState {
  return {
    context: null,
    bundle: null,
  };
}

function relationshipEntry(
  implementedBy: readonly { name: string; file: string }[],
): RelationshipEntry {
  return {
    uses: [],
    usedBy: [],
    dependsOn: [],
    enables: [],
    implementsPatterns: [],
    implementedBy: implementedBy.map((reference) => ({ ...reference })),
    extendedBy: [],
    seeAlso: [],
    apiRef: [],
    enforcesDecisions: [],
    enforcedBy: [],
  };
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the Delivery Reporting traceability projection state is initialized', () => {
      state = createState();
    });
  });

  Rule(
    'Traceability rows are sourced from realization edges and stay deterministic',
    ({ RuleScenario }) => {
      RuleScenario(
        'projecting the traceability matrix from realization edges',
        ({ Given, When, Then, And }) => {
          Given('a traceability projection context with realized and unrealized patterns', () => {
            state!.context = createProjectionContext({
              patterns: [
                createPattern('GraphHandle', {
                  status: 'completed',
                  file: 'packages/architect-core/src/read-api/graph-handle.ts',
                  deliverables: [
                    {
                      name: 'Read API surface',
                      status: 'complete',
                      tests: 2,
                      location: 'packages/architect-core/src/read-api/graph-handle.ts',
                    },
                  ],
                }),
                createPattern('TraceabilityMatrixProjection', {
                  status: 'completed',
                  file: 'packages/architect-projection/src/projections/delivery-reporting/index.ts',
                }),
                createPattern('UnrealizedPattern', {
                  status: 'active',
                  file: 'packages/architect-projection/src/projections/orphan.ts',
                }),
              ],
              relationshipIndex: {
                GraphHandle: relationshipEntry([
                  {
                    name: 'GraphRelationshipLookupExecutableTests',
                    file: 'packages/architect-core/tests/features/read-api/reverse-lookup.feature',
                  },
                  {
                    name: 'GraphFieldConsistencyExecutableTests',
                    file: 'packages/architect-core/tests/features/read-api/consistency.feature',
                  },
                ]),
                TraceabilityMatrixProjection: relationshipEntry([
                  {
                    name: 'TraceabilityMatrixProjectionExecutableTests',
                    file: 'packages/architect-projection/tests/features/projections/delivery-reporting/traceability-matrix.feature',
                  },
                ]),
                UnrealizedPattern: relationshipEntry([]),
              },
            });
          });

          When('I project the traceability matrix', () => {
            state!.bundle = projectTraceabilityMatrix(state!.context!);
          });

          Then(
            'the traceability matrix should include only patterns with realization edges',
            () => {
              expect(state!.bundle?.root.rows.map((row) => row.pattern)).toEqual([
                'GraphHandle',
                'TraceabilityMatrixProjection',
              ]);
            },
          );

          And("each row's tests should be the realizing source files", () => {
            expect(state!.bundle?.root.rows).toEqual([
              {
                pattern: 'GraphHandle',
                status: 'completed',
                tests: [
                  'packages/architect-core/tests/features/read-api/consistency.feature',
                  'packages/architect-core/tests/features/read-api/reverse-lookup.feature',
                ],
                specs: ['packages/architect-core/src/read-api/graph-handle.ts'],
                deliverables: ['packages/architect-core/src/read-api/graph-handle.ts'],
              },
              {
                pattern: 'TraceabilityMatrixProjection',
                status: 'completed',
                tests: [
                  'packages/architect-projection/tests/features/projections/delivery-reporting/traceability-matrix.feature',
                ],
                specs: [
                  'packages/architect-projection/src/projections/delivery-reporting/index.ts',
                ],
                deliverables: [],
              },
            ]);
          });

          And('the traceability child keys should be deterministic', () => {
            expect(Object.keys(state!.bundle?.children ?? {})).toEqual([
              'graph-handle',
              'traceability-matrix-projection',
            ]);
          });
        },
      );

      RuleScenario('the tests column excludes production TS realizers', ({ Given, When, Then }) => {
        Given(
          'a traceability projection context with a TS and a feature realizer on one pattern',
          () => {
            state!.context = createProjectionContext({
              patterns: [
                createPattern('GraphHandleCliExecutableTests', {
                  status: 'completed',
                  file: 'tests/features/cli/graph-handle.feature',
                }),
              ],
              relationshipIndex: {
                GraphHandleCliExecutableTests: relationshipEntry([
                  {
                    name: 'GraphHandleCli',
                    file: 'packages/architect-cli/src/cli/graph-cli.ts',
                  },
                  {
                    name: 'GraphHandleCliPackageTests',
                    file: 'packages/architect-cli/tests/features/cli-command-resolution.feature',
                  },
                ]),
              },
            });
          },
        );

        When('I project the traceability matrix', () => {
          state!.bundle = projectTraceabilityMatrix(state!.context!);
        });

        Then("the row's tests should contain only the executable feature file", () => {
          expect(state!.bundle?.root.rows).toHaveLength(1);
          expect(state!.bundle?.root.rows[0]?.tests).toEqual([
            'packages/architect-cli/tests/features/cli-command-resolution.feature',
          ]);
        });
      });
    },
  );
});
