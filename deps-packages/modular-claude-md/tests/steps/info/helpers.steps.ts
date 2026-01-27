/**
 * Info Command Helpers Step Definitions
 *
 * Tests for getModuleLines, getModuleHeadings, collectAllTags,
 * getMatchingModules, and validateModuleStructure functions.
 */

import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { Metadata, Section } from "../../../src/types.js";
import {
  getModuleLines,
  getModuleHeadings,
  collectAllTags,
  getMatchingModules,
  validateModuleStructure,
  type HeadingInfo,
  type StructureIssue,
} from "../../../src/info/helpers.js";

// =============================================================================
// Type Definitions
// =============================================================================

interface TestState {
  tempDir: string;
  metadata: Metadata;
  lineCount: number;
  headings: HeadingInfo[];
  tags: string[];
  matchingModules: { path: string; tags: string[] }[];
  structureIssues: StructureIssue[];
  headingsForValidation: HeadingInfo[];
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: TestState | null = null;

function initState(): TestState {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "modular-claude-md-info-"));
  return {
    tempDir,
    metadata: {
      document: { title: "Test", version: "1.0" },
      sections: [],
      variations: [],
    },
    lineCount: 0,
    headings: [],
    tags: [],
    matchingModules: [],
    structureIssues: [],
    headingsForValidation: [],
  };
}

function cleanupState(): void {
  if (state?.tempDir && fs.existsSync(state.tempDir)) {
    fs.rmSync(state.tempDir, { recursive: true, force: true });
  }
  state = null;
}

