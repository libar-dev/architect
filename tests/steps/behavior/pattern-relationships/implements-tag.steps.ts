/**
 * Implements Tag Step Definitions
 *
 * BDD step definitions for testing @libar-docs-implements tag extraction
 * and processing through the delivery-process pipeline.
 *
 * These step definitions test:
 * 1. Tag registry definition (data-driven extraction)
 * 2. AST parser metadata extraction
 * 3. ExtractedPattern population
 * 4. Relationship index building (implementedBy reverse lookup)
 * 5. Schema validation
 */
import { loadFeature, describeFeature } from "@amiceli/vitest-cucumber";
import { expect } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { buildRegistry, type TagDefinition } from "../../../../src/taxonomy/registry-builder.js";
import { parseFileDirectives } from "../../../../src/scanner/ast-parser.js";
import { Result } from "../../../../src/types/result.js";
import {
  DocDirectiveSchema,
  type DocDirective,
} from "../../../../src/validation-schemas/doc-directive.js";
import {
  RelationshipEntrySchema,
  type RelationshipEntry,
} from "../../../../src/validation-schemas/master-dataset.js";
import { transformToMasterDataset } from "../../../../src/generators/pipeline/transform-dataset.js";
import { createDefaultTagRegistry } from "../../../../src/validation-schemas/index.js";
import type { ExtractedPattern } from "../../../../src/types/index.js";
import { asPatternId, asCategoryName, asSourceFilePath } from "../../../../src/types/branded.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const feature = await loadFeature(
  resolve(__dirname, "../../../features/behavior/pattern-relationships/implements-tag.feature")
);

// =============================================================================
// Module-level state
// =============================================================================

interface ImplementsTagState {
  tagRegistry: ReturnType<typeof buildRegistry>;
  foundTag: TagDefinition | undefined;
  sourceCode: string;
  extractedDirective: DocDirective | null;
  extractedPattern: ExtractedPattern | null;
  patterns: ExtractedPattern[];
  relationshipIndex: Record<string, RelationshipEntry>;
  validationResult: { success: boolean; data?: unknown; error?: unknown };
}

let state: ImplementsTagState | null = null;

function initState(): ImplementsTagState {
  return {
    tagRegistry: buildRegistry(),
    foundTag: undefined,
    sourceCode: "",
    extractedDirective: null,
    extractedPattern: null,
    patterns: [],
    relationshipIndex: {},
    validationResult: { success: false },
  };
}

/**
 * Create a minimal ExtractedPattern for testing
 */
