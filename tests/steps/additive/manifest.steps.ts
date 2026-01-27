/**
 * Shell Manifest Generation Step Definitions
 *
 * Tests for generateManifestEntries, generateManifestContent, and writeManifest functions.
 */

import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { Metadata, AdditiveVariation } from "../../../src/types.js";
import {
  generateManifestEntries,
  generateManifestContent,
  writeManifest,
  type ManifestEntry,
} from "../../../src/additive/manifest.js";
import * as colors from "../../../src/utils/colors.js";

// =============================================================================
// Type Definitions
// =============================================================================

interface TestState {
  tempDir: string;
  metadata: Metadata;
  entries: ManifestEntry[];
  content: string;
  manifestPath: string;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: TestState | null = null;

function initState(): TestState {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "modular-claude-md-manifest-"));
  return {
    tempDir,
    metadata: {
      document: { title: "Test", version: "1.0" },
      sections: [],
      variations: [],
    },
    entries: [],
    content: "",
    manifestPath: "",
  };
}

function cleanupState(): void {
  if (state?.tempDir && fs.existsSync(state.tempDir)) {
    fs.rmSync(state.tempDir, { recursive: true, force: true });
  }
  state = null;
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature("tests/features/additive/manifest.feature");

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanupState();
  });

  // ===========================================================================
  // Manifest Entry Generation
  // ===========================================================================
  Scenario("Generate manifest entries from additive variations", ({ Given, When, Then }) => {
    Given(
      "metadata with additive variations:",
      (_ctx: unknown, table: Array<{ name: string; output_dir: string; description: string }>) => {
        state = initState();
        state.metadata.additive_variations = table.map((row) => ({
          name: row.name,
          output_dir: row.output_dir,
          description: row.description,
          tags: [],
        }));
      }
    );

    When("generating manifest entries", () => {
      state!.entries = generateManifestEntries(state!.metadata);
    });

    Then(
      "there should be {int} manifest entries with correct aliases and paths",
      (_ctx: unknown, count: number) => {
        expect(state!.entries.length).toBe(count);
        // Verify testing entry
        const testingEntry = state!.entries.find((e) => e.name === "testing");
        expect(testingEntry).toBeDefined();
        expect(testingEntry!.alias).toBe("claude-testing");
        expect(testingEntry!.addDirPath).toBe(".claude-layers/testing");
        // Verify advanced entry
        const advancedEntry = state!.entries.find((e) => e.name === "advanced");
        expect(advancedEntry).toBeDefined();
        expect(advancedEntry!.alias).toBe("claude-advanced");
        expect(advancedEntry!.addDirPath).toBe(".claude-layers/advanced");
      }
    );
  });

  Scenario("Generate empty entries when no additive variations", ({ Given, When, Then }) => {
    Given("metadata without additive variations", () => {
      state = initState();
      // No additive_variations set
    });

    When("generating manifest entries", () => {
      state!.entries = generateManifestEntries(state!.metadata);
    });

    Then("there should be {int} manifest entries", (_ctx: unknown, count: number) => {
      expect(state!.entries.length).toBe(count);
    });
  });

  // ===========================================================================
  // Manifest Content Generation
  // ===========================================================================
  Scenario("Generate manifest content with env var export", ({ Given, When, Then, And }) => {
    Given(
      "metadata with additive variations:",
      (_ctx: unknown, table: Array<{ name: string; output_dir: string; description: string }>) => {
        state = initState();
        state.metadata.additive_variations = table.map((row) => ({
          name: row.name,
          output_dir: row.output_dir,
          description: row.description,
          tags: [],
        }));
      }
    );

    When("generating manifest content", () => {
      state!.content = generateManifestContent(state!.metadata);
    });

    Then("the content should contain the shebang line", () => {
      expect(state!.content).toContain("#!/usr/bin/env bash");
    });

    And("the content should export CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD", () => {
      expect(state!.content).toContain("export CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1");
    });
  });

  Scenario("Generate aliases for single layer", ({ Given, When, Then, And }) => {
    Given(
      "metadata with additive variations:",
      (_ctx: unknown, table: Array<{ name: string; output_dir: string; description: string }>) => {
        state = initState();
        state.metadata.additive_variations = table.map((row) => ({
          name: row.name,
          output_dir: row.output_dir,
          description: row.description,
          tags: [],
        }));
      }
    );

    When("generating manifest content", () => {
      state!.content = generateManifestContent(state!.metadata);
    });

    Then("the content should contain alias {string}", (_ctx: unknown, alias: string) => {
      expect(state!.content).toContain(`alias ${alias}=`);
    });

    And(
      "the content should contain description comment {string}",
      (_ctx: unknown, desc: string) => {
        expect(state!.content).toContain(`# ${desc}`);
      }
    );

    And("the content should contain the claude-with helper function", () => {
      expect(state!.content).toContain("claude-with()");
    });
  });

  Scenario("Generate aliases for multiple layers", ({ Given, When, Then }) => {
    Given(
      "metadata with additive variations:",
      (_ctx: unknown, table: Array<{ name: string; output_dir: string; description: string }>) => {
        state = initState();
        state.metadata.additive_variations = table.map((row) => ({
          name: row.name,
          output_dir: row.output_dir,
          description: row.description,
          tags: [],
        }));
      }
    );

    When("generating manifest content", () => {
      state!.content = generateManifestContent(state!.metadata);
    });

    Then("the content should contain all layer aliases and claude-full", () => {
      // Verify individual layer aliases
      expect(state!.content).toContain("alias claude-testing=");
      expect(state!.content).toContain("alias claude-advanced=");
      // Verify claude-full alias with both paths
      expect(state!.content).toContain("alias claude-full=");
      const fullAliasLine = state!.content
        .split("\n")
        .find((line) => line.includes("alias claude-full="));
      expect(fullAliasLine).toContain(".claude-layers/testing");
      expect(fullAliasLine).toContain(".claude-layers/advanced");
    });
  });

  // ===========================================================================
  // Manifest File Writing
  // ===========================================================================
  Scenario("Write manifest to project root", ({ Given, And, When, Then }) => {
    Given(
      "metadata with additive variations:",
      (_ctx: unknown, table: Array<{ name: string; output_dir: string; description: string }>) => {
        state = initState();
        state.metadata.additive_variations = table.map((row) => ({
          name: row.name,
          output_dir: row.output_dir,
          description: row.description,
          tags: [],
        }));
      }
    );

    And("a temporary project directory", () => {
      // Already created in initState
    });

    When("writing manifest to project root", () => {
      vi.spyOn(colors, "log").mockImplementation(() => {});
      state!.manifestPath = writeManifest(state!.metadata, state!.tempDir, false);
    });

    Then("the manifest file should exist at {string}", (_ctx: unknown, relPath: string) => {
      const fullPath = path.join(state!.tempDir, relPath);
      expect(fs.existsSync(fullPath)).toBe(true);
    });

    And("the manifest file should be executable", () => {
      const stats = fs.statSync(state!.manifestPath);
      // Check if file has execute permission
      expect(stats.mode & 0o111).toBeTruthy();
    });
  });

  Scenario("Preview manifest without writing", ({ Given, And, When, Then }) => {
    Given(
      "metadata with additive variations:",
      (_ctx: unknown, table: Array<{ name: string; output_dir: string; description: string }>) => {
        state = initState();
        state.metadata.additive_variations = table.map((row) => ({
          name: row.name,
          output_dir: row.output_dir,
          description: row.description,
          tags: [],
        }));
      }
    );

    And("a temporary project directory", () => {
      // Already created in initState
    });

    When("previewing manifest", () => {
      vi.spyOn(colors, "log").mockImplementation(() => {});
      vi.spyOn(console, "log").mockImplementation(() => {});
      state!.manifestPath = writeManifest(state!.metadata, state!.tempDir, true);
    });

    Then("no manifest file should be created", () => {
      const expectedPath = path.join(state!.tempDir, ".claude-layers", "manifest.sh");
      expect(fs.existsSync(expectedPath)).toBe(false);
    });
  });
});
