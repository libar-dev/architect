import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  parseAndProjectDocumentationBundle,
  renderMarkdown,
  type Fragment,
  type ProjectionBundle,
  type ProjectionContext,
} from '../../../src/index.js';
import {
  createPattern,
  createProjectionContext,
} from '../projections/delivery-reporting/support.js';

interface RoadmapMarkdownState {
  context: ProjectionContext | null;
  bundle: ProjectionBundle<Fragment> | null;
  rendered: Record<string, string> | null;
}

const feature = await loadFeature('tests/features/renderers/roadmap-markdown.feature');

let state: RoadmapMarkdownState | null = null;

function createState(): RoadmapMarkdownState {
  return {
    context: null,
    bundle: null,
    rendered: null,
  };
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the roadmap markdown renderer state is initialized', () => {
      state = createState();
    });
  });

  Rule('Roadmap documentation bundles stay routed and quarter-grouped', ({ RuleScenario }) => {
    RuleScenario(
      'roadmap documentation bundle renders routed markdown files',
      ({ Given, When, Then, And }) => {
        Given(
          'a documentation projection context with roadmap and deferred quarter entries',
          () => {
            state!.context = createProjectionContext({
              patterns: [
                createPattern('RoadmapAlpha', {
                  status: 'roadmap',
                  phase: 16,
                  quarter: 'Q1 2026',
                }),
                createPattern('RoadmapBeta', {
                  status: 'deferred',
                  phase: 17,
                  quarter: 'Q2 2026',
                }),
                createPattern('ActiveNoise', {
                  status: 'active',
                  phase: 18,
                  quarter: 'Q3 2026',
                }),
              ],
            });
          }
        );

        When('I project and render the roadmap documentation bundle as markdown', () => {
          state!.bundle = parseAndProjectDocumentationBundle(state!.context!, {
            documentType: 'roadmap',
          });
          const rendered = renderMarkdown(state!.bundle!);
          expect(typeof rendered).toBe('object');
          expect(rendered).not.toBeNull();

          if (typeof rendered === 'string') {
            throw new Error('Expected roadmap markdown rendering to return routed files.');
          }

          state!.rendered = rendered;
        });

        Then(
          'the routed markdown output should include the roadmap root and quarter child files',
          () => {
            expect(Object.keys(state!.rendered ?? {})).toEqual([
              'ROADMAP.md',
              'roadmap/q1-2026.md',
              'roadmap/q2-2026.md',
            ]);
          }
        );

        And('the roadmap root markdown should summarize the roadmap quarters', () => {
          const root = state!.rendered?.['ROADMAP.md'];
          expect(root).toContain('# Roadmap');
          expect(root).toContain('Quarter-grouped roadmap timeline covering 2 quarters.');
          expect(root).toContain('## Q1 2026');
          expect(root).toContain('## Q2 2026');
          expect(root).toContain('RoadmapAlpha');
          expect(root).toContain('RoadmapBeta');
          expect(root).not.toContain('ActiveNoise');
        });

        And('the roadmap child markdown should retain the quarter pattern details', () => {
          const child = state!.rendered?.['roadmap/q1-2026.md'];
          expect(child).toContain('# Roadmap');
          expect(child).toContain('## Q1 2026');
          expect(child).toContain('RoadmapAlpha');
          expect(child).toContain('packages/architect-projection/fixtures/RoadmapAlpha.ts');
        });
      }
    );
  });
});
