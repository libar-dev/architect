import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { describe, expect, it } from 'vitest';

import {
  PatternSummarySchema,
  SessionContextBundleSchema,
  isBundle,
  renderJson,
  type Fragment,
  type PatternSummary,
  type ProjectionBundle,
  type SessionContextBundle,
} from '../../../src/index.js';
import { isPlainObject } from '../../../src/shared/plain-object.js';

interface RenderJsonState {
  input: Fragment | ProjectionBundle<Fragment> | null;
  rendered: string | object | null;
  renderedAgain: string | object | null;
  invalidInputs: Fragment[];
  errorMessages: string[];
  malformedBundleCandidate: unknown;
  malformedBundleDetectedAsBundle: boolean | null;
  malformedBundleError: string | null;
  plainObjectCandidates: {
    plainObject: unknown;
    nullPrototype: unknown;
    classInstance: unknown;
    pollutedPrototype: unknown;
  } | null;
  plainObjectResults: {
    plainObject: boolean;
    nullPrototype: boolean;
    classInstance: boolean;
    pollutedPrototype: boolean;
  } | null;
}

interface PlainObjectCandidates {
  plainObject: Record<string, unknown>;
  nullPrototype: Record<string, unknown>;
  classInstance: CustomPrototypeValue;
  pollutedPrototype: Record<string, unknown>;
}

class UnsupportedJsonValue {
  constructor(readonly label: string) {}
}

class CustomPrototypeValue {
  readonly payload = 'custom';
}

const feature = await loadFeature('tests/features/renderers/render-json.feature');

let state: RenderJsonState | null = null;

function createState(): RenderJsonState {
  return {
    input: null,
    rendered: null,
    renderedAgain: null,
    invalidInputs: [],
    errorMessages: [],
    malformedBundleCandidate: null,
    malformedBundleDetectedAsBundle: null,
    malformedBundleError: null,
    plainObjectCandidates: null,
    plainObjectResults: null,
  };
}

function assertRenderedObject(value: string | object | null): Record<string, unknown> {
  expect(value).not.toBeNull();
  expect(typeof value).toBe('object');

  if (!value || typeof value === 'string') {
    throw new Error('Expected renderJson to return an object.');
  }

  return value as Record<string, unknown>;
}

function assertRenderedString(value: string | object | null): string {
  expect(typeof value).toBe('string');

  if (typeof value !== 'string') {
    throw new Error('Expected renderJson to return a string.');
  }

  return value;
}

function createPatternSummaryFixture(): PatternSummary {
  return {
    kind: 'PatternSummary',
    patternName: 'RenderJsonProjection',
    status: 'active',
    role: 'service',
    file: 'packages/architect-projection/src/renderers/render-json.ts',
    source: 'typescript',
  };
}

function createSessionContextBundleFixture(): SessionContextBundle {
  return {
    kind: 'SessionContextBundle',
    testFiles: ['tests/features/renderers/render-json.feature'],
    fsmByPattern: [],
    patterns: ['RenderJsonProjection'],
    sessionType: 'implement',
    metadata: [
      {
        summary: 'Stable JSON output for projection fragments.',
        role: 'service',
        name: 'RenderJsonProjection',
        file: 'packages/architect-projection/src/renderers/render-json.ts',
        status: 'active',
      },
    ],
    specFiles: ['architect/specs/projection/render-json.feature'],
    stubs: [],
    dependencies: [],
    sharedDependencies: [],
    consumers: [],
    architectureNeighbors: [],
    deliverables: [],
    fsm: {
      validTransitions: ['completed', 'planned'],
      protectionLevel: 'scope',
      currentStatus: 'active',
    },
  };
}

function createJsonRendererGuideFixture(): PatternSummary {
  return {
    kind: 'PatternSummary',
    patternName: 'JsonRendererGuide',
    status: 'completed',
    role: 'projection',
    file: 'packages/architect-projection/src/renderers/render-json.ts',
    source: 'typescript',
  };
}

function createProgressiveDisclosureBundleFixture(): ProjectionBundle<PatternSummary> {
  return {
    root: createPatternSummaryFixture(),
    children: {
      'business-rules': {
        kind: 'PatternSummary',
        patternName: 'BusinessRulesJsonGuide',
        status: 'active',
        role: 'projection',
        file: 'packages/architect-projection/src/renderers/render-json.ts',
        source: 'typescript',
      },
      'requirements-specs': {
        kind: 'PatternSummary',
        patternName: 'RequirementsSpecsJsonGuide',
        status: 'planned',
        role: 'projection',
        file: 'packages/architect-projection/src/renderers/render-json.ts',
        source: 'typescript',
      },
    },
    routing: {
      rootRouteId: 'guide:index',
      childRouteIds: {
        'business-rules': 'guide:business-rules',
        'requirements-specs': 'guide:requirements-specs',
      },
      childPathStrategy: 'nested',
      anchorStrategy: 'heading-slug',
    },
  };
}

