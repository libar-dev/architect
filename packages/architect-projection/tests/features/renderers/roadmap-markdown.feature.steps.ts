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
  rendered: string | null;
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

  Rule('Roadmap documentation bundles stay routed as a flat pattern list', ({ RuleScenario }) => {
    RuleScenario(
      'roadmap documentation bundle renders routed markdown files',
      ({ Given, When, Then, And }) => {
        Given('a documentation projection context with roadmap and deferred patterns', () => {
          state!.context = createProjectionContext({
            patterns: [
              createPattern('RoadmapAlpha', {
                status: 'roadmap',
              }),
              createPattern('RoadmapBeta', {
                status: 'deferred',
              }),
              createPattern('ActiveNoise', {
                status: 'active',
              }),
            ],
          });
        });

        When('I project and render the roadmap documentation bundle as markdown', () => {
          state!.bundle = parseAndProjectDocumentationBundle(state!.context!, {
            documentType: 'roadmap',
          });
          const rendered = renderMarkdown(state!.bundle!);
          expect(typeof rendered).toBe('string');

          if (typeof rendered !== 'string') {
            throw new Error('Expected roadmap markdown rendering to return a single document.');
          }

          state!.rendered = rendered;
        });

        Then('the routed markdown output should include the roadmap root file', () => {
          expect(typeof state!.rendered).toBe('string');
          expect(state!.rendered).toContain('# Roadmap');
        });

        And('the roadmap root markdown should summarize the roadmap patterns', () => {
          const root = state!.rendered ?? '';
          expect(root).toContain('Roadmap timeline covering 2 patterns.');
          expect(root).toContain('RoadmapAlpha');
          expect(root).toContain('RoadmapBeta');
          expect(root).not.toContain('ActiveNoise');
          expect(root).toContain('packages/architect-projection/fixtures/RoadmapAlpha.ts');
        });
      },
    );
  });
});
