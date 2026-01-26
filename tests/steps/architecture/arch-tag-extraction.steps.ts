/**
 * Architecture Tag Extraction Step Definitions
 *
 * BDD step definitions for testing architecture tag extraction from the tag
 * registry and AST parser. These tests verify that arch-role, arch-context,
 * and arch-layer tags are correctly defined and extracted.
 *
 * @libar-docs
 */

import { expect } from "vitest";
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";

import { buildRegistry } from "../../../src/taxonomy/index.js";
import { parseFileDirectives } from "../../../src/scanner/ast-parser.js";
import { Result } from "../../../src/types/index.js";
import { createTempDir, writeTempFile } from "../../support/helpers/file-system.js";
import type { TagRegistry } from "../../../src/taxonomy/index.js";

// =============================================================================
// Type Definitions
// =============================================================================

interface ArchTagExtractionState {
  tagRegistry: TagRegistry | null;
  queriedTag: string | null;
  queriedTagDef: {
    tag: string;
    format: string;
    purpose?: string;
    values?: readonly string[];
  } | null;
  typeScriptSource: string | null;
  tempDir: string | null;
  filePath: string | null;
  directive: {
    archRole?: string;
    archContext?: string;
    archLayer?: string;
  } | null;
  cleanup: (() => Promise<void>) | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: ArchTagExtractionState | null = null;

// =============================================================================
// Helper Functions
// =============================================================================

function initState(): ArchTagExtractionState {
  return {
    tagRegistry: null,
    queriedTag: null,
    queriedTagDef: null,
    typeScriptSource: null,
    tempDir: null,
    filePath: null,
    directive: null,
    cleanup: null,
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature(
  "tests/features/behavior/architecture-diagrams/arch-tag-extraction.feature"
);

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  // ---------------------------------------------------------------------------
  // Lifecycle Hooks
  // ---------------------------------------------------------------------------

  AfterEachScenario(async () => {
    if (state?.cleanup) {
      await state.cleanup();
    }
    state = null;
  });

  // ---------------------------------------------------------------------------
  // Background
  // ---------------------------------------------------------------------------

  Background(({ Given }) => {
    Given("the tag registry is loaded with architecture tags", () => {
      state = initState();
      state.tagRegistry = buildRegistry();
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: arch-role tag is defined in the registry
  // ---------------------------------------------------------------------------

  Rule("arch-role tag is defined in the registry", ({ RuleScenario }) => {
    RuleScenario("arch-role tag exists with enum format", ({ When, Then, And }) => {
      When('querying for tag "arch-role"', () => {
        if (!state?.tagRegistry) throw new Error("Tag registry not initialized");
        const tagRegistry = state.tagRegistry;
        state.queriedTag = "arch-role";
        const tagDef = tagRegistry.metadataTags.find((t) => t.tag === "arch-role");
        state.queriedTagDef = tagDef ?? null;
      });

      Then("the tag should exist", () => {
        expect(state?.queriedTagDef).not.toBeNull();
      });

      And('the tag format should be "enum"', () => {
        expect(state?.queriedTagDef?.format).toBe("enum");
      });

      And('the tag purpose should mention "diagram"', () => {
        expect(state?.queriedTagDef?.purpose?.toLowerCase()).toContain("diagram");
      });
    });

    RuleScenario("arch-role has required enum values", ({ When, Then, And }) => {
      When('querying for tag "arch-role"', () => {
        if (!state?.tagRegistry) throw new Error("Tag registry not initialized");
        const tagRegistry = state.tagRegistry;
        state.queriedTag = "arch-role";
        const tagDef = tagRegistry.metadataTags.find((t) => t.tag === "arch-role");
        state.queriedTagDef = tagDef ?? null;
      });

      Then('the tag values should include "command-handler"', () => {
        expect(state?.queriedTagDef?.values).toContain("command-handler");
      });

      And('the tag values should include "projection"', () => {
        expect(state?.queriedTagDef?.values).toContain("projection");
      });

      And('the tag values should include "saga"', () => {
        expect(state?.queriedTagDef?.values).toContain("saga");
      });

      And('the tag values should include "infrastructure"', () => {
        expect(state?.queriedTagDef?.values).toContain("infrastructure");
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: arch-context tag is defined in the registry
  // ---------------------------------------------------------------------------

  Rule("arch-context tag is defined in the registry", ({ RuleScenario }) => {
    RuleScenario("arch-context tag exists with value format", ({ When, Then, And }) => {
      When('querying for tag "arch-context"', () => {
        if (!state?.tagRegistry) throw new Error("Tag registry not initialized");
        const tagRegistry = state.tagRegistry;
        state.queriedTag = "arch-context";
        const tagDef = tagRegistry.metadataTags.find((t) => t.tag === "arch-context");
        state.queriedTagDef = tagDef ?? null;
      });

      Then("the tag should exist", () => {
        expect(state?.queriedTagDef).not.toBeNull();
      });

      And('the tag format should be "value"', () => {
        expect(state?.queriedTagDef?.format).toBe("value");
      });

      And('the tag purpose should mention "bounded context"', () => {
        expect(state?.queriedTagDef?.purpose?.toLowerCase()).toContain("bounded context");
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: arch-layer tag is defined in the registry
  // ---------------------------------------------------------------------------

  Rule("arch-layer tag is defined in the registry", ({ RuleScenario }) => {
    RuleScenario("arch-layer tag exists with enum format", ({ When, Then, And }) => {
      When('querying for tag "arch-layer"', () => {
        if (!state?.tagRegistry) throw new Error("Tag registry not initialized");
        const tagRegistry = state.tagRegistry;
        state.queriedTag = "arch-layer";
        const tagDef = tagRegistry.metadataTags.find((t) => t.tag === "arch-layer");
        state.queriedTagDef = tagDef ?? null;
      });

      Then("the tag should exist", () => {
        expect(state?.queriedTagDef).not.toBeNull();
      });

      And('the tag format should be "enum"', () => {
        expect(state?.queriedTagDef?.format).toBe("enum");
      });
    });

    RuleScenario("arch-layer has exactly three values", ({ When, Then, And }) => {
      When('querying for tag "arch-layer"', () => {
        if (!state?.tagRegistry) throw new Error("Tag registry not initialized");
        const tagRegistry = state.tagRegistry;
        state.queriedTag = "arch-layer";
        const tagDef = tagRegistry.metadataTags.find((t) => t.tag === "arch-layer");
        state.queriedTagDef = tagDef ?? null;
      });

      Then('the tag values should include "domain"', () => {
        expect(state?.queriedTagDef?.values).toContain("domain");
      });

      And('the tag values should include "application"', () => {
        expect(state?.queriedTagDef?.values).toContain("application");
      });

      And('the tag values should include "infrastructure"', () => {
        expect(state?.queriedTagDef?.values).toContain("infrastructure");
      });

      And("the tag values count should be 3", () => {
        expect(state?.queriedTagDef?.values).toHaveLength(3);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: AST parser extracts arch-role from TypeScript annotations
  // ---------------------------------------------------------------------------

  Rule("AST parser extracts arch-role from TypeScript annotations", ({ RuleScenario }) => {
    RuleScenario("Extract arch-role projection", ({ Given, When, Then }) => {
      Given("TypeScript source:", async (_ctx: unknown, docString: string) => {
        if (!state) state = initState();
        const tempContext = await createTempDir({ prefix: "arch-tag-test-" });
        state.tempDir = tempContext.tempDir;
        state.cleanup = tempContext.cleanup;
        state.typeScriptSource = docString.trim();
        state.filePath = await writeTempFile(state.tempDir, "test.ts", state.typeScriptSource);
      });

      When("the AST parser extracts the directive", () => {
        if (!state) throw new Error("State not initialized");
        if (!state.filePath || !state.typeScriptSource) {
          throw new Error("File path or TypeScript source not initialized");
        }
        const result = parseFileDirectives(state.typeScriptSource, state.filePath);
        if (Result.isOk(result) && result.value.directives.length > 0) {
          const directive = result.value.directives[0].directive;
          state.directive = {
            archRole: directive.archRole,
            archContext: directive.archContext,
            archLayer: directive.archLayer,
          };
        } else {
          state.directive = null;
        }
      });

      Then('the directive archRole should be "projection"', () => {
        expect(state?.directive?.archRole).toBe("projection");
      });
    });

    RuleScenario("Extract arch-role command-handler", ({ Given, When, Then }) => {
      Given("TypeScript source:", async (_ctx: unknown, docString: string) => {
        if (!state) state = initState();
        const tempContext = await createTempDir({ prefix: "arch-tag-test-" });
        state.tempDir = tempContext.tempDir;
        state.cleanup = tempContext.cleanup;
        state.typeScriptSource = docString.trim();
        state.filePath = await writeTempFile(state.tempDir, "test.ts", state.typeScriptSource);
      });

      When("the AST parser extracts the directive", () => {
        if (!state) throw new Error("State not initialized");
        if (!state.filePath || !state.typeScriptSource) {
          throw new Error("File path or TypeScript source not initialized");
        }
        const result = parseFileDirectives(state.typeScriptSource, state.filePath);
        if (Result.isOk(result) && result.value.directives.length > 0) {
          const directive = result.value.directives[0].directive;
          state.directive = {
            archRole: directive.archRole,
            archContext: directive.archContext,
            archLayer: directive.archLayer,
          };
        } else {
          state.directive = null;
        }
      });

      Then('the directive archRole should be "command-handler"', () => {
        expect(state?.directive?.archRole).toBe("command-handler");
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: AST parser extracts arch-context from TypeScript annotations
  // ---------------------------------------------------------------------------

  Rule("AST parser extracts arch-context from TypeScript annotations", ({ RuleScenario }) => {
    RuleScenario("Extract arch-context orders", ({ Given, When, Then }) => {
      Given("TypeScript source:", async (_ctx: unknown, docString: string) => {
        if (!state) state = initState();
        const tempContext = await createTempDir({ prefix: "arch-tag-test-" });
        state.tempDir = tempContext.tempDir;
        state.cleanup = tempContext.cleanup;
        state.typeScriptSource = docString.trim();
        state.filePath = await writeTempFile(state.tempDir, "test.ts", state.typeScriptSource);
      });

      When("the AST parser extracts the directive", () => {
        if (!state) throw new Error("State not initialized");
        if (!state.filePath || !state.typeScriptSource) {
          throw new Error("File path or TypeScript source not initialized");
        }
        const result = parseFileDirectives(state.typeScriptSource, state.filePath);
        if (Result.isOk(result) && result.value.directives.length > 0) {
          const directive = result.value.directives[0].directive;
          state.directive = {
            archRole: directive.archRole,
            archContext: directive.archContext,
            archLayer: directive.archLayer,
          };
        } else {
          state.directive = null;
        }
      });

      Then('the directive archContext should be "orders"', () => {
        expect(state?.directive?.archContext).toBe("orders");
      });
    });

    RuleScenario("Extract arch-context inventory", ({ Given, When, Then }) => {
      Given("TypeScript source:", async (_ctx: unknown, docString: string) => {
        if (!state) state = initState();
        const tempContext = await createTempDir({ prefix: "arch-tag-test-" });
        state.tempDir = tempContext.tempDir;
        state.cleanup = tempContext.cleanup;
        state.typeScriptSource = docString.trim();
        state.filePath = await writeTempFile(state.tempDir, "test.ts", state.typeScriptSource);
      });

      When("the AST parser extracts the directive", () => {
        if (!state) throw new Error("State not initialized");
        if (!state.filePath || !state.typeScriptSource) {
          throw new Error("File path or TypeScript source not initialized");
        }
        const result = parseFileDirectives(state.typeScriptSource, state.filePath);
        if (Result.isOk(result) && result.value.directives.length > 0) {
          const directive = result.value.directives[0].directive;
          state.directive = {
            archRole: directive.archRole,
            archContext: directive.archContext,
            archLayer: directive.archLayer,
          };
        } else {
          state.directive = null;
        }
      });

      Then('the directive archContext should be "inventory"', () => {
        expect(state?.directive?.archContext).toBe("inventory");
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: AST parser extracts arch-layer from TypeScript annotations
  // ---------------------------------------------------------------------------

  Rule("AST parser extracts arch-layer from TypeScript annotations", ({ RuleScenario }) => {
    RuleScenario("Extract arch-layer application", ({ Given, When, Then }) => {
      Given("TypeScript source:", async (_ctx: unknown, docString: string) => {
        if (!state) state = initState();
        const tempContext = await createTempDir({ prefix: "arch-tag-test-" });
        state.tempDir = tempContext.tempDir;
        state.cleanup = tempContext.cleanup;
        state.typeScriptSource = docString.trim();
        state.filePath = await writeTempFile(state.tempDir, "test.ts", state.typeScriptSource);
      });

      When("the AST parser extracts the directive", () => {
        if (!state) throw new Error("State not initialized");
        if (!state.filePath || !state.typeScriptSource) {
          throw new Error("File path or TypeScript source not initialized");
        }
        const result = parseFileDirectives(state.typeScriptSource, state.filePath);
        if (Result.isOk(result) && result.value.directives.length > 0) {
          const directive = result.value.directives[0].directive;
          state.directive = {
            archRole: directive.archRole,
            archContext: directive.archContext,
            archLayer: directive.archLayer,
          };
        } else {
          state.directive = null;
        }
      });

      Then('the directive archLayer should be "application"', () => {
        expect(state?.directive?.archLayer).toBe("application");
      });
    });

    RuleScenario("Extract arch-layer infrastructure", ({ Given, When, Then }) => {
      Given("TypeScript source:", async (_ctx: unknown, docString: string) => {
        if (!state) state = initState();
        const tempContext = await createTempDir({ prefix: "arch-tag-test-" });
        state.tempDir = tempContext.tempDir;
        state.cleanup = tempContext.cleanup;
        state.typeScriptSource = docString.trim();
        state.filePath = await writeTempFile(state.tempDir, "test.ts", state.typeScriptSource);
      });

      When("the AST parser extracts the directive", () => {
        if (!state) throw new Error("State not initialized");
        if (!state.filePath || !state.typeScriptSource) {
          throw new Error("File path or TypeScript source not initialized");
        }
        const result = parseFileDirectives(state.typeScriptSource, state.filePath);
        if (Result.isOk(result) && result.value.directives.length > 0) {
          const directive = result.value.directives[0].directive;
          state.directive = {
            archRole: directive.archRole,
            archContext: directive.archContext,
            archLayer: directive.archLayer,
          };
        } else {
          state.directive = null;
        }
      });

      Then('the directive archLayer should be "infrastructure"', () => {
        expect(state?.directive?.archLayer).toBe("infrastructure");
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: AST parser handles multiple arch tags together
  // ---------------------------------------------------------------------------

  Rule("AST parser handles multiple arch tags together", ({ RuleScenario }) => {
    RuleScenario("Extract all three arch tags", ({ Given, When, Then, And }) => {
      Given("TypeScript source:", async (_ctx: unknown, docString: string) => {
        if (!state) state = initState();
        const tempContext = await createTempDir({ prefix: "arch-tag-test-" });
        state.tempDir = tempContext.tempDir;
        state.cleanup = tempContext.cleanup;
        state.typeScriptSource = docString.trim();
        state.filePath = await writeTempFile(state.tempDir, "test.ts", state.typeScriptSource);
      });

      When("the AST parser extracts the directive", () => {
        if (!state) throw new Error("State not initialized");
        if (!state.filePath || !state.typeScriptSource) {
          throw new Error("File path or TypeScript source not initialized");
        }
        const result = parseFileDirectives(state.typeScriptSource, state.filePath);
        if (Result.isOk(result) && result.value.directives.length > 0) {
          const directive = result.value.directives[0].directive;
          state.directive = {
            archRole: directive.archRole,
            archContext: directive.archContext,
            archLayer: directive.archLayer,
          };
        } else {
          state.directive = null;
        }
      });

      Then('the directive archRole should be "command-handler"', () => {
        expect(state?.directive?.archRole).toBe("command-handler");
      });

      And('the directive archContext should be "orders"', () => {
        expect(state?.directive?.archContext).toBe("orders");
      });

      And('the directive archLayer should be "application"', () => {
        expect(state?.directive?.archLayer).toBe("application");
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Missing arch tags yield undefined values
  // ---------------------------------------------------------------------------

  Rule("Missing arch tags yield undefined values", ({ RuleScenario }) => {
    RuleScenario("Missing arch tags are undefined", ({ Given, When, Then, And }) => {
      Given("TypeScript source:", async (_ctx: unknown, docString: string) => {
        if (!state) state = initState();
        const tempContext = await createTempDir({ prefix: "arch-tag-test-" });
        state.tempDir = tempContext.tempDir;
        state.cleanup = tempContext.cleanup;
        state.typeScriptSource = docString.trim();
        state.filePath = await writeTempFile(state.tempDir, "test.ts", state.typeScriptSource);
      });

      When("the AST parser extracts the directive", () => {
        if (!state) throw new Error("State not initialized");
        if (!state.filePath || !state.typeScriptSource) {
          throw new Error("File path or TypeScript source not initialized");
        }
        const result = parseFileDirectives(state.typeScriptSource, state.filePath);
        if (Result.isOk(result) && result.value.directives.length > 0) {
          const directive = result.value.directives[0].directive;
          state.directive = {
            archRole: directive.archRole,
            archContext: directive.archContext,
            archLayer: directive.archLayer,
          };
        } else {
          state.directive = {};
        }
      });

      Then("the directive archRole should be undefined", () => {
        expect(state?.directive?.archRole).toBeUndefined();
      });

      And("the directive archContext should be undefined", () => {
        expect(state?.directive?.archContext).toBeUndefined();
      });

      And("the directive archLayer should be undefined", () => {
        expect(state?.directive?.archLayer).toBeUndefined();
      });
    });
  });
});
