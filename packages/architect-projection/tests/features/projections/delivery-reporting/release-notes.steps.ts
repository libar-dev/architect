import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  projectReleaseNotesDigest,
  type ProjectionBundle,
  type ProjectionContext,
  type ReleaseNotesDigest,
} from '../../../../src/index.js';
import { createPattern, createProjectionContext } from './support.js';

interface ReleaseNotesState {
  context: ProjectionContext | null;
  bundle: ProjectionBundle<ReleaseNotesDigest> | null;
}

const feature = await loadFeature(
  'tests/features/projections/delivery-reporting/release-notes.feature'
);

let state: ReleaseNotesState | null = null;

function createState(): ReleaseNotesState {
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
    Given('the Delivery Reporting release notes projection state is initialized', () => {
      state = createState();
    });
    And('the following deliverables:', () => void 0);
  });

  Rule(
    'Release notes keep changelog grouping semantics without renderer formatting',
    ({ RuleScenario }) => {
      RuleScenario(
        'release notes group unreleased, tagged, and fallback entries',
        ({ Given, When, Then, And }) => {
          Given(
            'a release notes projection context with unreleased, versioned, and fallback completions',
            () => {
              state!.context = createProjectionContext({
                patterns: [
                  createPattern('ActivePreview', {
                    status: 'active',
                    phase: 16,
                    release: 'vNEXT',
                    deliverables: [
                      {
                        name: 'Preview docs',
                        status: 'in-progress',
                        tests: 1,
                        location: 'docs/preview.md',
                        release: 'vNEXT',
                      },
                    ],
                  }),
                  createPattern('ReleaseCut', {
                    status: 'completed',
                    phase: 17,
                    release: 'v1.2.0',
                    completed: '2026-04-19',
                    deliverables: [
                      {
                        name: 'Roadmap bundle',
                        status: 'complete',
                        tests: 2,
                        location: 'src/projections/delivery-reporting/roadmap.ts',
                        release: 'v1.2.0',
                      },
                    ],
                  }),
                  createPattern('QuarterFallback', {
                    status: 'completed',
                    phase: 18,
                    quarter: 'Q2-2026',
                    completed: '2026-03-01',
                    deliverables: [
                      {
                        name: 'Traceability bundle',
                        status: 'complete',
                        tests: 1,
                        location: 'src/projections/delivery-reporting/traceability-matrix.ts',
                      },
                    ],
                  }),
                  createPattern('EarlierFallback', {
                    status: 'completed',
                    phase: 19,
                    completed: '2026-01-15',
                  }),
                ],
              });
            }
          );

          When('I project release notes without a filter', () => {
            state!.bundle = projectReleaseNotesDigest(state!.context!);
          });

          Then('the release notes root should group entries in changelog order', () => {
            expect(state!.bundle?.root.releases.map((entry) => entry.release)).toEqual([
              'Unreleased',
              'v1.2.0',
              'Q2-2026',
              'Earlier',
            ]);
            expect(state!.bundle?.root.releases[1]).toMatchObject({
              release: 'v1.2.0',
              date: '2026-04-19',
              patterns: [
                {
                  kind: 'PatternSummary',
                  patternName: 'ReleaseCut',
                },
              ],
              deliverables: [
                {
                  name: 'Roadmap bundle',
                  location: 'src/projections/delivery-reporting/roadmap.ts',
                  release: 'v1.2.0',
                },
              ],
            });
          });

          And('the release notes child keys should be deterministic', () => {
            expect(Object.keys(state!.bundle?.children ?? {})).toEqual([
              'unreleased',
              'v1-2-0',
              'q2-2026',
              'earlier',
            ]);
          });
        }
      );

      RuleScenario(
        'release filters keep only the requested release entry',
        ({ Given, When, Then }) => {
          Given(
            'a release notes projection context with unreleased, versioned, and fallback completions',
            () => {
              state!.context = createProjectionContext({
                patterns: [
                  createPattern('ActivePreview', { status: 'active', phase: 16, release: 'vNEXT' }),
                  createPattern('ReleaseCut', {
                    status: 'completed',
                    phase: 17,
                    release: 'v1.2.0',
                    completed: '2026-04-19',
                  }),
                  createPattern('QuarterFallback', {
                    status: 'completed',
                    phase: 18,
                    quarter: 'Q2-2026',
                  }),
                ],
              });
            }
          );

          When('I project release notes filtered to {string}', (_ctx: unknown, release: string) => {
            state!.bundle = projectReleaseNotesDigest(state!.context!, release);
          });

          Then(
            'the filtered release notes root should contain only {string}',
            (_ctx: unknown, release: string) => {
              expect(state!.bundle?.root.releases).toHaveLength(1);
              expect(state!.bundle?.root.releases[0]?.release).toBe(release);
            }
          );
        }
      );
    }
  );
});