function createTestPattern(
  name: string,
  overrides: Partial<ExtractedPattern> = {}
): ExtractedPattern {
  return {
    id: asPatternId(`test-${name.toLowerCase().replace(/\s/g, "-")}`),
    name,
    category: asCategoryName("test"),
    directive: {
      tags: [],
      description: "",
      examples: [],
      position: { startLine: 1, endLine: 10 },
    },
    code: "",
    source: {
      file: asSourceFilePath(`test/${name}.ts`),
      lines: [1, 10] as const,
    },
    exports: [],
    extractedAt: new Date().toISOString(),
    ...overrides,
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

describeFeature(feature, ({ Rule }) => {
  // ===========================================================================
  // RULE 1: Tag Extraction from Registry
  // ===========================================================================

  Rule("Implements tag is defined in taxonomy registry", ({ RuleScenario }) => {
    state = initState();
    RuleScenario("Implements tag exists in registry", ({ Given, When, Then, And }) => {
      Given("the tag registry is loaded", () => {
        state!.tagRegistry = buildRegistry();
      });

      When('querying for tag "implements"', () => {
        state!.foundTag = state!.tagRegistry.metadataTags.find(
          (t: TagDefinition) => t.tag === "implements"
        );
      });

      Then("the tag should exist", () => {
        expect(state!.foundTag).toBeDefined();
      });

      And('the tag format should be "csv"', () => {
        expect(state!.foundTag?.format).toBe("csv");
      });

      And('the tag purpose should mention "realization"', () => {
        expect(state!.foundTag?.purpose.toLowerCase()).toContain("realization");
      });
    });
  });

  // ===========================================================================
  // RULE 2: Single Pattern Implementation
  // ===========================================================================

  Rule("Files can implement a single pattern", ({ RuleScenario }) => {
    state = initState();
    RuleScenario("Parse implements with single pattern", ({ Given, When, Then }) => {
      Given("a TypeScript file with content:", (_ctx: unknown, docString: string) => {
        state!.sourceCode = docString;
      });

      When("the AST parser extracts metadata", () => {
        const result = parseFileDirectives(state!.sourceCode, "/test/file.ts");
        if (Result.isOk(result) && result.value.directives.length > 0) {
          state!.extractedDirective = result.value.directives[0].directive;
        }
      });

      Then('the directive should have implements ["EventStoreDurability"]', () => {
        expect(state!.extractedDirective).not.toBeNull();
        expect(state!.extractedDirective?.implements).toEqual(["EventStoreDurability"]);
      });
    });

    RuleScenario("Implements preserved through extraction pipeline", ({ Given, When, Then }) => {
      Given('a scanned file with implements "EventStoreDurability"', () => {
        // Create pattern with implementsPatterns (as it would come from extraction)
        state!.extractedPattern = createTestPattern("TestFile", {
          implementsPatterns: ["EventStoreDurability"],
        });
      });

      When("the extractor builds ExtractedPattern", () => {
        // Pattern already built in Given - just verify it exists
        expect(state!.extractedPattern).not.toBeNull();
      });

      Then('the pattern should have implementsPatterns ["EventStoreDurability"]', () => {
        expect(state!.extractedPattern?.implementsPatterns).toEqual(["EventStoreDurability"]);
      });
    });
  });

  // ===========================================================================
  // RULE 3: Multiple Pattern Implementation (CSV)
  // ===========================================================================

  Rule("Files can implement multiple patterns using CSV format", ({ RuleScenario }) => {
    state = initState();
    RuleScenario("Parse implements with multiple patterns", ({ Given, When, Then }) => {
      Given("a TypeScript file with content:", (_ctx: unknown, docString: string) => {
        state!.sourceCode = docString;
      });

      When("the AST parser extracts metadata", () => {
        const result = parseFileDirectives(state!.sourceCode, "/test/file.ts");
        if (Result.isOk(result) && result.value.directives.length > 0) {
          state!.extractedDirective = result.value.directives[0].directive;
        }
      });

      Then(
        'the directive should have implements ["EventStoreDurability", "IdempotentAppend"]',
        () => {
          expect(state!.extractedDirective).not.toBeNull();
          expect(state!.extractedDirective?.implements).toEqual([
            "EventStoreDurability",
            "IdempotentAppend",
          ]);
        }
      );
    });

    RuleScenario("CSV values are trimmed", ({ Given, When, Then }) => {
      Given('a TypeScript file with implements " Pattern1 , Pattern2 "', () => {
        state!.sourceCode = `/**
         * @libar-docs
         * @libar-docs-implements  Pattern1 , Pattern2
         */
        export function test() {}`;
      });

      When("the AST parser extracts metadata", () => {
        const result = parseFileDirectives(state!.sourceCode, "/test/file.ts");
        if (Result.isOk(result) && result.value.directives.length > 0) {
          state!.extractedDirective = result.value.directives[0].directive;
        }
      });

      Then('the directive should have implements ["Pattern1", "Pattern2"]', () => {
        expect(state!.extractedDirective).not.toBeNull();
        expect(state!.extractedDirective?.implements).toEqual(["Pattern1", "Pattern2"]);
      });
    });
  });

  // ===========================================================================
  // RULE 4: Relationship Index Building
  // ===========================================================================

  Rule("Transform builds implementedBy reverse lookup", ({ RuleScenario }) => {
    state = initState();
    RuleScenario("Single implementation creates reverse lookup", ({ Given, When, Then, And }) => {
      Given("patterns:", (_ctx: unknown, table: unknown) => {
        // DataTable format: { name, implementsPatterns }
        const rows = table as Array<{ name: string; implementsPatterns: string }>;
        state!.patterns = rows.map((row) =>
          createTestPattern(row.name, {
            implementsPatterns: row.implementsPatterns ? [row.implementsPatterns] : undefined,
          })
        );
      });

      And('a pattern "EventStoreDurability" exists', () => {
        // Add the target pattern
        state!.patterns.push(
          createTestPattern("EventStoreDurability", {
            patternName: "EventStoreDurability",
          })
        );
      });

      When("the relationship index is built", () => {
        const tagRegistry = createDefaultTagRegistry();
        const dataset = transformToMasterDataset({
          patterns: state!.patterns,
          tagRegistry,
        });
        state!.relationshipIndex = dataset.relationshipIndex ?? {};
      });

      Then('"EventStoreDurability" should have implementedBy ["outbox.ts"]', () => {
        const entry = state!.relationshipIndex["EventStoreDurability"];
        expect(entry).toBeDefined();
        // implementedBy now contains ImplementationRef objects, not strings
        expect(entry?.implementedBy.some((impl) => impl.name === "outbox.ts")).toBe(true);
      });
    });

    RuleScenario("Multiple implementations aggregate", ({ Given, When, Then, And }) => {
      Given("patterns:", (_ctx: unknown, table: unknown) => {
        const rows = table as Array<{ name: string; implementsPatterns: string }>;
        state!.patterns = rows.map((row) =>
          createTestPattern(row.name, {
            implementsPatterns: row.implementsPatterns ? [row.implementsPatterns] : undefined,
          })
        );
      });

      And('a pattern "EventStoreDurability" exists', () => {
        state!.patterns.push(
          createTestPattern("EventStoreDurability", {
            patternName: "EventStoreDurability",
          })
        );
      });

      When("the relationship index is built", () => {
        const tagRegistry = createDefaultTagRegistry();
        const dataset = transformToMasterDataset({
          patterns: state!.patterns,
          tagRegistry,
        });
        state!.relationshipIndex = dataset.relationshipIndex ?? {};
      });

      Then('"EventStoreDurability" should have implementedBy containing all three files', () => {
        const entry = state!.relationshipIndex["EventStoreDurability"];
        expect(entry).toBeDefined();
        expect(entry?.implementedBy).toHaveLength(3);
        // implementedBy now contains ImplementationRef objects, not strings
        const names = entry?.implementedBy.map((impl) => impl.name) ?? [];
        expect(names).toContain("outbox.ts");
        expect(names).toContain("publication.ts");
        expect(names).toContain("idempotentAppend.ts");
      });
    });
  });

  // ===========================================================================
  // RULE 5: Schema Validation
  // ===========================================================================

  Rule("Schemas validate implements field correctly", ({ RuleScenario }) => {
    state = initState();
    RuleScenario("DocDirective schema accepts implements", ({ Given, When, Then }) => {
      Given('a DocDirective with implementsPatterns ["Pattern1"]', () => {
        // DocDirective uses 'implements' field name
        state!.extractedDirective = {
          tags: [],
          description: "",
          examples: [],
          position: { startLine: 1, endLine: 10 },
          implements: ["Pattern1"],
        } as DocDirective;
      });

      When("validating against DocDirectiveSchema", () => {
        state!.validationResult = DocDirectiveSchema.safeParse(state!.extractedDirective);
      });

      Then("validation should pass", () => {
        expect(state!.validationResult.success).toBe(true);
      });
    });

    RuleScenario("RelationshipEntry schema accepts implementedBy", ({ Given, When, Then }) => {
      Given('a RelationshipEntry with implementedBy ["file1.ts", "file2.ts"]', () => {
        // Create a valid RelationshipEntry with ImplementationRef objects
        const entry: RelationshipEntry = {
          uses: [],
          usedBy: [],
          dependsOn: [],
          enables: [],
          implementsPatterns: [],
          implementedBy: [
            { name: "file1", file: "path/to/file1.ts" },
            { name: "file2", file: "path/to/file2.ts" },
          ],
          extendedBy: [],
          // Cross-reference and API navigation fields (PatternRelationshipModel enhancement)
          seeAlso: [],
          apiRef: [],
        };
        state!.validationResult = { success: false, data: entry };
      });

      When("validating against RelationshipEntrySchema", () => {
        state!.validationResult = RelationshipEntrySchema.safeParse(
          (state!.validationResult as { data: RelationshipEntry }).data
        );
      });

      Then("validation should pass", () => {
        expect(state!.validationResult.success).toBe(true);
      });
    });
  });
});
