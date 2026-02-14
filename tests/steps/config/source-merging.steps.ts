/**
 * Source Merging Step Definitions
 *
 * BDD step definitions for testing mergeSourcesForGenerator,
 * verifying override semantics for features, typescript sources, and exclude.
 *
 * @libar-docs
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { mergeSourcesForGenerator } from '../../../src/config/merge-sources.js';
import type {
  ResolvedSourcesConfig,
  GeneratorSourceOverride,
} from '../../../src/config/project-config.js';

// =============================================================================
// Constants
// =============================================================================

const BASE_TS = 'src/**/*.ts';
const BASE_FEATURES = 'specs/**/*.feature';
const BASE_EXCLUDE = 'node_modules/**';
const ADDITIONAL_FEATURES = 'releases/**/*.feature';
const REPLACE_FEATURES = 'releases/**/*.feature';
const EXTRA_FEATURES = 'extra/**/*.feature';
const ADDITIONAL_INPUT = 'stubs/**/*.ts';
const EXTRA_INPUT = 'extra/**/*.ts';

// =============================================================================
// Types
// =============================================================================

interface SourceMergingState {
  baseSources: ResolvedSourcesConfig | null;
  overrides: Record<string, GeneratorSourceOverride>;
  mergedSources: ResolvedSourcesConfig | null;
}

// =============================================================================
// Module State
// =============================================================================

let state: SourceMergingState | null = null;

