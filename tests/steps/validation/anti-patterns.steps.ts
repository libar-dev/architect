/**
 * Anti-Pattern Detection Step Definitions
 *
 * BDD step definitions for testing anti-pattern detection functions
 * that enforce dual-source documentation architecture.
 *
 * @libar-docs
 */

import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  detectTagDuplication,
  detectProcessInCode,
  detectMagicComments,
  detectScenarioBloat,
  detectMegaFeature,
  detectAntiPatterns,
  formatAntiPatternReport,
  type AntiPatternViolation,
} from "../../../src/validation/anti-patterns.js";
import type { ScannedFile } from "../../../src/scanner/index.js";
import type { ScannedGherkinFile } from "../../../src/validation-schemas/feature.js";

// =============================================================================
// Type Definitions
// =============================================================================

interface AntiPatternState {
  // Input data
  featureFiles: ScannedGherkinFile[];
  scannedFiles: ScannedFile[];
  violations: AntiPatternViolation[];
  report: string;

  // Temp files for magic comment / mega-feature tests
  tempDir: string | null;
  tempFiles: string[];
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: AntiPatternState | null = null;

function initState(): AntiPatternState {
  return {
    featureFiles: [],
    scannedFiles: [],
    violations: [],
    report: "",
    tempDir: null,
    tempFiles: [],
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a mock ScannedGherkinFile with given tags
 */
function createMockFeature(
  featureTags: string[],
  scenarioTags: string[] = [],
  scenarioCount = 1
): ScannedGherkinFile {
  const scenarios = Array.from({ length: scenarioCount }, (_, i) => ({
    name: `Scenario ${i + 1}`,
    tags: i === 0 ? scenarioTags : [],
    steps: [],
    line: 10 + i * 5,
  }));

  return {
    filePath: "/test/feature.feature",
    feature: {
      name: "Test Feature",
      description: "Test description",
      tags: featureTags,
      language: "en",
      line: 1,
    },
    scenarios,
  };
}

/**
 * Create a mock ScannedFile with given directive tags
 */
function createMockScannedFile(tags: string[]): ScannedFile {
  return {
    filePath: "/test/file.ts",
    directives: [
      {
        directive: {
          tags: tags as ReadonlyArray<`@libar-docs-${string}`>,
          description: "Test directive",
          examples: [],
          position: { startLine: 1, endLine: 10 },
        },
        code: "export function test() {}",
        exports: [],
      },
    ],
  };
}

/**
 * Dedent a multi-line string by removing common leading whitespace
 */
function dedent(content: string): string {
  const lines = content.split("\n");
  // Find minimum indentation (ignoring empty lines)
  const nonEmptyLines = lines.filter((l) => l.trim().length > 0);
  if (nonEmptyLines.length === 0) return content;

  const minIndent = Math.min(
    ...nonEmptyLines.map((line) => {
      const match = /^(\s*)/.exec(line);
      return match?.[1]?.length ?? 0;
    })
  );

  // Remove that indentation from all lines
  return lines.map((line) => line.slice(minIndent)).join("\n");
}

/**
 * Create a temp file with content for magic comment / mega-feature tests
 */
function createTempFeatureFile(content: string): string {
  if (!state!.tempDir) {
    state!.tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "anti-pattern-test-"));
  }
  const filePath = path.join(state!.tempDir, `test-${Date.now()}.feature`);
  // Dedent and trim the content to handle Gherkin docstring indentation
  const dedentedContent = dedent(content.trim());
  fs.writeFileSync(filePath, dedentedContent);
  state!.tempFiles.push(filePath);
  return filePath;
}

/**
 * Clean up temp files
 */
function cleanupTempFiles(): void {
  if (state?.tempFiles) {
    for (const file of state.tempFiles) {
      try {
        fs.unlinkSync(file);
      } catch {
        // Ignore
      }
    }
  }
  if (state?.tempDir) {
    try {
      fs.rmdirSync(state.tempDir);
    } catch {
      // Ignore
    }
  }
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature("tests/features/validation/anti-patterns.feature");

describeFeature(feature, ({ Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanupTempFiles();
    state = null;
  });

  // ===========================================================================
  // Tag Duplication Detection
  // ===========================================================================

  Rule(
    "Code-only tags should not appear in feature files",
    ({ RuleScenario, RuleScenarioOutline }) => {
      RuleScenario("Feature without code-only tags passes", ({ Given, When, Then }) => {
        Given("a feature file with tags:", (_ctx, table: Array<{ tag: string }>) => {
          state = initState();
          const tags = table.map((row) => row.tag);
          state.featureFiles = [createMockFeature(tags)];
        });

        When("detecting tag duplication", () => {
          state!.violations = detectTagDuplication(state!.featureFiles);
        });

        Then("no violations are found", () => {
          expect(state!.violations).toHaveLength(0);
        });
      });

      RuleScenarioOutline(
        "Code-only dependency tags in features are flagged",
        ({ Given, When, Then, And }, variables: { code_tag: string }) => {
          Given("a feature file with code-only tag {string}", () => {
            state = initState();
            state.featureFiles = [createMockFeature([variables.code_tag])];
          });

          When("detecting tag duplication", () => {
            state!.violations = detectTagDuplication(state!.featureFiles);
          });

          Then('a "tag-duplication" violation is found', () => {
            expect(
              state!.violations.some((v: AntiPatternViolation) => v.id === "tag-duplication")
            ).toBe(true);
          });

          And('the violation severity is "error"', () => {
            const violation = state!.violations.find(
              (v: AntiPatternViolation) => v.id === "tag-duplication"
            );
            expect(violation?.severity).toBe("error");
          });

          And("the fix suggests moving to code", () => {
            const violation = state!.violations.find(
              (v: AntiPatternViolation) => v.id === "tag-duplication"
            );
            expect(violation?.fix).toContain("@libar-docs-depends-on");
          });
        }
      );

      RuleScenario(
        "Scenario-level code-only tags are also flagged",
        ({ Given, When, Then, And }) => {
          Given("a feature file with feature tags:", (_ctx, table: Array<{ tag: string }>) => {
            state = initState();
            const featureTags = table.map((row) => row.tag);
            // Store for later combination with scenario tags
            state.featureFiles = [createMockFeature(featureTags)];
          });

          And("scenario tags:", (_ctx, table: Array<{ tag: string }>) => {
            const scenarioTags = table.map((row) => row.tag);
            // Get existing feature tags and recreate with scenario tags
            const featureTags = state!.featureFiles[0]!.feature.tags;
            state!.featureFiles = [createMockFeature([...featureTags], scenarioTags)];
          });

          When("detecting tag duplication", () => {
            state!.violations = detectTagDuplication(state!.featureFiles);
          });

          Then('a "tag-duplication" violation is found', () => {
            expect(
              state!.violations.some((v: AntiPatternViolation) => v.id === "tag-duplication")
            ).toBe(true);
          });
        }
      );
    }
  );

  // ===========================================================================
  // Process-in-Code Detection
  // ===========================================================================

  Rule(
    "Process metadata should not appear in TypeScript code",
    ({ RuleScenario, RuleScenarioOutline }) => {
      RuleScenario("Code without process tags passes", ({ Given, When, Then }) => {
        Given("a TypeScript file with directive tags:", (_ctx, table: Array<{ tag: string }>) => {
          state = initState();
          const tags = table.map((row) => row.tag);
          state.scannedFiles = [createMockScannedFile(tags)];
        });

        When("detecting process-in-code anti-patterns", () => {
          state!.violations = detectProcessInCode(state!.scannedFiles);
        });

        Then("no violations are found", () => {
          expect(state!.violations).toHaveLength(0);
        });
      });

      RuleScenarioOutline(
        "Feature-only process tags in code are flagged",
        ({ Given, When, Then, And }, variables: { process_tag: string }) => {
          Given("a TypeScript file with process tag {string}", () => {
            state = initState();
            state.scannedFiles = [createMockScannedFile(["@libar-docs", variables.process_tag])];
          });

          When("detecting process-in-code anti-patterns", () => {
            state!.violations = detectProcessInCode(state!.scannedFiles);
          });

          Then('a "process-in-code" violation is found', () => {
            expect(
              state!.violations.some((v: AntiPatternViolation) => v.id === "process-in-code")
            ).toBe(true);
          });

          And('the violation severity is "error"', () => {
            const violation = state!.violations.find(
              (v: AntiPatternViolation) => v.id === "process-in-code"
            );
            expect(violation?.severity).toBe("error");
          });

          And("the fix suggests moving to feature file", () => {
            const violation = state!.violations.find(
              (v: AntiPatternViolation) => v.id === "process-in-code"
            );
            expect(violation?.fix).toContain("feature file");
          });
        }
      );
    }
  );

  // ===========================================================================
  // Magic Comments Detection
  // ===========================================================================

  Rule("Generator hints should not appear in feature files", ({ RuleScenario }) => {
    RuleScenario("Feature without magic comments passes", ({ Given, When, Then }) => {
      Given("a feature file content:", (_ctx, docString: string) => {
        state = initState();
        const filePath = createTempFeatureFile(docString);
        state.featureFiles = [
          {
            filePath,
            feature: {
              name: "Normal Feature",
              description: "",
              tags: [],
              language: "en",
              line: 1,
            },
            scenarios: [{ name: "Normal scenario", tags: [], steps: [], line: 5 }],
          },
        ];
      });

      When("detecting magic comments with threshold {int}", (_ctx, threshold: number) => {
        state!.violations = detectMagicComments(state!.featureFiles, threshold);
      });

      Then("no violations are found", () => {
        expect(state!.violations).toHaveLength(0);
      });
    });

    RuleScenario(
      "Features with excessive magic comments are flagged",
      ({ Given, When, Then, And }) => {
        Given("a feature file with {int} magic comments", (_ctx, count: number) => {
          state = initState();
          // Create content with magic comments programmatically (Gherkin strips # comments from docstrings)
          const magicComments = [
            "# GENERATOR: skip-this-section",
            "# PARSER: use-alt-parser",
            "# AUTO-GEN: header",
            "# DO NOT EDIT: managed",
            "# GENERATOR: footer",
            "# GENERATOR: sidebar",
          ].slice(0, count);
          const content = [
            ...magicComments,
            "Feature: Over-coupled Feature",
            "  Too many generator hints.",
          ].join("\n");
          const filePath = createTempFeatureFile(content);
          state.featureFiles = [
            {
              filePath,
              feature: {
                name: "Over-coupled Feature",
                description: "",
                tags: [],
                language: "en",
                line: 1,
              },
              scenarios: [],
            },
          ];
        });

        When("detecting magic comments with threshold {int}", (_ctx, threshold: number) => {
          state!.violations = detectMagicComments(state!.featureFiles, threshold);
        });

        Then('a "magic-comments" violation is found', () => {
          expect(
            state!.violations.some((v: AntiPatternViolation) => v.id === "magic-comments")
          ).toBe(true);
        });

        And('the violation severity is "warning"', () => {
          const violation = state!.violations.find(
            (v: AntiPatternViolation) => v.id === "magic-comments"
          );
          expect(violation?.severity).toBe("warning");
        });

        And('the violation message mentions "6 magic comments"', () => {
          const violation = state!.violations.find(
            (v: AntiPatternViolation) => v.id === "magic-comments"
          );
          expect(violation?.message).toContain("6 magic comments");
        });
      }
    );

    RuleScenario("Magic comments within threshold pass", ({ Given, When, Then }) => {
      Given("a feature file content:", (_ctx, docString: string) => {
        state = initState();
        const filePath = createTempFeatureFile(docString);
        state.featureFiles = [
          {
            filePath,
            feature: {
              name: "Acceptable Feature",
              description: "",
              tags: [],
              language: "en",
              line: 1,
            },
            scenarios: [],
          },
        ];
      });

      When("detecting magic comments with threshold {int}", (_ctx, threshold: number) => {
        state!.violations = detectMagicComments(state!.featureFiles, threshold);
      });

      Then("no violations are found", () => {
        expect(state!.violations).toHaveLength(0);
      });
    });
  });

  // ===========================================================================
  // Scenario Bloat Detection
  // ===========================================================================

  Rule("Feature files should not have excessive scenarios", ({ RuleScenario }) => {
    RuleScenario("Feature with few scenarios passes", ({ Given, When, Then }) => {
      Given("a feature with {int} scenarios", (_ctx, count: number) => {
        state = initState();
        state.featureFiles = [createMockFeature([], [], count)];
      });

      When("detecting scenario bloat with threshold {int}", (_ctx, threshold: number) => {
        state!.violations = detectScenarioBloat(state!.featureFiles, threshold);
      });

      Then("no violations are found", () => {
        expect(state!.violations).toHaveLength(0);
      });
    });

    RuleScenario(
      "Feature exceeding scenario threshold is flagged",
      ({ Given, When, Then, And }) => {
        Given("a feature with {int} scenarios", (_ctx, count: number) => {
          state = initState();
          state.featureFiles = [createMockFeature([], [], count)];
        });

        When("detecting scenario bloat with threshold {int}", (_ctx, threshold: number) => {
          state!.violations = detectScenarioBloat(state!.featureFiles, threshold);
        });

        Then('a "scenario-bloat" violation is found', () => {
          expect(
            state!.violations.some((v: AntiPatternViolation) => v.id === "scenario-bloat")
          ).toBe(true);
        });

        And('the violation severity is "warning"', () => {
          const violation = state!.violations.find(
            (v: AntiPatternViolation) => v.id === "scenario-bloat"
          );
          expect(violation?.severity).toBe("warning");
        });

        And("the fix suggests splitting the feature", () => {
          const violation = state!.violations.find(
            (v: AntiPatternViolation) => v.id === "scenario-bloat"
          );
          expect(violation?.fix).toContain("Split");
        });
      }
    );
  });

  // ===========================================================================
  // Mega-Feature Detection
  // ===========================================================================

  Rule("Feature files should not exceed size thresholds", ({ RuleScenario }) => {
    RuleScenario("Normal-sized feature passes", ({ Given, When, Then }) => {
      Given("a feature file with {int} lines", (_ctx, lineCount: number) => {
        state = initState();
        const content = "Feature: Test\n" + "  Scenario: Test\n".repeat(lineCount - 2);
        const filePath = createTempFeatureFile(content);
        state.featureFiles = [
          {
            filePath,
            feature: { name: "Test", description: "", tags: [], language: "en", line: 1 },
            scenarios: [],
          },
        ];
      });

      When("detecting mega-feature with threshold {int}", (_ctx, threshold: number) => {
        state!.violations = detectMegaFeature(state!.featureFiles, threshold);
      });

      Then("no violations are found", () => {
        expect(state!.violations).toHaveLength(0);
      });
    });

    RuleScenario("Oversized feature is flagged", ({ Given, When, Then, And }) => {
      Given("a feature file with {int} lines", (_ctx, lineCount: number) => {
        state = initState();
        const content = "Feature: Test\n" + "  Line content\n".repeat(lineCount - 1);
        const filePath = createTempFeatureFile(content);
        state.featureFiles = [
          {
            filePath,
            feature: { name: "Test", description: "", tags: [], language: "en", line: 1 },
            scenarios: [],
          },
        ];
      });

      When("detecting mega-feature with threshold {int}", (_ctx, threshold: number) => {
        state!.violations = detectMegaFeature(state!.featureFiles, threshold);
      });

      Then('a "mega-feature" violation is found', () => {
        expect(state!.violations.some((v: AntiPatternViolation) => v.id === "mega-feature")).toBe(
          true
        );
      });

      And('the violation severity is "warning"', () => {
        const violation = state!.violations.find(
          (v: AntiPatternViolation) => v.id === "mega-feature"
        );
        expect(violation?.severity).toBe("warning");
      });

      And('the violation message mentions "lines"', () => {
        const violation = state!.violations.find(
          (v: AntiPatternViolation) => v.id === "mega-feature"
        );
        expect(violation?.message).toContain("lines");
      });
    });
  });

  // ===========================================================================
  // Combined Detection
  // ===========================================================================

  Rule("All anti-patterns can be detected in one pass", ({ RuleScenario }) => {
    RuleScenario("Combined detection finds multiple issues", ({ Given, When, Then, And }) => {
      Given("a TypeScript file with directive tags:", (_ctx, table: Array<{ tag: string }>) => {
        state = initState();
        const tags = table.map((row) => row.tag);
        state.scannedFiles = [createMockScannedFile(tags)];
      });

      And("a feature file with tags:", (_ctx, table: Array<{ tag: string }>) => {
        const tags = table.map((row) => row.tag);
        state!.featureFiles = [createMockFeature(tags)];
      });

      When("detecting all anti-patterns", () => {
        state!.violations = detectAntiPatterns(state!.scannedFiles, state!.featureFiles);
      });

      Then("{int} violations are found", (_ctx, count: number) => {
        expect(state!.violations).toHaveLength(count);
      });

      And('violations include "process-in-code"', () => {
        expect(
          state!.violations.some((v: AntiPatternViolation) => v.id === "process-in-code")
        ).toBe(true);
      });

      And('violations include "tag-duplication"', () => {
        expect(
          state!.violations.some((v: AntiPatternViolation) => v.id === "tag-duplication")
        ).toBe(true);
      });
    });
  });

  // ===========================================================================
  // Report Formatting
  // ===========================================================================

  Rule("Violations can be formatted for console output", ({ RuleScenario }) => {
    RuleScenario("Empty violations produce clean report", ({ Given, When, Then }) => {
      Given("no violations", () => {
        state = initState();
        state.violations = [];
      });

      When("formatting the anti-pattern report", () => {
        state!.report = formatAntiPatternReport(state!.violations);
      });

      Then('the report contains "No anti-patterns detected"', () => {
        expect(state!.report).toContain("No anti-patterns detected");
      });
    });

    RuleScenario("Violations are grouped by severity", ({ Given, When, Then, And }) => {
      Given("violations:", (_ctx, table: Array<{ id: string; severity: string }>) => {
        state = initState();
        state.violations = table.map((row) => ({
          id: row.id as AntiPatternViolation["id"],
          severity: row.severity as "error" | "warning",
          message: `Test ${row.id} violation`,
          file: "/test/file.ts",
        }));
      });

      When("formatting the anti-pattern report", () => {
        state!.report = formatAntiPatternReport(state!.violations);
      });

      Then('the report contains "Errors (architectural violations)"', () => {
        expect(state!.report).toContain("Errors (architectural violations)");
      });

      And('the report contains "Warnings (hygiene issues)"', () => {
        expect(state!.report).toContain("Warnings (hygiene issues)");
      });

      And('the report shows "2 errors, 1 warning"', () => {
        expect(state!.report).toContain("2 errors, 1 warning");
      });
    });
  });
});
