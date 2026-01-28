/**
 * CLI Commands Step Definitions
 *
 * Tests for CLI argument parsing and command handling.
 */

import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { parseArgs, type CLIConfig } from "../../../src/cli/index.js";

// =============================================================================
// Type Definitions
// =============================================================================

interface CLIState {
  config: CLIConfig | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: CLIState | null = null;

function initState(): CLIState {
  return {
    config: null,
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature("tests/features/cli/cli-commands.feature");

describeFeature(feature, ({ Scenario, ScenarioOutline, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  // ===========================================================================
  // Argument Parsing - Commands
  // ===========================================================================

  Scenario("Parse build command", ({ When, Then }) => {
    When("parsing arguments {string}", (_ctx: unknown, args: string) => {
      state = initState();
      const argv = args.split(" ").filter((a) => a.length > 0);
      state.config = parseArgs(argv);
    });

    Then("the command should be {string}", (_ctx: unknown, expected: string) => {
      expect(state!.config?.command).toBe(expected);
    });
  });

  Scenario("Parse validate command", ({ When, Then }) => {
    When("parsing arguments {string}", (_ctx: unknown, args: string) => {
      state = initState();
      const argv = args.split(" ").filter((a) => a.length > 0);
      state.config = parseArgs(argv);
    });

    Then("the command should be {string}", (_ctx: unknown, expected: string) => {
      expect(state!.config?.command).toBe(expected);
    });
  });

  // ===========================================================================
  // Argument Parsing - Flags
  // ===========================================================================

  Scenario("Parse preview flag", ({ When, Then, And }) => {
    When("parsing arguments {string}", (_ctx: unknown, args: string) => {
      state = initState();
      const argv = args.split(" ").filter((a) => a.length > 0);
      state.config = parseArgs(argv);
    });

    Then("the command should be {string}", (_ctx: unknown, expected: string) => {
      expect(state!.config?.command).toBe(expected);
    });

    And("preview should be enabled", () => {
      expect(state!.config?.preview).toBe(true);
    });
  });

  Scenario("Parse short preview flag", ({ When, Then, And }) => {
    When("parsing arguments {string}", (_ctx: unknown, args: string) => {
      state = initState();
      const argv = args.split(" ").filter((a) => a.length > 0);
      state.config = parseArgs(argv);
    });

    Then("the command should be {string}", (_ctx: unknown, expected: string) => {
      expect(state!.config?.command).toBe(expected);
    });

    And("preview should be enabled", () => {
      expect(state!.config?.preview).toBe(true);
    });
  });

  // ===========================================================================
  // Argument Parsing - Options
  // ===========================================================================

  Scenario("Parse variation option", ({ When, Then }) => {
    When("parsing arguments {string}", (_ctx: unknown, args: string) => {
      state = initState();
      const argv = args.split(" ").filter((a) => a.length > 0);
      state.config = parseArgs(argv);
    });

    Then("the variation should be {string}", (_ctx: unknown, expected: string) => {
      expect(state!.config?.variation).toBe(expected);
    });
  });

  Scenario("Parse layer option", ({ When, Then }) => {
    When("parsing arguments {string}", (_ctx: unknown, args: string) => {
      state = initState();
      const argv = args.split(" ").filter((a) => a.length > 0);
      state.config = parseArgs(argv);
    });

    Then("the layer should be {string}", (_ctx: unknown, expected: string) => {
      expect(state!.config?.layer).toBe(expected);
    });
  });

  Scenario("Parse base-dir option", ({ When, Then }) => {
    When("parsing arguments {string}", (_ctx: unknown, args: string) => {
      state = initState();
      const argv = args.split(" ").filter((a) => a.length > 0);
      state.config = parseArgs(argv);
    });

    Then("the base directory should be {string}", (_ctx: unknown, expected: string) => {
      expect(state!.config?.baseDir).toBe(expected);
    });
  });

  Scenario("Parse project-root option", ({ When, Then }) => {
    When("parsing arguments {string}", (_ctx: unknown, args: string) => {
      state = initState();
      const argv = args.split(" ").filter((a) => a.length > 0);
      state.config = parseArgs(argv);
    });

    Then("the project root should be {string}", (_ctx: unknown, expected: string) => {
      expect(state!.config?.projectRoot).toBe(expected);
    });
  });

  // ===========================================================================
  // Default Behavior
  // ===========================================================================

  Scenario("Default to help when no command", ({ When, Then }) => {
    When("parsing arguments {string}", (_ctx: unknown, args: string) => {
      state = initState();
      const argv = args.split(" ").filter((a) => a.length > 0);
      state.config = parseArgs(argv);
    });

    Then("the command should be {string}", (_ctx: unknown, expected: string) => {
      expect(state!.config?.command).toBe(expected);
    });
  });

  Scenario("Default to build when only options provided", ({ When, Then }) => {
    When("parsing arguments {string}", (_ctx: unknown, args: string) => {
      state = initState();
      const argv = args.split(" ").filter((a) => a.length > 0);
      state.config = parseArgs(argv);
    });

    Then("the command should be {string}", (_ctx: unknown, expected: string) => {
      expect(state!.config?.command).toBe(expected);
    });
  });

  // ===========================================================================
  // All Commands (ScenarioOutline)
  // ===========================================================================

  ScenarioOutline(
    "Recognize all valid commands",
    ({ When, Then }, variables: { command: string }) => {
      When("parsing arguments {string}", () => {
        state = initState();
        state.config = parseArgs([variables.command]);
      });

      Then("the command should be {string}", () => {
        expect(state!.config?.command).toBe(variables.command);
      });
    }
  );
});
