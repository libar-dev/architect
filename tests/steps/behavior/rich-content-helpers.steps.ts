/**
 * Rich Content Helpers Step Definitions
 *
 * BDD step definitions for testing rich content rendering helpers.
 * Tests parseDescriptionWithDocStrings, renderDataTable, renderScenarioContent,
 * and renderBusinessRule functions.
 */
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import {
  parseDescriptionWithDocStrings,
  renderDataTable,
  renderScenarioContent,
  renderBusinessRule,
  type BusinessRule,
} from "../../../src/renderable/codecs/helpers.js";
import type { SectionBlock } from "../../../src/renderable/schema.js";
import type {
  ScenarioRef,
  ScenarioDataTable,
} from "../../../src/validation-schemas/scenario-ref.js";

// =============================================================================
// State Types
// =============================================================================

interface RichContentTestState {
  // Input
  description: string;
  dataTable: ScenarioDataTable | null;
  scenario: ScenarioRef | null;
  businessRule: BusinessRule | null;

  // Output
  result: SectionBlock[];
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: RichContentTestState | null = null;

function initState(): RichContentTestState {
  return {
    description: "",
    dataTable: null,
    scenario: null,
    businessRule: null,
    result: [],
  };
}

// =============================================================================
// Feature: Rich Content Rendering Helpers
// =============================================================================

const feature = await loadFeature("tests/features/behavior/rich-content-helpers.feature");

describeFeature(feature, ({ Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  // ===========================================================================
  // Rule: DocString parsing handles edge cases
  // ===========================================================================

  Rule("DocString parsing handles edge cases", ({ RuleScenario }) => {
    RuleScenario("Empty description returns empty array", ({ Given, When, Then }) => {
      Given("a description {string}", (_ctx: unknown, desc: string) => {
        state = initState();
        state.description = desc;
      });

      When("parsing for DocStrings", () => {
        state!.result = parseDescriptionWithDocStrings(state!.description);
      });

      Then("the result is an empty array", () => {
        expect(state!.result).toEqual([]);
      });
    });

    RuleScenario(
      "Description with no DocStrings returns single paragraph",
      ({ Given, When, Then, And }) => {
        Given("a description {string}", (_ctx: unknown, desc: string) => {
          state = initState();
          state.description = desc;
        });

        When("parsing for DocStrings", () => {
          state!.result = parseDescriptionWithDocStrings(state!.description);
        });

        Then("the result contains {int} block", (_ctx: unknown, count: number) => {
          expect(state!.result.length).toBe(count);
        });

        And(
          "block {int} is a paragraph with text {string}",
          (_ctx: unknown, index: number, text: string) => {
            const block = state!.result[index - 1];
            expect(block.type).toBe("paragraph");
            if (block.type === "paragraph") {
              expect(block.text).toBe(text);
            }
          }
        );
      }
    );

    RuleScenario("Single DocString parses correctly", ({ Given, When, Then }) => {
      Given("a description with embedded DocString containing typescript code", () => {
        state = initState();
        // Set up description with embedded DocString directly in code
        // to avoid Gherkin parsing conflicts with """ markers
        state.description = 'Before text.\n\n"""typescript\nconst x = 42;\n"""\n\nAfter text.';
      });

      When("parsing for DocStrings", () => {
        state!.result = parseDescriptionWithDocStrings(state!.description);
      });

      Then(
        "the result contains {int} blocks with types:",
        (
          _ctx: unknown,
          count: number,
          dataTable: Array<{ index: string; type: string; language: string }>
        ) => {
          expect(state!.result.length).toBe(count);
          for (const row of dataTable) {
            const idx = parseInt(row.index, 10) - 1;
            const block = state!.result[idx];
            expect(block.type).toBe(row.type);
            if (row.type === "code" && row.language && block.type === "code") {
              expect(block.language).toBe(row.language);
            }
          }
        }
      );
    });

    RuleScenario("DocString without language hint uses text", ({ Given, When, Then }) => {
      Given("a description with embedded DocString without language hint", () => {
        state = initState();
        // DocString without language hint defaults to "text"
        state.description = 'Some intro.\n\n"""\nplain content\n"""\n\nMore text.';
      });

      When("parsing for DocStrings", () => {
        state!.result = parseDescriptionWithDocStrings(state!.description);
      });

      Then(
        "block {int} is a code block with language {string}",
        (_ctx: unknown, index: number, lang: string) => {
          const block = state!.result[index - 1];
          expect(block.type).toBe("code");
          if (block.type === "code") {
            expect(block.language).toBe(lang);
          }
        }
      );
    });

    RuleScenario(
      "Unclosed DocString returns plain paragraph fallback",
      ({ Given, When, Then, And }) => {
        Given("a description with unclosed DocString", () => {
          state = initState();
          // Unclosed DocString (odd number of """ markers) should fallback to plain paragraph
          state.description =
            'Start text.\n\n"""typescript\nconst broken = true;\n\nThis never closes.';
        });

        When("parsing for DocStrings", () => {
          state!.result = parseDescriptionWithDocStrings(state!.description);
        });

        Then("the result contains {int} block", (_ctx: unknown, count: number) => {
          expect(state!.result.length).toBe(count);
        });

        And("block {int} is a paragraph", (_ctx: unknown, index: number) => {
          const block = state!.result[index - 1];
          expect(block.type).toBe("paragraph");
        });
      }
    );

    RuleScenario("Windows CRLF line endings are normalized", ({ Given, When, Then }) => {
      Given("a description with CRLF line endings", () => {
        state = initState();
        state.description = "Line one.\r\nLine two.\r\nLine three.";
      });

      When("parsing for DocStrings", () => {
        state!.result = parseDescriptionWithDocStrings(state!.description);
      });

      Then("line endings are normalized to LF", () => {
        // The parsing should produce a paragraph with normalized content
        expect(state!.result.length).toBeGreaterThan(0);
        const block = state!.result[0];
        if (block.type === "paragraph") {
          // If CRLF was present, it should be normalized
          expect(block.text).not.toContain("\r\n");
        }
      });
    });
  });

  // ===========================================================================
  // Rule: DataTable rendering produces valid markdown
  // ===========================================================================

  Rule("DataTable rendering produces valid markdown", ({ RuleScenario }) => {
    RuleScenario("Single row DataTable renders correctly", ({ Given, When, Then, And }) => {
      Given(
        "a DataTable with headers {string} and {string}",
        (_ctx: unknown, h1: string, h2: string) => {
          state = initState();
          state.dataTable = {
            headers: [h1, h2] as readonly string[],
            rows: [],
          };
        }
      );

      And("a row with values {string} and {string}", (_ctx: unknown, v1: string, v2: string) => {
        const row: Record<string, string> = {};
        row[state!.dataTable!.headers[0]] = v1;
        row[state!.dataTable!.headers[1]] = v2;
        state!.dataTable = {
          ...state!.dataTable!,
          rows: [row],
        };
      });

      When("rendering the DataTable", () => {
        state!.result = [renderDataTable(state!.dataTable!)];
      });

      Then("the output is a table block with {int} row", (_ctx: unknown, rowCount: number) => {
        expect(state!.result.length).toBe(1);
        const block = state!.result[0];
        expect(block.type).toBe("table");
        // Type assertion safe after the expect() above confirms type
        const tableBlock = block as { type: "table"; columns: string[]; rows: string[][] };
        expect(tableBlock.rows.length).toBe(rowCount);
      });
    });

    RuleScenario("Multi-row DataTable renders correctly", ({ Given, When, Then, And }) => {
      Given(
        "a DataTable with headers {string} and {string} and {string}",
        (_ctx: unknown, h1: string, h2: string, h3: string) => {
          state = initState();
          state.dataTable = {
            headers: [h1, h2, h3] as readonly string[],
            rows: [],
          };
        }
      );

      And("rows:", (_ctx: unknown, dataTable: Array<Record<string, string>>) => {
        state!.dataTable = {
          ...state!.dataTable!,
          rows: dataTable,
        };
      });

      When("rendering the DataTable", () => {
        state!.result = [renderDataTable(state!.dataTable!)];
      });

      Then("the output is a table block with {int} rows", (_ctx: unknown, rowCount: number) => {
        const block = state!.result[0];
        expect(block.type).toBe("table");
        // Type assertion safe after the expect() above confirms type
        const tableBlock = block as { type: "table"; columns: string[]; rows: string[][] };
        expect(tableBlock.rows.length).toBe(rowCount);
      });
    });

    RuleScenario("Missing cell values become empty strings", ({ Given, When, Then, And }) => {
      Given(
        "a DataTable with headers {string} and {string}",
        (_ctx: unknown, h1: string, h2: string) => {
          state = initState();
          state.dataTable = {
            headers: [h1, h2] as readonly string[],
            rows: [],
          };
        }
      );

      And(
        "a row with only {string} value {string}",
        (_ctx: unknown, colName: string, value: string) => {
          const row: Record<string, string> = {};
          row[colName] = value;
          // Intentionally don't set the other column
          state!.dataTable = {
            ...state!.dataTable!,
            rows: [row],
          };
        }
      );

      When("rendering the DataTable", () => {
        state!.result = [renderDataTable(state!.dataTable!)];
      });

      Then("the row has empty string for {string}", (_ctx: unknown, colName: string) => {
        const block = state!.result[0];
        expect(block.type).toBe("table");
        // Type assertion safe after the expect() above confirms type
        const tableBlock = block as { type: "table"; columns: string[]; rows: string[][] };
        const colIndex = state!.dataTable!.headers.indexOf(colName);
        expect(tableBlock.rows[0][colIndex]).toBe("");
      });
    });
  });

  // ===========================================================================
  // Rule: Scenario content rendering respects options
  // ===========================================================================

  Rule("Scenario content rendering respects options", ({ RuleScenario }) => {
    RuleScenario("Render scenario with steps", ({ Given, When, Then }) => {
      Given(
        "a scenario {string} with steps:",
        (_ctx: unknown, name: string, dataTable: Array<{ keyword: string; text: string }>) => {
          state = initState();
          state.scenario = {
            scenarioName: name,
            steps: dataTable.map((row) => ({
              keyword: row.keyword,
              text: row.text,
            })),
          };
        }
      );

      When("rendering scenario content with default options", () => {
        state!.result = renderScenarioContent(state!.scenario!);
      });

      Then("the output contains a list block with {int} items", (_ctx: unknown, count: number) => {
        const listBlock = state!.result.find((b) => b.type === "list");
        expect(listBlock).toBeDefined();
        // Type assertion safe because find() with type === "list" guarantees list type
        expect((listBlock as { type: "list"; items: unknown[] }).items.length).toBe(count);
      });
    });

    RuleScenario("Skip steps when includeSteps is false", ({ Given, When, Then }) => {
      Given(
        "a scenario {string} with steps:",
        (_ctx: unknown, name: string, dataTable: Array<{ keyword: string; text: string }>) => {
          state = initState();
          state.scenario = {
            scenarioName: name,
            steps: dataTable.map((row) => ({
              keyword: row.keyword,
              text: row.text,
            })),
          };
        }
      );

      When("rendering scenario content with includeSteps false", () => {
        state!.result = renderScenarioContent(state!.scenario!, { includeSteps: false });
      });

      Then("the output does not contain a list block", () => {
        const listBlock = state!.result.find((b) => b.type === "list");
        expect(listBlock).toBeUndefined();
      });
    });

    RuleScenario("Render scenario with DataTable in step", ({ Given, When, Then }) => {
      Given(
        "a scenario {string} with a step containing a DataTable",
        (_ctx: unknown, name: string) => {
          state = initState();
          state.scenario = {
            scenarioName: name,
            steps: [
              {
                keyword: "Given",
                text: "data in a table",
                dataTable: {
                  headers: ["Col1", "Col2"] as readonly string[],
                  rows: [{ Col1: "a", Col2: "b" }],
                },
              },
            ],
          };
        }
      );

      When("rendering scenario content with default options", () => {
        state!.result = renderScenarioContent(state!.scenario!);
      });

      Then("the output contains a table block", () => {
        const tableBlock = state!.result.find((b) => b.type === "table");
        expect(tableBlock).toBeDefined();
      });
    });
  });

  // ===========================================================================
  // Rule: Business rule rendering handles descriptions
  // ===========================================================================

  Rule("Business rule rendering handles descriptions", ({ RuleScenario }) => {
    RuleScenario("Rule with simple description", ({ Given, When, Then, And }) => {
      Given(
        "a business rule {string} with description {string}",
        (_ctx: unknown, name: string, description: string) => {
          state = initState();
          state.businessRule = {
            name,
            description,
            scenarioCount: 0,
            scenarioNames: [],
          };
        }
      );

      When("rendering the business rule", () => {
        state!.result = renderBusinessRule(state!.businessRule!);
      });

      Then("the output contains a bold paragraph with the rule name", () => {
        const boldPara = state!.result.find(
          (b) => b.type === "paragraph" && b.text.includes(`**${state!.businessRule!.name}**`)
        );
        expect(boldPara).toBeDefined();
      });

      And("the output contains the description as a paragraph", () => {
        const descPara = state!.result.find(
          (b) => b.type === "paragraph" && b.text === state!.businessRule!.description
        );
        expect(descPara).toBeDefined();
      });
    });

    RuleScenario("Rule with no description", ({ Given, When, Then, And }) => {
      Given("a business rule {string} with no description", (_ctx: unknown, name: string) => {
        state = initState();
        state.businessRule = {
          name,
          description: "",
          scenarioCount: 0,
          scenarioNames: [],
        };
      });

      When("rendering the business rule", () => {
        state!.result = renderBusinessRule(state!.businessRule!);
      });

      Then("the output contains a bold paragraph with the rule name", () => {
        const boldPara = state!.result.find(
          (b) => b.type === "paragraph" && b.text.includes(`**${state!.businessRule!.name}**`)
        );
        expect(boldPara).toBeDefined();
      });

      And("no description paragraph is rendered", () => {
        // Only one paragraph should exist (the bold rule name)
        const paragraphs = state!.result.filter((b) => b.type === "paragraph");
        expect(paragraphs.length).toBe(1);
      });
    });

    RuleScenario("Rule with embedded DocString in description", ({ Given, When, Then, And }) => {
      Given(
        "a business rule {string} with description containing a DocString",
        (_ctx: unknown, name: string) => {
          state = initState();
          state.businessRule = {
            name,
            description: 'Some text.\n\n"""typescript\nconst x = 1;\n"""\n\nMore text.',
            scenarioCount: 0,
            scenarioNames: [],
          };
        }
      );

      When("rendering the business rule", () => {
        state!.result = renderBusinessRule(state!.businessRule!);
      });

      Then("the description is parsed for DocStrings", () => {
        // Should have more than just the bold name + one paragraph
        expect(state!.result.length).toBeGreaterThan(2);
      });

      And("code blocks are rendered from embedded DocStrings", () => {
        const codeBlock = state!.result.find((b) => b.type === "code");
        expect(codeBlock).toBeDefined();
      });
    });
  });
});
