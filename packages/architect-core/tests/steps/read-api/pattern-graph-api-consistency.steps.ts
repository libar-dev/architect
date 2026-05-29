import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import { transformToPatternGraph } from '../../../src/generators/pipeline/transform-dataset.js';
import type { RawDataset } from '../../../src/generators/pipeline/transform-types.js';
import { createPatternGraphAPI } from '../../../src/read-api/pattern-graph-api.js';
import type { PatternGraphAPI } from '../../../src/read-api/pattern-graph-api.js';
import { aggregateTagUsage } from '../../../src/read-api/graph-inventory.js';
import type { TagUsageReport } from '../../../src/read-api/graph-inventory.js';
import type {
  PatternDependencies,
  PatternRelationships,
  ProtectionInfo,
  StatusDistribution,
  TransitionCheck,
} from '../../../src/read-api/types.js';
import { ExtractedPatternSchema } from '../../../src/validation-schemas/extracted-pattern.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/extracted-pattern.js';
import type { StatusCounts } from '../../../src/validation-schemas/pattern-graph.js';
import type { ProcessStatusValue } from '../../../src/taxonomy/index.js';
import { createDefaultTagRegistry } from '../../../src/validation-schemas/tag-registry.js';

const feature = await loadFeature(
  'tests/features/read-api/pattern-graph-api-consistency.feature',
);

const NORMALIZED = ['completed', 'active', 'planned', 'candidate'] as const;

// In the representative fixture, AlphaCore uses BetaCore. These constants name
// the "using"/"used" patterns the relationship scenarios reason about.
const USING_PATTERN = 'AlphaCore';
const USED_PATTERN = 'BetaCore';

interface PatternSpec {
  readonly name: string;
  readonly status: string;
  readonly phase?: number;
  readonly quarter?: string;
  readonly role?: string;
  readonly uses?: readonly string[];
  readonly completed?: string;
  readonly seeAlso?: readonly string[];
  readonly apiRef?: readonly string[];
}

function makePatternId(name: string): string {
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return `pattern-${hash.toString(16).padStart(8, '0').slice(0, 8)}`;
}

function makePattern(spec: PatternSpec): ExtractedPattern {
  return ExtractedPatternSchema.parse({
    id: makePatternId(spec.name),
    name: spec.name,
    patternName: spec.name,
    directive: {
      tags: [`@architect-pattern:${spec.name}`],
      description: '',
      examples: [],
      position: { startLine: 1, endLine: 1 },
      patternName: spec.name,
    },
    code: '',
    source: { file: `packages/architect-core/src/${spec.name.toLowerCase()}.ts`, lines: [1, 1] },
    exports: [],
    extractedAt: '2026-01-01T00:00:00.000Z',
    status: spec.status,
    ...(spec.phase !== undefined ? { phase: spec.phase } : {}),
    ...(spec.quarter !== undefined ? { quarter: spec.quarter } : {}),
    ...(spec.role !== undefined ? { role: spec.role } : {}),
    ...(spec.uses !== undefined ? { uses: [...spec.uses] } : {}),
    ...(spec.completed !== undefined ? { completed: spec.completed } : {}),
    ...(spec.seeAlso !== undefined ? { seeAlso: [...spec.seeAlso] } : {}),
    ...(spec.apiRef !== undefined ? { apiRef: [...spec.apiRef] } : {}),
  });
}

