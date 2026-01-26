/**
 * Config Schema Step Definitions
 *
 * BDD step definitions for testing configuration schemas:
 * - ScannerConfigSchema - Scanner configuration validation
 * - createGeneratorConfigSchema - Generator configuration with security
 * - isScannerConfig - Type guard for ScannerConfig
 * - isGeneratorConfig - Type guard for GeneratorConfig
 */
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import * as path from "path";
import {
  ScannerConfigSchema,
  createGeneratorConfigSchema,
  isScannerConfig,
  isGeneratorConfig,
  type ScannerConfig,
  type GeneratorConfig,
} from "../../../src/validation-schemas/config.js";
import type { DataTableRow } from "../../support/world.js";

// =============================================================================
// Type Definitions
// =============================================================================

interface ConfigSchemaTestState {
  // Scanner config
  scannerResult: { success: true; data: ScannerConfig } | { success: false; error: unknown } | null;
  scannerValidationError: string;

  // Generator config
  baseDir: string;
  generatorResult:
    | { success: true; data: GeneratorConfig }
    | { success: false; error: unknown }
    | null;
  generatorValidationError: string;

  // Type guards
  testValue: unknown;
  isScannerConfigResult: boolean;
  isGeneratorConfigResult: boolean;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: ConfigSchemaTestState | null = null;

// =============================================================================
// Helper Functions
// =============================================================================

function initState(): ConfigSchemaTestState {
  return {
    scannerResult: null,
    scannerValidationError: "",
    baseDir: process.cwd(),
    generatorResult: null,
    generatorValidationError: "",
    testValue: undefined,
    isScannerConfigResult: false,
    isGeneratorConfigResult: false,
  };
}

function extractZodError(error: unknown): string {
  if (error && typeof error === "object" && "issues" in error) {
    const zodError = error as { issues: Array<{ message: string }> };
    return zodError.issues.map((i) => i.message).join(", ");
  }
  return String(error);
}

// =============================================================================
// Feature: Configuration Schema Validation
// =============================================================================

const feature = await loadFeature("tests/features/validation/config-schemas.feature");

describeFeature(feature, ({ Scenario, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given("a config schema test context", () => {
      state = initState();
    });
  });

  // ===========================================================================
  // ScannerConfigSchema
  // ===========================================================================

  Scenario("ScannerConfigSchema validates correct configuration", ({ When, Then, And }) => {
    When("I validate a scanner config with:", (_ctx: unknown, table: DataTableRow[]) => {
      const row = table[0];
      const result = ScannerConfigSchema.safeParse({
        patterns: [row.patterns],
        baseDir: row.baseDir,
      });
      state!.scannerResult = result;
      if (!result.success) {
        state!.scannerValidationError = extractZodError(result.error);
      }
    });

    Then("the scanner config should be valid", () => {
      expect(state!.scannerResult!.success).toBe(true);
    });

    And("the validated patterns should include {string}", (_ctx: unknown, pattern: string) => {
      expect(state!.scannerResult!.success).toBe(true);
      if (state!.scannerResult!.success) {
        expect(state!.scannerResult!.data.patterns).toContain(pattern);
      }
    });
  });

  Scenario("ScannerConfigSchema accepts multiple patterns", ({ When, Then, And }) => {
    When("I validate a scanner config with patterns:", (_ctx: unknown, table: DataTableRow[]) => {
      const patterns = table.map((row) => row.pattern);
      const result = ScannerConfigSchema.safeParse({
        patterns,
        baseDir: "/project",
      });
      state!.scannerResult = result;
    });

    Then("the scanner config should be valid", () => {
      expect(state!.scannerResult!.success).toBe(true);
    });

    And("the validated patterns should have {int} items", (_ctx: unknown, count: number) => {
      expect(state!.scannerResult!.success).toBe(true);
      if (state!.scannerResult!.success) {
        expect(state!.scannerResult!.data.patterns).toHaveLength(count);
      }
    });
  });

  Scenario("ScannerConfigSchema rejects empty patterns array", ({ When, Then, And }) => {
    When("I validate a scanner config with empty patterns", () => {
      const result = ScannerConfigSchema.safeParse({
        patterns: [],
        baseDir: "/project",
      });
      state!.scannerResult = result;
      if (!result.success) {
        state!.scannerValidationError = extractZodError(result.error);
      }
    });

    Then("the scanner config should be invalid", () => {
      expect(state!.scannerResult!.success).toBe(false);
    });

    And("the validation error should mention {string}", (_ctx: unknown, text: string) => {
      expect(state!.scannerValidationError.toLowerCase()).toContain(text.toLowerCase());
    });
  });

  Scenario("ScannerConfigSchema rejects parent traversal in patterns", ({ When, Then, And }) => {
    When("I validate a scanner config with pattern {string}", (_ctx: unknown, pattern: string) => {
      const result = ScannerConfigSchema.safeParse({
        patterns: [pattern],
        baseDir: "/project",
      });
      state!.scannerResult = result;
      if (!result.success) {
        state!.scannerValidationError = extractZodError(result.error);
      }
    });

    Then("the scanner config should be invalid", () => {
      expect(state!.scannerResult!.success).toBe(false);
    });

    And("the validation error should mention {string}", (_ctx: unknown, text: string) => {
      expect(state!.scannerValidationError.toLowerCase()).toContain(text.toLowerCase());
    });
  });

  Scenario("ScannerConfigSchema rejects hidden parent traversal", ({ When, Then, And }) => {
    When("I validate a scanner config with pattern {string}", (_ctx: unknown, pattern: string) => {
      const result = ScannerConfigSchema.safeParse({
        patterns: [pattern],
        baseDir: "/project",
      });
      state!.scannerResult = result;
      if (!result.success) {
        state!.scannerValidationError = extractZodError(result.error);
      }
    });

    Then("the scanner config should be invalid", () => {
      expect(state!.scannerResult!.success).toBe(false);
    });

    And("the validation error should mention {string}", (_ctx: unknown, text: string) => {
      expect(state!.scannerValidationError.toLowerCase()).toContain(text.toLowerCase());
    });
  });

  Scenario("ScannerConfigSchema normalizes baseDir to absolute path", ({ When, Then, And }) => {
    When("I validate a scanner config with baseDir {string}", (_ctx: unknown, baseDir: string) => {
      const result = ScannerConfigSchema.safeParse({
        patterns: ["**/*.ts"],
        baseDir,
      });
      state!.scannerResult = result;
    });

    Then("the scanner config should be valid", () => {
      expect(state!.scannerResult!.success).toBe(true);
    });

    And("the validated baseDir should be an absolute path", () => {
      expect(state!.scannerResult!.success).toBe(true);
      if (state!.scannerResult!.success) {
        expect(path.isAbsolute(state!.scannerResult!.data.baseDir)).toBe(true);
      }
    });
  });

  Scenario("ScannerConfigSchema accepts optional exclude patterns", ({ When, Then, And }) => {
    When(
      "I validate a scanner config with exclude patterns:",
      (_ctx: unknown, table: DataTableRow[]) => {
        const exclude = table.map((row) => row.pattern);
        const result = ScannerConfigSchema.safeParse({
          patterns: ["src/**/*.ts"],
          baseDir: "/project",
          exclude,
        });
        state!.scannerResult = result;
      }
    );

    Then("the scanner config should be valid", () => {
      expect(state!.scannerResult!.success).toBe(true);
    });

    And("the validated exclude should have {int} items", (_ctx: unknown, count: number) => {
      expect(state!.scannerResult!.success).toBe(true);
      if (state!.scannerResult!.success) {
        expect(state!.scannerResult!.data.exclude).toHaveLength(count);
      }
    });
  });

  // ===========================================================================
  // createGeneratorConfigSchema
  // ===========================================================================

  Scenario("GeneratorConfigSchema validates correct configuration", ({ Given, When, Then }) => {
    Given("the current working directory as base", () => {
      state!.baseDir = process.cwd();
    });

    When("I validate a generator config with:", (_ctx: unknown, table: DataTableRow[]) => {
      const row = table[0];
      const schema = createGeneratorConfigSchema(state!.baseDir);
      const result = schema.safeParse({
        outputDir: row.outputDir,
        registryPath: row.registryPath,
      });
      state!.generatorResult = result;
      if (!result.success) {
        state!.generatorValidationError = extractZodError(result.error);
      }
    });

    Then("the generator config should be valid", () => {
      expect(state!.generatorResult!.success).toBe(true);
    });
  });

  Scenario("GeneratorConfigSchema requires .json registry file", ({ Given, When, Then, And }) => {
    Given("the current working directory as base", () => {
      state!.baseDir = process.cwd();
    });

    When(
      "I validate a generator config with registryPath {string}",
      (_ctx: unknown, registryPath: string) => {
        const schema = createGeneratorConfigSchema(state!.baseDir);
        const result = schema.safeParse({
          outputDir: "docs",
          registryPath,
        });
        state!.generatorResult = result;
        if (!result.success) {
          state!.generatorValidationError = extractZodError(result.error);
        }
      }
    );

    Then("the generator config should be invalid", () => {
      expect(state!.generatorResult!.success).toBe(false);
    });

    And("the validation error should mention {string}", (_ctx: unknown, text: string) => {
      expect(state!.generatorValidationError.toLowerCase()).toContain(text.toLowerCase());
    });
  });

  Scenario(
    "GeneratorConfigSchema rejects outputDir with parent traversal",
    ({ Given, When, Then, And }) => {
      Given("the current working directory as base", () => {
        state!.baseDir = process.cwd();
      });

      When(
        "I validate a generator config with outputDir {string}",
        (_ctx: unknown, outputDir: string) => {
          const schema = createGeneratorConfigSchema(state!.baseDir);
          const result = schema.safeParse({
            outputDir,
            registryPath: "registry.json",
          });
          state!.generatorResult = result;
          if (!result.success) {
            state!.generatorValidationError = extractZodError(result.error);
          }
        }
      );

      Then("the generator config should be invalid", () => {
        expect(state!.generatorResult!.success).toBe(false);
      });

      And("the validation error should mention {string}", (_ctx: unknown, text: string) => {
        expect(state!.generatorValidationError.toLowerCase()).toContain(text.toLowerCase());
      });
    }
  );

  Scenario("GeneratorConfigSchema accepts relative output directory", ({ Given, When, Then }) => {
    Given("the current working directory as base", () => {
      state!.baseDir = process.cwd();
    });

    When(
      "I validate a generator config with outputDir {string}",
      (_ctx: unknown, outputDir: string) => {
        const schema = createGeneratorConfigSchema(state!.baseDir);
        const result = schema.safeParse({
          outputDir,
          registryPath: "registry.json",
        });
        state!.generatorResult = result;
      }
    );

    Then("the generator config should be valid", () => {
      expect(state!.generatorResult!.success).toBe(true);
    });
  });

  Scenario("GeneratorConfigSchema defaults overwrite to false", ({ Given, When, Then, And }) => {
    Given("the current working directory as base", () => {
      state!.baseDir = process.cwd();
    });

    When("I validate a generator config without overwrite", () => {
      const schema = createGeneratorConfigSchema(state!.baseDir);
      const result = schema.safeParse({
        outputDir: "docs",
        registryPath: "registry.json",
      });
      state!.generatorResult = result;
    });

    Then("the generator config should be valid", () => {
      expect(state!.generatorResult!.success).toBe(true);
    });

    And("the validated overwrite should be false", () => {
      expect(state!.generatorResult!.success).toBe(true);
      if (state!.generatorResult!.success) {
        expect(state!.generatorResult!.data.overwrite).toBe(false);
      }
    });
  });

  Scenario("GeneratorConfigSchema defaults readmeOnly to false", ({ Given, When, Then, And }) => {
    Given("the current working directory as base", () => {
      state!.baseDir = process.cwd();
    });

    When("I validate a generator config without readmeOnly", () => {
      const schema = createGeneratorConfigSchema(state!.baseDir);
      const result = schema.safeParse({
        outputDir: "docs",
        registryPath: "registry.json",
      });
      state!.generatorResult = result;
    });

    Then("the generator config should be valid", () => {
      expect(state!.generatorResult!.success).toBe(true);
    });

    And("the validated readmeOnly should be false", () => {
      expect(state!.generatorResult!.success).toBe(true);
      if (state!.generatorResult!.success) {
        expect(state!.generatorResult!.data.readmeOnly).toBe(false);
      }
    });
  });

  // ===========================================================================
  // isScannerConfig
  // ===========================================================================

  Scenario("isScannerConfig returns true for valid config", ({ Given, When, Then }) => {
    Given("a valid scanner config object", () => {
      state!.testValue = {
        patterns: ["src/**/*.ts"],
        baseDir: "/project",
      };
    });

    When("I check if it is a scanner config", () => {
      state!.isScannerConfigResult = isScannerConfig(state!.testValue);
    });

    Then("isScannerConfig should return true", () => {
      expect(state!.isScannerConfigResult).toBe(true);
    });
  });

  Scenario("isScannerConfig returns false for invalid config", ({ Given, When, Then }) => {
    Given("an object with missing patterns", () => {
      state!.testValue = {
        baseDir: "/project",
      };
    });

    When("I check if it is a scanner config", () => {
      state!.isScannerConfigResult = isScannerConfig(state!.testValue);
    });

    Then("isScannerConfig should return false", () => {
      expect(state!.isScannerConfigResult).toBe(false);
    });
  });

  Scenario("isScannerConfig returns false for null", ({ Given, When, Then }) => {
    Given("a null value", () => {
      state!.testValue = null;
    });

    When("I check if it is a scanner config", () => {
      state!.isScannerConfigResult = isScannerConfig(state!.testValue);
    });

    Then("isScannerConfig should return false", () => {
      expect(state!.isScannerConfigResult).toBe(false);
    });
  });

  Scenario("isScannerConfig returns false for non-object", ({ Given, When, Then }) => {
    Given("a string value {string}", (_ctx: unknown, value: string) => {
      state!.testValue = value;
    });

    When("I check if it is a scanner config", () => {
      state!.isScannerConfigResult = isScannerConfig(state!.testValue);
    });

    Then("isScannerConfig should return false", () => {
      expect(state!.isScannerConfigResult).toBe(false);
    });
  });

  // ===========================================================================
  // isGeneratorConfig
  // ===========================================================================

  Scenario("isGeneratorConfig returns true for valid config", ({ Given, When, Then }) => {
    Given("a valid generator config object", () => {
      state!.testValue = {
        outputDir: "docs",
        registryPath: "registry.json",
        overwrite: false,
        readmeOnly: false,
      };
    });

    When("I check if it is a generator config", () => {
      state!.isGeneratorConfigResult = isGeneratorConfig(state!.testValue);
    });

    Then("isGeneratorConfig should return true", () => {
      expect(state!.isGeneratorConfigResult).toBe(true);
    });
  });

  Scenario("isGeneratorConfig returns false for invalid config", ({ Given, When, Then }) => {
    Given("an object with missing outputDir", () => {
      state!.testValue = {
        registryPath: "registry.json",
      };
    });

    When("I check if it is a generator config", () => {
      state!.isGeneratorConfigResult = isGeneratorConfig(state!.testValue);
    });

    Then("isGeneratorConfig should return false", () => {
      expect(state!.isGeneratorConfigResult).toBe(false);
    });
  });

  Scenario("isGeneratorConfig returns false for non-json registry", ({ Given, When, Then }) => {
    Given(
      "a generator config with registryPath {string}",
      (_ctx: unknown, registryPath: string) => {
        state!.testValue = {
          outputDir: "docs",
          registryPath,
          overwrite: false,
          readmeOnly: false,
        };
      }
    );

    When("I check if it is a generator config", () => {
      state!.isGeneratorConfigResult = isGeneratorConfig(state!.testValue);
    });

    Then("isGeneratorConfig should return false", () => {
      expect(state!.isGeneratorConfigResult).toBe(false);
    });
  });
});
