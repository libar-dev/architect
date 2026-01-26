/**
 * Preset System Step Definitions
 *
 * BDD step definitions for testing the preset system including
 * GENERIC_PRESET, DDD_ES_CQRS_PRESET, and PRESETS lookup.
 *
 * @libar-docs
 */

import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import {
  GENERIC_PRESET,
  LIBAR_GENERIC_PRESET,
  DDD_ES_CQRS_PRESET,
  PRESETS,
  type PresetName,
} from "../../../src/config/presets.js";
import type { DeliveryProcessConfig } from "../../../src/config/types.js";

// =============================================================================
// Type Definitions
// =============================================================================

interface PresetTestState {
  preset: DeliveryProcessConfig | null;
  presetFromMap: DeliveryProcessConfig | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: PresetTestState | null = null;

function initState(): PresetTestState {
  return {
    preset: null,
    presetFromMap: null,
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature("tests/features/config/preset-system.feature");

describeFeature(feature, ({ Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  // ===========================================================================
  // Generic Preset
  // ===========================================================================

  Rule("Generic preset provides minimal taxonomy", ({ RuleScenario }) => {
    RuleScenario("Generic preset has correct prefix configuration", ({ Given, Then, And }) => {
      Given("the generic preset", () => {
        state = initState();
        state.preset = GENERIC_PRESET;
      });

      Then('it should have tagPrefix "@docs-"', () => {
        expect(state!.preset!.tagPrefix).toBe("@docs-");
      });

      And('it should have fileOptInTag "@docs"', () => {
        expect(state!.preset!.fileOptInTag).toBe("@docs");
      });
    });

    RuleScenario("Generic preset has core categories only", ({ Given, Then, And }) => {
      Given("the generic preset", () => {
        state = initState();
        state.preset = GENERIC_PRESET;
      });

      Then('it should include category "core"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).toContain("core");
      });

      And('it should include category "api"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).toContain("api");
      });

      And('it should include category "infra"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).toContain("infra");
      });

      And('it should NOT include category "ddd"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).not.toContain("ddd");
      });

      And('it should NOT include category "event-sourcing"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).not.toContain("event-sourcing");
      });

      And('it should NOT include category "cqrs"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).not.toContain("cqrs");
      });

      And('it should NOT include category "saga"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).not.toContain("saga");
      });

      And("it should have exactly 3 categories", () => {
        expect(state!.preset!.categories).toHaveLength(3);
      });
    });
  });

  // ===========================================================================
  // Libar Generic Preset
  // ===========================================================================

  Rule("Libar generic preset provides minimal taxonomy with libar prefix", ({ RuleScenario }) => {
    RuleScenario("Libar generic preset has correct prefix configuration", ({ Given, Then, And }) => {
      Given("the libar-generic preset", () => {
        state = initState();
        state.preset = LIBAR_GENERIC_PRESET;
      });

      Then('it should have tagPrefix "@libar-docs-"', () => {
        expect(state!.preset!.tagPrefix).toBe("@libar-docs-");
      });

      And('it should have fileOptInTag "@libar-docs"', () => {
        expect(state!.preset!.fileOptInTag).toBe("@libar-docs");
      });
    });

    RuleScenario("Libar generic preset has core categories only", ({ Given, Then, And }) => {
      Given("the libar-generic preset", () => {
        state = initState();
        state.preset = LIBAR_GENERIC_PRESET;
      });

      Then('it should include category "core"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).toContain("core");
      });

      And('it should include category "api"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).toContain("api");
      });

      And('it should include category "infra"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).toContain("infra");
      });

      And('it should NOT include category "ddd"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).not.toContain("ddd");
      });

      And('it should NOT include category "event-sourcing"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).not.toContain("event-sourcing");
      });

      And('it should NOT include category "cqrs"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).not.toContain("cqrs");
      });

      And('it should NOT include category "saga"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).not.toContain("saga");
      });

      And("it should have exactly 3 categories", () => {
        expect(state!.preset!.categories).toHaveLength(3);
      });
    });
  });

  // ===========================================================================
  // DDD-ES-CQRS Preset
  // ===========================================================================

  Rule("DDD-ES-CQRS preset provides full taxonomy", ({ RuleScenario }) => {
    RuleScenario("Full preset has correct prefix configuration", ({ Given, Then, And }) => {
      Given("the ddd-es-cqrs preset", () => {
        state = initState();
        state.preset = DDD_ES_CQRS_PRESET;
      });

      Then('it should have tagPrefix "@libar-docs-"', () => {
        expect(state!.preset!.tagPrefix).toBe("@libar-docs-");
      });

      And('it should have fileOptInTag "@libar-docs"', () => {
        expect(state!.preset!.fileOptInTag).toBe("@libar-docs");
      });
    });

    RuleScenario("Full preset has all DDD categories", ({ Given, Then, And }) => {
      Given("the ddd-es-cqrs preset", () => {
        state = initState();
        state.preset = DDD_ES_CQRS_PRESET;
      });

      Then('it should include category "ddd"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).toContain("ddd");
      });

      And('it should include category "event-sourcing"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).toContain("event-sourcing");
      });

      And('it should include category "cqrs"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).toContain("cqrs");
      });

      And('it should include category "saga"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).toContain("saga");
      });

      And('it should include category "projection"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).toContain("projection");
      });

      And('it should include category "decider"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).toContain("decider");
      });

      And('it should include category "command"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).toContain("command");
      });

      And('it should include category "bounded-context"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).toContain("bounded-context");
      });
    });

    RuleScenario("Full preset has infrastructure categories", ({ Given, Then, And }) => {
      Given("the ddd-es-cqrs preset", () => {
        state = initState();
        state.preset = DDD_ES_CQRS_PRESET;
      });

      Then('it should include category "core"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).toContain("core");
      });

      And('it should include category "api"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).toContain("api");
      });

      And('it should include category "infra"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).toContain("infra");
      });

      And('it should include category "arch"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).toContain("arch");
      });

      And('it should include category "validation"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).toContain("validation");
      });

      And('it should include category "testing"', () => {
        const categoryTags = state!.preset!.categories.map((c) => c.tag);
        expect(categoryTags).toContain("testing");
      });
    });

    RuleScenario("Full preset has all 21 categories", ({ Given, Then }) => {
      Given("the ddd-es-cqrs preset", () => {
        state = initState();
        state.preset = DDD_ES_CQRS_PRESET;
      });

      Then("it should have exactly 21 categories", () => {
        expect(state!.preset!.categories).toHaveLength(21);
      });
    });
  });

  // ===========================================================================
  // Preset Lookup
  // ===========================================================================

  Rule("Presets can be accessed by name", ({ RuleScenario }) => {
    RuleScenario("Generic preset accessible via PRESETS map", ({ When, Then }) => {
      When('I access PRESETS with key "generic"', () => {
        state = initState();
        state.presetFromMap = PRESETS["generic" as PresetName];
      });

      Then('the preset tagPrefix should be "@docs-"', () => {
        expect(state!.presetFromMap!.tagPrefix).toBe("@docs-");
      });
    });

    RuleScenario("DDD preset accessible via PRESETS map", ({ When, Then }) => {
      When('I access PRESETS with key "ddd-es-cqrs"', () => {
        state = initState();
        state.presetFromMap = PRESETS["ddd-es-cqrs" as PresetName];
      });

      Then('the preset tagPrefix should be "@libar-docs-"', () => {
        expect(state!.presetFromMap!.tagPrefix).toBe("@libar-docs-");
      });
    });

    RuleScenario("Libar generic preset accessible via PRESETS map", ({ When, Then }) => {
      When('I access PRESETS with key "libar-generic"', () => {
        state = initState();
        state.presetFromMap = PRESETS["libar-generic" as PresetName];
      });

      Then('the preset tagPrefix should be "@libar-docs-"', () => {
        expect(state!.presetFromMap!.tagPrefix).toBe("@libar-docs-");
      });
    });
  });
});
