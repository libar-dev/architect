import type { ExtractedPattern } from '@libar-dev/architect-core';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  renderMarkdown,
  type ApiReferenceDigest,
  type ProjectionContext,
} from '../../../../src/index.js';
import { buildApiReferenceBundle } from '../../../../src/projections/documentation-composition/api-reference.js';
import { createPattern, createProjectionContext } from '../governance/support.js';

type ExtractedShape = NonNullable<ExtractedPattern['extractedShapes']>[number];

interface ApiReferenceState {
  context: ProjectionContext | null;
  bundle: ReturnType<typeof buildApiReferenceBundle> | null;
  rendered: string | Record<string, string> | null;
}

let state: ApiReferenceState | null = null;

const DANGER_DESCRIPTION = 'A *bold* claim with <html> & a |pipe|.';
const DANGER_SOURCE = 'type DangerType = "```";';

function shape(
  overrides: Partial<ExtractedShape> & Pick<ExtractedShape, 'name' | 'kind' | 'sourceText'>,
): ExtractedShape {
  return { lineNumber: 1, exported: true, ...overrides };
}

function annotatedContext(): ProjectionContext {
  return createProjectionContext({
    patterns: [
      createPattern('WidgetContract', {
        role: 'contract',
        file: 'packages/architect-core/src/widget.ts',
        extractedShapes: [
          shape({
            name: 'WidgetConfig',
            kind: 'interface',
            sourceText: 'interface WidgetConfig {\n  width: number;\n}',
            jsDoc: '/**\n * Configuration for a widget.\n */',
            propertyDocs: [{ name: 'width', jsDoc: 'The widget width in pixels.' }],
          }),
          shape({
            name: 'makeWidget',
            kind: 'function',
            sourceText: 'function makeWidget(config: WidgetConfig): Widget;',
            jsDoc: '/**\n * Builds a widget.\n */',
            params: [
              { name: 'config', type: 'WidgetConfig', description: 'The widget configuration.' },
            ],
            returns: { type: 'Widget', description: 'A new widget.' },
            throws: [{ type: 'Error', description: 'When the config is invalid.' }],
          }),
          shape({
            name: 'WidgetKind',
            kind: 'enum',
            sourceText: 'enum WidgetKind {\n  Primary,\n  Secondary,\n}',
          }),
        ],
      }),
      createPattern('AlphaContract', {
        role: 'contract',
        file: 'packages/architect-core/src/alpha.ts',
        extractedShapes: [
          shape({
            name: 'DangerType',
            kind: 'type',
            sourceText: DANGER_SOURCE,
            jsDoc: `/**\n * ${DANGER_DESCRIPTION}\n */`,
          }),
        ],
      }),
      createPattern('RenderContract', {
        role: 'contract',
        file: 'packages/architect-projection/src/render.ts',
        extractedShapes: [
          shape({
            name: 'RenderOptions',
            kind: 'interface',
            sourceText: 'interface RenderOptions {\n  pretty: boolean;\n}',
            propertyDocs: [{ name: 'pretty', jsDoc: 'Whether to pretty-print.' }],
          }),
        ],
      }),
    ],
  });
}

function bareContext(): ProjectionContext {
  return createProjectionContext({
    patterns: [
      createPattern('PlainContract', {
        role: 'contract',
        file: 'packages/architect-core/src/plain.ts',
      }),
    ],
  });
}

function requireBundle(): ReturnType<typeof buildApiReferenceBundle> {
  if (state!.bundle === null) {
    state!.bundle = buildApiReferenceBundle(state!.context!);
  }
  return state!.bundle;
}

function requireRecord(): Record<string, string> {
  const rendered = state!.rendered;
  if (rendered === null || typeof rendered === 'string') {
    throw new Error('Expected renderMarkdown to return a routed markdown record.');
  }
  return rendered;
}

