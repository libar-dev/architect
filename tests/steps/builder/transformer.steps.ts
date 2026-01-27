/**
 * Path Transformer Step Definitions
 *
 * Tests for transformPaths and transformAdditiveLayerPaths functions.
 */

import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { transformPaths, transformAdditiveLayerPaths } from "../../../src/builder/transformer.js";

// =============================================================================
// Type Definitions
// =============================================================================

interface TransformerState {
  originalContent: string;
  transformedContent: string;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: TransformerState | null = null;

function initState(): TransformerState {
  return {
    originalContent: "",
    transformedContent: "",
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature("tests/features/builder/transformer.feature");

describeFeature(feature, ({ Background, Scenario, ScenarioOutline, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given("a markdown content containing relative paths", () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Root Variation Tests
  // ===========================================================================

  Scenario("Root variation paths unchanged", ({ Given, When, Then }) => {
    Given("content with link {string}", (_ctx: unknown, link: string) => {
      state!.originalContent = link;
    });

    When("transforming for variation path {string}", (_ctx: unknown, variationPath: string) => {
      state!.transformedContent = transformPaths(state!.originalContent, variationPath);
    });

    Then("the content should contain {string}", (_ctx: unknown, expected: string) => {
      expect(state!.transformedContent).toContain(expected);
    });
  });

  // ===========================================================================
  // Deep Path Tests
  // ===========================================================================

  Scenario("Single-level deep variation adds one prefix", ({ Given, When, Then }) => {
    Given("content with link {string}", (_ctx: unknown, link: string) => {
      state!.originalContent = link;
    });

    When("transforming for variation path {string}", (_ctx: unknown, variationPath: string) => {
      state!.transformedContent = transformPaths(state!.originalContent, variationPath);
    });

    Then("the content should contain {string}", (_ctx: unknown, expected: string) => {
      expect(state!.transformedContent).toContain(expected);
    });
  });

  Scenario("Two-level deep variation adds two prefixes", ({ Given, When, Then }) => {
    Given("content with link {string}", (_ctx: unknown, link: string) => {
      state!.originalContent = link;
    });

    When("transforming for variation path {string}", (_ctx: unknown, variationPath: string) => {
      state!.transformedContent = transformPaths(state!.originalContent, variationPath);
    });

    Then("the content should contain {string}", (_ctx: unknown, expected: string) => {
      expect(state!.transformedContent).toContain(expected);
    });
  });

  Scenario("Three-level deep variation adds three prefixes", ({ Given, When, Then }) => {
    Given("content with link {string}", (_ctx: unknown, link: string) => {
      state!.originalContent = link;
    });

    When("transforming for variation path {string}", (_ctx: unknown, variationPath: string) => {
      state!.transformedContent = transformPaths(state!.originalContent, variationPath);
    });

    Then("the content should contain {string}", (_ctx: unknown, expected: string) => {
      expect(state!.transformedContent).toContain(expected);
    });
  });

  // ===========================================================================
  // URL Scheme Tests (ScenarioOutline)
  // ===========================================================================

  ScenarioOutline(
    "URL schemes are never transformed",
    ({ Given, When, Then }, variables: { url: string }) => {
      Given("content with link {string}", () => {
        // Replace <url> placeholder with actual URL from examples
        state!.originalContent = `[Link](${variables.url})`;
      });

      When("transforming for variation path {string}", () => {
        state!.transformedContent = transformPaths(state!.originalContent, "/deep/path");
      });

      Then("the content should contain {string}", () => {
        expect(state!.transformedContent).toContain(`[Link](${variables.url})`);
      });
    }
  );

  // ===========================================================================
  // Special Path Tests
  // ===========================================================================

  Scenario("Absolute paths are not transformed", ({ Given, When, Then }) => {
    Given("content with link {string}", (_ctx: unknown, link: string) => {
      state!.originalContent = link;
    });

    When("transforming for variation path {string}", (_ctx: unknown, variationPath: string) => {
      state!.transformedContent = transformPaths(state!.originalContent, variationPath);
    });

    Then("the content should contain {string}", (_ctx: unknown, expected: string) => {
      expect(state!.transformedContent).toContain(expected);
    });
  });

  Scenario("Anchor links are not transformed", ({ Given, When, Then }) => {
    Given("content with link {string}", (_ctx: unknown, link: string) => {
      state!.originalContent = link;
    });

    When("transforming for variation path {string}", (_ctx: unknown, variationPath: string) => {
      state!.transformedContent = transformPaths(state!.originalContent, variationPath);
    });

    Then("the content should contain {string}", (_ctx: unknown, expected: string) => {
      expect(state!.transformedContent).toContain(expected);
    });
  });

  Scenario("Already-relative paths are not transformed", ({ Given, When, Then }) => {
    Given("content with link {string}", (_ctx: unknown, link: string) => {
      state!.originalContent = link;
    });

    When("transforming for variation path {string}", (_ctx: unknown, variationPath: string) => {
      state!.transformedContent = transformPaths(state!.originalContent, variationPath);
    });

    Then("the content should contain {string}", (_ctx: unknown, expected: string) => {
      expect(state!.transformedContent).toContain(expected);
    });
  });

  // ===========================================================================
  // Multiple Links Test
  // ===========================================================================

  Scenario("Multiple links - relative paths transformed", ({ Given, When, Then }) => {
    Given("content with multiple links:", (_ctx: unknown, docstring: string) => {
      state!.originalContent = docstring;
    });

    When("transforming for variation path {string}", (_ctx: unknown, variationPath: string) => {
      state!.transformedContent = transformPaths(state!.originalContent, variationPath);
    });

    Then("the content should contain {string}", (_ctx: unknown, expected: string) => {
      expect(state!.transformedContent).toContain(expected);
    });
  });

  Scenario("Multiple links - external URLs unchanged", ({ Given, When, Then }) => {
    Given("content with multiple links:", (_ctx: unknown, docstring: string) => {
      state!.originalContent = docstring;
    });

    When("transforming for variation path {string}", (_ctx: unknown, variationPath: string) => {
      state!.transformedContent = transformPaths(state!.originalContent, variationPath);
    });

    Then("the content should contain {string}", (_ctx: unknown, expected: string) => {
      expect(state!.transformedContent).toContain(expected);
    });
  });

  Scenario("Multiple links - anchors unchanged", ({ Given, When, Then }) => {
    Given("content with multiple links:", (_ctx: unknown, docstring: string) => {
      state!.originalContent = docstring;
    });

    When("transforming for variation path {string}", (_ctx: unknown, variationPath: string) => {
      state!.transformedContent = transformPaths(state!.originalContent, variationPath);
    });

    Then("the content should contain {string}", (_ctx: unknown, expected: string) => {
      expect(state!.transformedContent).toContain(expected);
    });
  });

  // ===========================================================================
  // Additive Layer Test
  // ===========================================================================

  Scenario("Additive layer paths transform correctly", ({ Given, When, Then }) => {
    Given("content with link {string}", (_ctx: unknown, link: string) => {
      state!.originalContent = link;
    });

    When("transforming for additive layer output {string}", (_ctx: unknown, outputDir: string) => {
      state!.transformedContent = transformAdditiveLayerPaths(state!.originalContent, outputDir);
    });

    Then("the content should contain {string}", (_ctx: unknown, expected: string) => {
      expect(state!.transformedContent).toContain(expected);
    });
  });
});