// Delivery base is engineered to be exactly 10 so the delivery percentages
// round cleanly (completed 5 -> 50, active 3 -> 30, planned 2 -> 20, summing
// to 100). candidate 2 over total 12 gives a candidate share of round(16.67) =
// 17 — deliberately distinct from any delivery percentage.
const REPRESENTATIVE_SPECS: readonly PatternSpec[] = [
  {
    name: USING_PATTERN,
    status: 'completed',
    phase: 1,
    quarter: '2026-Q1',
    role: 'service',
    completed: '2026-01-10',
    uses: [USED_PATTERN],
    seeAlso: [USED_PATTERN],
    apiRef: ['AlphaCore.run'],
  },
  { name: USED_PATTERN, status: 'completed', phase: 1, quarter: '2026-Q1', role: 'utility', completed: '2026-02-15' },
  { name: 'GammaCore', status: 'completed', phase: 1, quarter: '2026-Q1', role: 'utility', completed: '2026-03-20' },
  { name: 'DeltaCore', status: 'completed', phase: 2, quarter: '2026-Q2', role: 'codec', completed: '2026-04-01' },
  { name: 'EpsilonCore', status: 'completed', phase: 2, quarter: '2026-Q2', role: 'codec', completed: '2026-05-05' },
  { name: 'ZetaCore', status: 'active', phase: 2, quarter: '2026-Q2', role: 'decider', uses: [USING_PATTERN] },
  { name: 'EtaCore', status: 'active', phase: 3, quarter: '2026-Q3', role: 'decider' },
  { name: 'ThetaCore', status: 'active', phase: 3, quarter: '2026-Q3', role: 'projection' },
  { name: 'IotaCore', status: 'roadmap', phase: 3, quarter: '2026-Q3', role: 'projection' },
  { name: 'KappaCore', status: 'deferred', phase: 4, quarter: '2026-Q4', role: 'contract' },
  { name: 'LambdaCore', status: 'candidate', role: 'barrel' },
  { name: 'MuCore', status: 'candidate', role: 'barrel' },
];

const CANDIDATE_ONLY_SPECS: readonly PatternSpec[] = [
  { name: 'OnlyCandidateA', status: 'candidate' },
  { name: 'OnlyCandidateB', status: 'candidate' },
  { name: 'OnlyCandidateC', status: 'candidate' },
];

function buildApi(specs: readonly PatternSpec[]): PatternGraphAPI {
  const raw: RawDataset = {
    patterns: specs.map(makePattern),
    tagRegistry: createDefaultTagRegistry(),
  };
  return createPatternGraphAPI(transformToPatternGraph(raw));
}

function round(value: number): number {
  return Math.round(value);
}

interface State {
  api: PatternGraphAPI;
  counts: StatusCounts | null;
  distribution: StatusDistribution | null;
  tagUsage: TagUsageReport | null;
  transition: { from: ProcessStatusValue; to: ProcessStatusValue; check: TransitionCheck } | null;
  protection: ProtectionInfo | null;
  relationships: Map<string, PatternRelationships>;
  dependencies: Map<string, PatternDependencies>;
  recentlyCompleted: ExtractedPattern[] | null;
}

let state: State;

function freshState(specs: readonly PatternSpec[]): State {
  return {
    api: buildApi(specs),
    counts: null,
    distribution: null,
    tagUsage: null,
    transition: null,
    protection: null,
    relationships: new Map(),
    dependencies: new Map(),
    recentlyCompleted: null,
  };
}

function requireCounts(): StatusCounts {
  if (state.counts === null) throw new Error('status counts not read');
  return state.counts;
}

function requireDistribution(): StatusDistribution {
  if (state.distribution === null) throw new Error('status distribution not read');
  return state.distribution;
}

function requireTransition(): {
  from: ProcessStatusValue;
  to: ProcessStatusValue;
  check: TransitionCheck;
} {
  if (state.transition === null) throw new Error('transition not evaluated');
  return state.transition;
}

function patternName(pattern: ExtractedPattern): string {
  return pattern.patternName ?? pattern.name;
}

function tagStatusCount(value: string): number {
  if (state.tagUsage === null) throw new Error('tag usage not aggregated');
  const statusTag = state.tagUsage.tags.find((tag) => tag.tag === 'status');
  const entry = statusTag?.values?.find((candidate) => candidate.value === value);
  return entry?.count ?? 0;
}

