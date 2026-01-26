/**
 * Scanner Core Step Definitions
 *
 * BDD step definitions for testing the scanPatterns function which
 * orchestrates file discovery, directive detection, and AST parsing
 * to extract documentation directives from TypeScript files.
 *
 * @libar-docs
 */

import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import * as fs from "fs/promises";
import * as os from "os";
import * as path from "path";
import { scanPatterns } from "../../../src/scanner/index.js";
import { Result } from "../../../src/types/index.js";
import type { ScannerConfig } from "../../../src/types/index.js";
import type { FileError, ScannedFile } from "../../../src/scanner/index.js";

// =============================================================================
// Type Definitions
// =============================================================================

interface ScannerCoreState {
  tempDir: string | null;
  config: ScannerConfig;
  scanResult: { files: readonly ScannedFile[]; errors: readonly FileError[] } | null;
  scanSucceeded: boolean;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: ScannerCoreState | null = null;

function initState(): ScannerCoreState {
  return {
    tempDir: null,
    config: {
      patterns: [],
      baseDir: "",
    },
    scanResult: null,
    scanSucceeded: false,
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature("tests/features/behavior/scanner-core.feature");

describeFeature(feature, ({ Scenario, Background, AfterEachScenario }) => {
  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  AfterEachScenario(async () => {
    if (state?.tempDir) {
      await fs.rm(state.tempDir, { recursive: true, force: true });
    }
    state = null;
  });

  // ---------------------------------------------------------------------------
  // Background
  // ---------------------------------------------------------------------------

  Background(({ Given }) => {
    Given("a scanner integration context with temp directory", async () => {
      state = initState();
      state.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "scanner-core-test-"));
      state.config.baseDir = state.tempDir;
    });
  });

  // ---------------------------------------------------------------------------
  // Helper Functions
  // ---------------------------------------------------------------------------

  async function createFile(relativePath: string, content: string): Promise<void> {
    if (!state?.tempDir) throw new Error("State not initialized");
    const filePath = path.join(state.tempDir, relativePath);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content.trim());
  }

  async function runScan(pattern: string, exclude?: string[]): Promise<void> {
    if (!state) throw new Error("State not initialized");
    state.config.patterns = [pattern];
    if (exclude) {
      state.config.exclude = exclude;
    }
    const result = await scanPatterns(state.config);
    state.scanSucceeded = Result.isOk(result);
    if (Result.isOk(result)) {
      state.scanResult = result.value;
    }
  }

  // ---------------------------------------------------------------------------
  // Scenario: Scan files and extract directives
  // ---------------------------------------------------------------------------

  Scenario("Scan files and extract directives", ({ Given, When, Then, And }) => {
    Given(
      "a file {string} with content:",
      async (_: unknown, filePath: string, content: string) => {
        await createFile(filePath, content);
      }
    );

    When("scanning with pattern {string}", async (_: unknown, pattern: string) => {
      await runScan(pattern);
    });

    Then("the scan should succeed with {int} file", (_: unknown, count: number) => {
      expect(state!.scanSucceeded).toBe(true);
      expect(state!.scanResult!.files).toHaveLength(count);
    });

    And("the scan should have {int} errors", (_: unknown, count: number) => {
      expect(state!.scanResult!.errors).toHaveLength(count);
    });

    And(
      "file {string} should have {int} directive",
      (_: unknown, fileName: string, count: number) => {
        const file = state!.scanResult!.files.find((f) => f.filePath.includes(fileName));
        expect(file).toBeDefined();
        expect(file!.directives).toHaveLength(count);
      }
    );

    And("the directive should have tag {string}", (_: unknown, tag: string) => {
      const directive = state!.scanResult!.files[0]!.directives[0]!;
      expect(directive.directive.tags).toContain(tag);
    });

    And("the directive should have {int} export", (_: unknown, count: number) => {
      const directive = state!.scanResult!.files[0]!.directives[0]!;
      expect(directive.exports).toHaveLength(count);
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario: Skip files without directives
  // ---------------------------------------------------------------------------

  Scenario("Skip files without directives", ({ Given, When, Then, And }) => {
    Given(
      "a file {string} with content:",
      async (_: unknown, filePath: string, content: string) => {
        await createFile(filePath, content);
      }
    );

    When("scanning with pattern {string}", async (_: unknown, pattern: string) => {
      await runScan(pattern);
    });

    Then("the scan should succeed with {int} files", (_: unknown, count: number) => {
      expect(state!.scanSucceeded).toBe(true);
      expect(state!.scanResult!.files).toHaveLength(count);
    });

    And("the scan should have {int} errors", (_: unknown, count: number) => {
      expect(state!.scanResult!.errors).toHaveLength(count);
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario: Collect errors for files that fail to parse
  // ---------------------------------------------------------------------------

  Scenario("Collect errors for files that fail to parse", ({ Given, When, Then, And }) => {
    Given(
      "a file {string} with content:",
      async (_: unknown, filePath: string, content: string) => {
        await createFile(filePath, content);
      }
    );

    // And is used for additional files
    And("a file {string} with content:", async (_: unknown, filePath: string, content: string) => {
      await createFile(filePath, content);
    });

    When("scanning with pattern {string}", async (_: unknown, pattern: string) => {
      await runScan(pattern);
    });

    Then("the scan should succeed with {int} file", (_: unknown, count: number) => {
      expect(state!.scanSucceeded).toBe(true);
      expect(state!.scanResult!.files).toHaveLength(count);
    });

    And("file {string} should be in the results", (_: unknown, fileName: string) => {
      const file = state!.scanResult!.files.find((f) => f.filePath.includes(fileName));
      expect(file).toBeDefined();
    });

    And("the scan should have {int} error", (_: unknown, count: number) => {
      expect(state!.scanResult!.errors).toHaveLength(count);
    });

    And("the error should reference file {string}", (_: unknown, fileName: string) => {
      expect(state!.scanResult!.errors[0]!.file).toContain(fileName);
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario: Always return Ok result even with broken files
  // ---------------------------------------------------------------------------

  Scenario("Always return Ok result even with broken files", ({ Given, When, Then, And }) => {
    Given(
      "a file {string} with content:",
      async (_: unknown, filePath: string, content: string) => {
        await createFile(filePath, content);
      }
    );

    And("a file {string} with content:", async (_: unknown, filePath: string, content: string) => {
      await createFile(filePath, content);
    });

    When("scanning with pattern {string}", async (_: unknown, pattern: string) => {
      await runScan(pattern);
    });

    Then("the scan should succeed with {int} files", (_: unknown, count: number) => {
      expect(state!.scanSucceeded).toBe(true);
      expect(state!.scanResult!.files).toHaveLength(count);
    });

    And("the scan should have {int} errors", (_: unknown, count: number) => {
      expect(state!.scanResult!.errors).toHaveLength(count);
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario: Handle multiple files with multiple directives each
  // ---------------------------------------------------------------------------

  Scenario("Handle multiple files with multiple directives each", ({ Given, When, Then, And }) => {
    Given(
      "a file {string} with content:",
      async (_: unknown, filePath: string, content: string) => {
        await createFile(filePath, content);
      }
    );

    And("a file {string} with content:", async (_: unknown, filePath: string, content: string) => {
      await createFile(filePath, content);
    });

    When("scanning with pattern {string}", async (_: unknown, pattern: string) => {
      await runScan(pattern);
    });

    Then("the scan should succeed with {int} files", (_: unknown, count: number) => {
      expect(state!.scanSucceeded).toBe(true);
      expect(state!.scanResult!.files).toHaveLength(count);
    });

    And("the scan should have {int} errors", (_: unknown, count: number) => {
      expect(state!.scanResult!.errors).toHaveLength(count);
    });

    And(
      "file {string} should have {int} directives",
      (_: unknown, fileName: string, count: number) => {
        const file = state!.scanResult!.files.find((f) => f.filePath.includes(fileName));
        expect(file).toBeDefined();
        expect(file!.directives).toHaveLength(count);
      }
    );

    And(
      "file {string} should have {int} directive",
      (_: unknown, fileName: string, count: number) => {
        const file = state!.scanResult!.files.find((f) => f.filePath.includes(fileName));
        expect(file).toBeDefined();
        expect(file!.directives).toHaveLength(count);
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Scenario: Return empty results when no patterns match
  // ---------------------------------------------------------------------------

  Scenario("Return empty results when no patterns match", ({ When, Then, And }) => {
    When("scanning with pattern {string}", async (_: unknown, pattern: string) => {
      await runScan(pattern);
    });

    Then("the scan should succeed with {int} files", (_: unknown, count: number) => {
      expect(state!.scanSucceeded).toBe(true);
      expect(state!.scanResult!.files).toHaveLength(count);
    });

    And("the scan should have {int} errors", (_: unknown, count: number) => {
      expect(state!.scanResult!.errors).toHaveLength(count);
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario: Respect exclusion patterns
  // ---------------------------------------------------------------------------

  Scenario("Respect exclusion patterns", ({ Given, When, Then, And }) => {
    Given(
      "a file {string} with content:",
      async (_: unknown, filePath: string, content: string) => {
        await createFile(filePath, content);
      }
    );

    And("a file {string} with content:", async (_: unknown, filePath: string, content: string) => {
      await createFile(filePath, content);
    });

    When(
      "scanning with pattern {string} excluding {string}",
      async (_: unknown, pattern: string, exclude: string) => {
        await runScan(pattern, [exclude]);
      }
    );

    Then("the scan should succeed with {int} file", (_: unknown, count: number) => {
      expect(state!.scanSucceeded).toBe(true);
      expect(state!.scanResult!.files).toHaveLength(count);
    });

    And("file {string} should be in the results", (_: unknown, fileName: string) => {
      const file = state!.scanResult!.files.find((f) => f.filePath.includes(fileName));
      expect(file).toBeDefined();
    });

    And("file {string} should not be in the results", (_: unknown, pathPart: string) => {
      const file = state!.scanResult!.files.find((f) => f.filePath.includes(pathPart));
      expect(file).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario: Extract complete directive information
  // ---------------------------------------------------------------------------

  Scenario("Extract complete directive information", ({ Given, When, Then, And }) => {
    Given(
      "a file {string} with content:",
      async (_: unknown, filePath: string, content: string) => {
        await createFile(filePath, content);
      }
    );

    When("scanning with pattern {string}", async (_: unknown, pattern: string) => {
      await runScan(pattern);
    });

    Then("the scan should succeed with {int} file", (_: unknown, count: number) => {
      expect(state!.scanSucceeded).toBe(true);
      expect(state!.scanResult!.files).toHaveLength(count);
    });

    And("the scan should have {int} errors", (_: unknown, count: number) => {
      expect(state!.scanResult!.errors).toHaveLength(count);
    });

    And(
      "the directive should have tags {string} and {string}",
      (_: unknown, tag1: string, tag2: string) => {
        const directive = state!.scanResult!.files[0]!.directives[0]!;
        expect(directive.directive.tags).toContain(tag1);
        expect(directive.directive.tags).toContain(tag2);
      }
    );

    And("the directive description should contain {string}", (_: unknown, text: string) => {
      const directive = state!.scanResult!.files[0]!.directives[0]!;
      expect(directive.directive.description).toContain(text);
    });

    And("the directive description should also contain {string}", (_: unknown, text: string) => {
      const directive = state!.scanResult!.files[0]!.directives[0]!;
      expect(directive.directive.description).toContain(text);
    });

    And("the directive should have {int} example", (_: unknown, count: number) => {
      const directive = state!.scanResult!.files[0]!.directives[0]!;
      expect(directive.directive.examples).toHaveLength(count);
    });

    And("the directive example should contain {string}", (_: unknown, text: string) => {
      const directive = state!.scanResult!.files[0]!.directives[0]!;
      expect(directive.directive.examples[0]).toContain(text);
    });

    And("the directive code should contain {string}", (_: unknown, text: string) => {
      const directive = state!.scanResult!.files[0]!.directives[0]!;
      expect(directive.code).toContain(text);
    });

    And("the directive code should also contain {string}", (_: unknown, text: string) => {
      const directive = state!.scanResult!.files[0]!.directives[0]!;
      expect(directive.code).toContain(text);
    });

    And(
      "the directive should have {int} export named {string} of type {string}",
      (_: unknown, count: number, name: string, type: string) => {
        const directive = state!.scanResult!.files[0]!.directives[0]!;
        expect(directive.exports).toHaveLength(count);
        expect(directive.exports[0]!.name).toBe(name);
        expect(directive.exports[0]!.type).toBe(type);
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Scenario: Handle files with quick directive check optimization
  // ---------------------------------------------------------------------------

  Scenario("Handle files with quick directive check optimization", ({ Given, When, Then, And }) => {
    Given(
      "a file {string} with content:",
      async (_: unknown, filePath: string, content: string) => {
        await createFile(filePath, content);
      }
    );

    And("a file {string} with content:", async (_: unknown, filePath: string, content: string) => {
      await createFile(filePath, content);
    });

    When("scanning with pattern {string}", async (_: unknown, pattern: string) => {
      await runScan(pattern);
    });

    Then("the scan should succeed with {int} file", (_: unknown, count: number) => {
      expect(state!.scanSucceeded).toBe(true);
      expect(state!.scanResult!.files).toHaveLength(count);
    });

    And("file {string} should be in the results", (_: unknown, fileName: string) => {
      const file = state!.scanResult!.files.find((f) => f.filePath.includes(fileName));
      expect(file).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario: Skip files without @libar-docs file-level opt-in
  // ---------------------------------------------------------------------------

  Scenario("Skip files without @libar-docs file-level opt-in", ({ Given, When, Then, And }) => {
    Given(
      "a file {string} with content:",
      async (_: unknown, filePath: string, content: string) => {
        await createFile(filePath, content);
      }
    );

    And("a file {string} with content:", async (_: unknown, filePath: string, content: string) => {
      await createFile(filePath, content);
    });

    When("scanning with pattern {string}", async (_: unknown, pattern: string) => {
      await runScan(pattern);
    });

    Then("the scan should succeed with {int} file", (_: unknown, count: number) => {
      expect(state!.scanSucceeded).toBe(true);
      expect(state!.scanResult!.files).toHaveLength(count);
    });

    And("file {string} should be in the results", (_: unknown, fileName: string) => {
      const file = state!.scanResult!.files.find((f) => f.filePath.includes(fileName));
      expect(file).toBeDefined();
    });

    And("the scan should have {int} errors", (_: unknown, count: number) => {
      expect(state!.scanResult!.errors).toHaveLength(count);
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario: Not confuse @libar-docs-* with @libar-docs opt-in
  // ---------------------------------------------------------------------------

  Scenario("Not confuse @libar-docs-* with @libar-docs opt-in", ({ Given, When, Then, And }) => {
    Given(
      "a file {string} with content:",
      async (_: unknown, filePath: string, content: string) => {
        await createFile(filePath, content);
      }
    );

    When("scanning with pattern {string}", async (_: unknown, pattern: string) => {
      await runScan(pattern);
    });

    Then("the scan should succeed with {int} files", (_: unknown, count: number) => {
      expect(state!.scanSucceeded).toBe(true);
      expect(state!.scanResult!.files).toHaveLength(count);
    });

    And("the scan should have {int} errors", (_: unknown, count: number) => {
      expect(state!.scanResult!.errors).toHaveLength(count);
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario: Detect @libar-docs opt-in combined with section tags
  // ---------------------------------------------------------------------------

  Scenario("Detect @libar-docs opt-in combined with section tags", ({ Given, When, Then, And }) => {
    Given(
      "a file {string} with content:",
      async (_: unknown, filePath: string, content: string) => {
        await createFile(filePath, content);
      }
    );

    When("scanning with pattern {string}", async (_: unknown, pattern: string) => {
      await runScan(pattern);
    });

    Then("the scan should succeed with {int} file", (_: unknown, count: number) => {
      expect(state!.scanSucceeded).toBe(true);
      expect(state!.scanResult!.files).toHaveLength(count);
    });

    And(
      "file {string} should have {int} directive",
      (_: unknown, fileName: string, count: number) => {
        const file = state!.scanResult!.files.find((f) => f.filePath.includes(fileName));
        expect(file).toBeDefined();
        expect(file!.directives).toHaveLength(count);
      }
    );

    And("the directive should have tag {string}", (_: unknown, tag: string) => {
      const directive = state!.scanResult!.files[0]!.directives[0]!;
      expect(directive.directive.tags).toContain(tag);
    });

    And("the scan should have {int} errors", (_: unknown, count: number) => {
      expect(state!.scanResult!.errors).toHaveLength(count);
    });
  });
});
