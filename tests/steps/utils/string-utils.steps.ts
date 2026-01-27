/**
 * String Utils Step Definitions
 *
 * BDD step definitions for testing string utility functions:
 * - slugify - URL-safe slug generation
 * - camelCaseToTitleCase - Human-readable title generation
 *
 * Note: toKebabCase is tested in kebab-case-slugs.steps.ts
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { slugify, camelCaseToTitleCase } from '../../../src/utils/string-utils.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface StringUtilsTestState {
  slugResult: string;
  titleResult: string;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: StringUtilsTestState | null = null;

// =============================================================================
// Helper Functions
// =============================================================================

function initState(): StringUtilsTestState {
  return {
    slugResult: '',
    titleResult: '',
  };
}

// =============================================================================
// Feature: String Utility Functions
// =============================================================================

const feature = await loadFeature('tests/features/utils/string-utils.feature');

describeFeature(feature, ({ Scenario, ScenarioOutline, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a string utils test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // slugify
  // ===========================================================================

  ScenarioOutline(
    'slugify converts text to URL-safe format',
    ({ When, Then }, variables: { input: string; expected: string }) => {
      When('I slugify {string}', () => {
        state!.slugResult = slugify(variables.input);
      });

      Then('the slug should be {string}', () => {
        expect(state!.slugResult).toBe(variables.expected);
      });
    }
  );

  Scenario('slugify handles empty-ish input', ({ When, Then }) => {
    When('I slugify {string}', (_ctx: unknown, input: string) => {
      state!.slugResult = slugify(input);
    });

    Then('the slug should be {string}', (_ctx: unknown, expected: string) => {
      expect(state!.slugResult).toBe(expected);
    });
  });

  Scenario('slugify handles single word', ({ When, Then }) => {
    When('I slugify {string}', (_ctx: unknown, input: string) => {
      state!.slugResult = slugify(input);
    });

    Then('the slug should be {string}', (_ctx: unknown, expected: string) => {
      expect(state!.slugResult).toBe(expected);
    });
  });

  // ===========================================================================
  // camelCaseToTitleCase
  // ===========================================================================

  ScenarioOutline(
    'camelCaseToTitleCase converts to title case',
    ({ When, Then }, variables: { input: string; expected: string }) => {
      When('I convert {string} to title case', () => {
        state!.titleResult = camelCaseToTitleCase(variables.input);
      });

      Then('the title should be {string}', () => {
        expect(state!.titleResult).toBe(variables.expected);
      });
    }
  );

  Scenario('camelCaseToTitleCase handles all-uppercase acronym', ({ When, Then }) => {
    When('I convert {string} to title case', (_ctx: unknown, input: string) => {
      state!.titleResult = camelCaseToTitleCase(input);
    });

    Then('the title should be {string}', (_ctx: unknown, expected: string) => {
      expect(state!.titleResult).toBe(expected);
    });
  });

  Scenario('camelCaseToTitleCase handles lowercase word', ({ When, Then }) => {
    When('I convert {string} to title case', (_ctx: unknown, input: string) => {
      state!.titleResult = camelCaseToTitleCase(input);
    });

    Then('the title should be {string}', (_ctx: unknown, expected: string) => {
      expect(state!.titleResult).toBe(expected);
    });
  });
});
