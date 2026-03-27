/**
 * Uses Tag Step Definitions
 *
 * BDD step definitions for testing @architect-uses and @architect-used-by
 * tag extraction and processing through the Architect pipeline.
 *
 * These step definitions test:
 * 1. Tag registry definition (CSV format)
 * 2. AST parser metadata extraction for uses/usedBy
 * 3. Relationship index building (usedBy reverse lookup)
 * 4. Schema validation
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  buildRegistry,
  type MetadataTagDefinitionForRegistry,
} from '../../../../src/taxonomy/registry-builder.js';
import { parseFileDirectives } from '../../../../src/scanner/ast-parser.js';
import { Result } from '../../../../src/types/result.js';
import {
  DocDirectiveSchema,
  type DocDirective,
} from '../../../../src/validation-schemas/doc-directive.js';
import {
  RelationshipEntrySchema,
  type RelationshipEntry,
} from '../../../../src/validation-schemas/master-dataset.js';
import { transformToMasterDataset } from '../../../../src/generators/pipeline/transform-dataset.js';
import { createDefaultTagRegistry } from '../../../../src/validation-schemas/index.js';
import type { ExtractedPattern } from '../../../../src/types/index.js';
import { asPatternId, asCategoryName, asSourceFilePath } from '../../../../src/types/branded.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const feature = await loadFeature(
  resolve(__dirname, '../../../features/behavior/pattern-relationships/uses-tag.feature')
);

// =============================================================================
// Module-level state
// =============================================================================

interface UsesTagState {
  tagRegistry: ReturnType<typeof buildRegistry>;
  foundTag: MetadataTagDefinitionForRegistry | undefined;
  sourceCode: string;
  extractedDirective: DocDirective | null;
  extractedPattern: ExtractedPattern | null;
  patterns: ExtractedPattern[];
  relationshipIndex: Record<string, RelationshipEntry>;
  validationResult: { success: boolean; data?: unknown; error?: unknown };
}

let state: UsesTagState | null = null;

function initState(): UsesTagState {
  return {
    tagRegistry: buildRegistry(),
    foundTag: undefined,
    sourceCode: '',
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
    id: asPatternId(`test-${name.toLowerCase().replace(/\s/g, '-')}`),
    name,
    category: asCategoryName('test'),
    directive: {
      tags: [],
      description: '',
      examples: [],
      position: { startLine: 1, endLine: 10 },
    },
    code: '',
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
  // RULE 1: Tag Registry Definition
  // ===========================================================================

  Rule('Uses tag is defined in taxonomy registry', ({ RuleScenario }) => {
    RuleScenario('Uses tag exists in registry', ({ Given, When, Then, And }) => {
      state = initState();

      Given('the tag registry is loaded', () => {
        state!.tagRegistry = buildRegistry();
      });

      When('querying for tag "uses"', () => {
        state!.foundTag = state!.tagRegistry.metadataTags.find(
          (t: MetadataTagDefinitionForRegistry) => t.tag === 'uses'
        );
      });

      Then('the tag should exist', () => {
        expect(state!.foundTag).toBeDefined();
      });

      And('the tag format should be "csv"', () => {
        expect(state!.foundTag?.format).toBe('csv');
      });

      And('the tag purpose should mention "depends"', () => {
        expect(state!.foundTag?.purpose.toLowerCase()).toContain('depends');
      });
    });

    RuleScenario('Used-by tag exists in registry', ({ Given, When, Then, And }) => {
      state = initState();

      Given('the tag registry is loaded', () => {
        state!.tagRegistry = buildRegistry();
      });

      When('querying for tag "used-by"', () => {
        state!.foundTag = state!.tagRegistry.metadataTags.find(
          (t: MetadataTagDefinitionForRegistry) => t.tag === 'used-by'
        );
      });

      Then('the tag should exist', () => {
        expect(state!.foundTag).toBeDefined();
      });

      And('the tag format should be "csv"', () => {
        expect(state!.foundTag?.format).toBe('csv');
      });

      And('the tag purpose should mention "depend"', () => {
        expect(state!.foundTag?.purpose.toLowerCase()).toContain('depend');
      });
    });
  });

  // ===========================================================================
  // RULE 2: Single Uses Value
  // ===========================================================================

  Rule('Uses tag is extracted from TypeScript files', ({ RuleScenario }) => {
    RuleScenario('Single uses value extracted', ({ Given, When, Then }) => {
      state = initState();

      Given('a TypeScript file with content:', (_ctx: unknown, docString: string) => {
        state!.sourceCode = docString;
      });

      When('the AST parser extracts metadata', () => {
        const result = parseFileDirectives(state!.sourceCode, '/test/file.ts');
        if (Result.isOk(result) && result.value.directives.length > 0) {
          state!.extractedDirective = result.value.directives[0].directive;
        }
      });

      Then('the directive should have uses "ServiceB"', () => {
        expect(state!.extractedDirective).not.toBeNull();
        expect(state!.extractedDirective?.uses).toContain('ServiceB');
      });
    });

    RuleScenario('Multiple uses values extracted as CSV', ({ Given, When, Then }) => {
      state = initState();

      Given('a TypeScript file with content:', (_ctx: unknown, docString: string) => {
        state!.sourceCode = docString;
      });

      When('the AST parser extracts metadata', () => {
        const result = parseFileDirectives(state!.sourceCode, '/test/file.ts');
        if (Result.isOk(result) && result.value.directives.length > 0) {
          state!.extractedDirective = result.value.directives[0].directive;
        }
      });

      Then('the directive should have uses "ServiceA, ServiceB, ServiceC"', () => {
        expect(state!.extractedDirective).not.toBeNull();
        expect(state!.extractedDirective?.uses).toContain('ServiceA');
        expect(state!.extractedDirective?.uses).toContain('ServiceB');
        expect(state!.extractedDirective?.uses).toContain('ServiceC');
      });
    });
  });

  // ===========================================================================
  // RULE 3: Used-by Extraction
  // ===========================================================================

  Rule('Used-by tag is extracted from TypeScript files', ({ RuleScenario }) => {
    RuleScenario('Single used-by value extracted', ({ Given, When, Then }) => {
      state = initState();

      Given('a TypeScript file with content:', (_ctx: unknown, docString: string) => {
        state!.sourceCode = docString;
      });

      When('the AST parser extracts metadata', () => {
        const result = parseFileDirectives(state!.sourceCode, '/test/file.ts');
        if (Result.isOk(result) && result.value.directives.length > 0) {
          state!.extractedDirective = result.value.directives[0].directive;
        }
      });

      Then('the directive should have usedBy "HighLevelOrchestrator"', () => {
        expect(state!.extractedDirective).not.toBeNull();
        expect(state!.extractedDirective?.usedBy).toContain('HighLevelOrchestrator');
      });
    });

    RuleScenario('Multiple used-by values extracted as CSV', ({ Given, When, Then }) => {
      state = initState();

      Given('a TypeScript file with content:', (_ctx: unknown, docString: string) => {
        state!.sourceCode = docString;
      });

      When('the AST parser extracts metadata', () => {
        const result = parseFileDirectives(state!.sourceCode, '/test/file.ts');
        if (Result.isOk(result) && result.value.directives.length > 0) {
          state!.extractedDirective = result.value.directives[0].directive;
        }
      });

      Then('the directive should have usedBy "ServiceA, ServiceB"', () => {
        expect(state!.extractedDirective).not.toBeNull();
        expect(state!.extractedDirective?.usedBy).toContain('ServiceA');
        expect(state!.extractedDirective?.usedBy).toContain('ServiceB');
      });
    });
  });

  // ===========================================================================
  // RULE 4: Relationship Index Building
  // ===========================================================================

  Rule('Uses relationships are stored in relationship index', ({ RuleScenario }) => {
    RuleScenario(
      'Uses relationships stored in relationship index',
      ({ Given, When, Then, And }) => {
        state = initState();

        Given('patterns with uses relationships:', (_ctx: unknown, table: unknown) => {
          // DataTable format: { name, uses }
          const rows = table as Array<{ name: string; uses: string }>;
          state!.patterns = rows.map((row) =>
            createTestPattern(row.name, {
              patternName: row.name,
              uses: row.uses ? [row.uses] : undefined,
            })
          );
        });

        And('a pattern "ServiceB" exists', () => {
          state!.patterns.push(
            createTestPattern('ServiceB', {
              patternName: 'ServiceB',
            })
          );
        });

        When('the relationship index is built', () => {
          const tagRegistry = createDefaultTagRegistry();
          const dataset = transformToMasterDataset({
            patterns: state!.patterns,
            tagRegistry,
          });
          state!.relationshipIndex = dataset.relationshipIndex ?? {};
        });

        Then('"ServiceA" should have uses containing "ServiceB"', () => {
          const entry = state!.relationshipIndex['ServiceA'];
          expect(entry).toBeDefined();
          expect(entry?.uses).toContain('ServiceB');
        });

        And('"ServiceC" should have uses containing "ServiceB"', () => {
          const entry = state!.relationshipIndex['ServiceC'];
          expect(entry?.uses).toContain('ServiceB');
        });
      }
    );

    RuleScenario('UsedBy relationships stored explicitly', ({ Given, When, Then, And }) => {
      state = initState();

      Given('a pattern "ServiceB" with usedBy "ServiceA, ServiceC"', () => {
        state!.patterns = [
          createTestPattern('ServiceB', {
            patternName: 'ServiceB',
            usedBy: ['ServiceA', 'ServiceC'],
          }),
        ];
      });

      When('the relationship index is built', () => {
        const tagRegistry = createDefaultTagRegistry();
        const dataset = transformToMasterDataset({
          patterns: state!.patterns,
          tagRegistry,
        });
        state!.relationshipIndex = dataset.relationshipIndex ?? {};
      });

      Then('"ServiceB" should have usedBy containing "ServiceA"', () => {
        const entry = state!.relationshipIndex['ServiceB'];
        expect(entry).toBeDefined();
        expect(entry?.usedBy).toContain('ServiceA');
      });

      And('"ServiceB" should have usedBy containing "ServiceC"', () => {
        const entry = state!.relationshipIndex['ServiceB'];
        expect(entry?.usedBy).toContain('ServiceC');
      });
    });
  });

  // ===========================================================================
  // RULE 5: Schema Validation
  // ===========================================================================

  Rule('Schemas validate uses field correctly', ({ RuleScenario }) => {
    RuleScenario('DocDirective schema accepts uses', ({ Given, When, Then }) => {
      state = initState();

      Given('a DocDirective with uses "Pattern1, Pattern2"', () => {
        state!.extractedDirective = {
          tags: [],
          description: '',
          examples: [],
          position: { startLine: 1, endLine: 10 },
          uses: ['Pattern1', 'Pattern2'],
        } as DocDirective;
      });

      When('validating against DocDirectiveSchema', () => {
        state!.validationResult = DocDirectiveSchema.safeParse(state!.extractedDirective);
      });

      Then('validation should pass', () => {
        expect(state!.validationResult.success).toBe(true);
      });
    });

    RuleScenario('RelationshipEntry schema accepts usedBy', ({ Given, When, Then }) => {
      state = initState();

      Given('a RelationshipEntry with usedBy "Pattern1, Pattern2"', () => {
        // Create a valid RelationshipEntry
        const entry: RelationshipEntry = {
          uses: [],
          usedBy: ['Pattern1', 'Pattern2'],
          dependsOn: [],
          enables: [],
          implementsPatterns: [],
          implementedBy: [],
          extendedBy: [],
          seeAlso: [],
          apiRef: [],
        };
        state!.validationResult = { success: false, data: entry };
      });

      When('validating against RelationshipEntrySchema', () => {
        state!.validationResult = RelationshipEntrySchema.safeParse(
          (state!.validationResult as { data: RelationshipEntry }).data
        );
      });

      Then('validation should pass', () => {
        expect(state!.validationResult.success).toBe(true);
      });
    });
  });
});
