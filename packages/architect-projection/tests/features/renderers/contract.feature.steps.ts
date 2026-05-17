import { readFile } from 'node:fs/promises';

import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { describe, expect, expectTypeOf, it } from 'vitest';

import * as publicSurface from '../../../src/index.js';
import {
  type BundleRouting,
  isBundle,
  type Fragment,
  type MarkdownRenderEvent,
  type PatternSummary,
  type ProjectionBundle,
  type RenderCompactOptions,
  type RenderJsonOptions,
  type RenderMarkdownOptions,
  type RenderUiOptions,
} from '../../../src/index.js';
import * as rendererSurface from '../../../src/renderers/index.js';
import type {
  renderCompactText,
  renderJson,
  renderMarkdown,
  renderUi,
} from '../../../src/index.js';
import type { LogicalRouteId } from '../../../src/routing/route-id.js';
import type { DisclosureSpec } from '../../../src/disclosure/spec.js';
import { defaultMarkdownRouteProfile } from '../../../src/renderers/markdown-paths.js';
import { dispatchByKind } from '../../../src/renderers/_shared/dispatch.js';
import { projectSingle } from '../../../src/fragments/base.js';

interface ContractState {
  fragment: PatternSummary | null;
  bundle: ProjectionBundle<PatternSummary> | null;
  bareFragment: Fragment | null;
  bundleCandidate: Fragment | ProjectionBundle<PatternSummary> | null;
  bundleCheck: boolean | null;
  fragmentCheck: boolean | null;
  discriminatedRootKind: string | null;
  markdownRecord: Record<string, string>;
  contractAssertionsRan: boolean;
  documentation: string;
  dispatchDirectResult: string | null;
  dispatchFallbackResult: string | null;
}

const feature = await loadFeature('tests/features/renderers/contract.feature');

let state: ContractState | null = null;

function createState(): ContractState {
  return {
    fragment: null,
    bundle: null,
    bareFragment: null,
    bundleCandidate: null,
    bundleCheck: null,
    fragmentCheck: null,
    discriminatedRootKind: null,
    markdownRecord: {},
    contractAssertionsRan: false,
    documentation: '',
    dispatchDirectResult: null,
    dispatchFallbackResult: null,
  };
}

function createPatternSummary(
  patternName: string,
  status: 'completed' | 'active' | 'planned' | 'candidate',
): PatternSummary {
  return {
    kind: 'PatternSummary',
    patternName,
    status,
    role: 'service',
    phase: 10,
    file: `packages/architect-projection/src/projections/${patternName}.ts`,
    source: 'typescript',
  };
}

function createRouting(): BundleRouting {
  return {
    rootRouteId: 'patterns:index',
    childRouteIds: {
      'projection-bundle-contract': 'patterns:projection-bundle-contract',
      'progressive-disclosure-doc': 'patterns:progressive-disclosure-doc',
    },
    childPathStrategy: 'nested',
    anchorStrategy: 'kind-id',
  };
}

