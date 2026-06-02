import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import type { ProjectionContext } from '../../../../src/index.js';
import {
  buildDesignReviewBundle,
  projectDesignReview,
} from '../../../../src/projections/documentation-composition/design-review.js';
import { createPattern, createProjectionContext } from '../governance/support.js';

interface DesignReviewState {
  context: ProjectionContext;
  bundle: ReturnType<typeof buildDesignReviewBundle> | null;
  bundleB: ReturnType<typeof buildDesignReviewBundle> | null;
  scoped: ReturnType<typeof projectDesignReview> | null;
}

let state: DesignReviewState | null = null;

function reviewContext(): ProjectionContext {
  return createProjectionContext({
    patterns: [
      createPattern('WidgetService', {
        status: 'completed',
        role: 'service',
        file: 'packages/architect-core/src/widget.ts',
      }),
      // Working-state spec under `architect/` — excluded from the production
      // architecture view (D-16/D-18) but INCLUDED here.
      createPattern('PlannedFeature', {
        status: 'candidate',
        maturity: 'idea',
        productArea: 'Generation',
        file: 'architect/specs/ideas/planned-feature.feature',
      }),
      // Test feature — the verification surface, excluded from every component view.
      createPattern('WidgetServiceExecutableTests', {
        status: 'active',
        role: 'service',
        file: 'packages/architect-core/tests/features/widget.feature',
        implementsPatterns: ['WidgetService'],
      }),
    ],
  });
}

function rootPatterns(): readonly string[] {
  return state!.bundle!.root.patterns;
}

/** Every Mermaid diagram string across the bundle's root + lens children. */
function allDiagramContents(bundle: ReturnType<typeof buildDesignReviewBundle>): string[] {
  // children are typed as the broad Fragment union; read sections/diagram defensively.
  const fragments = [bundle.root, ...Object.values(bundle.children ?? {})] as {
    readonly sections?: readonly { readonly diagram?: { readonly content?: unknown } }[];
  }[];
  return fragments.flatMap((fragment) =>
    (fragment.sections ?? []).flatMap((section) => {
      const content = section.diagram?.content;
      return typeof content === 'string' ? [content] : [];
    }),
  );
}

/** The Mermaid node-definition line for a pattern (its `id["Name<br/>(…)"]` label). */
function nodeLabelLine(name: string): string | undefined {
  return allDiagramContents(state!.bundle!)
    .flatMap((content) => content.split('\n'))
    .find((line) => line.includes(`["${name}`));
}

const feature = await loadFeature(
  'tests/features/projections/documentation-composition/design-review.feature',
);

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given(
      'a graph with a completed production pattern, a candidate working-state spec, and a test feature',
      () => {
        state = { context: reviewContext(), bundle: null, bundleB: null, scoped: null };
      },
    );
  });

  Rule(
    'A design review includes not-yet-implemented specs and excludes the test surface',
    ({ RuleScenario }) => {
      RuleScenario(
        'the bundle root includes a working-state spec and excludes test features',
        ({ When, Then, And }) => {
          When('I build the design-review bundle', () => {
            state!.bundle = buildDesignReviewBundle(state!.context);
          });

          Then('the bundle root kind should be {string}', (_ctx: unknown, kind: string) => {
            expect(state!.bundle!.root.kind).toBe(kind);
          });

          And(
            'the bundle root presentation title should be {string}',
            (_ctx: unknown, title: string) => {
              expect(state!.bundle!.root.presentation?.title).toBe(title);
            },
          );

          And('the bundle root patterns should include {string}', (_ctx: unknown, csv: string) => {
            for (const name of csv.split(',').map((part) => part.trim())) {
              expect(rootPatterns()).toContain(name);
            }
          });

          And('the bundle root patterns should exclude {string}', (_ctx: unknown, name: string) => {
            expect(rootPatterns()).not.toContain(name);
          });

          And('every bundle lens child should exclude {string}', (_ctx: unknown, name: string) => {
            const children = Object.values(state!.bundle!.children) as {
              patterns?: readonly string[];
            }[];
            expect(children.length).toBeGreaterThan(0);
            for (const child of children) {
              expect(child.patterns ?? []).not.toContain(name);
            }
          });

          And('every bundle lens child should render under a design-review heading', () => {
            const children = Object.values(state!.bundle!.children) as {
              presentation?: { title: string };
            }[];
            expect(children.length).toBeGreaterThan(0);
            for (const child of children) {
              expect(child.presentation?.title ?? '').toMatch(/^Design Review/u);
            }
          });
        },
      );
    },
  );

  Rule(
    'A design review annotates each node with its lifecycle status so unbuilt shape is legible',
    ({ RuleScenario }) => {
      RuleScenario(
        'the working-state spec node shows its status, the shipped pattern shows its own',
        ({ When, Then, And }) => {
          When('I build the design-review bundle', () => {
            state!.bundle = buildDesignReviewBundle(state!.context);
          });

          Then(
            'the diagram for {string} should be annotated with status {string}',
            (_ctx: unknown, name: string, status: string) => {
              const line = nodeLabelLine(name);
              expect(line, `no node label found for ${name}`).toBeDefined();
              expect(line).toContain(`${status})`);
            },
          );

          And(
            'the diagram for {string} should be annotated with status {string}',
            (_ctx: unknown, name: string, status: string) => {
              const line = nodeLabelLine(name);
              expect(line, `no node label found for ${name}`).toBeDefined();
              expect(line).toContain(`${status})`);
            },
          );
        },
      );
    },
  );

  Rule(
    'A design review is a deterministic projection, never a hand-maintained artifact',
    ({ RuleScenario }) => {
      RuleScenario(
        'building the design-review bundle twice yields an identical bundle',
        ({ When, Then }) => {
          When('I build the design-review bundle twice', () => {
            state!.bundle = buildDesignReviewBundle(state!.context);
            state!.bundleB = buildDesignReviewBundle(state!.context);
          });

          Then('the two design-review bundles should be deeply equal', () => {
            expect(state!.bundleB).toEqual(state!.bundle);
          });
        },
      );
    },
  );

  Rule(
    "A design review's scope is a related set, not only one central pattern",
    ({ RuleScenario }) => {
      RuleScenario('a scoped review narrows to one product area', ({ When, Then, And }) => {
        When(
          'I project a design review scoped to product-area {string}',
          (_ctx: unknown, area: string) => {
            state!.scoped = projectDesignReview(state!.context, {
              scope: 'product-area',
              scopeValue: area,
            });
          },
        );

        Then(
          'the scoped diagram patterns should include {string}',
          (_ctx: unknown, name: string) => {
            expect(state!.scoped!.root.patterns).toContain(name);
          },
        );

        And(
          'the scoped diagram patterns should exclude {string}',
          (_ctx: unknown, name: string) => {
            expect(state!.scoped!.root.patterns).not.toContain(name);
          },
        );
      });
    },
  );
});