describeFeature(feature, ({ Background, Rule }) => {
  Background(({ Given }) => {
    Given('a representative pattern graph derived through the transform pipeline', () => {
      state = freshState(REPRESENTATIVE_SPECS);
    });
  });

  Rule('The status partition is exact', ({ RuleScenario }) => {
    RuleScenario('Each status count equals its bucket length', ({ When, Then }) => {
      When('I read the status counts', () => {
        state.counts = state.api.getStatusCounts();
      });
      Then('each normalized status count equals its bucket length', () => {
        const counts = requireCounts();
        for (const status of NORMALIZED) {
          expect(counts[status]).toBe(state.api.getPatternsByNormalizedStatus(status).length);
        }
      });
    });

    RuleScenario('The four status counts sum to the total', ({ When, Then }) => {
      When('I read the status counts', () => {
        state.counts = state.api.getStatusCounts();
      });
      Then('the four normalized counts sum to the total count', () => {
        const counts = requireCounts();
        expect(counts.completed + counts.active + counts.planned + counts.candidate).toBe(
          counts.total,
        );
      });
    });
  });

  Rule('Delivery and candidate bases stay separate and correct', ({ RuleScenario }) => {
    RuleScenario('The delivery base excludes candidates', ({ When, Then, And }) => {
      When('I read the status counts', () => {
        state.counts = state.api.getStatusCounts();
      });
      And('I read the status distribution', () => {
        state.distribution = state.api.getStatusDistribution();
      });
      Then('completed plus active plus planned counts equal the delivery base', () => {
        const counts = requireCounts();
        expect(counts.completed + counts.active + counts.planned).toBe(
          counts.total - counts.candidate,
        );
      });
      And('the delivery base equals total minus candidate', () => {
        const counts = requireCounts();
        expect(counts.total - counts.candidate).toBe(
          counts.completed + counts.active + counts.planned,
        );
      });
    });

    RuleScenario(
      'Each delivery percentage is its count over the delivery base',
      ({ When, Then, And }) => {
        When('I read the status counts', () => {
          state.counts = state.api.getStatusCounts();
        });
        And('I read the status distribution', () => {
          state.distribution = state.api.getStatusDistribution();
        });
        Then('each delivery percentage equals round of its count over the delivery base', () => {
          const counts = requireCounts();
          const base = counts.total - counts.candidate;
          const { deliveryPercentages } = requireDistribution();
          expect(deliveryPercentages.completed).toBe(round((counts.completed / base) * 100));
          expect(deliveryPercentages.active).toBe(round((counts.active / base) * 100));
          expect(deliveryPercentages.planned).toBe(round((counts.planned / base) * 100));
        });
        And('each delivery percentage is between 0 and 100', () => {
          const { deliveryPercentages } = requireDistribution();
          for (const value of [
            deliveryPercentages.completed,
            deliveryPercentages.active,
            deliveryPercentages.planned,
          ]) {
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThanOrEqual(100);
          }
        });
      },
    );

    RuleScenario('The three delivery percentages sum to 100', ({ When, Then }) => {
      When('I read the status distribution', () => {
        state.distribution = state.api.getStatusDistribution();
      });
      Then('the three delivery percentages sum to 100', () => {
        const { deliveryPercentages } = requireDistribution();
        expect(
          deliveryPercentages.completed + deliveryPercentages.active + deliveryPercentages.planned,
        ).toBe(100);
      });
    });

    RuleScenario('The candidate share is computed on the grand total', ({ When, Then, And }) => {
      When('I read the status counts', () => {
        state.counts = state.api.getStatusCounts();
      });
      And('I read the status distribution', () => {
        state.distribution = state.api.getStatusDistribution();
      });
      Then('the candidate share equals round of candidate over total', () => {
        const counts = requireCounts();
        expect(requireDistribution().candidateShare).toBe(
          round((counts.candidate / counts.total) * 100),
        );
      });
    });

    RuleScenario(
      'A candidate-only graph has no delivery percentages and never divides by zero',
      ({ Given, When, Then, And }) => {
        Given('a candidate-only pattern graph derived through the transform pipeline', () => {
          state = freshState(CANDIDATE_ONLY_SPECS);
        });
        When('I read the status distribution', () => {
          state.distribution = state.api.getStatusDistribution();
        });
        Then('every delivery percentage is 0', () => {
          const { deliveryPercentages } = requireDistribution();
          expect(deliveryPercentages.completed).toBe(0);
          expect(deliveryPercentages.active).toBe(0);
          expect(deliveryPercentages.planned).toBe(0);
        });
        And('the candidate share is 100', () => {
          expect(requireDistribution().candidateShare).toBe(100);
        });
      },
    );
  });

  Rule('The completion percentage agrees with the distribution', ({ RuleScenario }) => {
    RuleScenario(
      'Completion percentage equals the distribution completed share',
      ({ When, Then }) => {
        When('I read the status distribution', () => {
          state.distribution = state.api.getStatusDistribution();
        });
        Then('the completion percentage equals the completed delivery percentage', () => {
          expect(state.api.getCompletionPercentage()).toBe(
            requireDistribution().deliveryPercentages.completed,
          );
        });
      },
    );
  });

  Rule('The four FSM methods agree', ({ RuleScenario }) => {
    RuleScenario(
      'A legal transition agrees across the three transition methods',
      ({ When, Then, And }) => {
        When(
          'I evaluate the transition from {string} to {string}',
          (_ctx: unknown, from: string, to: string) => {
            const typedFrom = from as ProcessStatusValue;
            const typedTo = to as ProcessStatusValue;
            state.transition = {
              from: typedFrom,
              to: typedTo,
              check: state.api.checkTransition(from, to),
            };
          },
        );
        Then('isValidTransition reports the transition legal', () => {
          const { from, to } = requireTransition();
          expect(state.api.isValidTransition(from, to)).toBe(true);
        });
        And('the valid-transitions list includes the target', () => {
          const { from, to } = requireTransition();
          expect(state.api.getValidTransitionsFrom(from)).toContain(to);
        });
        And('checkTransition reports the transition valid', () => {
          expect(requireTransition().check.valid).toBe(true);
        });
        And('the three transition methods agree on the transition', () => {
          const { from, to, check } = requireTransition();
          const isValid = state.api.isValidTransition(from, to);
          const inList = state.api.getValidTransitionsFrom(from).includes(to);
          expect(isValid).toBe(inList);
          expect(inList).toBe(check.valid);
        });
      },
    );

    RuleScenario(
      'An illegal transition agrees across the three transition methods',
      ({ When, Then, And }) => {
        When(
          'I evaluate the transition from {string} to {string}',
          (_ctx: unknown, from: string, to: string) => {
            const typedFrom = from as ProcessStatusValue;
            const typedTo = to as ProcessStatusValue;
            state.transition = {
              from: typedFrom,
              to: typedTo,
              check: state.api.checkTransition(from, to),
            };
          },
        );
        Then('isValidTransition reports the transition illegal', () => {
          const { from, to } = requireTransition();
          expect(state.api.isValidTransition(from, to)).toBe(false);
        });
        And('the valid-transitions list excludes the target', () => {
          const { from, to } = requireTransition();
          expect(state.api.getValidTransitionsFrom(from)).not.toContain(to);
        });
        And('checkTransition reports the transition invalid', () => {
          expect(requireTransition().check.valid).toBe(false);
        });
        And('the three transition methods agree on the transition', () => {
          const { from, to, check } = requireTransition();
          const isValid = state.api.isValidTransition(from, to);
          const inList = state.api.getValidTransitionsFrom(from).includes(to);
          expect(isValid).toBe(inList);
          expect(inList).toBe(check.valid);
        });
      },
    );

    RuleScenario(
      'Protection info reflects the terminal state as hard-locked',
      ({ When, Then, And }) => {
        When('I read the protection info for {string}', (_ctx: unknown, status: string) => {
          state.protection = state.api.getProtectionInfo(status as ProcessStatusValue);
        });
        Then('the protection level is {string}', (_ctx: unknown, level: string) => {
          expect(state.protection?.level).toBe(level);
        });
        And('the protection info requires an unlock', () => {
          expect(state.protection?.requiresUnlock).toBe(true);
        });
        And('the protection info forbids adding deliverables', () => {
          expect(state.protection?.canAddDeliverables).toBe(false);
        });
      },
    );

    RuleScenario(
      'Protection info reflects an editable state as unlocked',
      ({ When, Then, And }) => {
        When('I read the protection info for {string}', (_ctx: unknown, status: string) => {
          state.protection = state.api.getProtectionInfo(status as ProcessStatusValue);
        });
        Then('the protection level is {string}', (_ctx: unknown, level: string) => {
          expect(state.protection?.level).toBe(level);
        });
        And('the protection info does not require an unlock', () => {
          expect(state.protection?.requiresUnlock).toBe(false);
        });
        And('the protection info allows adding deliverables', () => {
          expect(state.protection?.canAddDeliverables).toBe(true);
        });
      },
    );
  });

  Rule(
    'Relationship reverse edges stay consistent with the canonical index',
    ({ RuleScenario }) => {
      RuleScenario('A uses B implies B is used by A', ({ When, Then, And }) => {
        When('I read the relationships for the using and used patterns', () => {
          const using = state.api.getPatternRelationships(USING_PATTERN);
          const used = state.api.getPatternRelationships(USED_PATTERN);
          if (using !== undefined) state.relationships.set(USING_PATTERN, using);
          if (used !== undefined) state.relationships.set(USED_PATTERN, used);
        });
        Then('the using pattern uses the used pattern', () => {
          expect(state.relationships.get(USING_PATTERN)?.uses).toContain(USED_PATTERN);
        });
        And('the used pattern is used by the using pattern', () => {
          expect(state.relationships.get(USED_PATTERN)?.usedBy).toContain(USING_PATTERN);
        });
        And('the used pattern enables the using pattern', () => {
          expect(state.relationships.get(USED_PATTERN)?.enables).toContain(USING_PATTERN);
        });
      });

      RuleScenario(
        'Dependencies and relationships report the same reverse edges',
        ({ When, Then, And }) => {
          When('I read the relationships for the used pattern', () => {
            const used = state.api.getPatternRelationships(USED_PATTERN);
            if (used !== undefined) state.relationships.set(USED_PATTERN, used);
          });
          And('I read the dependencies for the used pattern', () => {
            const used = state.api.getPatternDependencies(USED_PATTERN);
            if (used !== undefined) state.dependencies.set(USED_PATTERN, used);
          });
          Then('the dependency usedBy edges equal the relationship usedBy edges', () => {
            expect(state.dependencies.get(USED_PATTERN)?.usedBy).toEqual(
              state.relationships.get(USED_PATTERN)?.usedBy,
            );
          });
          And('the dependency enables edges equal the relationship enables edges', () => {
            expect(state.dependencies.get(USED_PATTERN)?.enables).toEqual(
              state.relationships.get(USED_PATTERN)?.enables,
            );
          });
        },
      );

      RuleScenario(
        'The related-pattern and api-reference accessors mirror the relationship view',
        ({ When, Then, And }) => {
          When('I read the relationships for the using pattern', () => {
            const using = state.api.getPatternRelationships(USING_PATTERN);
            if (using !== undefined) state.relationships.set(USING_PATTERN, using);
          });
          Then('the related patterns equal the relationship seeAlso edges', () => {
            expect(state.api.getRelatedPatterns(USING_PATTERN)).toEqual(
              state.relationships.get(USING_PATTERN)?.seeAlso,
            );
          });
          And('the api references equal the relationship apiRef edges', () => {
            expect(state.api.getApiReferences(USING_PATTERN)).toEqual(
              state.relationships.get(USING_PATTERN)?.apiRef,
            );
          });
        },
      );
    },
  );

  Rule('Phase and quarter rollups never exceed the whole', ({ RuleScenario }) => {
    RuleScenario('Active phases are a subset of all phases', ({ When, Then, And }) => {
      When('I read the active phases', () => undefined);
      Then('every active phase appears among all phases', () => {
        const allNumbers = new Set(state.api.getAllPhases().map((phase) => phase.phaseNumber));
        for (const phase of state.api.getActivePhases()) {
          expect(allNumbers.has(phase.phaseNumber)).toBe(true);
        }
      });
      And('every active phase has at least one active pattern', () => {
        for (const phase of state.api.getActivePhases()) {
          expect(phase.counts.active).toBeGreaterThan(0);
        }
      });
    });

    RuleScenario('Phase and quarter rollups are bounded by the grand total', ({ When, Then, And }) => {
      When('I read the status counts', () => {
        state.counts = state.api.getStatusCounts();
      });
      Then('no phase total exceeds the grand total', () => {
        const total = requireCounts().total;
        for (const phase of state.api.getAllPhases()) {
          expect(phase.counts.total).toBeLessThanOrEqual(total);
        }
      });
      And('every phase bucket partitions its own total', () => {
        for (const phase of state.api.getAllPhases()) {
          const { completed, active, planned, candidate, total } = phase.counts;
          expect(completed + active + planned + candidate).toBe(total);
        }
      });
      And('no quarter total exceeds the grand total', () => {
        const total = requireCounts().total;
        for (const quarter of state.api.getQuarters()) {
          expect(quarter.counts.total).toBeLessThanOrEqual(total);
        }
      });
      And('every quarter total equals its pattern-list length', () => {
        for (const quarter of state.api.getQuarters()) {
          expect(quarter.counts.total).toBe(quarter.patterns.length);
        }
      });
    });

    RuleScenario('Phase progress agrees with the phase patterns', ({ When, Then, And }) => {
      When('I read the status counts', () => {
        state.counts = state.api.getStatusCounts();
      });
      Then('each phase progress total equals its pattern count', () => {
        for (const phase of state.api.getAllPhases()) {
          const progress = state.api.getPhaseProgress(phase.phaseNumber);
          expect(progress?.total).toBe(state.api.getPatternsByPhase(phase.phaseNumber).length);
        }
      });
      And('each phase progress completed count equals its bucket completed count', () => {
        for (const phase of state.api.getAllPhases()) {
          const progress = state.api.getPhaseProgress(phase.phaseNumber);
          expect(progress?.completed).toBe(phase.counts.completed);
        }
      });
    });
  });

  Rule(
    'Recently-completed returns only completed patterns within the limit',
    ({ RuleScenario }) => {
      RuleScenario(
        'Recently-completed respects the limit and reports only completed patterns',
        ({ When, Then, And }) => {
          When(
            'I read the {number} most recently completed patterns',
            (_ctx: unknown, limit: number) => {
              state.recentlyCompleted = state.api.getRecentlyCompleted(limit);
            },
          );
          Then('at most {number} patterns are returned', (_ctx: unknown, limit: number) => {
            expect(state.recentlyCompleted?.length ?? 0).toBeLessThanOrEqual(limit);
          });
          And('every returned pattern is in the completed bucket', () => {
            const completedNames = new Set(
              state.api.getPatternsByNormalizedStatus('completed').map(patternName),
            );
            for (const pattern of state.recentlyCompleted ?? []) {
              expect(completedNames.has(patternName(pattern))).toBe(true);
            }
          });
          And('every returned pattern has a completed date', () => {
            for (const pattern of state.recentlyCompleted ?? []) {
              expect(pattern.completed).toBeDefined();
            }
          });
          And('the returned patterns are ordered by completed date descending', () => {
            const dates = (state.recentlyCompleted ?? []).map((pattern) => pattern.completed ?? '');
            for (let index = 1; index < dates.length; index += 1) {
              expect(dates[index - 1]! >= dates[index]!).toBe(true);
            }
          });
        },
      );
    },
  );

  Rule('The tag-usage oracle agrees with the status counters', ({ RuleScenario }) => {
    RuleScenario('The tag-usage status tally agrees with the status counts', ({ When, Then, And }) => {
      When('I read the status counts', () => {
        state.counts = state.api.getStatusCounts();
      });
      And('I aggregate tag usage over the graph', () => {
        state.tagUsage = aggregateTagUsage(state.api.getPatternGraph());
      });
      Then('the tag-usage active count equals the active status count', () => {
        expect(tagStatusCount('active')).toBe(requireCounts().active);
      });
      And('the tag-usage completed count equals the completed status count', () => {
        expect(tagStatusCount('completed')).toBe(requireCounts().completed);
      });
      And('the tag-usage candidate count equals the candidate status count', () => {
        expect(tagStatusCount('candidate')).toBe(requireCounts().candidate);
      });
      And('the tag-usage status total equals the grand total', () => {
        if (state.tagUsage === null) throw new Error('tag usage not aggregated');
        const statusTag = state.tagUsage.tags.find((tag) => tag.tag === 'status');
        expect(statusTag?.count).toBe(requireCounts().total);
      });
    });
  });
});