function materializeMarkdownRecord(
  bundle: ProjectionBundle<PatternSummary>,
): Record<string, string> {
  const fileMap: Record<string, string> = {};
  const routing = bundle.routing;

  if (!routing) {
    return fileMap;
  }

  fileMap[
    defaultMarkdownRouteProfile.mapPath(
      routing.rootRouteId as LogicalRouteId,
      bundle.root.kind,
      undefined,
      routing,
    )
  ] = `root:${bundle.root.patternName}`;

  for (const [key, child] of Object.entries(bundle.children)) {
    const routeId = routing.childRouteIds[key];
    if (routeId === undefined) {
      throw new Error(`Missing child route id for ${key}`);
    }

    fileMap[
      defaultMarkdownRouteProfile.mapPath(routeId as LogicalRouteId, child.kind, key, routing)
    ] = `child:${child.kind}:${key}`;
  }

  return fileMap;
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the renderer contract test state is initialized', () => {
      state = createState();
    });
  });

  Rule('Single-fragment helpers stay minimal and discriminable', ({ RuleScenario }) => {
    RuleScenario(
      'projectSingle wraps a single fragment correctly',
      ({ Given, When, Then, And }) => {
        Given('a PatternSummary fragment fixture', () => {
          state!.fragment = createPatternSummary('ProjectionBundleContract', 'active');
        });

        When('I wrap the fragment with projectSingle', () => {
          state!.bundle = projectSingle(state!.fragment!);
        });

        Then('the bundle should keep the fragment as its root', () => {
          expect(state!.bundle?.root).toBe(state!.fragment);
        });

        And('the bundle should start with no children', () => {
          expect(state!.bundle?.children).toEqual({});
        });

        And('the bundle should not define routing', () => {
          expect(state!.bundle?.routing).toBeUndefined();
        });
      },
    );

    RuleScenario(
      'isBundle discriminates bundles from bare fragments',
      ({ Given, When, Then, And }) => {
        Given('a bare fragment fixture and a routed bundle fixture', () => {
          state!.bareFragment = createPatternSummary('ProjectionRendererContract', 'planned');
          state!.bundleCandidate = {
            root: createPatternSummary('ProjectionRendererContract', 'active'),
            children: {
              'projection-renderer-contract': createPatternSummary(
                'ProjectionRendererContractDetail',
                'completed',
              ),
            },
            routing: createRouting(),
          };
        });

        When('I inspect both values with isBundle', () => {
          state!.bundleCheck = isBundle(state!.bundleCandidate);
          state!.fragmentCheck = isBundle(state!.bareFragment);

          if (isBundle(state!.bundleCandidate)) {
            state!.discriminatedRootKind = state!.bundleCandidate.root.kind;
          }
        });

        Then('only the routed bundle should be identified as a bundle', () => {
          expect(state!.bundleCheck).toBe(true);
          expect(state!.fragmentCheck).toBe(false);
        });

        And('bundle discrimination should expose the bundle root kind', () => {
          expect(state!.discriminatedRootKind).toBe('PatternSummary');
        });
      },
    );

    RuleScenario(
      'dispatchByKind falls back when a kind has no direct renderer',
      ({ Given, When, Then, And }) => {
        Given('a PatternSummary fragment fixture', () => {
          state!.fragment = createPatternSummary('ProjectionBundleContract', 'active');
        });

        When('I dispatch the fragment with and without a matching kind handler', () => {
          const fragment = state!.fragment!;

          state!.dispatchDirectResult = dispatchByKind(
            fragment,
            {
              PatternSummary: (value, options: { label: string }) =>
                `direct:${value.kind}:${options.label}`,
            },
            (value, options) => `fallback:${value.kind}:${options.label}`,
            { label: 'renderer-contract' },
          );

          state!.dispatchFallbackResult = dispatchByKind(
            fragment,
            {},
            (value, options: { label: string }) => `fallback:${value.kind}:${options.label}`,
            { label: 'renderer-contract' },
          );
        });

        Then('dispatchByKind should use the direct handler when present', () => {
          expect(state!.dispatchDirectResult).toBe('direct:PatternSummary:renderer-contract');
        });

        And('dispatchByKind should use the fallback when the kind handler is omitted', () => {
          expect(state!.dispatchFallbackResult).toBe('fallback:PatternSummary:renderer-contract');
        });
      },
    );
  });

  Rule(
    'Renderer contracts stay format-specific without implementation coupling',
    ({ RuleScenario }) => {
      RuleScenario(
        'renderer signature types stay locked to the bundle contract',
        ({ When, Then }) => {
          When('I assert the renderer contract types', () => {
            expectTypeOf<{
              sizeBudget?: number;
              splitStrategy?: 'h2-boundary' | 'never';
              includeChildren?: boolean;
              includeFrontmatter?: boolean;
              disclosureLevel?: 'essential' | 'important' | 'useful' | 'advanced';
              disclosureSpec?: DisclosureSpec;
              routeProfile?: {
                mapPath: (
                  routeId: LogicalRouteId,
                  kind: Fragment['kind'],
                  key: string | undefined,
                  routing: BundleRouting | undefined,
                ) => string;
              };
              onRenderDocument?: (event: MarkdownRenderEvent) => void;
            }>().toEqualTypeOf<RenderMarkdownOptions>();

            expectTypeOf<RenderCompactOptions>().toEqualTypeOf<{
              sectionSeparator?: '===' | '---' | 'none';
              includeHeader?: boolean;
              wrapLines?: number;
            }>();

            expectTypeOf<RenderJsonOptions>().toEqualTypeOf<{
              pretty?: boolean;
              stableKeyOrder?: boolean;
            }>();

            expectTypeOf<RenderUiOptions>().toEqualTypeOf<{
              resolveChildLinks: boolean;
            }>();

            expectTypeOf<typeof renderMarkdown>().toEqualTypeOf<
              (
                input: Fragment | ProjectionBundle<Fragment>,
                options?: RenderMarkdownOptions,
              ) => string | Record<string, string>
            >();

            expectTypeOf<typeof renderCompactText>().toEqualTypeOf<
              (
                input: Fragment | ProjectionBundle<Fragment>,
                options?: RenderCompactOptions,
              ) => string
            >();

            expectTypeOf<typeof renderJson>().toEqualTypeOf<{
              (
                input: Fragment | ProjectionBundle<Fragment>,
                options: RenderJsonOptions & { pretty: true },
              ): string;
              (
                input: Fragment | ProjectionBundle<Fragment>,
                options?: RenderJsonOptions & { pretty?: false | undefined },
              ): object;
            }>();

            expectTypeOf<typeof renderUi>().toEqualTypeOf<
              (input: Fragment | ProjectionBundle<Fragment>, options?: RenderUiOptions) => object
            >();

            state!.contractAssertionsRan = true;
          });

          Then('the renderer contract assertions should compile', () => {
            expect(state!.contractAssertionsRan).toBe(true);
          });
        },
      );

      RuleScenario(
        'bundle child routing defines markdown record paths',
        ({ Given, When, Then, And }) => {
          Given('a routed bundle fixture with two children', () => {
            state!.bundle = {
              root: createPatternSummary('ProjectionBundleContract', 'active'),
              children: {
                'projection-bundle-contract': createPatternSummary(
                  'ProjectionBundleContract',
                  'completed',
                ),
                'progressive-disclosure-doc': createPatternSummary(
                  'ProgressiveDisclosureDoc',
                  'planned',
                ),
              },
              routing: createRouting(),
            };
          });

          When('I materialize the markdown routing contract', () => {
            state!.markdownRecord = materializeMarkdownRecord(state!.bundle!);
          });

          Then('the markdown record should include the routed root and child paths', () => {
            expect(state!.markdownRecord).toEqual({
              'PATTERNS.md': 'root:ProjectionBundleContract',
              'patterns/projection-bundle-contract.md':
                'child:PatternSummary:projection-bundle-contract',
              'patterns/progressive-disclosure-doc.md':
                'child:PatternSummary:progressive-disclosure-doc',
            });
          });

          And('every routed markdown path should be unique', () => {
            const paths = Object.keys(state!.markdownRecord);
            expect(new Set(paths).size).toBe(paths.length);
          });
        },
      );
    },
  );

  Rule(
    'Progressive disclosure decisions remain explicit in the architecture doc',
    ({ RuleScenario }) => {
      RuleScenario(
        'Delivery-reporting view splitting keeps roadmap internal but retained views public',
        ({ Given, When, Then, And }) => {
          Given('the progressive disclosure contract document', async () => {
            state!.documentation = await readFile(
              new URL(
                '../../../tests/fixtures/renderers/progressive-disclosure.md',
                import.meta.url,
              ),
              'utf8',
            );
          });

          When('I inspect the delivery-reporting splitting decision', () => {
            expect(state!.documentation).toContain('projectCompletedMilestones');
            expect(state!.documentation).toContain('projectCurrentWork');
          });

          Then(
            'the document should name the retained public delivery-reporting projection entrypoints',
            () => {
              expect(state!.documentation).toContain('explicit public projection entrypoints');
            },
          );

          And(
            'the document should keep roadmap generation inside documentation composition',
            () => {
              expect(state!.documentation).toContain("documentType: 'roadmap'");
            },
          );
        },
      );

      RuleScenario(
        'Oversized document splitting is markdown-only',
        ({ Given, When, Then, And }) => {
          Given('the progressive disclosure contract document', async () => {
            state!.documentation = await readFile(
              new URL(
                '../../../tests/fixtures/renderers/progressive-disclosure.md',
                import.meta.url,
              ),
              'utf8',
            );
          });

          When('I inspect the split semantics decision', () => {
            expect(state!.documentation).toContain('splitOversizedDocument');
          });

          Then('the document should mark oversized splitting as markdown-only', () => {
            expect(state!.documentation).toContain(
              'Oversized-document splitting stays a Markdown concern.',
            );
          });

          And(
            'the document should list compact text, JSON, and UI as non-splitting renderers',
            () => {
              expect(state!.documentation).toContain('Compact text does not split.');
              expect(state!.documentation).toContain('JSON does not split.');
              expect(state!.documentation).toContain('UI does not split.');
            },
          );
        },
      );

      RuleScenario('Additional files flatten only for markdown', ({ Given, When, Then, And }) => {
        Given('the progressive disclosure contract document', async () => {
          state!.documentation = await readFile(
            new URL('../../../tests/fixtures/renderers/progressive-disclosure.md', import.meta.url),
            'utf8',
          );
        });

        When('I inspect the additional files decision', () => {
          expect(state!.documentation).toContain('Legacy `additionalFiles`');
        });

        Then('the document should describe markdown output as a file-path record', () => {
          expect(state!.documentation).toContain('Record<path, string>');
        });

        And('the document should keep JSON and UI outputs structured', () => {
          expect(state!.documentation).toContain('JSON keeps the structured');
          expect(state!.documentation).toContain('UI keeps the structured');
        });
      });
    },
  );
});

describe('Renderer and progressive disclosure contract adversarial coverage', () => {
  it('keeps TRUSTED_MARKDOWN private to the markdown renderer module API', () => {
    expect(Object.hasOwn(publicSurface, 'TRUSTED_MARKDOWN')).toBe(false);
    expect(Object.hasOwn(rendererSurface, 'TRUSTED_MARKDOWN')).toBe(false);
  });
});
