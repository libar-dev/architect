import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  FragmentSchema,
  renderCompactText,
  renderJson,
  renderMarkdown,
  renderUi,
  type Fragment,
} from '../../../src/index.js';
import {
  FRAGMENT_SCHEMAS,
  FRAGMENT_VALID_FIXTURES,
  type PublicFragmentKind,
} from '../../fixtures/fragments.js';

type RendererName = 'renderCompactText' | 'renderJson' | 'renderMarkdown' | 'renderUi';

interface RendererSmokeState {
  fixture: Fragment | null;
  outputs: Partial<Record<RendererName, unknown>>;
  errors: { renderer: RendererName; error: unknown }[];
}

const feature = await loadFeature('tests/features/renderers/renderer-smoke.feature');

let state: RendererSmokeState | null = null;

function createState(): RendererSmokeState {
  return { fixture: null, outputs: {}, errors: [] };
}

function kindFromExamples(examples: Record<string, unknown>): PublicFragmentKind {
  const kind = examples['kind'];
  if (typeof kind !== 'string' || !(kind in FRAGMENT_SCHEMAS)) {
    throw new Error(`Unknown fragment kind "${String(kind)}" in examples row`);
  }
  return kind as PublicFragmentKind;
}

function runRenderer(name: RendererName, fn: () => unknown): void {
  try {
    state!.outputs[name] = fn();
  } catch (error) {
    state!.errors.push({ renderer: name, error });
  }
}

function isNonEmptyProjection(value: unknown): boolean {
  if (typeof value === 'string') return value.length > 0;
  if (value !== null && typeof value === 'object') return Object.keys(value).length > 0;
  return false;
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the renderer smoke test state is initialized', () => {
      state = createState();
    });
  });

  Rule(
    'All four renderers produce a non-empty projection for every fragment kind',
    ({ RuleScenarioOutline }) => {
      RuleScenarioOutline(
        'all four renderers accept a <kind> fragment',
        ({ Given, When, Then, And }, examples: Record<string, unknown>) => {
          const kind = kindFromExamples(examples);

          Given('a valid "<kind>" fragment fixture', () => {
            state!.fixture = FRAGMENT_VALID_FIXTURES[kind];
          });

          When(
            'I run renderCompactText, renderJson, renderMarkdown, and renderUi against the fixture',
            () => {
              const fixture = state!.fixture!;
              runRenderer('renderCompactText', () => renderCompactText(fixture));
              runRenderer('renderJson', () => renderJson(fixture));
              runRenderer('renderMarkdown', () => renderMarkdown(fixture));
              runRenderer('renderUi', () => renderUi(fixture));
            }
          );

          Then('no renderer throws', () => {
            expect(state!.errors).toEqual([]);
          });

          And('each renderer produces a non-empty projection', () => {
            const renderers: readonly RendererName[] = [
              'renderCompactText',
              'renderJson',
              'renderMarkdown',
              'renderUi',
            ];
            for (const name of renderers) {
              const output = state!.outputs[name];
              expect(output, `${name} output for ${kind}`).toBeDefined();
              expect(
                isNonEmptyProjection(output),
                `${name} output for ${kind} should be non-empty`
              ).toBe(true);
            }

            const renderedJson = state!.outputs['renderJson'];
            expect(typeof renderedJson).toBe('object');
            expect(renderedJson).not.toBeNull();
            expect(FragmentSchema.safeParse(renderedJson).success).toBe(true);

            if (kind === 'HandoffRecord') {
              const compactText = state!.outputs['renderCompactText'];
              expect(typeof compactText).toBe('string');
              expect(compactText).toContain('Status: active');
              expect(compactText).not.toContain('Status: unknown');
              expect(compactText).not.toContain('Date: unknown');
            }
          });
        }
      );
    }
  );
});