function createModule(modulePath: string, content: string): void {
  const fullPath = path.join(state!.tempDir, modulePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature("tests/features/info/helpers.feature");

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanupState();
  });

  // ===========================================================================
  // Module Line Counting
  // ===========================================================================
  Scenario("Count lines in existing module", ({ Given, When, Then }) => {
    Given(
      "a module {string} with sample content having {int} lines",
      (_ctx: unknown, modulePath: string, _lineCount: number) => {
        state = initState();
        // Create a module with exactly 4 lines
        createModule(modulePath, "### Introduction\nWelcome to the project.\nThis is line 3.\n");
      }
    );

    When("counting lines for {string}", (_ctx: unknown, modulePath: string) => {
      state!.lineCount = getModuleLines(state!.tempDir, modulePath);
    });

    Then("the line count should be {int}", (_ctx: unknown, expected: number) => {
      expect(state!.lineCount).toBe(expected);
    });
  });

  Scenario("Count lines for missing module returns zero", ({ When, Then }) => {
    When("counting lines for {string}", (_ctx: unknown, modulePath: string) => {
      state = initState();
      state!.lineCount = getModuleLines(state!.tempDir, modulePath);
    });

    Then("the line count should be {int}", (_ctx: unknown, expected: number) => {
      expect(state!.lineCount).toBe(expected);
    });
  });

  // ===========================================================================
  // Heading Extraction
  // ===========================================================================
  Scenario("Extract headings from module with mixed levels", ({ Given, When, Then }) => {
    Given("a module {string} with mixed heading levels", (_ctx: unknown, modulePath: string) => {
      state = initState();
      // Create module with ### and #### headings
      const content = [
        "### Getting Started",
        "Some intro text.",
        "#### Prerequisites",
        "You need these things.",
        "#### Installation",
        "Run these commands.",
        "### Advanced Topics",
        "More complex stuff.",
      ].join("\n");
      createModule(modulePath, content);
    });

    When("extracting headings from {string}", (_ctx: unknown, modulePath: string) => {
      state!.headings = getModuleHeadings(state!.tempDir, modulePath);
    });

    Then("the extracted headings should match the mixed levels structure", () => {
      expect(state!.headings.length).toBe(4);
      expect(state!.headings[0]).toEqual({ level: 3, text: "Getting Started", line: 1 });
      expect(state!.headings[1]).toEqual({ level: 4, text: "Prerequisites", line: 3 });
      expect(state!.headings[2]).toEqual({ level: 4, text: "Installation", line: 5 });
      expect(state!.headings[3]).toEqual({ level: 3, text: "Advanced Topics", line: 7 });
    });
  });

  Scenario("Extract headings from module with no headings", ({ Given, When, Then }) => {
    Given("a module {string} with plain text only", (_ctx: unknown, modulePath: string) => {
      state = initState();
      createModule(modulePath, "Just plain text.\nNo headings here.");
    });

    When("extracting headings from {string}", (_ctx: unknown, modulePath: string) => {
      state!.headings = getModuleHeadings(state!.tempDir, modulePath);
    });

    Then("the headings should be empty", () => {
      expect(state!.headings.length).toBe(0);
    });
  });

  Scenario("Extract headings from missing module", ({ When, Then }) => {
    When("extracting headings from {string}", (_ctx: unknown, modulePath: string) => {
      state = initState();
      state!.headings = getModuleHeadings(state!.tempDir, modulePath);
    });

    Then("the headings should be empty", () => {
      expect(state!.headings.length).toBe(0);
    });
  });

  Scenario("Ignore H1 headings in module", ({ Given, When, Then }) => {
    Given("a module {string} with H1 and H3 headings", (_ctx: unknown, modulePath: string) => {
      state = initState();
      createModule(modulePath, "# Document Title\n### Real Content\nText here.");
    });

    When("extracting headings from {string}", (_ctx: unknown, modulePath: string) => {
      state!.headings = getModuleHeadings(state!.tempDir, modulePath);
    });

    Then("only the H3 heading should be extracted", () => {
      expect(state!.headings.length).toBe(1);
      expect(state!.headings[0]).toEqual({ level: 3, text: "Real Content", line: 2 });
    });
  });

  // ===========================================================================
  // Tag Collection
  // ===========================================================================
  Scenario("Collect all unique tags from metadata", ({ Given, When, Then }) => {
    Given(
      "metadata with sections:",
      (
        _ctx: unknown,
        table: Array<{ title: string; tags: string; module: string; moduleTags: string }>
      ) => {
        state = initState();
        for (const row of table) {
          const sectionTags = row.tags.split(",").map((t) => t.trim());
          const moduleTags = row.moduleTags.split(",").map((t) => t.trim());
          const section: Section = {
            title: row.title,
            tags: sectionTags,
            subsections: [{ path: row.module, tags: moduleTags, description: "Test" }],
          };
          state!.metadata.sections.push(section);
        }
      }
    );

    When("collecting all tags", () => {
      state!.tags = collectAllTags(state!.metadata);
    });

    Then("the tags should be {string}", (_ctx: unknown, expected: string) => {
      const expectedTags = expected.split(",").map((t) => t.trim());
      expect(state!.tags).toEqual(expectedTags);
    });
  });

  Scenario("Collect tags with no duplicates", ({ Given, When, Then }) => {
    Given(
      "metadata with sections:",
      (
        _ctx: unknown,
        table: Array<{ title: string; tags: string; module: string; moduleTags: string }>
      ) => {
        state = initState();
        for (const row of table) {
          const sectionTags = row.tags.split(",").map((t) => t.trim());
          const moduleTags = row.moduleTags.split(",").map((t) => t.trim());
          const section: Section = {
            title: row.title,
            tags: sectionTags,
            subsections: [{ path: row.module, tags: moduleTags, description: "Test" }],
          };
          state!.metadata.sections.push(section);
        }
      }
    );

    When("collecting all tags", () => {
      state!.tags = collectAllTags(state!.metadata);
    });

    Then("the tags should be {string}", (_ctx: unknown, expected: string) => {
      const expectedTags = expected.split(",").map((t) => t.trim());
      expect(state!.tags).toEqual(expectedTags);
    });
  });

  // ===========================================================================
  // Module Matching
  // ===========================================================================
  Scenario("Get modules matching tags", ({ Given, When, Then }) => {
    Given(
      "metadata with sections:",
      (
        _ctx: unknown,
        table: Array<{ title: string; tags: string; module: string; moduleTags: string }>
      ) => {
        state = initState();
        for (const row of table) {
          const sectionTags = row.tags.split(",").map((t) => t.trim());
          const moduleTags = row.moduleTags.split(",").map((t) => t.trim());
          const section: Section = {
            title: row.title,
            tags: sectionTags,
            subsections: [{ path: row.module, tags: moduleTags, description: "Test" }],
          };
          state!.metadata.sections.push(section);
        }
      }
    );

    When("getting modules matching tags {string}", (_ctx: unknown, tagsStr: string) => {
      const tags = tagsStr.split(",").map((t) => t.trim());
      state!.matchingModules = getMatchingModules(state!.metadata, tags);
    });

    Then("the matching modules should be:", (_ctx: unknown, table: Array<{ path: string }>) => {
      expect(state!.matchingModules.length).toBe(table.length);
      for (let i = 0; i < table.length; i++) {
        expect(state!.matchingModules[i]!.path).toBe(table[i]!.path);
      }
    });
  });

  Scenario("Get modules with no matches", ({ Given, When, Then }) => {
    Given(
      "metadata with sections:",
      (
        _ctx: unknown,
        table: Array<{ title: string; tags: string; module: string; moduleTags: string }>
      ) => {
        state = initState();
        for (const row of table) {
          const sectionTags = row.tags.split(",").map((t) => t.trim());
          const moduleTags = row.moduleTags.split(",").map((t) => t.trim());
          const section: Section = {
            title: row.title,
            tags: sectionTags,
            subsections: [{ path: row.module, tags: moduleTags, description: "Test" }],
          };
          state!.metadata.sections.push(section);
        }
      }
    );

    When("getting modules matching tags {string}", (_ctx: unknown, tagsStr: string) => {
      const tags = tagsStr.split(",").map((t) => t.trim());
      state!.matchingModules = getMatchingModules(state!.metadata, tags);
    });

    Then("the matching modules should be empty", () => {
      expect(state!.matchingModules.length).toBe(0);
    });
  });

  // ===========================================================================
  // Structure Validation
  // ===========================================================================
  Scenario("Valid module structure starting with H3", ({ Given, When, Then }) => {
    Given(
      "headings for validation:",
      (_ctx: unknown, table: Array<{ level: string; text: string; line: string }>) => {
        state = initState();
        state!.headingsForValidation = table.map((row) => ({
          level: parseInt(row.level, 10),
          text: row.text,
          line: parseInt(row.line, 10),
        }));
      }
    );

    When("validating structure for {string}", (_ctx: unknown, modulePath: string) => {
      state!.structureIssues = validateModuleStructure(modulePath, state!.headingsForValidation);
    });

    Then("there should be no structure issues", () => {
      expect(state!.structureIssues.length).toBe(0);
    });
  });

  Scenario("Detect module with no headings", ({ Given, When, Then, And }) => {
    Given(
      "headings for validation:",
      (_ctx: unknown, _table: Array<{ level: string; text: string; line: string }>) => {
        state = initState();
        state!.headingsForValidation = [];
      }
    );

    When("validating structure for {string}", (_ctx: unknown, modulePath: string) => {
      state!.structureIssues = validateModuleStructure(modulePath, state!.headingsForValidation);
    });

    Then("there should be {int} structure issue", (_ctx: unknown, count: number) => {
      expect(state!.structureIssues.length).toBe(count);
    });

    And(
      "issue {int} should have severity {string} and type {string}",
      (_ctx: unknown, index: number, severity: string, issueType: string) => {
        const issue = state!.structureIssues[index - 1];
        expect(issue).toBeDefined();
        expect(issue!.severity).toBe(severity);
        expect(issue!.issue).toBe(issueType);
      }
    );
  });

  Scenario("Detect module starting with H2 shallow", ({ Given, When, Then, And }) => {
    Given(
      "headings for validation:",
      (_ctx: unknown, table: Array<{ level: string; text: string; line: string }>) => {
        state = initState();
        state!.headingsForValidation = table.map((row) => ({
          level: parseInt(row.level, 10),
          text: row.text,
          line: parseInt(row.line, 10),
        }));
      }
    );

    When("validating structure for {string}", (_ctx: unknown, modulePath: string) => {
      state!.structureIssues = validateModuleStructure(modulePath, state!.headingsForValidation);
    });

    Then("there should be {int} structure issue", (_ctx: unknown, count: number) => {
      expect(state!.structureIssues.length).toBe(count);
    });

    And(
      "issue {int} should have severity {string} and type {string}",
      (_ctx: unknown, index: number, severity: string, issueType: string) => {
        const issue = state!.structureIssues[index - 1];
        expect(issue).toBeDefined();
        expect(issue!.severity).toBe(severity);
        expect(issue!.issue).toBe(issueType);
      }
    );
  });

  Scenario("Detect module starting with H4 deep", ({ Given, When, Then, And }) => {
    Given(
      "headings for validation:",
      (_ctx: unknown, table: Array<{ level: string; text: string; line: string }>) => {
        state = initState();
        state!.headingsForValidation = table.map((row) => ({
          level: parseInt(row.level, 10),
          text: row.text,
          line: parseInt(row.line, 10),
        }));
      }
    );

    When("validating structure for {string}", (_ctx: unknown, modulePath: string) => {
      state!.structureIssues = validateModuleStructure(modulePath, state!.headingsForValidation);
    });

    Then("there should be {int} structure issue", (_ctx: unknown, count: number) => {
      expect(state!.structureIssues.length).toBe(count);
    });

    And(
      "issue {int} should have severity {string} and type {string}",
      (_ctx: unknown, index: number, severity: string, issueType: string) => {
        const issue = state!.structureIssues[index - 1];
        expect(issue).toBeDefined();
        expect(issue!.severity).toBe(severity);
        expect(issue!.issue).toBe(issueType);
      }
    );
  });

  Scenario("Detect level skip in headings", ({ Given, When, Then, And }) => {
    Given(
      "headings for validation:",
      (_ctx: unknown, table: Array<{ level: string; text: string; line: string }>) => {
        state = initState();
        state!.headingsForValidation = table.map((row) => ({
          level: parseInt(row.level, 10),
          text: row.text,
          line: parseInt(row.line, 10),
        }));
      }
    );

    When("validating structure for {string}", (_ctx: unknown, modulePath: string) => {
      state!.structureIssues = validateModuleStructure(modulePath, state!.headingsForValidation);
    });

    Then("there should be {int} structure issue", (_ctx: unknown, count: number) => {
      expect(state!.structureIssues.length).toBe(count);
    });

    And(
      "issue {int} should have severity {string} and type {string}",
      (_ctx: unknown, index: number, severity: string, issueType: string) => {
        const issue = state!.structureIssues[index - 1];
        expect(issue).toBeDefined();
        expect(issue!.severity).toBe(severity);
        expect(issue!.issue).toBe(issueType);
      }
    );
  });

  Scenario("Detect multiple issues", ({ Given, When, Then, And }) => {
    Given(
      "headings for validation:",
      (_ctx: unknown, table: Array<{ level: string; text: string; line: string }>) => {
        state = initState();
        state!.headingsForValidation = table.map((row) => ({
          level: parseInt(row.level, 10),
          text: row.text,
          line: parseInt(row.line, 10),
        }));
      }
    );

    When("validating structure for {string}", (_ctx: unknown, modulePath: string) => {
      state!.structureIssues = validateModuleStructure(modulePath, state!.headingsForValidation);
    });

    Then("there should be {int} structure issues", (_ctx: unknown, count: number) => {
      expect(state!.structureIssues.length).toBe(count);
    });

    And(
      "the issues should include error {string} and warning {string}",
      (_ctx: unknown, errorType: string, warningType: string) => {
        const errorIssue = state!.structureIssues.find(
          (i) => i.severity === "error" && i.issue === errorType
        );
        const warningIssue = state!.structureIssues.find(
          (i) => i.severity === "warning" && i.issue === warningType
        );
        expect(errorIssue).toBeDefined();
        expect(warningIssue).toBeDefined();
      }
    );
  });
});
