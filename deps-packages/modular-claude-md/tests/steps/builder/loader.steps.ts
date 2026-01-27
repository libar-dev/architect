/**
 * Metadata Loader Step Definitions
 *
 * Tests for loadMetadata and validateMetadata functions.
 */

import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { Metadata, ValidationResult } from "../../../src/types.js";
import { loadMetadata, validateMetadata, moduleExists } from "../../../src/builder/loader.js";

// =============================================================================
// Type Definitions
// =============================================================================

interface LoaderState {
  tempDir: string;
  metadataPath: string;
  metadata: Metadata | null;
  error: Error | null;
  validationResult: ValidationResult | null;
  existingModules: Set<string>;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: LoaderState | null = null;

function initState(): LoaderState {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "modular-claude-md-test-"));
  return {
    tempDir,
    metadataPath: path.join(tempDir, "metadata.json"),
    metadata: null,
    error: null,
    validationResult: null,
    existingModules: new Set(),
  };
}

function cleanupState(): void {
  if (state?.tempDir && fs.existsSync(state.tempDir)) {
    fs.rmSync(state.tempDir, { recursive: true, force: true });
  }
}

function writeMetadata(metadata: Partial<Metadata>): void {
  fs.writeFileSync(state!.metadataPath, JSON.stringify(metadata, null, 2));
}

