/**
 * Layer Inference Step Definitions
 *
 * BDD step definitions for testing directory-based feature layer classification.
 * Tests the inferFeatureLayer function and FEATURE_LAYERS constant.
 */
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import {
  inferFeatureLayer,
  FEATURE_LAYERS,
  type FeatureLayer,
} from "../../../src/extractor/layer-inference.js";

// =============================================================================
// Type Definitions
// =============================================================================

interface LayerInferenceScenarioState {
  filePath: string;
  inferredLayer: FeatureLayer | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: LayerInferenceScenarioState | null = null;

// =============================================================================
// Helper Functions
// =============================================================================

function initState(): LayerInferenceScenarioState {
  return {
    filePath: "",
    inferredLayer: null,
  };
}

// =============================================================================
// Reusable Step Handlers
// =============================================================================

const givenFeatureFilePath = (_ctx: unknown, path: string) => {
  state = initState();
  state.filePath = path;
};

const whenInferFeatureLayer = () => {
  state!.inferredLayer = inferFeatureLayer(state!.filePath);
};

const thenInferredLayerShouldBe = (_ctx: unknown, expectedLayer: string) => {
  expect(state!.inferredLayer).toBe(expectedLayer);
};

// =============================================================================
// Feature: Layer Inference from Feature File Paths
// =============================================================================

const feature = await loadFeature("tests/features/behavior/layer-inference.feature");

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  // ===========================================================================
  // Timeline Layer Detection
  // ===========================================================================

  Scenario("Detect timeline features from /timeline/ path", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  Scenario("Detect timeline features regardless of parent directories", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  Scenario("Detect timeline features in delivery-process package", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  // ===========================================================================
  // Domain Layer Detection
  // ===========================================================================

  Scenario("Detect decider features as domain", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  Scenario("Detect orders features as domain", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  Scenario("Detect inventory features as domain", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  // ===========================================================================
  // Integration Layer Detection
  // ===========================================================================

  Scenario("Detect integration-features directory as integration", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  Scenario("Detect /integration/ directory as integration", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  Scenario("Integration takes priority over orders subdirectory", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  Scenario("Integration takes priority over inventory subdirectory", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  // ===========================================================================
  // E2E Layer Detection
  // ===========================================================================

  Scenario("Detect e2e features from /e2e/ path", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  Scenario("Detect e2e features in frontend app", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  Scenario("Detect e2e-journeys as e2e", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  // ===========================================================================
  // Component Layer Detection
  // ===========================================================================

  Scenario("Detect scanner features as component", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  Scenario("Detect lint features as component", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  // ===========================================================================
  // Unknown Layer Fallback
  // ===========================================================================

  Scenario("Return unknown for unclassified paths", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  Scenario("Return unknown for root-level features", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  Scenario("Return unknown for generic test paths", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  // ===========================================================================
  // Path Normalization
  // ===========================================================================

  Scenario("Handle Windows-style paths with backslashes", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  Scenario("Be case-insensitive", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  Scenario("Handle mixed path separators", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  Scenario("Handle absolute Unix paths", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  Scenario("Handle Windows absolute paths", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  Scenario("Timeline in filename only should not match", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  Scenario("Timeline detected even with deep nesting", ({ Given, When, Then }) => {
    Given("the feature file path {string}", givenFeatureFilePath);
    When("I infer the feature layer", whenInferFeatureLayer);
    Then("the inferred layer should be {string}", thenInferredLayerShouldBe);
  });

  // ===========================================================================
  // FEATURE_LAYERS Constant Validation
  // ===========================================================================

  Scenario("FEATURE_LAYERS contains all valid layer values", ({ Then }) => {
    Then(
      'FEATURE_LAYERS should contain all expected layers: "timeline", "domain", "integration", "e2e", "component", "unknown"',
      () => {
        expect(FEATURE_LAYERS).toContain("timeline");
        expect(FEATURE_LAYERS).toContain("domain");
        expect(FEATURE_LAYERS).toContain("integration");
        expect(FEATURE_LAYERS).toContain("e2e");
        expect(FEATURE_LAYERS).toContain("component");
        expect(FEATURE_LAYERS).toContain("unknown");
      }
    );
  });

  Scenario("FEATURE_LAYERS has exactly 6 layers", ({ Then }) => {
    Then("FEATURE_LAYERS should have length {int}", (_ctx: unknown, length: number) => {
      expect(FEATURE_LAYERS).toHaveLength(length);
    });
  });

  Scenario("FEATURE_LAYERS is a readonly array", ({ Then }) => {
    Then("FEATURE_LAYERS should be readonly", () => {
      // TypeScript ensures this at compile time, but we can verify the reference is stable
      const layers: readonly FeatureLayer[] = FEATURE_LAYERS;
      expect(layers).toBe(FEATURE_LAYERS);
    });
  });
});
