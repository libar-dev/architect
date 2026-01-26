/**
 * Business Rules Codec Step Definitions
 *
 * BDD step definitions for testing the BusinessRulesCodec.
 * Tests rule extraction, organization, code preservation, and traceability.
 *
 * Uses Rule() + RuleScenario() pattern as feature file uses Rule: blocks.
 */
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { createBusinessRulesCodec } from "../../../src/renderable/codecs/business-rules.js";
import { renderToMarkdown } from "../../../src/renderable/render.js";
import type { RenderableDocument, TableBlock } from "../../../src/renderable/schema.js";
import type { RuntimeMasterDataset } from "../../../src/generators/pipeline/transform-dataset.js";
import { transformToMasterDataset } from "../../../src/generators/pipeline/transform-dataset.js";
import { createDefaultTagRegistry } from "../../../src/validation-schemas/tag-registry.js";
import type { ExtractedPattern } from "../../../src/validation-schemas/index.js";
import type { BusinessRule } from "../../../src/validation-schemas/extracted-pattern.js";
import { createTestPattern, resetPatternCounter } from "../../fixtures/dataset-factories.js";
import { findHeadings, findTables } from "../../support/helpers/document-assertions.js";
import type { DataTableRow } from "../../support/world.js";

// =============================================================================
// State Types
// =============================================================================