function createModule(modulePath: string): void {
  const fullPath = path.join(state!.tempDir, modulePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, `# Module: ${modulePath}\n\nContent goes here.`);
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature("tests/features/builder/loader.feature");

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanupState();
    state = null;
  });

  // ===========================================================================
  // Basic Loading
  // ===========================================================================

  Scenario("Load valid metadata file", ({ Given, When, Then, And }) => {
    Given("a valid metadata.json file", () => {
      state = initState();
      writeMetadata({
        document: { title: "Test Project", version: "1.0" },
        sections: [],
        variations: [],
      });
    });

    When("loading the metadata", () => {
      try {
        state!.metadata = loadMetadata(state!.metadataPath);
      } catch (e) {
        state!.error = e as Error;
      }
    });

    Then("the metadata should be loaded successfully", () => {
      expect(state!.error).toBeNull();
      expect(state!.metadata).not.toBeNull();
    });

    And("the document title should be {string}", (_ctx: unknown, title: string) => {
      expect(state!.metadata?.document.title).toBe(title);
    });
  });

  Scenario("Throw error when metadata file not found", ({ Given, When, Then }) => {
    Given("a non-existent metadata path", () => {
      state = initState();
      state.metadataPath = path.join(state.tempDir, "nonexistent.json");
    });

    When("loading the metadata", () => {
      try {
        state!.metadata = loadMetadata(state!.metadataPath);
      } catch (e) {
        state!.error = e as Error;
      }
    });

    Then("an error should be thrown with message {string}", (_ctx: unknown, message: string) => {
      expect(state!.error).not.toBeNull();
      expect(state!.error?.message).toContain(message);
    });
  });

  Scenario("Throw error when JSON is invalid", ({ Given, When, Then }) => {
    Given("an invalid JSON metadata file", () => {
      state = initState();
      fs.writeFileSync(state.metadataPath, "{ invalid json }");
    });

    When("loading the metadata", () => {
      try {
        state!.metadata = loadMetadata(state!.metadataPath);
      } catch (e) {
        state!.error = e as Error;
      }
    });

    Then("an error should be thrown with message {string}", (_ctx: unknown, message: string) => {
      expect(state!.error).not.toBeNull();
      expect(state!.error?.message.toLowerCase()).toContain(message.toLowerCase());
    });
  });

  // ===========================================================================
  // Required Field Validation
  // ===========================================================================

  Scenario("Throw error when document.title is missing", ({ Given, When, Then }) => {
    Given("a metadata file missing document.title", () => {
      state = initState();
      writeMetadata({
        document: { version: "1.0" } as Metadata["document"],
        sections: [],
        variations: [],
      });
    });

    When("loading the metadata", () => {
      try {
        state!.metadata = loadMetadata(state!.metadataPath);
      } catch (e) {
        state!.error = e as Error;
      }
    });

    Then("an error should be thrown with message {string}", (_ctx: unknown, message: string) => {
      expect(state!.error).not.toBeNull();
      expect(state!.error?.message).toContain(message);
    });
  });

  Scenario("Throw error when sections array is missing", ({ Given, When, Then }) => {
    Given("a metadata file missing sections array", () => {
      state = initState();
      const metadata = {
        document: { title: "Test", version: "1.0" },
        variations: [],
      };
      fs.writeFileSync(state.metadataPath, JSON.stringify(metadata, null, 2));
    });

    When("loading the metadata", () => {
      try {
        state!.metadata = loadMetadata(state!.metadataPath);
      } catch (e) {
        state!.error = e as Error;
      }
    });

    Then("an error should be thrown with message {string}", (_ctx: unknown, message: string) => {
      expect(state!.error).not.toBeNull();
      expect(state!.error?.message).toContain(message);
    });
  });

  Scenario("Throw error when variations array is missing", ({ Given, When, Then }) => {
    Given("a metadata file missing variations array", () => {
      state = initState();
      const metadata = {
        document: { title: "Test", version: "1.0" },
        sections: [],
      };
      fs.writeFileSync(state.metadataPath, JSON.stringify(metadata, null, 2));
    });

    When("loading the metadata", () => {
      try {
        state!.metadata = loadMetadata(state!.metadataPath);
      } catch (e) {
        state!.error = e as Error;
      }
    });

    Then("an error should be thrown with message {string}", (_ctx: unknown, message: string) => {
      expect(state!.error).not.toBeNull();
      expect(state!.error?.message).toContain(message);
    });
  });

  // ===========================================================================
  // Module File Validation
  // ===========================================================================

  Scenario("Validation passes when all module files exist", ({ Given, And, When, Then }) => {
    Given("a metadata file with module paths:", (_ctx: unknown, table: Array<{ path: string }>) => {
      state = initState();
      writeMetadata({
        document: { title: "Test", version: "1.0" },
        sections: [
          {
            title: "Test Section",
            tags: ["core"],
            subsections: table.map((row) => ({ path: row.path, tags: ["core"] })),
          },
        ],
        variations: [{ name: "default", path: "/", tags: ["core"], budget_tokens: 8000 }],
      });
    });

    And("all module files exist", () => {
      // Load metadata to get paths
      const metadata = loadMetadata(state!.metadataPath);
      for (const section of metadata.sections) {
        for (const sub of section.subsections) {
          createModule(sub.path);
        }
      }
    });

    When("validating the metadata", () => {
      const metadata = loadMetadata(state!.metadataPath);
      state!.validationResult = validateMetadata(metadata, state!.tempDir, state!.tempDir);
    });

    Then("validation should pass", () => {
      expect(state!.validationResult?.valid).toBe(true);
    });

    And("there should be {int} errors", (_ctx: unknown, count: number) => {
      expect(state!.validationResult?.errors).toHaveLength(count);
    });
  });

  Scenario("Validation fails when module file is missing", ({ Given, And, When, Then }) => {
    Given("a metadata file with module paths:", (_ctx: unknown, table: Array<{ path: string }>) => {
      state = initState();
      writeMetadata({
        document: { title: "Test", version: "1.0" },
        sections: [
          {
            title: "Test Section",
            tags: ["core"],
            subsections: table.map((row) => ({ path: row.path, tags: ["core"] })),
          },
        ],
        variations: [{ name: "default", path: "/", tags: ["core"], budget_tokens: 8000 }],
      });
    });

    And("module {string} exists", (_ctx: unknown, modulePath: string) => {
      createModule(modulePath);
    });

    And("module {string} does not exist", () => {
      // Do nothing - file is not created
    });

    When("validating the metadata", () => {
      const metadata = loadMetadata(state!.metadataPath);
      state!.validationResult = validateMetadata(metadata, state!.tempDir, state!.tempDir);
    });

    Then("validation should fail", () => {
      expect(state!.validationResult?.valid).toBe(false);
    });

    And(
      "there should be {int} error containing {string}",
      (_ctx: unknown, count: number, message: string) => {
        expect(state!.validationResult?.errors).toHaveLength(count);
        expect(state!.validationResult?.errors.some((e) => e.includes(message))).toBe(true);
      }
    );
  });

  // ===========================================================================
  // Duplicate Variation Detection
  // ===========================================================================

  Scenario("Validation fails when variation names are duplicated", ({ Given, When, Then, And }) => {
    Given("a metadata file with variations:", (_ctx: unknown, table: Array<{ name: string }>) => {
      state = initState();
      writeMetadata({
        document: { title: "Test", version: "1.0" },
        sections: [],
        variations: table.map((row) => ({
          name: row.name,
          path: "/",
          tags: ["core"],
          budget_tokens: 8000,
        })),
      });
    });

    When("validating the metadata", () => {
      const metadata = loadMetadata(state!.metadataPath);
      state!.validationResult = validateMetadata(metadata, state!.tempDir, state!.tempDir);
    });

    Then("validation should fail", () => {
      expect(state!.validationResult?.valid).toBe(false);
    });

    And(
      "there should be {int} error containing {string}",
      (_ctx: unknown, count: number, message: string) => {
        expect(state!.validationResult?.errors).toHaveLength(count);
        expect(state!.validationResult?.errors.some((e) => e.includes(message))).toBe(true);
      }
    );
  });

  Scenario(
    "Validation fails when additive layer conflicts with variation name",
    ({ Given, When, Then, And }) => {
      Given(
        "a metadata file with:",
        (_ctx: unknown, table: Array<{ type: string; name: string }>) => {
          state = initState();
          const variations = table
            .filter((r) => r.type === "variation")
            .map((r) => ({ name: r.name, path: "/", tags: ["core"], budget_tokens: 8000 }));
          const additiveVariations = table
            .filter((r) => r.type === "additive")
            .map((r) => ({
              name: r.name,
              output_dir: ".claude-layers/" + r.name,
              tags: ["extra"],
            }));

          writeMetadata({
            document: { title: "Test", version: "1.0" },
            sections: [],
            variations,
            additive_variations: additiveVariations,
          });
        }
      );

      When("validating the metadata", () => {
        const metadata = loadMetadata(state!.metadataPath);
        state!.validationResult = validateMetadata(metadata, state!.tempDir, state!.tempDir);
      });

      Then("validation should fail", () => {
        expect(state!.validationResult?.valid).toBe(false);
      });

      And(
        "there should be {int} error containing {string}",
        (_ctx: unknown, count: number, message: string) => {
          expect(state!.validationResult?.errors).toHaveLength(count);
          expect(state!.validationResult?.errors.some((e) => e.includes(message))).toBe(true);
        }
      );
    }
  );
});
