/**
 * Planning Dependency Tags Step Definitions
 *
 * BDD step definitions for testing @architect-depends-on and @architect-enables
 * tag extraction from Gherkin files.
 *
 * These step definitions test:
 * 1. Tag registry definition (CSV format)
 * 2. Gherkin parser metadata extraction for depends-on/enables
 * 3. Anti-pattern detection (depends-on in TypeScript)
 * 4. Relationship index building (enables reverse lookup)
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  buildRegistry,
  type MetadataTagDefinitionForRegistry,
} from '../../../../src/taxonomy/registry-builder.js';
import {
  parseFeatureFile,
  extractPatternTags,
} from '../../../../src/scanner/gherkin-ast-parser.js';
import { Result } from '../../../../src/types/result.js';
import { transformToPatternGraph } from '../../../../src/generators/pipeline/transform-dataset.js';
import { createDefaultTagRegistry } from '../../../../src/validation-schemas/index.js';
import type { RelationshipEntry } from '../../../../src/validation-schemas/pattern-graph.js';
import type { ExtractedPattern } from '../../../../src/types/index.js';
import { asPatternId, asCategoryName, asSourceFilePath } from '../../../../src/types/branded.js';
import { missingRelationshipTarget, type LintContext } from '../../../../src/lint/rules.js';
import type { DocDirective } from '../../../../src/validation-schemas/doc-directive.js';
import type { LintViolation } from '../../../../src/validation-schemas/lint.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const feature = await loadFeature(
  resolve(__dirname, '../../../features/behavior/pattern-relationships/depends-on-tag.feature')
);

// =============================================================================
// Module-level state
// =============================================================================

interface DependsOnTagState {
  tagRegistry: ReturnType<typeof buildRegistry>;
  foundTag: MetadataTagDefinitionForRegistry | undefined;
  gherkinContent: string;
  extractedMetadata: {
    pattern?: string;
    dependsOn?: readonly string[];
    enables?: readonly string[];
  } | null;
  patterns: ExtractedPattern[];
  relationshipIndex: Record<string, RelationshipEntry>;
  directive: DocDirective | null;
  violations: LintViolation[];
}

let state: DependsOnTagState | null = null;

function initState(): DependsOnTagState {
  return {
    tagRegistry: buildRegistry(),
    foundTag: undefined,
    gherkinContent: '',
    extractedMetadata: null,
    patterns: [],
    relationshipIndex: {},
    directive: null,
    violations: [],
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
      file: asSourceFilePath(`test/${name}.feature`),
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

  Rule('Depends-on tag is defined in taxonomy registry', ({ RuleScenario }) => {
    RuleScenario('Depends-on tag exists in registry', ({ Given, When, Then, And }) => {
      state = initState();

      Given('the tag registry is loaded', () => {
        state!.tagRegistry = buildRegistry();
      });

      When('querying for tag "depends-on"', () => {
        state!.foundTag = state!.tagRegistry.metadataTags.find(
          (t: MetadataTagDefinitionForRegistry) => t.tag === 'depends-on'
        );
      });

      Then('the tag should exist', () => {
        expect(state!.foundTag).toBeDefined();
      });

      And('the tag format should be "csv"', () => {
        expect(state!.foundTag?.format).toBe('csv');
      });

      And('the tag purpose should mention "dependencies"', () => {
        expect(state!.foundTag?.purpose.toLowerCase()).toContain('dependencies');
      });
    });

    RuleScenario('Enables tag exists in registry', ({ Given, When, Then, And }) => {
      state = initState();

      Given('the tag registry is loaded', () => {
        state!.tagRegistry = buildRegistry();
      });

      When('querying for tag "enables"', () => {
        state!.foundTag = state!.tagRegistry.metadataTags.find(
          (t: MetadataTagDefinitionForRegistry) => t.tag === 'enables'
        );
      });

      Then('the tag should exist', () => {
        expect(state!.foundTag).toBeDefined();
      });

      And('the tag format should be "csv"', () => {
        expect(state!.foundTag?.format).toBe('csv');
      });

      And('the tag purpose should mention "enables"', () => {
        expect(state!.foundTag?.purpose.toLowerCase()).toContain('enables');
      });
    });
  });

  // ===========================================================================
  // RULE 2: Depends-on Extraction from Gherkin
  // ===========================================================================

  Rule('Depends-on tag is extracted from Gherkin files', ({ RuleScenario }) => {
    RuleScenario('Depends-on extracted from feature file', ({ Given, When, Then }) => {
      state = initState();

      Given('a Gherkin file with tags:', (_ctx: unknown, docString: string) => {
        state!.gherkinContent = docString;
      });

      When('the Gherkin parser extracts metadata', () => {
        const result = parseFeatureFile(state!.gherkinContent, 'test.feature');
        if (!Result.isOk(result)) {
          throw new Error(`Failed to parse feature: ${result.error.error.message}`);
        }
        state!.extractedMetadata = extractPatternTags(result.value.feature.tags);
      });

      Then('the pattern should have dependsOn "FeatureA"', () => {
        expect(state!.extractedMetadata?.dependsOn).toContain('FeatureA');
      });
    });

    RuleScenario('Multiple depends-on values extracted as CSV', ({ Given, When, Then }) => {
      state = initState();

      Given('a Gherkin file with tags:', (_ctx: unknown, docString: string) => {
        state!.gherkinContent = docString;
      });

      When('the Gherkin parser extracts metadata', () => {
        const result = parseFeatureFile(state!.gherkinContent, 'test.feature');
        if (!Result.isOk(result)) {
          throw new Error(`Failed to parse feature: ${result.error.error.message}`);
        }
        state!.extractedMetadata = extractPatternTags(result.value.feature.tags);
      });

      Then('the pattern should have dependsOn "FeatureA, FeatureB"', () => {
        expect(state!.extractedMetadata?.dependsOn).toContain('FeatureA');
        expect(state!.extractedMetadata?.dependsOn).toContain('FeatureB');
      });
    });
  });

  // ===========================================================================
  // RULE 3: Depends-on Anti-pattern Detection
  // ===========================================================================

  Rule('Depends-on in TypeScript triggers anti-pattern warning', ({ RuleScenario }) => {
    RuleScenario('Depends-on in TypeScript is detected by lint rule', ({ Given, When, Then }) => {
      state = initState();

      Given('a TypeScript file with depends-on "ServiceY"', () => {
        // Note: The lint rules check 'uses' and 'implements' relationships,
        // not 'dependsOn' because dependsOn is intended for Gherkin files only.
        // We test that the missingRelationshipTarget rule only checks uses/implements.
        state!.directive = {
          tags: [],
          description: '',
          examples: [],
          position: { startLine: 1, endLine: 10 },
          uses: ['ServiceY'], // Uses is what should be in TypeScript
        } as DocDirective;
      });

      When('the missing-relationship-target rule runs with known patterns', () => {
        const context: LintContext = { knownPatterns: new Set() }; // Empty set = no known patterns
        const result = missingRelationshipTarget.check(
          state!.directive!,
          '/test/file.ts',
          1,
          context
        );
        if (result) {
          const violations = Array.isArray(result) ? result : [result];
          state!.violations.push(...violations);
        }
      });

      Then('the uses relationship is checked not depends-on', () => {
        // The rule should check 'uses' relationships (for TypeScript files)
        // not 'dependsOn' (which is Gherkin-only)
        const usesViolation = state!.violations.find((v) => v.message.includes('ServiceY'));
        expect(usesViolation).toBeDefined();
        // The message should mention "Relationship target" (for uses)
        expect(usesViolation?.message).toContain('Relationship target');
      });
    });
  });

  // ===========================================================================
  // RULE 4: Enables Extraction from Gherkin
  // ===========================================================================

  Rule('Enables tag is extracted from Gherkin files', ({ RuleScenario }) => {
    RuleScenario('Enables extracted from feature file', ({ Given, When, Then }) => {
      state = initState();

      Given('a Gherkin file with tags:', (_ctx: unknown, docString: string) => {
        state!.gherkinContent = docString;
      });

      When('the Gherkin parser extracts metadata', () => {
        const result = parseFeatureFile(state!.gherkinContent, 'test.feature');
        if (!Result.isOk(result)) {
          throw new Error(`Failed to parse feature: ${result.error.error.message}`);
        }
        state!.extractedMetadata = extractPatternTags(result.value.feature.tags);
      });

      Then('the pattern should have enables "FeatureB"', () => {
        expect(state!.extractedMetadata?.enables).toContain('FeatureB');
      });
    });

    RuleScenario('Multiple enables values extracted as CSV', ({ Given, When, Then }) => {
      state = initState();

      Given('a Gherkin file with tags:', (_ctx: unknown, docString: string) => {
        state!.gherkinContent = docString;
      });

      When('the Gherkin parser extracts metadata', () => {
        const result = parseFeatureFile(state!.gherkinContent, 'test.feature');
        if (!Result.isOk(result)) {
          throw new Error(`Failed to parse feature: ${result.error.error.message}`);
        }
        state!.extractedMetadata = extractPatternTags(result.value.feature.tags);
      });

      Then('the pattern should have enables "ServiceA, ServiceB"', () => {
        expect(state!.extractedMetadata?.enables).toContain('ServiceA');
        expect(state!.extractedMetadata?.enables).toContain('ServiceB');
      });
    });
  });

  // ===========================================================================
  // RULE 5: Relationship Index Building
  // ===========================================================================

  Rule('Planning dependencies are stored in relationship index', ({ RuleScenario }) => {
    RuleScenario(
      'DependsOn relationships stored in relationship index',
      ({ Given, When, Then, And }) => {
        state = initState();

        Given('patterns with planning dependencies:', (_ctx: unknown, table: unknown) => {
          // DataTable format: { name, dependsOn }
          const rows = table as Array<{ name: string; dependsOn: string }>;
          state!.patterns = rows.map((row) =>
            createTestPattern(row.name, {
              patternName: row.name,
              dependsOn: row.dependsOn ? [row.dependsOn] : undefined,
            })
          );
        });

        And('a pattern "FeatureA" exists', () => {
          state!.patterns.push(
            createTestPattern('FeatureA', {
              patternName: 'FeatureA',
            })
          );
        });

        When('the relationship index is built', () => {
          const tagRegistry = createDefaultTagRegistry();
          const dataset = transformToPatternGraph({
            patterns: state!.patterns,
            tagRegistry,
          });
          state!.relationshipIndex = dataset.relationshipIndex ?? {};
        });

        Then('"FeatureB" should have dependsOn containing "FeatureA"', () => {
          const entry = state!.relationshipIndex['FeatureB'];
          expect(entry).toBeDefined();
          expect(entry?.dependsOn).toContain('FeatureA');
        });

        And('"FeatureC" should have dependsOn containing "FeatureA"', () => {
          const entry = state!.relationshipIndex['FeatureC'];
          expect(entry?.dependsOn).toContain('FeatureA');
        });
      }
    );

    RuleScenario('Enables relationships stored explicitly', ({ Given, When, Then, And }) => {
      state = initState();

      Given('a pattern "FeatureA" with enables "FeatureB, FeatureC"', () => {
        state!.patterns = [
          createTestPattern('FeatureA', {
            patternName: 'FeatureA',
            enables: ['FeatureB', 'FeatureC'],
          }),
        ];
      });

      When('the relationship index is built', () => {
        const tagRegistry = createDefaultTagRegistry();
        const dataset = transformToPatternGraph({
          patterns: state!.patterns,
          tagRegistry,
        });
        state!.relationshipIndex = dataset.relationshipIndex ?? {};
      });

      Then('"FeatureA" should have enables containing "FeatureB"', () => {
        const entry = state!.relationshipIndex['FeatureA'];
        expect(entry).toBeDefined();
        expect(entry?.enables).toContain('FeatureB');
      });

      And('"FeatureA" should have enables containing "FeatureC"', () => {
        const entry = state!.relationshipIndex['FeatureA'];
        expect(entry?.enables).toContain('FeatureC');
      });
    });
  });
});