interface BusinessRulesState {
  dataset: RuntimeMasterDataset | null;
  document: RenderableDocument | null;
  markdown: string;
  patterns: ExtractedPattern[];
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: BusinessRulesState | null = null;

function initState(): BusinessRulesState {
  resetPatternCounter();
  return {
    dataset: null,
    document: null,
    markdown: "",
    patterns: [],
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a pattern with rules attached
 */
function createPatternWithRules(
  options: {
    name?: string;
    category?: string;
    phase?: number;
    filePath?: string;
  },
  rules: BusinessRule[]
): ExtractedPattern {
  const pattern = createTestPattern({
    name: options.name ?? "TestPattern",
    category: options.category ?? "core",
    phase: options.phase,
    filePath: options.filePath ?? "test.feature",
  });

  // Add rules to the pattern (rules is an optional field on ExtractedPattern)
  return {
    ...pattern,
    rules,
    scenarios: rules.flatMap((r) =>
      r.scenarioNames.map((name, idx) => ({
        scenarioName: name,
        featureName: pattern.name,
        featureDescription: "",
        featureFile: options.filePath ?? "test.feature",
        line: 50 + idx * 10,
        semanticTags: [],
        tags: [],
      }))
    ),
  };
}

/**
 * Build the dataset from patterns and run the generator
 */
function buildDataset(): void {
  state!.dataset = transformToMasterDataset({
    patterns: state!.patterns,
    tagRegistry: createDefaultTagRegistry(),
    workflow: undefined,
  });
}

interface CodecOptions {
  detailLevel?: "summary" | "standard" | "detailed";
  includeCodeExamples?: boolean;
  includeVerifiedBy?: boolean;
}

function runGenerator(options: CodecOptions = {}): void {
  buildDataset();
  const codec = createBusinessRulesCodec(options);
  state!.document = codec.decode(state!.dataset!);
  state!.markdown = renderToMarkdown(state!.document);
}

function findRuleHeading(ruleName: string): boolean {
  const headings = findHeadings(state!.document!);
  return headings.some((h) => h.text === ruleName);
}

function markdownContains(text: string): boolean {
  return state!.markdown.includes(text);
}

function _findSummaryTable(): TableBlock | undefined {
  const tables = findTables(state!.document!);
  return tables.find((t) => t.columns.includes("Metric") && t.columns.includes("Value"));
}

function _findAllRulesTable(): TableBlock | undefined {
  const tables = findTables(state!.document!);
  return tables.find((t) => t.columns.includes("Rule") && t.columns.includes("Source"));
}

function _hasDomainSection(domainName: string): boolean {
  const headings = findHeadings(state!.document!);
  return headings.some((h) => h.level === 2 && h.text.includes(domainName));
}

// =============================================================================
// Feature: Business Rules Document Codec
// =============================================================================

const feature = await loadFeature("tests/features/generators/business-rules-codec.feature");

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given("a business rules codec test context", () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Rule 1: Extracts Rule blocks with Invariant and Rationale
  // ===========================================================================

  Rule("Extracts Rule blocks with Invariant and Rationale", ({ RuleScenario }) => {
    RuleScenario(
      "Extracts annotated Rule with Invariant and Rationale",
      ({ Given, When, Then, And }) => {
        Given("a pattern with a rule containing:", (_ctx: unknown, dataTable: DataTableRow[]) => {
          const fields: Record<string, string> = {};
          for (const row of dataTable) {
            fields[row.Field] = row.Value;
          }

          // Build rule description with annotations
          const description = `
**Invariant:** ${fields.invariant ?? ""}

**Rationale:** ${fields.rationale ?? ""}

**Verified by:** ${fields.verifiedBy ?? ""}
`.trim();

          const rule: BusinessRule = {
            name: fields.name ?? "Test Rule",
            description,
            scenarioNames: fields.verifiedBy ? [fields.verifiedBy] : [],
            scenarioCount: fields.verifiedBy ? 1 : 0,
          };

          state!.patterns.push(
            createPatternWithRules(
              { name: "TestPattern", category: "ddd", phase: 20, filePath: "test.feature" },
              [rule]
            )
          );
        });

        When("decoding with BusinessRulesCodec in detailed mode", () => {
          runGenerator({ detailLevel: "detailed", includeVerifiedBy: true });
        });

        Then("the document contains rule {string}", (_ctx: unknown, expectedRule: string) => {
          expect(findRuleHeading(expectedRule)).toBe(true);
        });

        And(
          "the document contains invariant text {string}",
          (_ctx: unknown, expectedText: string) => {
            expect(markdownContains("**Invariant:**")).toBe(true);
            expect(markdownContains(expectedText)).toBe(true);
          }
        );

        And(
          "the document contains rationale text {string}",
          (_ctx: unknown, expectedText: string) => {
            expect(markdownContains("**Rationale:**")).toBe(true);
            expect(markdownContains(expectedText)).toBe(true);
          }
        );

        And(
          "the document contains verified by link to {string}",
          (_ctx: unknown, scenarioName: string) => {
            expect(markdownContains("**Verified by:**")).toBe(true);
            expect(markdownContains(scenarioName)).toBe(true);
          }
        );
      }
    );

    RuleScenario(
      "Extracts unannotated Rule without showing not specified",
      ({ Given, When, Then, And }) => {
        Given("a pattern with a rule containing:", (_ctx: unknown, dataTable: DataTableRow[]) => {
          const fields: Record<string, string> = {};
          for (const row of dataTable) {
            fields[row.Field] = row.Value;
          }

          const rule: BusinessRule = {
            name: fields.name ?? "Test Rule",
            description: fields.description ?? "",
            scenarioNames: [],
            scenarioCount: 0,
          };

          state!.patterns.push(
            createPatternWithRules({ name: "TestPattern", category: "event-sourcing", phase: 2 }, [
              rule,
            ])
          );
        });

        When("decoding with BusinessRulesCodec in detailed mode", () => {
          runGenerator({ detailLevel: "detailed" });
        });

        Then("the document contains rule {string}", (_ctx: unknown, expectedRule: string) => {
          expect(findRuleHeading(expectedRule)).toBe(true);
        });

        And("the document contains description {string}", (_ctx: unknown, expectedDesc: string) => {
          expect(markdownContains(expectedDesc)).toBe(true);
        });

        And("the document does not contain {string}", (_ctx: unknown, unexpectedText: string) => {
          expect(markdownContains(unexpectedText)).toBe(false);
        });
      }
    );
  });

  // ===========================================================================
  // Rule 2: Organizes rules by product area and phase
  // ===========================================================================

  Rule("Organizes rules by product area and phase", ({ RuleScenario }) => {
    RuleScenario("Groups rules by product area and phase", ({ Given, When, Then }) => {
      Given(
        "patterns with rules in these categories:",
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          let phaseNum = 15;
          for (const row of dataTable) {
            const category = row.Category ?? "uncategorized";
            const ruleName = row["Rule Name"] ?? "Test Rule";

            const rule: BusinessRule = {
              name: ruleName,
              description: `Description for ${ruleName}`,
              scenarioNames: [],
              scenarioCount: 0,
            };

            state!.patterns.push(
              createPatternWithRules({ name: `${category}Pattern`, category, phase: phaseNum++ }, [
                rule,
              ])
            );
          }
        }
      );

      When("decoding with BusinessRulesCodec in standard mode", () => {
        runGenerator({ detailLevel: "standard" });
      });

      Then("the document has product area sections with phases", () => {
        // New format: "## Platform / Phase X" instead of domain names
        // Check that we have H2 headings with "Phase" in them
        const headings = findHeadings(state!.document!);
        const h2Headings = headings.filter((h) => h.level === 2);
        const hasPhaseHeadings = h2Headings.some((h) => h.text.includes("Phase"));
        expect(hasPhaseHeadings, "Expected H2 headings with Phase grouping").toBe(true);
      });
    });

    RuleScenario("Orders rules by phase within domain", ({ Given, When, Then }) => {
      Given("patterns with rules in these phases:", (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          const phase = parseInt(row.Phase ?? "0");
          const ruleName = row["Rule Name"] ?? "Test Rule";

          const rule: BusinessRule = {
            name: ruleName,
            description: `Description for ${ruleName}`,
            scenarioNames: [],
            scenarioCount: 0,
          };

          state!.patterns.push(
            createPatternWithRules({ name: `Phase${phase}Pattern`, category: "ddd", phase }, [rule])
          );
        }
      });

      When("decoding with BusinessRulesCodec in standard mode", () => {
        runGenerator({ detailLevel: "standard" });
      });

      Then(
        "phase {int} content appears before phase {int} content",
        (_ctx: unknown, phase1: number, phase2: number) => {
          const phase1Pos = state!.markdown.indexOf(`Phase ${phase1}`);
          const phase2Pos = state!.markdown.indexOf(`Phase ${phase2}`);

          expect(phase1Pos, `Phase ${phase1} not found`).toBeGreaterThan(-1);
          expect(phase2Pos, `Phase ${phase2} not found`).toBeGreaterThan(-1);
          expect(phase1Pos, `Phase ${phase1} should appear before Phase ${phase2}`).toBeLessThan(
            phase2Pos
          );
        }
      );
    });
  });

  // ===========================================================================
  // Rule 3: Summary mode generates compact output
  // ===========================================================================

  Rule("Summary mode generates compact output", ({ RuleScenario }) => {
    RuleScenario("Summary mode includes statistics line", ({ Given, When, Then }) => {
      Given("multiple patterns with a total of {int} rules", (_ctx: unknown, ruleCount: number) => {
        for (let i = 0; i < ruleCount; i++) {
          const rule: BusinessRule = {
            name: `Rule ${i + 1}`,
            description: `Description for rule ${i + 1}`,
            scenarioNames: [],
            scenarioCount: 0,
          };

          state!.patterns.push(
            createPatternWithRules(
              {
                name: `Pattern${i}`,
                category: i % 2 === 0 ? "ddd" : "event-sourcing",
                phase: 10 + i,
              },
              [rule]
            )
          );
        }
      });

      When("decoding with BusinessRulesCodec in summary mode", () => {
        runGenerator({ detailLevel: "summary" });
      });

      Then(
        "the document has a summary line with rule count {int}",
        (_ctx: unknown, expectedTotal: number) => {
          // New format: single line summary like "169 rules from 38 features across 3 product areas"
          expect(
            markdownContains(`${expectedTotal} rules`),
            `Expected summary to mention "${expectedTotal} rules"`
          ).toBe(true);
        }
      );
    });

    RuleScenario("Summary mode excludes detailed sections", ({ Given, When, Then }) => {
      Given("multiple patterns with a total of {int} rules", (_ctx: unknown, ruleCount: number) => {
        for (let i = 0; i < ruleCount; i++) {
          const rule: BusinessRule = {
            name: `Rule ${i + 1}`,
            description: `Description for rule ${i + 1}`,
            scenarioNames: [],
            scenarioCount: 0,
          };

          state!.patterns.push(
            createPatternWithRules({ name: `Pattern${i}`, category: "ddd", phase: 10 }, [rule])
          );
        }
      });

      When("decoding with BusinessRulesCodec in summary mode", () => {
        runGenerator({ detailLevel: "summary" });
      });

      Then("the document does not have detailed rule headings", () => {
        // In summary mode, there should be no H4 rule headings (individual rules)
        const headings = findHeadings(state!.document!);
        const h4Headings = headings.filter((h) => h.level === 4);
        expect(h4Headings.length).toBe(0);
      });
    });
  });

  // ===========================================================================
  // Rule 4: Code examples and tables
  // ===========================================================================

  Rule("Preserves code examples and tables in detailed mode", ({ RuleScenario }) => {
    RuleScenario("Code examples included in detailed mode", ({ Given, When, Then }) => {
      Given("a pattern with a rule containing code examples", () => {
        const description = `
**Invariant:** Code must be documented.

\`\`\`typescript
const example = "code";
\`\`\`
`;
        const rule: BusinessRule = {
          name: "Code Rule",
          description,
          scenarioNames: [],
          scenarioCount: 0,
        };

        state!.patterns.push(
          createPatternWithRules({ name: "CodePattern", category: "core", phase: 1 }, [rule])
        );
      });

      When("decoding with BusinessRulesCodec in detailed mode with code examples enabled", () => {
        runGenerator({ detailLevel: "detailed", includeCodeExamples: true });
      });

      Then("the document contains code blocks", () => {
        expect(markdownContains("```")).toBe(true);
      });
    });

    RuleScenario("Code examples excluded in standard mode", ({ Given, When, Then }) => {
      Given("a pattern with a rule containing code examples", () => {
        const description = `
**Invariant:** Code must be documented.

\`\`\`typescript
const example = "code";
\`\`\`
`;
        const rule: BusinessRule = {
          name: "Code Rule",
          description,
          scenarioNames: [],
          scenarioCount: 0,
        };

        state!.patterns.push(
          createPatternWithRules({ name: "CodePattern", category: "core", phase: 1 }, [rule])
        );
      });

      When("decoding with BusinessRulesCodec in standard mode", () => {
        runGenerator({ detailLevel: "standard", includeCodeExamples: false });
      });

      Then("the document does not contain code blocks with language hints", () => {
        // The code blocks from rule descriptions should not appear in standard mode
        expect(markdownContains("```typescript")).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Rule 5: Traceability links
  // ===========================================================================

  Rule("Generates scenario traceability links", ({ RuleScenario }) => {
    RuleScenario("Verification links include file path", ({ Given, When, Then }) => {
      Given(
        "a pattern with scenarios in {string} at line {int}",
        (_ctx: unknown, featureFile: string, _lineNumber: number) => {
          const rule: BusinessRule = {
            name: "Test Rule",
            description: "**Verified by:** Test Scenario",
            scenarioNames: ["Test Scenario"],
            scenarioCount: 1,
          };

          state!.patterns.push(
            createPatternWithRules(
              { name: "TestPattern", category: "ddd", phase: 20, filePath: featureFile },
              [rule]
            )
          );
        }
      );

      When("decoding with BusinessRulesCodec in detailed mode with verification enabled", () => {
        runGenerator({ detailLevel: "detailed", includeVerifiedBy: true });
      });

      Then("the verification links include {string}", (_ctx: unknown, expectedPath: string) => {
        expect(markdownContains(expectedPath)).toBe(true);
      });
    });
  });
});