function createBundleFixture(): ProjectionBundle<Fragment> {
  return {
    root: createPatternSummaryFixture(),
    children: {
      'zeta-detail': {
        kind: 'PatternSummary',
        patternName: 'RenderJsonProjectionZeta',
        status: 'planned',
        role: 'service',
        file: 'packages/architect-projection/src/renderers/render-json-zeta.ts',
        source: 'typescript',
      },
      'alpha-detail': {
        kind: 'PatternSummary',
        patternName: 'RenderJsonProjectionAlpha',
        status: 'completed',
        role: 'service',
        file: 'packages/architect-projection/src/renderers/render-json-alpha.ts',
        source: 'typescript',
      },
    },
    routing: {
      rootRouteId: 'patterns:index',
      childRouteIds: {
        'zeta-detail': 'patterns:zeta-detail',
        'alpha-detail': 'patterns:alpha-detail',
      },
      childPathStrategy: 'nested',
      anchorStrategy: 'kind-id',
    },
  };
}

function createInvalidInputs(): Fragment[] {
  return [
    {
      ...createPatternSummaryFixture(),
      file: new Date('2026-04-19T00:00:00.000Z') as unknown as string,
    },
    { ...createPatternSummaryFixture(), file: new Map([['path', 'value']]) as unknown as string },
    { ...createPatternSummaryFixture(), file: new Set(['value']) as unknown as string },
    {
      ...createPatternSummaryFixture(),
      file: new UnsupportedJsonValue('custom') as unknown as string,
    },
  ];
}

function createMalformedBundleCandidate(): unknown {
  return {
    root: createPatternSummaryFixture(),
    children: {
      'broken-child': {
        patternName: 'MissingKindFragment',
      },
    },
    routing: {
      rootRouteId: (() => 'broken:index') as unknown as string,
      childRouteIds: {},
      childPathStrategy: 'nested',
      anchorStrategy: 'kind-id',
    },
  };
}

function createPlainObjectCandidates(): PlainObjectCandidates {
  const plainObject: Record<string, unknown> = { payload: 'plain' };
  const nullPrototype = Object.create(null) as Record<string, unknown>;
  const pollutedPrototype = Object.create({ polluted: true } as Record<string, unknown>) as Record<
    string,
    unknown
  >;

  nullPrototype['payload'] = 'null-prototype';
  pollutedPrototype['payload'] = 'polluted';

  return {
    plainObject,
    nullPrototype,
    classInstance: new CustomPrototypeValue(),
    pollutedPrototype,
  };
}

