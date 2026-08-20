import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import { ProjectionError, type ProjectionContext } from '../../../../src/index.js';
import { normalizePatternRelationships } from '../../../../src/projections/_shared/pattern-helpers.internal.js';
import type { PatternRelationships } from '../../../../src/fragments/pattern-relations/supporting.js';
import { createPattern, createProjectionContext, createRelationshipEntry } from './support.js';

interface KernelContractState {
  context: ProjectionContext | null;
  result: PatternRelationships | null;
  error: unknown;
}

const feature = await loadFeature(
  'tests/features/projections/pattern-relations/kernel-relationship-contract.feature',
);

let state: KernelContractState | null = null;

function createState(): KernelContractState {
  return { context: null, result: null, error: null };
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given, And }) => {
    Given('a synthetic graph where "AlphaCore" uses "BetaCore"', () => {
      state = createState();
    });

    And('the graph includes the canonical relationship index', () => {
      const alpha = createPattern('AlphaCore', { uses: ['BetaCore'] });
      const beta = createPattern('BetaCore');
      state!.context = createProjectionContext({
        patterns: [alpha, beta],
        relationshipIndex: {
          AlphaCore: createRelationshipEntry({
            uses: ['BetaCore'],
            dependsOn: ['BetaCore'],
          }),
          BetaCore: createRelationshipEntry({
            usedBy: ['AlphaCore'],
            enables: ['AlphaCore'],
          }),
        },
      });
    });
  });

  Rule(
    'Projection kernel reads reverse relationships from the canonical index',
    ({ RuleScenario }) => {
      RuleScenario(
        'Reverse relationships populated from index when index entry is present',
        ({ When, Then, And }) => {
          When('I normalize relationships for "BetaCore" through the projection kernel', () => {
            state!.result = normalizePatternRelationships(state!.context!, 'BetaCore');
          });

          Then('the normalized "usedBy" field contains "AlphaCore"', () => {
            expect(state!.result?.usedBy).toContain('AlphaCore');
          });

          And('the normalized "enables" field contains "AlphaCore"', () => {
            expect(state!.result?.enables).toContain('AlphaCore');
          });
        },
      );
    },
  );

  Rule(
    'Projection kernel throws the canonical invariant error for missing entries',
    ({ RuleScenario }) => {
      RuleScenario(
        'Missing index entry throws the canonical invariant error',
        ({ Given, When, Then, And }) => {
          Given(
            'a pattern named "OrphanCore" present on the graph but absent from the canonical relationship index',
            () => {
              const alpha = createPattern('AlphaCore', { uses: ['BetaCore'] });
              const orphan = createPattern('OrphanCore');
              state!.context = createProjectionContext({
                patterns: [alpha, orphan],
              });
              // The test builder auto-populates relationshipIndex for every
              // pattern. To exercise the canonical-invariant throw we delete
              // OrphanCore's entry, mirroring the pipeline-corruption scenario
              // the invariant exists to fail loudly on.
              delete (state!.context.graph.relationshipIndex as Record<string, unknown>)[
                'OrphanCore'
              ];
            },
          );

          When('I normalize relationships for "OrphanCore" through the projection kernel', () => {
            try {
              state!.result = normalizePatternRelationships(state!.context!, 'OrphanCore');
            } catch (caught) {
              state!.error = caught;
            }
          });

          Then('a ProjectionError with code "PATTERN_RELATIONSHIP_INVARIANT" is thrown', () => {
            expect(state!.error).toBeInstanceOf(ProjectionError);
            expect((state!.error as ProjectionError).code).toBe('PATTERN_RELATIONSHIP_INVARIANT');
          });

          And(
            'the error message contains "canonical relationship entry missing for pattern \\"OrphanCore\\""',
            () => {
              expect((state!.error as Error).message).toContain(
                'canonical relationship entry missing for pattern "OrphanCore"',
              );
            },
          );
        },
      );
    },
  );
});