function initState(): SourceMergingState {
  return {
    baseSources: null,
    overrides: {},
    mergedSources: null,
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/config/source-merging.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  AfterEachScenario(() => {
    state = null;
  });

  // ---------------------------------------------------------------------------
  // Background
  // ---------------------------------------------------------------------------

  Background(({ Given }) => {
    Given('a source merging test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // No override
  // ===========================================================================

  Rule('No override returns base unchanged', ({ RuleScenario }) => {
    RuleScenario('No override returns base sources', ({ Given, When, Then, And }) => {
      Given('base sources with one typescript and one features glob', () => {
        state!.baseSources = {
          typescript: [BASE_TS],
          features: [BASE_FEATURES],
          exclude: [],
        };
      });

      And('no overrides defined', () => {
        state!.overrides = {};
      });

      When('merging sources for the patterns generator', () => {
        state!.mergedSources = mergeSourcesForGenerator(
          state!.baseSources!,
          'patterns',
          state!.overrides
        );
      });

      Then('merged sources should equal base sources', () => {
        expect(state!.mergedSources).toBe(state!.baseSources);
      });
    });
  });

  // ===========================================================================
  // Feature overrides
  // ===========================================================================

  Rule('Feature overrides control feature source selection', ({ RuleScenario }) => {
    RuleScenario('additionalFeatures appended to base features', ({ Given, When, Then, And }) => {
      Given('base sources with one typescript and one features glob', () => {
        state!.baseSources = {
          typescript: [BASE_TS],
          features: [BASE_FEATURES],
          exclude: [],
        };
      });

      And('an override for changelog with additionalFeatures', () => {
        state!.overrides = {
          changelog: { additionalFeatures: [ADDITIONAL_FEATURES] },
        };
      });

      When('merging sources for the changelog generator', () => {
        state!.mergedSources = mergeSourcesForGenerator(
          state!.baseSources!,
          'changelog',
          state!.overrides
        );
      });

      Then('merged features should have 2 entries', () => {
        expect(state!.mergedSources!.features).toHaveLength(2);
        expect(state!.mergedSources!.features).toContain(BASE_FEATURES);
        expect(state!.mergedSources!.features).toContain(ADDITIONAL_FEATURES);
      });
    });

    RuleScenario(
      'replaceFeatures replaces base features entirely',
      ({ Given, When, Then, And }) => {
        Given('base sources with one typescript and one features glob', () => {
          state!.baseSources = {
            typescript: [BASE_TS],
            features: [BASE_FEATURES],
            exclude: [],
          };
        });

        And('an override for changelog with replaceFeatures', () => {
          state!.overrides = {
            changelog: { replaceFeatures: [REPLACE_FEATURES] },
          };
        });

        When('merging sources for the changelog generator', () => {
          state!.mergedSources = mergeSourcesForGenerator(
            state!.baseSources!,
            'changelog',
            state!.overrides
          );
        });

        Then('merged features should have 1 entry from the override', () => {
          expect(state!.mergedSources!.features).toEqual([REPLACE_FEATURES]);
        });
      }
    );

    RuleScenario('Empty replaceFeatures does NOT replace', ({ Given, When, Then, And }) => {
      Given('base sources with one typescript and one features glob', () => {
        state!.baseSources = {
          typescript: [BASE_TS],
          features: [BASE_FEATURES],
          exclude: [],
        };
      });

      And('an override for changelog with empty replaceFeatures and additionalFeatures', () => {
        state!.overrides = {
          changelog: {
            replaceFeatures: [],
            additionalFeatures: [EXTRA_FEATURES],
          },
        };
      });

      When('merging sources for the changelog generator', () => {
        state!.mergedSources = mergeSourcesForGenerator(
          state!.baseSources!,
          'changelog',
          state!.overrides
        );
      });

      Then('merged features should have 2 entries', () => {
        expect(state!.mergedSources!.features).toHaveLength(2);
        expect(state!.mergedSources!.features).toContain(BASE_FEATURES);
        expect(state!.mergedSources!.features).toContain(EXTRA_FEATURES);
      });
    });
  });

  // ===========================================================================
  // TypeScript source overrides
  // ===========================================================================

  Rule('TypeScript source overrides append additional input', ({ RuleScenario }) => {
    RuleScenario('additionalInput appended to typescript sources', ({ Given, When, Then, And }) => {
      Given('base sources with one typescript and one features glob', () => {
        state!.baseSources = {
          typescript: [BASE_TS],
          features: [BASE_FEATURES],
          exclude: [],
        };
      });

      And('an override for patterns with additionalInput', () => {
        state!.overrides = {
          patterns: { additionalInput: [ADDITIONAL_INPUT] },
        };
      });

      When('merging sources for the patterns generator', () => {
        state!.mergedSources = mergeSourcesForGenerator(
          state!.baseSources!,
          'patterns',
          state!.overrides
        );
      });

      Then('merged typescript should have 2 entries', () => {
        expect(state!.mergedSources!.typescript).toHaveLength(2);
        expect(state!.mergedSources!.typescript).toContain(BASE_TS);
        expect(state!.mergedSources!.typescript).toContain(ADDITIONAL_INPUT);
      });
    });
  });

  // ===========================================================================
  // Combined overrides
  // ===========================================================================

  Rule('Combined overrides apply together', ({ RuleScenario }) => {
    RuleScenario(
      'additionalFeatures and additionalInput combined',
      ({ Given, When, Then, And }) => {
        Given('base sources with one typescript and one features glob', () => {
          state!.baseSources = {
            typescript: [BASE_TS],
            features: [BASE_FEATURES],
            exclude: [],
          };
        });

        And('an override for changelog with additionalFeatures and additionalInput', () => {
          state!.overrides = {
            changelog: {
              additionalFeatures: [ADDITIONAL_FEATURES],
              additionalInput: [EXTRA_INPUT],
            },
          };
        });

        When('merging sources for the changelog generator', () => {
          state!.mergedSources = mergeSourcesForGenerator(
            state!.baseSources!,
            'changelog',
            state!.overrides
          );
        });

        Then('merged features should have 2 entries', () => {
          expect(state!.mergedSources!.features).toHaveLength(2);
          expect(state!.mergedSources!.features).toContain(BASE_FEATURES);
          expect(state!.mergedSources!.features).toContain(ADDITIONAL_FEATURES);
        });

        And('merged typescript should have 2 entries', () => {
          expect(state!.mergedSources!.typescript).toHaveLength(2);
          expect(state!.mergedSources!.typescript).toContain(BASE_TS);
          expect(state!.mergedSources!.typescript).toContain(EXTRA_INPUT);
        });
      }
    );
  });

  // ===========================================================================
  // Exclude inherited
  // ===========================================================================

  Rule('Exclude is always inherited from base', ({ RuleScenario }) => {
    RuleScenario('Exclude always inherited', ({ Given, When, Then, And }) => {
      Given('base sources with one typescript and one features glob and an exclude pattern', () => {
        state!.baseSources = {
          typescript: [BASE_TS],
          features: [BASE_FEATURES],
          exclude: [BASE_EXCLUDE],
        };
      });

      And('an override for patterns with additionalInput', () => {
        state!.overrides = {
          patterns: { additionalInput: [ADDITIONAL_INPUT] },
        };
      });

      When('merging sources for the patterns generator', () => {
        state!.mergedSources = mergeSourcesForGenerator(
          state!.baseSources!,
          'patterns',
          state!.overrides
        );
      });

      Then('merged exclude should equal the base exclude', () => {
        expect(state!.mergedSources!.exclude).toEqual([BASE_EXCLUDE]);
      });
    });
  });
});
