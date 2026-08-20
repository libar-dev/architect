import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import { computeNeighborhood } from '../../../src/read-api/architecture-inspection.js';
import { getDependencyContext } from '../../../src/read-api/dependency-context.js';
import { resolveDecisionPattern } from '../../../src/read-api/decision-resolution.js';
import {
  findPatternByName,
  getPatternName,
  getRelationshipsForPattern,
} from '../../../src/read-api/pattern-helpers.js';
import { getRulesForPattern } from '../../../src/read-api/rule-aggregation.js';
import type { PatternGraph } from '../../../src/validation-schemas/pattern-graph.js';
import { createReadKernelGraph } from '../../support/read-kernel-fixture.js';

const feature = await loadFeature('tests/features/read-api/read-kernels.feature');

let graph: PatternGraph | null = null;

function requireGraph(): PatternGraph {
  if (graph === null) {
    throw new TypeError('Read-kernel fixture is not initialized');
  }
  return graph;
}

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    graph = null;
  });

  Background(({ Given }) => {
    Given('a representative graph for pure read kernels', () => {
      graph = createReadKernelGraph();
    });
  });

  Rule('Relationship and dependency kernels use the canonical index', ({ RuleScenario }) => {
    RuleScenario(
      'Pure relationship and dependency kernels read canonical edges',
      ({ Then, And }) => {
        Then(
          'the canonical helper reports {string} as a consumer of {string}',
          (_ctx: unknown, consumer: string, target: string) => {
            const pattern = findPatternByName(requireGraph(), target);
            if (pattern === undefined) {
              throw new TypeError(`Fixture pattern ${target} is missing`);
            }
            expect(getRelationshipsForPattern(requireGraph(), pattern).usedBy).toContain(consumer);
          },
        );
        And(
          'the neighborhood reports {string} as a consumer of {string}',
          (_ctx: unknown, consumer: string, target: string) => {
            const neighborhood = computeNeighborhood(target, requireGraph());
            expect(neighborhood?.usedBy.map((entry) => entry.name)).toContain(consumer);
          },
        );
        And(
          'dependency context for {string} reaches {string} transitively',
          (_ctx: unknown, focal: string, prerequisite: string) => {
            const context = getDependencyContext(requireGraph(), focal);
            expect(context?.upstream[0]?.children[0]?.name).toBe(prerequisite);
            expect(context?.summary.upstreamTransitive).toBe(2);
          },
        );
        And('dependency context for {string} is absent', (_ctx: unknown, name: string) => {
          expect(getDependencyContext(requireGraph(), name)).toBeUndefined();
        });
      },
    );
  });

  Rule('Rule aggregation follows implementation provenance', ({ RuleScenario }) => {
    RuleScenario('Rule aggregation returns implementing feature provenance', ({ Then }) => {
      Then(
        'rules for {string} include {string} from {string}',
        (_ctx: unknown, name: string, ruleName: string, sourcePattern: string) => {
          const rule = getRulesForPattern(requireGraph(), name).find(
            (entry) => entry.rule.name === ruleName,
          );
          expect(rule?.sourcePattern).toBe(sourcePattern);
          expect(rule?.sourceFile).toBe('packages/architect-core/tests/features/widget.feature');
        },
      );
    });
  });

  Rule('Decision resolution composes with enforcedBy', ({ RuleScenario }) => {
    RuleScenario('Decision resolution exposes enforcing patterns and rules', ({ Then, And }) => {
      let canonicalDecision = '';
      Then(
        'decision {string} resolves to {string}',
        (_ctx: unknown, input: string, expected: string) => {
          const decision = resolveDecisionPattern(requireGraph(), input);
          canonicalDecision = decision === undefined ? '' : getPatternName(decision);
          expect(canonicalDecision).toBe(expected);
        },
      );
      And(
        'the decision is enforced by {string} with rule {string}',
        (_ctx: unknown, patternName: string, ruleName: string) => {
          expect(requireGraph().relationshipIndex[canonicalDecision]?.enforcedBy).toContain(
            patternName,
          );
          const pattern = findPatternByName(requireGraph(), patternName);
          expect(pattern?.rules?.map((rule) => rule.name)).toContain(ruleName);
        },
      );
    });
  });

  Rule('Package helpers and architecture indexing agree', ({ RuleScenario }) => {
    RuleScenario('Package keys are distinct and sorted', ({ Then }) => {
      Then('the package keys are exactly {string}', (_ctx: unknown, csv: string) => {
        const expected = csv.split(',').map((value) => value.trim());
        expect(Object.keys(requireGraph().archIndex?.byPackage ?? {}).sort()).toEqual(expected);
      });
    });
  });
});
