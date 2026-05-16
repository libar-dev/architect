import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  projectCompletedMilestones,
  projectCurrentWork,
  projectRoadmapTimeline,
  type ProjectionBundle,
  type ProjectionContext,
  type RoadmapTimeline,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext, splitList } from './support.js';

interface TimelineProjectionState {
  context: ProjectionContext | null;
  bundle: ProjectionBundle<RoadmapTimeline> | null;
}

const feature = await loadFeature(
  'tests/features/projections/delivery-reporting/roadmap-timeline.feature'
);

let state: TimelineProjectionState | null = null;

function createState(): TimelineProjectionState {
  return {
    context: null,
    bundle: null,
  };
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given, And }) => {
    Given('the Delivery Reporting timeline projection state is initialized', () => {
      state = createState();
    });
    And('the following deliverables:', () => void 0);
  });

  Rule(
    'Timeline bundles keep roadmap internals, milestones, and current work split by entrypoint',
    ({ RuleScenario }) => {
      RuleScenario('roadmap quarters are ordered chronologically', ({ Given, When, Then, And }) => {
        Given(
          'a timeline projection context with roadmap work in quarters {string}',
          (_ctx: unknown, quarters: string) => {
            const quarterList = splitList(quarters);
            state!.context = createProjectionContext({
              patterns: quarterList.map((quarter, index) => {
                const roadmapName = `Roadmap${String(index + 1)}`;

                return createPattern(roadmapName, {
                  status: index === 1 ? 'deferred' : 'roadmap',
                  phase: 16 + index,
                  quarter,
                });
              }),
            });
          }
        );

        When('I project the roadmap timeline', () => {
          state!.bundle = projectRoadmapTimeline(state!.context!);
        });

        Then(
          'the roadmap root quarters should be ordered as {string}',
          (_ctx: unknown, orderedQuarters: string) => {
            expect(state!.bundle?.root).toEqual({
              kind: 'RoadmapTimeline',
              view: 'roadmap',
              quarters: [
                {
                  quarter: 'Q1 2026',
                  patterns: [
                    {
                      kind: 'PatternSummary',
                      patternName: 'Roadmap1',
                      status: 'roadmap',
                      maturity: 'plan',
                      role: 'service',
                      phase: 16,
                      file: 'packages/architect-projection/fixtures/Roadmap1.ts',
                      source: 'typescript',
                    },
                  ],
                  counts: { completed: 0, active: 0, planned: 1, candidate: 0, total: 1 },
                },
                {
                  quarter: 'Q2 2026',
                  patterns: [
                    {
                      kind: 'PatternSummary',
                      patternName: 'Roadmap2',
                      status: 'deferred',
                      maturity: 'plan',
                      role: 'service',
                      phase: 17,
                      file: 'packages/architect-projection/fixtures/Roadmap2.ts',
                      source: 'typescript',
                    },
                  ],
                  counts: { completed: 0, active: 0, planned: 1, candidate: 0, total: 1 },
                },
                {
                  quarter: 'Q10 2026',
                  patterns: [
                    {
                      kind: 'PatternSummary',
                      patternName: 'Roadmap3',
                      status: 'roadmap',
                      maturity: 'plan',
                      role: 'service',
                      phase: 18,
                      file: 'packages/architect-projection/fixtures/Roadmap3.ts',
                      source: 'typescript',
                    },
                  ],
                  counts: { completed: 0, active: 0, planned: 1, candidate: 0, total: 1 },
                },
              ],
            });
            expect(state!.bundle?.root.quarters.map((entry) => entry.quarter).join(', ')).toBe(
              orderedQuarters
            );
          }
        );

        And(
          'the roadmap child keys should be ordered as {string}',
          (_ctx: unknown, orderedKeys: string) => {
            expect(Object.keys(state!.bundle?.children ?? {})).toEqual([
              'q1-2026',
              'q2-2026',
              'q10-2026',
            ]);
            expect(Object.keys(state!.bundle?.children ?? {}).join(', ')).toBe(orderedKeys);
          }
        );
      });

      RuleScenario(
        'completed milestones keep only completed quarter entries',
        ({ Given, When, Then }) => {
          Given('a timeline projection context with completed, active, and planned work', () => {
            state!.context = createProjectionContext({
              patterns: [
                createPattern('CompletedA', { status: 'completed', phase: 20, quarter: 'Q1-2026' }),
                createPattern('CompletedB', { status: 'completed', phase: 21, quarter: 'Q2-2026' }),
                createPattern('ActiveA', { status: 'active', phase: 22, quarter: 'Q2-2026' }),
                createPattern('PlannedA', { status: 'roadmap', phase: 23, quarter: 'Q3-2026' }),
              ],
            });
          });

          When('I project the completed milestones timeline', () => {
            state!.bundle = projectCompletedMilestones(state!.context!);
          });

          Then('the milestones root should contain only completed quarter entries', () => {
            expect(state!.bundle?.root.view).toBe('milestones');
            expect(state!.bundle?.root.quarters.map((entry) => entry.quarter)).toEqual([
              'Q1-2026',
              'Q2-2026',
            ]);
            expect(
              state!.bundle?.root.quarters.flatMap((entry) =>
                entry.patterns.map((pattern) => pattern.patternName)
              )
            ).toEqual(['CompletedA', 'CompletedB']);
          });
        }
      );

      RuleScenario('current work keeps only active quarter entries', ({ Given, When, Then }) => {
        Given('a timeline projection context with completed, active, and planned work', () => {
          state!.context = createProjectionContext({
            patterns: [
              createPattern('CompletedA', { status: 'completed', phase: 20, quarter: 'Q1-2026' }),
              createPattern('ActiveA', { status: 'active', phase: 21, quarter: 'Q1-2026' }),
              createPattern('ActiveB', { status: 'active', phase: 22, quarter: 'Q3-2026' }),
              createPattern('PlannedA', { status: 'roadmap', phase: 23, quarter: 'Q4-2026' }),
            ],
          });
        });

        When('I project the current work timeline', () => {
          state!.bundle = projectCurrentWork(state!.context!);
        });

        Then('the current-work root should contain only active quarter entries', () => {
          expect(state!.bundle?.root.view).toBe('current');
          expect(state!.bundle?.root.quarters.map((entry) => entry.quarter)).toEqual([
            'Q1-2026',
            'Q3-2026',
          ]);
          expect(
            state!.bundle?.root.quarters.flatMap((entry) =>
              entry.patterns.map((pattern) => pattern.patternName)
            )
          ).toEqual(['ActiveA', 'ActiveB']);
        });
      });
    }
  );
});
