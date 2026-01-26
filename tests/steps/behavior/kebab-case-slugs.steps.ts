/**
 * Kebab Case Slugs Step Definitions
 *
 * BDD step definitions for testing slug generation utilities.
 * Tests toKebabCase conversion, requirement slugs with phase prefixes,
 * and phase slug generation.
 *
 * **Note:** This test imports the actual production slug functions to ensure
 * we're testing the real implementation, not duplicated copies.
 */
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { toKebabCase } from "../../../src/utils/string-utils.js";
import { requirementToSlug } from "../../../src/renderable/codecs/requirements.js";
import { getPhaseSlug } from "../../../src/renderable/codecs/timeline.js";

// =============================================================================
// State Types
// =============================================================================

interface SlugTestState {
  input: string;
  result: string;
  patternName: string;
  phase: number | undefined;
  phaseName: string | undefined;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: SlugTestState | null = null;

function initState(): SlugTestState {
  return {
    input: "",
    result: "",
    patternName: "",
    phase: undefined,
    phaseName: undefined,
  };
}

// =============================================================================
// Feature: Slug Generation for Progressive Disclosure
// =============================================================================

const feature = await loadFeature("tests/features/behavior/kebab-case-slugs.feature");

describeFeature(feature, ({ Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  // ===========================================================================
  // Rule: CamelCase names convert to kebab-case
  // ===========================================================================

  Rule("CamelCase names convert to kebab-case", ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(
      "Convert pattern names to readable slugs",
      ({ Given, When, Then }, variables: { input: string; expected: string }) => {
        Given("pattern name {string}", () => {
          state = initState();
          state.input = variables.input;
        });

        When("converting to kebab-case slug", () => {
          state!.result = toKebabCase(state!.input);
        });

        Then("the slug is {string}", () => {
          expect(state!.result).toBe(variables.expected);
        });
      }
    );
  });

  // ===========================================================================
  // Rule: Edge cases are handled correctly
  // ===========================================================================

  Rule("Edge cases are handled correctly", ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(
      "Handle edge cases in slug generation",
      ({ Given, When, Then }, variables: { input: string; expected: string }) => {
        Given("pattern name {string}", () => {
          state = initState();
          state.input = variables.input;
        });

        When("converting to kebab-case slug", () => {
          state!.result = toKebabCase(state!.input);
        });

        Then("the slug is {string}", () => {
          expect(state!.result).toBe(variables.expected);
        });
      }
    );
  });

  // ===========================================================================
  // Rule: Requirements include phase prefix
  // ===========================================================================

  Rule("Requirements include phase prefix", ({ RuleScenarioOutline, RuleScenario }) => {
    RuleScenarioOutline(
      "Requirement slugs include phase number",
      ({ Given, When, Then }, variables: { pattern: string; phase: string; expected: string }) => {
        Given("pattern {string} with phase {string}", () => {
          state = initState();
          state.patternName = variables.pattern;
          state.phase = parseInt(variables.phase, 10);
        });

        When("generating requirement slug", () => {
          state!.result = requirementToSlug(state!.patternName, state!.phase);
        });

        Then("the slug is {string}", () => {
          expect(state!.result).toBe(variables.expected);
        });
      }
    );

    RuleScenario("Requirement without phase uses phase 00", ({ Given, When, Then }) => {
      Given("pattern {string} without a phase", (_ctx: unknown, name: string) => {
        state = initState();
        state.patternName = name;
        state.phase = undefined;
      });

      When("generating requirement slug", () => {
        state!.result = requirementToSlug(state!.patternName, state!.phase);
      });

      Then("the slug is {string}", (_ctx: unknown, expected: string) => {
        expect(state!.result).toBe(expected);
      });
    });
  });

  // ===========================================================================
  // Rule: Phase slugs use kebab-case for names
  // ===========================================================================

  Rule("Phase slugs use kebab-case for names", ({ RuleScenarioOutline, RuleScenario }) => {
    RuleScenarioOutline(
      "Phase slugs combine number and kebab-case name",
      ({ Given, When, Then }, variables: { number: string; name: string; expected: string }) => {
        Given("phase number {string} with name {string}", () => {
          state = initState();
          state.phase = parseInt(variables.number, 10);
          state.phaseName = variables.name;
        });

        When("generating phase slug", () => {
          state!.result = getPhaseSlug(state!.phase!, state!.phaseName);
        });

        Then("the slug is {string}", () => {
          expect(state!.result).toBe(variables.expected);
        });
      }
    );

    RuleScenario('Phase without name uses "unnamed"', ({ Given, When, Then }) => {
      Given("phase number {string} without a name", (_ctx: unknown, num: string) => {
        state = initState();
        state.phase = parseInt(num, 10);
        state.phaseName = undefined;
      });

      When("generating phase slug", () => {
        state!.result = getPhaseSlug(state!.phase!, state!.phaseName);
      });

      Then("the slug is {string}", (_ctx: unknown, expected: string) => {
        expect(state!.result).toBe(expected);
      });
    });
  });
});
