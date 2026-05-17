import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { describe, expect, it } from 'vitest';

import {
  ArchitectureDiagramSchema,
  CodeBlockSchema,
  FragmentSchema,
  type Fragment,
} from '../../../src/index.js';
import {
  FRAGMENT_INVALID_FIXTURES,
  FRAGMENT_SCHEMAS,
  FRAGMENT_VALID_FIXTURES,
  INVALID_ARCHITECTURE_DIAGRAM_SCOPE_FIXTURE,
  type PublicFragmentKind,
} from '../../fixtures/fragments.js';

interface FragmentSchemaState {
  fixture: unknown;
  parseResult:
    | {
        success: true;
        data: Fragment;
      }
    | {
        success: false;
      }
    | null;
  roundTripResult: Fragment | null;
}

const feature = await loadFeature('tests/features/fragments/fragment-schemas.feature');

let state: FragmentSchemaState | null = null;

function createState(): FragmentSchemaState {
  return {
    fixture: null,
    parseResult: null,
    roundTripResult: null,
  };
}

function kindFromExamples(examples: Record<string, unknown>): PublicFragmentKind {
  const kind = examples['kind'];
  if (typeof kind !== 'string' || !(kind in FRAGMENT_SCHEMAS)) {
    throw new Error(`Unknown fragment kind "${String(kind)}" in examples row`);
  }
  return kind as PublicFragmentKind;
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the Fragment schema test state is initialized', () => {
      state = createState();
    });
  });

  Rule(
    'Every fragment kind parses strictly and survives JSON round-trips',
    ({ RuleScenarioOutline }) => {
      RuleScenarioOutline(
        '<kind> accepts a valid fragment',
        ({ Given, When, Then, And }, examples: Record<string, unknown>) => {
          const kind = kindFromExamples(examples);

          Given('a valid "<kind>" fragment fixture', () => {
            state!.fixture = FRAGMENT_VALID_FIXTURES[kind];
          });

          When('I parse it with the "<kind>" schema', () => {
            const parsed = FRAGMENT_SCHEMAS[kind].parse(state!.fixture);
            state!.parseResult = { success: true, data: parsed };
          });

          Then('the schema parse should succeed', () => {
            expect(state!.parseResult).toMatchObject({ success: true });
          });

          And('the parsed fragment should equal the original fixture', () => {
            expect(state!.parseResult).toEqual({
              success: true,
              data: state!.fixture,
            });
          });
        },
      );

      RuleScenarioOutline(
        '<kind> rejects an invalid fragment',
        ({ Given, When, Then }, examples: Record<string, unknown>) => {
          const kind = kindFromExamples(examples);

          Given('an invalid "<kind>" fragment fixture', () => {
            state!.fixture = FRAGMENT_INVALID_FIXTURES[kind];
          });

          When('I safe-parse it with the "<kind>" schema', () => {
            const result = FRAGMENT_SCHEMAS[kind].safeParse(state!.fixture);
            state!.parseResult = result.success
              ? { success: true, data: result.data }
              : { success: false };
          });

          Then('the schema parse should fail', () => {
            expect(state!.parseResult).toEqual({ success: false });
          });
        },
      );

      RuleScenarioOutline(
        '<kind> survives JSON round-trip identity',
        ({ Given, When, Then }, examples: Record<string, unknown>) => {
          const kind = kindFromExamples(examples);

          Given('a valid "<kind>" fragment fixture', () => {
            state!.fixture = FRAGMENT_VALID_FIXTURES[kind];
          });

          When('I JSON round-trip it with the "<kind>" schema', () => {
            const serialized = JSON.stringify(state!.fixture);
            state!.roundTripResult = FRAGMENT_SCHEMAS[kind].parse(JSON.parse(serialized));
          });

          Then('the round-tripped fragment should equal the original fixture', () => {
            expect(state!.roundTripResult).toEqual(state!.fixture);
          });
        },
      );
    },
  );

  Rule(
    'Fragment schemas enforce structural invariants beyond the generic trio',
    ({ RuleScenario }) => {
      RuleScenario('ArchitectureDiagram scope enum enforced', ({ Given, When, Then }) => {
        Given('an "ArchitectureDiagram" fragment fixture with an invalid scope enum', () => {
          state!.fixture = INVALID_ARCHITECTURE_DIAGRAM_SCOPE_FIXTURE;
        });

        When('I safe-parse it with the "ArchitectureDiagram" schema', () => {
          const result = ArchitectureDiagramSchema.safeParse(state!.fixture);
          state!.parseResult = result.success
            ? { success: true, data: result.data }
            : { success: false };
        });

        Then('the schema parse should fail', () => {
          expect(state!.parseResult).toEqual({ success: false });
        });
      });
    },
  );

  Rule('FragmentSchema discriminated union narrows on the kind tag', ({ RuleScenario }) => {
    RuleScenario('FragmentSchema rejects an unknown kind', ({ Given, When, Then }) => {
      Given('a fragment-shaped object whose kind is "NotARealKind"', () => {
        state!.fixture = { kind: 'NotARealKind', anything: true };
      });

      When('I safe-parse it with the FragmentSchema discriminated union', () => {
        const result = FragmentSchema.safeParse(state!.fixture);
        state!.parseResult = result.success
          ? { success: true, data: result.data }
          : { success: false };
      });

      Then('the schema parse should fail', () => {
        expect(state!.parseResult).toEqual({ success: false });
      });
    });

    RuleScenario('FragmentSchema accepts a known kind', ({ Given, When, Then }) => {
      Given('a valid "PatternCatalog" fragment fixture', () => {
        state!.fixture = FRAGMENT_VALID_FIXTURES['PatternCatalog'];
      });

      When('I safe-parse it with the FragmentSchema discriminated union', () => {
        const result = FragmentSchema.safeParse(state!.fixture);
        state!.parseResult = result.success
          ? { success: true, data: result.data }
          : { success: false };
      });

      Then('the discriminated-union parse should succeed', () => {
        expect(state!.parseResult).toEqual({
          success: true,
          data: state!.fixture,
        });
      });
    });
  });
});

describe('Fragment schema mirror adversarial security coverage', () => {
  it('rejects hostile code languages and accepts identifier-shaped languages', () => {
    expect(
      CodeBlockSchema.safeParse({
        type: 'code',
        language: 'ts\n```\n<script>',
        content: 'console.log("x");',
      }).success,
    ).toBe(false);
    expect(
      CodeBlockSchema.safeParse({
        type: 'code',
        language: 'tsx+react-18.2',
        content: 'console.log("x");',
      }).success,
    ).toBe(true);
  });
});
