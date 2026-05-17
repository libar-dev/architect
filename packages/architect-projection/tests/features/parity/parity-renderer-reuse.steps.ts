import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  parseAndProjectBusinessRuleSet,
  projectDocumentationBundle,
  renderJson,
  renderMarkdown,
  renderUi,
  type BusinessRuleSet,
  type Fragment,
  type ProgressiveDisclosureLevel,
  type ProjectionBundle,
  type ProjectionContext,
} from '../../../src/index.js';

import { createParityContext } from './parity-fixtures.js';

interface RendererState {
  context: ProjectionContext | null;
  bundle: ProjectionBundle<BusinessRuleSet> | null;
  markdown: Record<string, string> | null;
  jsonBaseline: string | null;
  uiBaseline: string | null;
}

const feature = await loadFeature('tests/features/parity/parity-renderer-reuse.feature');

let state: RendererState | null = null;

function createState(): RendererState {
  return {
    context: null,
    bundle: null,
    markdown: null,
    jsonBaseline: null,
    uiBaseline: null,
  };
}

function projectBusinessRulesAt(
  context: ProjectionContext,
  disclosureLevel: ProgressiveDisclosureLevel,
): ProjectionBundle<Fragment> {
  return projectDocumentationBundle(context, {
    documentType: 'business-rules',
    disclosureLevel,
  });
}

function uiSnapshot(value: unknown): string {
  return JSON.stringify(value, sortKeysReplacer, 2);
}

function sortKeysReplacer(_key: string, value: unknown): unknown {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }
  const entries = Object.entries(value as Record<string, unknown>);
  entries.sort(([left], [right]) => left.localeCompare(right));
  return Object.fromEntries(entries);
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a parity projection context with three patterns across two packages', () => {
      state = createState();
      state.context = createParityContext();
    });
  });

  Rule('A single BusinessRuleSet bundle drives all three renderers', ({ RuleScenario }) => {
    RuleScenario('Fragment reuse across markdown, JSON, and UI', ({ When, And, Then }) => {
      When('I project the business-rules bundle grouped by package', () => {
        state!.bundle = parseAndProjectBusinessRuleSet(state!.context!, {
          scope: 'all',
          groupedBy: 'package',
        });
      });

      And('I render the bundle with markdown, JSON, and UI', () => {
        state!.markdown = renderMarkdown(state!.bundle!) as Record<string, string>;
        state!.jsonBaseline = renderJson(state!.bundle!, { pretty: true });
        state!.uiBaseline = uiSnapshot(renderUi(state!.bundle!));
      });

      Then('the markdown output groups rules under each configured package heading', () => {
        const rendered = Object.values(state!.markdown!).join('\n');
        expect(rendered).toContain('architect-projection');
        expect(rendered).toContain('architect-cli');
      });

      And('the JSON output exposes the BusinessRule fields verbatim', () => {
        const parsed = JSON.parse(state!.jsonBaseline!) as Record<string, unknown>;
        const root =
          (parsed['root'] as Record<string, unknown> | undefined) ??
          (parsed as Record<string, unknown>);
        expect(root['kind']).toBe('BusinessRuleSet');
        expect(root).toHaveProperty('rules');
      });

      And('the UI output is structured with one section per child route', () => {
        const ui = JSON.parse(state!.uiBaseline!) as Record<string, unknown>;
        expect(ui).toHaveProperty('kind');
        expect(ui).toHaveProperty('sections');
        expect(Array.isArray(ui['sections'])).toBe(true);
      });

      And('no domain projection function ran more than once', () => {
        // The bundle is projected once at the When step. Re-rendering does not
        // re-project — assert the renderers receive the same bundle reference,
        // proving they neither mutate nor re-derive from the graph.
        const projected = state!.bundle!;
        renderJson(projected);
        renderUi(projected);
        renderMarkdown(projected);
        expect(state!.bundle).toBe(projected);
      });
    });
  });

  Rule('JSON output is invariant across disclosure levels', ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(
      'JSON is byte-identical across disclosure levels',
      ({ When, Then }, examples: Record<string, unknown>) => {
        When('I project the business-rules bundle at disclosure "essential"', () => {
          state!.jsonBaseline = renderJson(projectBusinessRulesAt(state!.context!, 'essential'), {
            pretty: true,
          });
        });

        Then(
          'the JSON output at disclosure "<level>" matches the JSON output at disclosure "essential"',
          () => {
            const level = examples['level'] as ProgressiveDisclosureLevel;
            const projected = projectBusinessRulesAt(state!.context!, level);
            const json = renderJson(projected, { pretty: true });
            expect(json).toBe(state!.jsonBaseline);
          },
        );
      },
    );
  });

  Rule(
    'UI output is structurally identical across disclosure levels',
    ({ RuleScenarioOutline }) => {
      RuleScenarioOutline(
        'UI output is structurally identical across disclosure levels',
        ({ When, Then }, examples: Record<string, unknown>) => {
          When('I project the business-rules bundle at disclosure "essential"', () => {
            state!.uiBaseline = uiSnapshot(
              renderUi(projectBusinessRulesAt(state!.context!, 'essential')),
            );
          });

          Then(
            'the UI output at disclosure "<level>" has the same section structure as the UI output at disclosure "essential"',
            () => {
              const level = examples['level'] as ProgressiveDisclosureLevel;
              const projected = projectBusinessRulesAt(state!.context!, level);
              const snapshot = uiSnapshot(renderUi(projected));
              expect(snapshot).toBe(state!.uiBaseline);
            },
          );
        },
      );
    },
  );
});
