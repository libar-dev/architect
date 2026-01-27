/**
 * Tag Matcher Step Definitions
 *
 * Tests for tag matching functions (OR logic).
 */

import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import type { Subsection, Section } from "../../../src/types.js";
import {
  subsectionMatchesTags,
  sectionHasMatchingContent,
  getMatchingSubsections,
  countMatchingModules,
} from "../../../src/builder/matcher.js";

// =============================================================================
// Type Definitions
// =============================================================================

interface MatcherState {
  subsection: Subsection | null;
  section: Section | null;
  sections: Section[];
  targetTags: string[];
  matchResult: boolean;
  matchingSubsections: Subsection[];
  moduleCount: number;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: MatcherState | null = null;

function initState(): MatcherState {
  return {
    subsection: null,
    section: null,
    sections: [],
    targetTags: [],
    matchResult: false,
    matchingSubsections: [],
    moduleCount: 0,
  };
}

function parseTags(tagsString: string): string[] {
  if (!tagsString.trim()) return [];
  return tagsString
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature("tests/features/builder/matcher.feature");

describeFeature(feature, ({ Scenario, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  // ===========================================================================
  // Basic Tag Matching
  // ===========================================================================

  Scenario("Subsection matches when it shares one tag", ({ Given, When, Then }) => {
    Given("a subsection with tags {string}", (_ctx: unknown, tags: string) => {
      state = initState();
      state.subsection = { path: "test.md", tags: parseTags(tags) };
    });

    When("checking against target tags {string}", (_ctx: unknown, tags: string) => {
      state!.targetTags = parseTags(tags);
      state!.matchResult = subsectionMatchesTags(state!.subsection!, state!.targetTags);
    });

    Then("the subsection should match", () => {
      expect(state!.matchResult).toBe(true);
    });
  });

  Scenario("Subsection matches when it shares all tags", ({ Given, When, Then }) => {
    Given("a subsection with tags {string}", (_ctx: unknown, tags: string) => {
      state = initState();
      state.subsection = { path: "test.md", tags: parseTags(tags) };
    });

    When("checking against target tags {string}", (_ctx: unknown, tags: string) => {
      state!.targetTags = parseTags(tags);
      state!.matchResult = subsectionMatchesTags(state!.subsection!, state!.targetTags);
    });

    Then("the subsection should match", () => {
      expect(state!.matchResult).toBe(true);
    });
  });

  Scenario("Subsection does not match when no tags shared", ({ Given, When, Then }) => {
    Given("a subsection with tags {string}", (_ctx: unknown, tags: string) => {
      state = initState();
      state.subsection = { path: "test.md", tags: parseTags(tags) };
    });

    When("checking against target tags {string}", (_ctx: unknown, tags: string) => {
      state!.targetTags = parseTags(tags);
      state!.matchResult = subsectionMatchesTags(state!.subsection!, state!.targetTags);
    });

    Then("the subsection should not match", () => {
      expect(state!.matchResult).toBe(false);
    });
  });

  Scenario("Empty subsection tags never match", ({ Given, When, Then }) => {
    Given("a subsection with tags {string}", (_ctx: unknown, tags: string) => {
      state = initState();
      state.subsection = { path: "test.md", tags: parseTags(tags) };
    });

    When("checking against target tags {string}", (_ctx: unknown, tags: string) => {
      state!.targetTags = parseTags(tags);
      state!.matchResult = subsectionMatchesTags(state!.subsection!, state!.targetTags);
    });

    Then("the subsection should not match", () => {
      expect(state!.matchResult).toBe(false);
    });
  });

  Scenario("Empty target tags never match", ({ Given, When, Then }) => {
    Given("a subsection with tags {string}", (_ctx: unknown, tags: string) => {
      state = initState();
      state.subsection = { path: "test.md", tags: parseTags(tags) };
    });

    When("checking against target tags {string}", (_ctx: unknown, tags: string) => {
      state!.targetTags = parseTags(tags);
      state!.matchResult = subsectionMatchesTags(state!.subsection!, state!.targetTags);
    });

    Then("the subsection should not match", () => {
      expect(state!.matchResult).toBe(false);
    });
  });

  // ===========================================================================
  // Section Matching
  // ===========================================================================

  Scenario(
    "Section has matching content when at least one subsection matches",
    ({ Given, When, Then }) => {
      Given(
        "a section with subsections having tags:",
        (_ctx: unknown, table: Array<{ tags: string }>) => {
          state = initState();
          state.section = {
            title: "Test Section",
            tags: [],
            subsections: table.map((row, i) => ({
              path: `module${i}.md`,
              tags: parseTags(row.tags),
            })),
          };
        }
      );

      When("checking if section has content for tags {string}", (_ctx: unknown, tags: string) => {
        state!.targetTags = parseTags(tags);
        state!.matchResult = sectionHasMatchingContent(state!.section!, state!.targetTags);
      });

      Then("section should have matching content", () => {
        expect(state!.matchResult).toBe(true);
      });
    }
  );

  Scenario(
    "Section has no matching content when no subsection matches",
    ({ Given, When, Then }) => {
      Given(
        "a section with subsections having tags:",
        (_ctx: unknown, table: Array<{ tags: string }>) => {
          state = initState();
          state.section = {
            title: "Test Section",
            tags: [],
            subsections: table.map((row, i) => ({
              path: `module${i}.md`,
              tags: parseTags(row.tags),
            })),
          };
        }
      );

      When("checking if section has content for tags {string}", (_ctx: unknown, tags: string) => {
        state!.targetTags = parseTags(tags);
        state!.matchResult = sectionHasMatchingContent(state!.section!, state!.targetTags);
      });

      Then("section should not have matching content", () => {
        expect(state!.matchResult).toBe(false);
      });
    }
  );

  // ===========================================================================
  // Get Matching Subsections
  // ===========================================================================

  Scenario("Get only matching subsections", ({ Given, When, Then }) => {
    Given(
      "a section with subsections having tags:",
      (_ctx: unknown, table: Array<{ tags: string }>) => {
        state = initState();
        state.section = {
          title: "Test Section",
          tags: [],
          subsections: table.map((row, i) => ({
            path: `module${i}.md`,
            tags: parseTags(row.tags),
          })),
        };
      }
    );

    When("getting matching subsections for tags {string}", (_ctx: unknown, tags: string) => {
      state!.targetTags = parseTags(tags);
      state!.matchingSubsections = getMatchingSubsections(state!.section!, state!.targetTags);
    });

    Then("there should be {int} matching subsections", (_ctx: unknown, count: number) => {
      expect(state!.matchingSubsections).toHaveLength(count);
    });
  });

  // ===========================================================================
  // Count Modules
  // ===========================================================================

  Scenario("Count matching modules across sections", ({ Given, When, Then }) => {
    Given(
      "sections with subsections:",
      (_ctx: unknown, table: Array<{ section: string; tags: string }>) => {
        state = initState();

        // Group rows by section name
        const sectionMap = new Map<string, Subsection[]>();
        for (const row of table) {
          if (!sectionMap.has(row.section)) {
            sectionMap.set(row.section, []);
          }
          sectionMap.get(row.section)!.push({
            path: `${row.section.toLowerCase()}/module${sectionMap.get(row.section)!.length}.md`,
            tags: parseTags(row.tags),
          });
        }

        state.sections = Array.from(sectionMap.entries()).map(([title, subsections]) => ({
          title,
          tags: [],
          subsections,
        }));
      }
    );

    When("counting modules for tags {string}", (_ctx: unknown, tags: string) => {
      state!.targetTags = parseTags(tags);
      state!.moduleCount = countMatchingModules(state!.sections, state!.targetTags);
    });

    Then("the count should be {int}", (_ctx: unknown, expected: number) => {
      expect(state!.moduleCount).toBe(expected);
    });
  });
});
