/**
 * Content Renderer Step Definitions
 *
 * Tests for buildVariationContent and buildAdditiveContent functions.
 */

import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect, vi, type MockInstance } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { Metadata, Section, Variation, AdditiveVariation } from "../../../src/types.js";
import { buildVariationContent, buildAdditiveContent } from "../../../src/builder/renderer.js";
import * as colors from "../../../src/utils/colors.js";

// =============================================================================
// Type Definitions
// =============================================================================

interface RendererState {
  tempDir: string;
  metadata: Metadata;
  variation: Variation | undefined;
  additiveLayer: AdditiveVariation | undefined;
  output: string;
  warningLogged: boolean;
  logMessages: string[];
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: RendererState | null = null;
let logSpy: MockInstance<typeof colors.log> | undefined;

function initState(): RendererState {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "modular-claude-md-renderer-"));
  return {
    tempDir,
    metadata: {
      document: { title: "Test", version: "1.0" },
      sections: [],
      variations: [],
    },
    variation: undefined,
    additiveLayer: undefined,
    output: "",
    warningLogged: false,
    logMessages: [],
  };
}

function cleanupState(): void {
  if (state?.tempDir && fs.existsSync(state.tempDir)) {
    fs.rmSync(state.tempDir, { recursive: true, force: true });
  }
  if (logSpy) {
    logSpy.mockRestore();
    logSpy = undefined;
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

const feature = await loadFeature("tests/features/builder/renderer.feature");

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(() => {
    cleanupState();
  });

  // ===========================================================================
  // Scenario: Build variation with document header
  // ===========================================================================
  Scenario("Build variation with document header", ({ Given, And, When, Then }) => {
    Given(
      "a metadata document titled {string} with description {string}",
      (_ctx: unknown, title: string, description: string) => {
        state = initState();
        state.metadata.document.title = title;
        state.metadata.document.description = description;
      }
    );

    And(
      "a section {string} with tag {string} and module {string}",
      (_ctx: unknown, sectionTitle: string, tag: string, modulePath: string) => {
        const section: Section = {
          title: sectionTitle,
          tags: [tag],
          subsections: [{ path: modulePath, tags: [tag], description: "Test module" }],
        };
        state!.metadata.sections.push(section);
      }
    );

    And("module {string} contains:", (_ctx: unknown, modulePath: string, docString: string) => {
      createModule(modulePath, docString);
    });

    And(
      "a variation {string} with tags {string}",
      (_ctx: unknown, name: string, tagsStr: string) => {
        const tags = tagsStr.split(",").map((t) => t.trim());
        state!.variation = { name, path: "/", tags, budget_tokens: 8000 };
        state!.metadata.variations.push(state!.variation);
      }
    );

    When("building the variation", () => {
      logSpy = vi.spyOn(colors, "log").mockImplementation((msg: string) => {
        state!.logMessages.push(msg);
        if (msg.includes("Warning")) {
          state!.warningLogged = true;
        }
      });
      state!.output = buildVariationContent(state!.metadata, state!.variation!, state!.tempDir);
    });

    Then("the output should start with {string}", (_ctx: unknown, expected: string) => {
      expect(state!.output.startsWith(expected)).toBe(true);
    });

    And("the output should contain description blockquote", () => {
      expect(state!.output).toContain("> **Project description**");
    });
  });

  // ===========================================================================
  // Scenario: Build variation with section headers
  // ===========================================================================
  Scenario("Build variation with section headers", ({ Given, And, When, Then }) => {
    Given("a metadata document titled {string}", (_ctx: unknown, title: string) => {
      state = initState();
      state.metadata.document.title = title;
    });

    And(
      "a section {string} with tag {string} and module {string}",
      (_ctx: unknown, sectionTitle: string, tag: string, modulePath: string) => {
        const section: Section = {
          title: sectionTitle,
          tags: [tag],
          subsections: [{ path: modulePath, tags: [tag], description: "Test module" }],
        };
        state!.metadata.sections.push(section);
      }
    );

    And("module {string} has heading content", (_ctx: unknown, modulePath: string) => {
      createModule(modulePath, "### Quick Start\n\nBegin here.");
    });

    And(
      "a variation {string} with tags {string}",
      (_ctx: unknown, name: string, tagsStr: string) => {
        const tags = tagsStr.split(",").map((t) => t.trim());
        state!.variation = { name, path: "/", tags, budget_tokens: 8000 };
        state!.metadata.variations.push(state!.variation);
      }
    );

    When("building the variation", () => {
      logSpy = vi.spyOn(colors, "log").mockImplementation(() => {});
      state!.output = buildVariationContent(state!.metadata, state!.variation!, state!.tempDir);
    });

    Then("the output should contain section header and module heading", () => {
      expect(state!.output).toContain("## Getting Started");
      expect(state!.output).toContain("### Quick Start");
    });
  });

  // ===========================================================================
  // Scenario: Build variation filtering by tags
  // ===========================================================================
  Scenario("Build variation filtering by tags", ({ Given, And, When, Then }) => {
    Given("a metadata document titled {string}", (_ctx: unknown, title: string) => {
      state = initState();
      state.metadata.document.title = title;
    });

    And(
      "sections:",
      (_ctx: unknown, table: Array<{ title: string; tag: string; module: string }>) => {
        for (const row of table) {
          const section: Section = {
            title: row.title,
            tags: [row.tag],
            subsections: [{ path: row.module, tags: [row.tag], description: "Test module" }],
          };
          state!.metadata.sections.push(section);
        }
      }
    );

    And(
      "modules with content:",
      (_ctx: unknown, table: Array<{ path: string; content: string }>) => {
        for (const row of table) {
          createModule(row.path, row.content);
        }
      }
    );

    And(
      "a variation {string} with tags {string}",
      (_ctx: unknown, name: string, tagsStr: string) => {
        const tags = tagsStr.split(",").map((t) => t.trim());
        state!.variation = { name, path: "/", tags, budget_tokens: 8000 };
        state!.metadata.variations.push(state!.variation);
      }
    );

    When("building the variation", () => {
      logSpy = vi.spyOn(colors, "log").mockImplementation(() => {});
      state!.output = buildVariationContent(state!.metadata, state!.variation!, state!.tempDir);
    });

    Then("output includes public content but not private", () => {
      expect(state!.output).toContain("## Public");
      expect(state!.output).toContain("### Public Info");
      expect(state!.output).not.toContain("## Private");
      expect(state!.output).not.toContain("### Secret Info");
    });
  });

  // ===========================================================================
  // Scenario: Build variation with preamble
  // ===========================================================================
  Scenario("Build variation with preamble", ({ Given, And, When, Then }) => {
    Given(
      "a metadata document titled {string} with preamble tagline {string} and rules:",
      (_ctx: unknown, title: string, tagline: string, table: Array<{ rule: string }>) => {
        state = initState();
        state.metadata.document.title = title;
        state.metadata.preamble = {
          tagline,
          critical_rules: table.map((row) => row.rule),
        };
      }
    );

    And(
      "a section {string} with tag {string} and module {string}",
      (_ctx: unknown, sectionTitle: string, tag: string, modulePath: string) => {
        const section: Section = {
          title: sectionTitle,
          tags: [tag],
          subsections: [{ path: modulePath, tags: [tag], description: "Test module" }],
        };
        state!.metadata.sections.push(section);
      }
    );

    And(
      "module {string} contains {string}",
      (_ctx: unknown, modulePath: string, content: string) => {
        createModule(modulePath, content);
      }
    );

    And(
      "a variation {string} with tags {string}",
      (_ctx: unknown, name: string, tagsStr: string) => {
        const tags = tagsStr.split(",").map((t) => t.trim());
        state!.variation = { name, path: "/", tags, budget_tokens: 8000 };
        state!.metadata.variations.push(state!.variation);
      }
    );

    When("building the variation", () => {
      logSpy = vi.spyOn(colors, "log").mockImplementation(() => {});
      state!.output = buildVariationContent(state!.metadata, state!.variation!, state!.tempDir);
    });

    Then("the output should contain preamble with rules", () => {
      expect(state!.output).toContain("## Important Rules");
      expect(state!.output).toContain("### Key Rules");
      expect(state!.output).toContain("- **Always write tests**");
      expect(state!.output).toContain("- **Never skip code review**");
    });
  });

  // ===========================================================================
  // Scenario: Skip section when no matching subsections
  // ===========================================================================
  Scenario("Skip section when no matching subsections", ({ Given, And, When, Then }) => {
    Given("a metadata document titled {string}", (_ctx: unknown, title: string) => {
      state = initState();
      state.metadata.document.title = title;
    });

    And(
      "a section {string} with tag {string} and module {string}",
      (_ctx: unknown, sectionTitle: string, tag: string, modulePath: string) => {
        const section: Section = {
          title: sectionTitle,
          tags: [tag],
          subsections: [{ path: modulePath, tags: [tag], description: "Test module" }],
        };
        state!.metadata.sections.push(section);
      }
    );

    And(
      "module {string} contains {string}",
      (_ctx: unknown, modulePath: string, content: string) => {
        createModule(modulePath, content);
      }
    );

    And(
      "a variation {string} with tags {string}",
      (_ctx: unknown, name: string, tagsStr: string) => {
        const tags = tagsStr.split(",").map((t) => t.trim());
        state!.variation = { name, path: "/", tags, budget_tokens: 8000 };
        state!.metadata.variations.push(state!.variation);
      }
    );

    When("building the variation", () => {
      logSpy = vi.spyOn(colors, "log").mockImplementation(() => {});
      state!.output = buildVariationContent(state!.metadata, state!.variation!, state!.tempDir);
    });

    Then("the output should not contain {string}", (_ctx: unknown, unexpected: string) => {
      expect(state!.output).not.toContain(unexpected);
    });
  });

  // ===========================================================================
  // Scenario: Build additive layer with simplified header
  // ===========================================================================
  Scenario("Build additive layer with simplified header", ({ Given, And, When, Then }) => {
    Given("a metadata document titled {string}", (_ctx: unknown, title: string) => {
      state = initState();
      state.metadata.document.title = title;
    });

    And(
      "a section {string} with tag {string} and module {string}",
      (_ctx: unknown, sectionTitle: string, tag: string, modulePath: string) => {
        const section: Section = {
          title: sectionTitle,
          tags: [tag],
          subsections: [{ path: modulePath, tags: [tag], description: "Test module" }],
        };
        state!.metadata.sections.push(section);
      }
    );

    And(
      "module {string} contains {string}",
      (_ctx: unknown, modulePath: string, content: string) => {
        createModule(modulePath, content);
      }
    );

    And(
      "an additive layer {string} with tags {string} and output {string}",
      (_ctx: unknown, name: string, tagsStr: string, outputDir: string) => {
        const tags = tagsStr.split(",").map((t) => t.trim());
        state!.additiveLayer = { name, tags, output_dir: outputDir };
        state!.metadata.additive_variations = [state!.additiveLayer];
      }
    );

    When("building the additive layer", () => {
      logSpy = vi.spyOn(colors, "log").mockImplementation(() => {});
      state!.output = buildAdditiveContent(state!.metadata, state!.additiveLayer!, state!.tempDir);
    });

    Then("the output should have additive layer structure", () => {
      expect(state!.output.startsWith("# advanced Context")).toBe(true);
      expect(state!.output).toContain("This is an additive layer");
      expect(state!.output).toContain("--add-dir .layers/advanced");
      expect(state!.output).toContain("### Pro Tips");
    });
  });

  // ===========================================================================
  // Scenario: Build additive layer with description
  // ===========================================================================
  Scenario("Build additive layer with description", ({ Given, And, When, Then }) => {
    Given("a metadata document titled {string}", (_ctx: unknown, title: string) => {
      state = initState();
      state.metadata.document.title = title;
    });

    And(
      "a section {string} with tag {string} and module {string}",
      (_ctx: unknown, sectionTitle: string, tag: string, modulePath: string) => {
        const section: Section = {
          title: sectionTitle,
          tags: [tag],
          subsections: [{ path: modulePath, tags: [tag], description: "Test module" }],
        };
        state!.metadata.sections.push(section);
      }
    );

    And(
      "module {string} contains {string}",
      (_ctx: unknown, modulePath: string, content: string) => {
        createModule(modulePath, content);
      }
    );

    And(
      "an additive layer {string} with tags {string}, output {string}, and description {string}",
      (_ctx: unknown, name: string, tagsStr: string, outputDir: string, description: string) => {
        const tags = tagsStr.split(",").map((t) => t.trim());
        state!.additiveLayer = { name, tags, output_dir: outputDir, description };
        state!.metadata.additive_variations = [state!.additiveLayer];
      }
    );

    When("building the additive layer", () => {
      logSpy = vi.spyOn(colors, "log").mockImplementation(() => {});
      state!.output = buildAdditiveContent(state!.metadata, state!.additiveLayer!, state!.tempDir);
    });

    Then("the output should contain {string}", (_ctx: unknown, expected: string) => {
      expect(state!.output).toContain(expected);
    });
  });

  // ===========================================================================
  // Scenario: Handle missing module file gracefully
  // ===========================================================================
  Scenario("Handle missing module file gracefully", ({ Given, And, When, Then }) => {
    Given("a metadata document titled {string}", (_ctx: unknown, title: string) => {
      state = initState();
      state.metadata.document.title = title;
    });

    And(
      "a section {string} with tag {string} and module {string}",
      (_ctx: unknown, sectionTitle: string, tag: string, modulePath: string) => {
        const section: Section = {
          title: sectionTitle,
          tags: [tag],
          subsections: [{ path: modulePath, tags: [tag], description: "Test module" }],
        };
        state!.metadata.sections.push(section);
        // Note: NOT creating the module file to test warning behavior
      }
    );

    And(
      "a variation {string} with tags {string}",
      (_ctx: unknown, name: string, tagsStr: string) => {
        const tags = tagsStr.split(",").map((t) => t.trim());
        state!.variation = { name, path: "/", tags, budget_tokens: 8000 };
        state!.metadata.variations.push(state!.variation);
      }
    );

    When("building the variation", () => {
      logSpy = vi.spyOn(colors, "log").mockImplementation((msg: string) => {
        state!.logMessages.push(msg);
        if (msg.includes("Warning")) {
          state!.warningLogged = true;
        }
      });
      state!.output = buildVariationContent(state!.metadata, state!.variation!, state!.tempDir);
    });

    Then("a warning should be logged containing {string}", (_ctx: unknown, expected: string) => {
      const warningFound = state!.logMessages.some((msg) => msg.includes(expected));
      expect(warningFound).toBe(true);
    });

    And("the output should contain section header for Core", () => {
      expect(state!.output).toContain("## Core");
    });
  });
});
