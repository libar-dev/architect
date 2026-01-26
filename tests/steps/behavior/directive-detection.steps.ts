/**
 * Directive Detection Step Definitions
 *
 * BDD step definitions for testing hasDocDirectives and hasFileOptIn
 * functions which detect @libar-docs directives in source code content.
 *
 * @libar-docs
 */

import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { hasDocDirectives, hasFileOptIn } from "../../../src/scanner/pattern-scanner.js";

// =============================================================================
// Type Definitions
// =============================================================================

interface DirectiveDetectionState {
  sourceCode: string;
  hasDocDirectivesResult: boolean;
  hasFileOptInResult: boolean;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: DirectiveDetectionState | null = null;

function initState(): DirectiveDetectionState {
  return {
    sourceCode: "",
    hasDocDirectivesResult: false,
    hasFileOptInResult: false,
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature("tests/features/behavior/directive-detection.feature");

describeFeature(feature, ({ Scenario, ScenarioOutline, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  // ===========================================================================
  // hasDocDirectives Tests
  // ===========================================================================

  Scenario("Detect @libar-docs-core directive in JSDoc block", ({ Given, When, Then }) => {
    Given('source code with JSDoc containing "@libar-docs-core"', () => {
      state = initState();
      state.sourceCode = `
        /**
         * @libar-docs-core
         * Test function
         */
        export function test() {}
      `;
    });

    When("checking for documentation directives", () => {
      state!.hasDocDirectivesResult = hasDocDirectives(state!.sourceCode);
    });

    Then("hasDocDirectives should return true", () => {
      expect(state!.hasDocDirectivesResult).toBe(true);
    });
  });

  ScenarioOutline(
    "Detect various @libar-docs-* directives",
    ({ Given, When, Then }, variables: { directive: string }) => {
      Given("source code containing directive {string}", () => {
        state = initState();
        // Construct JSDoc comment containing the directive
        state.sourceCode = `/** ${variables.directive} */`;
      });

      When("checking for documentation directives", () => {
        state!.hasDocDirectivesResult = hasDocDirectives(state!.sourceCode);
      });

      Then("hasDocDirectives should return true", () => {
        expect(state!.hasDocDirectivesResult).toBe(true);
      });
    }
  );

  Scenario("Detect directive anywhere in file content", ({ Given, When, Then }) => {
    Given("source code with directive in middle of file", () => {
      state = initState();
      state.sourceCode = `
        export function foo() {}

        /**
         * @libar-docs-core
         */
        export function bar() {}

        export function baz() {}
      `;
    });

    When("checking for documentation directives", () => {
      state!.hasDocDirectivesResult = hasDocDirectives(state!.sourceCode);
    });

    Then("hasDocDirectives should return true", () => {
      expect(state!.hasDocDirectivesResult).toBe(true);
    });
  });

  Scenario("Detect multiple directives on same line", ({ Given, When, Then }) => {
    Given("source code {string}", (_ctx: unknown, code: string) => {
      state = initState();
      state.sourceCode = code;
    });

    When("checking for documentation directives", () => {
      state!.hasDocDirectivesResult = hasDocDirectives(state!.sourceCode);
    });

    Then("hasDocDirectives should return true", () => {
      expect(state!.hasDocDirectivesResult).toBe(true);
    });
  });

  Scenario("Detect directive in inline comment", ({ Given, When, Then }) => {
    Given("source code {string}", (_ctx: unknown, code: string) => {
      state = initState();
      state.sourceCode = code;
    });

    When("checking for documentation directives", () => {
      state!.hasDocDirectivesResult = hasDocDirectives(state!.sourceCode);
    });

    Then("hasDocDirectives should return true", () => {
      expect(state!.hasDocDirectivesResult).toBe(true);
    });
  });

  Scenario("Return false for content without directives", ({ Given, When, Then }) => {
    Given("source code with only standard JSDoc tags", () => {
      state = initState();
      state.sourceCode = `
        /**
         * Regular JSDoc comment
         * @param foo - parameter
         * @returns result
         */
        export function test(foo: string) {
          return foo;
        }
      `;
    });

    When("checking for documentation directives", () => {
      state!.hasDocDirectivesResult = hasDocDirectives(state!.sourceCode);
    });

    Then("hasDocDirectives should return false", () => {
      expect(state!.hasDocDirectivesResult).toBe(false);
    });
  });

  Scenario("Return false for empty content in hasDocDirectives", ({ Given, When, Then }) => {
    Given("empty source code", () => {
      state = initState();
      state.sourceCode = "";
    });

    When("checking for documentation directives", () => {
      state!.hasDocDirectivesResult = hasDocDirectives(state!.sourceCode);
    });

    Then("hasDocDirectives should return false", () => {
      expect(state!.hasDocDirectivesResult).toBe(false);
    });
  });

  ScenarioOutline(
    "Reject similar but non-matching patterns",
    ({ Given, When, Then }, variables: { pattern: string; reason: string }) => {
      Given("source code containing pattern {string}", () => {
        state = initState();
        // Construct JSDoc comment containing the pattern
        state.sourceCode = `/** ${variables.pattern} */`;
      });

      When("checking for documentation directives", () => {
        state!.hasDocDirectivesResult = hasDocDirectives(state!.sourceCode);
      });

      Then("hasDocDirectives should return false because {string}", () => {
        // The reason (variables.reason) is documentation only, the assertion is the same
        expect(state!.hasDocDirectivesResult).toBe(false);
      });
    }
  );

  // ===========================================================================
  // hasFileOptIn Tests
  // ===========================================================================

  Scenario("Detect @libar-docs in JSDoc block comment", ({ Given, When, Then }) => {
    Given('source code with file-level "@libar-docs" opt-in', () => {
      state = initState();
      state.sourceCode = `
/**
 * @libar-docs
 * This file contains documented patterns
 */

/**
 * @libar-docs-core
 * Some function
 */
export function test() {}
      `;
    });

    When("checking for file opt-in", () => {
      state!.hasFileOptInResult = hasFileOptIn(state!.sourceCode);
    });

    Then("hasFileOptIn should return true", () => {
      expect(state!.hasFileOptInResult).toBe(true);
    });
  });

  Scenario("Detect @libar-docs with description on same line", ({ Given, When, Then }) => {
    Given("source code {string}", (_ctx: unknown, code: string) => {
      state = initState();
      state.sourceCode = code;
    });

    When("checking for file opt-in", () => {
      state!.hasFileOptInResult = hasFileOptIn(state!.sourceCode);
    });

    Then("hasFileOptIn should return true", () => {
      expect(state!.hasFileOptInResult).toBe(true);
    });
  });

  Scenario("Detect @libar-docs in multi-line JSDoc", ({ Given, When, Then }) => {
    Given("source code with @libar-docs in middle of multi-line JSDoc", () => {
      state = initState();
      state.sourceCode = `
/**
 * File-level documentation
 *
 * @libar-docs
 *
 * This file contains important patterns.
 */
export const VERSION = '1.0.0';
      `;
    });

    When("checking for file opt-in", () => {
      state!.hasFileOptInResult = hasFileOptIn(state!.sourceCode);
    });

    Then("hasFileOptIn should return true", () => {
      expect(state!.hasFileOptInResult).toBe(true);
    });
  });

  Scenario("Detect @libar-docs anywhere in file", ({ Given, When, Then }) => {
    Given("source code with @libar-docs after other content", () => {
      state = initState();
      state.sourceCode = `
export function foo() {}

/**
 * @libar-docs
 */

/**
 * @libar-docs-core
 */
export function bar() {}
      `;
    });

    When("checking for file opt-in", () => {
      state!.hasFileOptInResult = hasFileOptIn(state!.sourceCode);
    });

    Then("hasFileOptIn should return true", () => {
      expect(state!.hasFileOptInResult).toBe(true);
    });
  });

  Scenario("Detect @libar-docs combined with section tags", ({ Given, When, Then }) => {
    Given("source code {string}", (_ctx: unknown, code: string) => {
      state = initState();
      state.sourceCode = code;
    });

    When("checking for file opt-in", () => {
      state!.hasFileOptInResult = hasFileOptIn(state!.sourceCode);
    });

    Then("hasFileOptIn should return true", () => {
      expect(state!.hasFileOptInResult).toBe(true);
    });
  });

  Scenario("Return false when only section tags present", ({ Given, When, Then }) => {
    Given('source code with only "@libar-docs-core" section tag', () => {
      state = initState();
      state.sourceCode = `
/**
 * @libar-docs-core
 * Some function without file opt-in
 */
export function test() {}
      `;
    });

    When("checking for file opt-in", () => {
      state!.hasFileOptInResult = hasFileOptIn(state!.sourceCode);
    });

    Then("hasFileOptIn should return false", () => {
      expect(state!.hasFileOptInResult).toBe(false);
    });
  });

  Scenario("Return false for multiple section tags without opt-in", ({ Given, When, Then }) => {
    Given("source code {string}", (_ctx: unknown, code: string) => {
      state = initState();
      state.sourceCode = code;
    });

    When("checking for file opt-in", () => {
      state!.hasFileOptInResult = hasFileOptIn(state!.sourceCode);
    });

    Then("hasFileOptIn should return false", () => {
      expect(state!.hasFileOptInResult).toBe(false);
    });
  });

  Scenario("Return false for empty content in hasFileOptIn", ({ Given, When, Then }) => {
    Given("empty source code", () => {
      state = initState();
      state.sourceCode = "";
    });

    When("checking for file opt-in", () => {
      state!.hasFileOptInResult = hasFileOptIn(state!.sourceCode);
    });

    Then("hasFileOptIn should return false", () => {
      expect(state!.hasFileOptInResult).toBe(false);
    });
  });

  Scenario("Return false for @libar-docs in line comment", ({ Given, When, Then }) => {
    Given("source code {string}", (_ctx: unknown, code: string) => {
      state = initState();
      state.sourceCode = code;
    });

    When("checking for file opt-in", () => {
      state!.hasFileOptInResult = hasFileOptIn(state!.sourceCode);
    });

    Then("hasFileOptIn should return false", () => {
      expect(state!.hasFileOptInResult).toBe(false);
    });
  });

  Scenario("Not confuse @libar-docs-* with @libar-docs opt-in", ({ Given, When, Then }) => {
    Given("source code {string}", (_ctx: unknown, code: string) => {
      state = initState();
      state.sourceCode = code;
    });

    When("checking for file opt-in", () => {
      state!.hasFileOptInResult = hasFileOptIn(state!.sourceCode);
    });

    Then("hasFileOptIn should return false", () => {
      expect(state!.hasFileOptInResult).toBe(false);
    });
  });
});