const expectedPrettyJson = [
  '{',
  '  "file": "packages/architect-projection/src/renderers/render-json.ts",',
  '  "kind": "PatternSummary",',
  '  "patternName": "RenderJsonProjection",',
  '  "role": "service",',
  '  "source": "typescript",',
  '  "status": "active"',
  '}',
].join('\n');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the renderJson test state is initialized', () => {
      state = createState();
    });
  });

  Rule('Stable ordering and identity stay explicit in JSON output', ({ RuleScenario }) => {
    RuleScenario(
      'Stable key ordering is applied at every object depth by default',
      ({ Given, When, Then }) => {
        Given('a SessionContextBundle fixture with intentionally unsorted keys', () => {
          state!.input = createSessionContextBundleFixture();
        });

        When('I render the fragment as JSON twice', () => {
          state!.rendered = renderJson(state!.input!);
          state!.renderedAgain = renderJson(state!.input!);
        });

        Then(
          'the JSON object output should keep a stable alphabetical key order at every depth',
          () => {
            const rendered = assertRenderedObject(state!.rendered);
            const renderedAgain = assertRenderedObject(state!.renderedAgain);

            expect(JSON.stringify(rendered)).toBe(JSON.stringify(renderedAgain));
            expect(Object.keys(rendered)).toEqual([
              'architectureNeighbors',
              'consumers',
              'deliverables',
              'dependencies',
              'fsm',
              'fsmByPattern',
              'kind',
              'metadata',
              'patterns',
              'sessionType',
              'sharedDependencies',
              'specFiles',
              'stubs',
              'testFiles',
            ]);

            const metadata = rendered['metadata'];
            expect(Array.isArray(metadata)).toBe(true);
            expect(Object.keys((metadata as Record<string, unknown>[])[0] ?? {})).toEqual([
              'file',
              'name',
              'role',
              'status',
              'summary',
            ]);

            expect(Object.keys(rendered['fsm'] as Record<string, unknown>)).toEqual([
              'currentStatus',
              'protectionLevel',
              'validTransitions',
            ]);

            expect(SessionContextBundleSchema.safeParse(rendered).success).toBe(true);
          },
        );
      },
    );

    RuleScenario(
      'Fragment output round-trips through the fragment schema without losing identity',
      ({ Given, When, Then, And }) => {
        Given('a PatternSummary fixture', () => {
          state!.input = createJsonRendererGuideFixture();
        });

        When('I render the fragment as JSON', () => {
          state!.rendered = renderJson(state!.input!);
        });

        Then('the JSON object output should round-trip through the PatternSummary schema', () => {
          const rendered = assertRenderedObject(state!.rendered);
          const result = PatternSummarySchema.safeParse(rendered);
          expect(result.success).toBe(true);
        });

        And('the JSON object output should equal the original fragment fixture', () => {
          expect(state!.rendered).toEqual(state!.input);
        });
      },
    );

    RuleScenario('Pretty mode returns a formatted JSON string', ({ Given, When, Then }) => {
      Given('a PatternSummary fixture for pretty JSON output', () => {
        state!.input = createPatternSummaryFixture();
      });

      When('I render the fragment as pretty JSON', () => {
        state!.rendered = renderJson(state!.input!, { pretty: true });
      });

      Then('the pretty JSON output should be a formatted string', () => {
        expect(assertRenderedString(state!.rendered)).toBe(expectedPrettyJson);
      });
    });
  });

  Rule('Bundle output stays structured and JSON-safe', ({ RuleScenario }) => {
    RuleScenario(
      'Bundle output keeps root, children, and JSON-safe routing metadata',
      ({ Given, When, Then }) => {
        Given('a routed JSON bundle fixture with two child fragments', () => {
          state!.input = createBundleFixture();
        });

        When('I render the bundle as JSON', () => {
          state!.rendered = renderJson(state!.input!);
        });

        Then('the JSON bundle output should keep the root, children, and routing metadata', () => {
          const rendered = assertRenderedObject(state!.rendered);
          expect(Object.keys(rendered)).toEqual(['children', 'root', 'routing']);

          const root = rendered['root'];
          const children = rendered['children'];
          const routing = rendered['routing'];

          expect(PatternSummarySchema.safeParse(root).success).toBe(true);
          expect(children).toEqual({
            'alpha-detail': {
              file: 'packages/architect-projection/src/renderers/render-json-alpha.ts',
              kind: 'PatternSummary',
              patternName: 'RenderJsonProjectionAlpha',
              role: 'service',
              source: 'typescript',
              status: 'completed',
            },
            'zeta-detail': {
              file: 'packages/architect-projection/src/renderers/render-json-zeta.ts',
              kind: 'PatternSummary',
              patternName: 'RenderJsonProjectionZeta',
              role: 'service',
              source: 'typescript',
              status: 'planned',
            },
          });
          expect(routing).toEqual({
            anchorStrategy: 'kind-id',
            childRouteIds: {
              'alpha-detail': 'patterns:alpha-detail',
              'zeta-detail': 'patterns:zeta-detail',
            },
            childPathStrategy: 'nested',
            rootRouteId: 'patterns:index',
          });
        });
      },
    );

    RuleScenario(
      'Progressive-disclosure bundles stay root-plus-children structured',
      ({ Given, When, Then }) => {
        Given('a progressive disclosure JSON bundle fixture with routed child documents', () => {
          state!.input = createProgressiveDisclosureBundleFixture();
        });

        When('I render the progressive disclosure bundle as JSON', () => {
          state!.rendered = renderJson(state!.input!);
        });

        Then('the JSON bundle output should preserve root and child documents separately', () => {
          const rendered = assertRenderedObject(state!.rendered);
          expect(Object.keys(rendered)).toEqual(['children', 'root', 'routing']);

          const root = rendered['root'];
          const children = rendered['children'] as Record<string, unknown>;
          const routing = rendered['routing'] as Record<string, unknown>;

          expect(PatternSummarySchema.safeParse(root).success).toBe(true);
          expect(PatternSummarySchema.safeParse(children['business-rules']).success).toBe(true);
          expect(PatternSummarySchema.safeParse(children['requirements-specs']).success).toBe(true);
          expect(routing).toEqual({
            anchorStrategy: 'heading-slug',
            childRouteIds: {
              'business-rules': 'guide:business-rules',
              'requirements-specs': 'guide:requirements-specs',
            },
            childPathStrategy: 'nested',
            rootRouteId: 'guide:index',
          });
        });
      },
    );
  });

  Rule('Plain-object checks stay shared and strict', ({ RuleScenario }) => {
    RuleScenario(
      'Shared plain-object checks allow safe records and reject unsafe object carriers',
      ({ Given, When, Then, And }) => {
        Given('plain-object helper candidates covering safe and unsafe object shapes', () => {
          state!.plainObjectCandidates = createPlainObjectCandidates();
        });

        When('I evaluate the shared plain-object helper for each candidate', () => {
          const candidates = state!.plainObjectCandidates!;

          state!.plainObjectResults = {
            plainObject: isPlainObject(candidates.plainObject),
            nullPrototype: isPlainObject(candidates.nullPrototype),
            classInstance: isPlainObject(candidates.classInstance),
            pollutedPrototype: isPlainObject(candidates.pollutedPrototype),
          };
        });

        Then('the helper should accept the plain object candidate', () => {
          expect(state!.plainObjectResults?.plainObject).toBe(true);
        });

        And('the helper should accept the null-prototype candidate', () => {
          expect(state!.plainObjectResults?.nullPrototype).toBe(true);
        });

        And('the helper should reject the class instance candidate', () => {
          expect(state!.plainObjectResults?.classInstance).toBe(false);
        });

        And('the helper should reject the polluted-prototype candidate', () => {
          expect(state!.plainObjectResults?.pollutedPrototype).toBe(false);
        });
      },
    );
  });

  Rule('Non-JSON-safe runtime values are rejected explicitly', ({ RuleScenario }) => {
    RuleScenario(
      'Forbidden runtime values produce descriptive path errors',
      ({ Given, When, Then }) => {
        Given('fragment candidates containing forbidden runtime values', () => {
          state!.invalidInputs = createInvalidInputs();
        });

        When('I attempt to render each invalid fragment as JSON', () => {
          state!.errorMessages = state!.invalidInputs.map((input) => {
            try {
              renderJson(input);
              return 'no error';
            } catch (error) {
              return error instanceof Error ? error.message : String(error);
            }
          });
        });

        Then('each invalid fragment should fail with a descriptive path error', () => {
          expect(state!.errorMessages).toEqual([
            'renderJson encountered a non-JSON-safe Date at $.file.',
            'renderJson encountered a non-JSON-safe Map at $.file.',
            'renderJson encountered a non-JSON-safe Set at $.file.',
            'renderJson encountered a non-JSON-safe UnsupportedJsonValue at $.file.',
          ]);
        });
      },
    );

    RuleScenario(
      'Malformed bundle-like input fails loudly instead of being treated as a bundle',
      ({ Given, When, Then, And }) => {
        Given('a malformed bundle-like candidate with a non-fragment child', () => {
          state!.malformedBundleCandidate = createMalformedBundleCandidate();
        });

        When('I attempt to render the malformed bundle-like input as JSON', () => {
          state!.malformedBundleDetectedAsBundle = isBundle(state!.malformedBundleCandidate);

          try {
            renderJson(state!.malformedBundleCandidate as Fragment | ProjectionBundle<Fragment>);
            state!.malformedBundleError = 'no error';
          } catch (error) {
            state!.malformedBundleError = error instanceof Error ? error.message : String(error);
          }
        });

        Then('the malformed bundle-like input should not be identified as a bundle', () => {
          expect(state!.malformedBundleDetectedAsBundle).toBe(false);
        });

        And('rendering the malformed bundle-like input should fail loudly', () => {
          expect(state!.malformedBundleError).toBe(
            'renderJson encountered a non-JSON-safe function at $.routing.rootRouteId.',
          );
        });
      },
    );
  });
});

describe('renderJson adversarial security coverage', () => {
  it('rejects class-instance custom-prototype nested objects', () => {
    const input = {
      ...createPatternSummaryFixture(),
      file: new CustomPrototypeValue() as unknown as string,
    };

    expect(() => renderJson(input)).toThrow(
      'renderJson encountered a non-JSON-safe CustomPrototypeValue at $.file.',
    );
  });

  it('rejects prototype-polluted nested objects', () => {
    const pollutedPrototype = { polluted: true };
    const pollutedObject = Object.assign(
      Object.create(pollutedPrototype) as Record<string, unknown>,
      {
        path: 'polluted.md',
      },
    );
    const input = {
      ...createPatternSummaryFixture(),
      file: pollutedObject as unknown as string,
    };

    expect(() => renderJson(input)).toThrow(
      'renderJson encountered a non-JSON-safe Object at $.file.',
    );
  });
});
