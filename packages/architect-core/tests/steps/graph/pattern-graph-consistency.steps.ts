import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import { aggregateTagUsage } from '../../../src/read-api/graph-inventory.js';
import type { PatternGraph } from '../../../src/validation-schemas/pattern-graph.js';
import { createReadKernelGraph } from '../../support/read-kernel-fixture.js';

const feature = await loadFeature('tests/features/graph/pattern-graph-consistency.feature');

const NORMALIZED_STATUSES = ['completed', 'active', 'planned', 'candidate'] as const;

let graph: PatternGraph | null = null;

function requireGraph(): PatternGraph {
  if (graph === null) {
    throw new TypeError('PatternGraph consistency fixture is not initialized');
  }
  return graph;
}

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    graph = null;
  });

  Background(({ Given }) => {
    Given('a representative canonical pattern graph', () => {
      graph = createReadKernelGraph();
    });
  });

  Rule('Status views form one exact partition', ({ RuleScenario }) => {
    RuleScenario('Canonical status fields agree', ({ Then, And }) => {
      Then('every normalized status count equals its bucket length', () => {
        const current = requireGraph();
        for (const status of NORMALIZED_STATUSES) {
          expect(current.counts[status]).toBe(current.byNormalizedStatus[status].length);
        }
      });
      And('the normalized status counts sum to the total', () => {
        const counts = requireGraph().counts;
        expect(counts.completed + counts.active + counts.planned + counts.candidate).toBe(
          counts.total,
        );
      });
      And('the planned bucket equals roadmap plus deferred', () => {
        const current = requireGraph();
        expect(current.byNormalizedStatus.planned.length).toBe(
          current.byStatus.roadmap.length + current.byStatus.deferred.length,
        );
      });
    });
  });

  Rule('Relationship fields are bidirectionally consistent', ({ RuleScenario }) => {
    RuleScenario('Canonical relationship fields agree', ({ Then, And }) => {
      Then('{string} uses {string}', (_ctx: unknown, source: string, target: string) => {
        expect(requireGraph().relationshipIndex[source]?.uses).toContain(target);
      });
      And(
        '{string} is used by and enables {string}',
        (_ctx: unknown, target: string, source: string) => {
          const entry = requireGraph().relationshipIndex[target];
          expect(entry?.usedBy).toContain(source);
          expect(entry?.enables).toContain(source);
        },
      );
      And(
        '{string} retains its related pattern and API reference',
        (_ctx: unknown, name: string) => {
          const entry = requireGraph().relationshipIndex[name];
          expect(entry?.seeAlso).toEqual(['BetaCore']);
          expect(entry?.apiRef).toEqual(['AlphaCore.run']);
        },
      );
    });
  });

  Rule('Independent graph inventory agrees with canonical counts', ({ RuleScenario }) => {
    RuleScenario('Inventory status totals match canonical counts', ({ Then }) => {
      Then('tag inventory status counts equal canonical status counts', () => {
        const current = requireGraph();
        const report = aggregateTagUsage(current);
        const statusTag = report.tags.find((tag) => tag.tag === 'status');
        const countFor = (status: string): number =>
          statusTag?.values?.find((entry) => entry.value === status)?.count ?? 0;

        expect(countFor('completed')).toBe(current.counts.completed);
        expect(countFor('active')).toBe(current.counts.active);
        expect(countFor('candidate')).toBe(current.counts.candidate);
        expect(statusTag?.count).toBe(current.counts.total);
      });
    });
  });
});