const feature = await loadFeature(
  'tests/features/projections/documentation-composition/api-reference.feature',
);

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a graph with shape-annotated patterns across two packages', () => {
      state = { context: annotatedContext(), bundle: null, rendered: null };
    });
  });

  Rule('The bundle groups shapes by package under a navigation root', ({ RuleScenario }) => {
    RuleScenario('Shapes are grouped into per-package children', ({ When, Then, And }) => {
      When('I build the api-reference bundle', () => {
        state!.bundle = buildApiReferenceBundle(state!.context!);
      });

      Then('the root scope should be {string}', (_ctx: unknown, scope: string) => {
        expect(requireBundle().root.scope).toBe(scope);
      });

      And('the bundle children keys should be {string}', (_ctx: unknown, csv: string) => {
        const expected = csv.split(',').map((part) => part.trim());
        expect(Object.keys(requireBundle().children).sort()).toEqual(expected);
      });

      And(
        'the root grouping entries should report 4 shapes for package {string}',
        (_ctx: unknown, label: string) => {
          const root = requireBundle().root as Extract<ApiReferenceDigest, { scope: 'all' }>;
          const entry = root.groupingEntries?.find((candidate) => candidate.label === label);
          expect(entry?.shapeCount).toBe(4);
          expect(entry?.patternCount).toBe(2);
        },
      );

      And('each child digest should list its shapes sorted by owning pattern', () => {
        const child = requireBundle().children['architect-core'] as Extract<
          ApiReferenceDigest,
          { scope: 'package' }
        >;
        const patterns = child.shapes.map((entry) => entry.pattern);
        expect(patterns).toEqual([...patterns].sort((a, b) => a.localeCompare(b)));
        expect(patterns[0]).toBe('AlphaContract');
      });
    });
  });

  Rule(
    'The renderer emits field-tables and signatures per documentation kind',
    ({ RuleScenario }) => {
      RuleScenario(
        'A package document renders interface, function, and enum shapes',
        ({ When, Then, And }) => {
          When('I render the api-reference bundle to routed markdown', () => {
            state!.rendered = renderMarkdown(buildApiReferenceBundle(state!.context!), {
              includeChildren: true,
              includeFrontmatter: true,
              splitStrategy: 'never',
            });
          });

          const expectTable = (_ctx: unknown, file: string, label: string): void => {
            const doc = requireRecord()[file];
            expect(doc).toBeDefined();
            expect(doc).toContain(`#### ${label}`);
          };

          Then('the package document {string} should contain a {string} table', expectTable);
          And('the package document {string} should contain a {string} table', expectTable);

          And(
            'the package document {string} should contain a fenced {string} code block',
            (_ctx: unknown, file: string, language: string) => {
              const doc = requireRecord()[file];
              expect(doc).toContain('```' + language);
            },
          );

          And(
            'the root document {string} should link to each package child',
            (_ctx: unknown, file: string) => {
              const doc = requireRecord()[file];
              expect(doc).toBeDefined();
              expect(doc).toContain('api-reference/architect-core.md');
              expect(doc).toContain('api-reference/architect-projection.md');
            },
          );
        },
      );
    },
  );

  Rule(
    'Sourced shape text is escaped and code fences are guarded (ADR-009)',
    ({ RuleScenario }) => {
      RuleScenario('Markdown metacharacters in sourced text are escaped', ({ When, Then, And }) => {
        When('I render the api-reference bundle to routed markdown', () => {
          state!.rendered = renderMarkdown(buildApiReferenceBundle(state!.context!), {
            includeChildren: true,
            includeFrontmatter: true,
            splitStrategy: 'never',
          });
        });

        Then(
          'the rendered package document should escape the shape description metacharacters',
          () => {
            const doc = requireRecord()['api-reference/architect-core.md'];
            expect(doc).toBeDefined();
            // Raw metacharacters must not survive; the escaped forms must be present.
            expect(doc).not.toContain('<html>');
            expect(doc).toContain('&lt;html&gt;');
            expect(doc).toContain('\\*bold\\*');
          },
        );

        And(
          'a source declaration containing a triple-backtick fence should be wrapped in a longer fence',
          () => {
            const doc = requireRecord()['api-reference/architect-core.md'];
            // pickFence widens the fence to 4 backticks so the embedded ``` cannot break out.
            expect(doc).toContain('````ts');
            expect(doc).toContain(DANGER_SOURCE);
          },
        );
      });
    },
  );

  Rule('An unannotated graph degrades to a single document', ({ RuleScenario }) => {
    RuleScenario(
      'A graph with no shapes yields a single root document',
      ({ Given, When, Then }) => {
        Given('a graph with no shape-annotated patterns', () => {
          state = { context: bareContext(), bundle: null, rendered: null };
        });

        When('I render the api-reference bundle to markdown', () => {
          state!.rendered = renderMarkdown(buildApiReferenceBundle(state!.context!), {
            includeChildren: true,
            includeFrontmatter: true,
            splitStrategy: 'never',
          });
        });

        Then('the render result should be a single root document', () => {
          expect(typeof state!.rendered).toBe('string');
        });
      },
    );
  });
});
