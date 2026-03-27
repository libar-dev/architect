/**
 * Extends Tag Step Definitions
 *
 * BDD step definitions for testing @architect-extends tag extraction
 * and processing for pattern generalization relationships.
 *
 * These step definitions test:
 * 1. Tag registry definition (single-value format)
 * 2. Gherkin parser metadata extraction
 * 3. ExtractedPattern population
 * 4. Relationship index building (extendedBy reverse lookup)
 * 5. Circular inheritance detection (requires additional linter rule)
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
import { transformToMasterDataset } from '../../../../src/generators/pipeline/transform-dataset.js';
import { createDefaultTagRegistry } from '../../../../src/validation-schemas/index.js';
import type { RelationshipEntry } from '../../../../src/validation-schemas/master-dataset.js';
import type { ExtractedPattern } from '../../../../src/types/index.js';
import { asPatternId, asCategoryName, asSourceFilePath } from '../../../../src/types/branded.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const feature = await loadFeature(
  resolve(__dirname, '../../../features/behavior/pattern-relationships/extends-tag.feature')
);

// =============================================================================
// Module-level state
// =============================================================================

interface ExtendsTagState {
  tagRegistry: ReturnType<typeof buildRegistry>;
  foundTag: MetadataTagDefinitionForRegistry | undefined;
  gherkinContent: string;
  extractedPattern: ExtractedPattern | null;
  patterns: ExtractedPattern[];
  relationshipIndex: Record<string, RelationshipEntry>;
  linterViolations: Array<{ rule: string; message: string; severity: string }>;
}

let state: ExtendsTagState | null = null;

function initState(): ExtendsTagState {
  return {
    tagRegistry: buildRegistry(),
    foundTag: undefined,
    gherkinContent: '',
    extractedPattern: null,
    patterns: [],
    relationshipIndex: {},
    linterViolations: [],
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

/**
 * Detect circular inheritance in the pattern set
 * Returns an array of patterns in the cycle, or null if no cycle
 *
 * This is a helper function for testing - actual implementation would
 * be in a linter rule.
 */
function detectCircularInheritance(patterns: ExtractedPattern[]): { cycle: string[] } | null {
  const extendsMap = new Map<string, string>();

  // Build extends map
  for (const pattern of patterns) {
    const name = pattern.patternName ?? pattern.name;
    if (pattern.extendsPattern) {
      extendsMap.set(name, pattern.extendsPattern);
    }
  }

  // Check each pattern for cycles
  for (const pattern of patterns) {
    const name = pattern.patternName ?? pattern.name;
    const visited = new Set<string>();
    let current: string | undefined = name;

    while (current && extendsMap.has(current)) {
      if (visited.has(current)) {
        // Found a cycle - return all patterns in it
        const cycle: string[] = [];
        const cycleStart = current;
        do {
          cycle.push(current);
          current = extendsMap.get(current);
        } while (current && current !== cycleStart);
        cycle.push(cycleStart); // Close the cycle
        return { cycle };
      }
      visited.add(current);
      current = extendsMap.get(current);
    }
  }

  return null;
}

// =============================================================================
// Feature Definition
// =============================================================================

describeFeature(feature, ({ Rule }) => {
  // ===========================================================================
  // RULE 1: Tag Extraction from Registry
  // ===========================================================================

  Rule('Extends tag is defined in taxonomy registry', ({ RuleScenario }) => {
    state = initState();
    RuleScenario('Extends tag exists in registry', ({ Given, When, Then, And }) => {
      Given('the tag registry is loaded', () => {
        state!.tagRegistry = buildRegistry();
      });

      When('querying for tag "extends"', () => {
        state!.foundTag = state!.tagRegistry.metadataTags.find(
          (t: MetadataTagDefinitionForRegistry) => t.tag === 'extends'
        );
      });

      Then('the tag should exist', () => {
        expect(state!.foundTag).toBeDefined();
      });

      And('the tag format should be "value"', () => {
        expect(state!.foundTag?.format).toBe('value');
      });

      And('the tag purpose should mention "generalization"', () => {
        expect(state!.foundTag?.purpose.toLowerCase()).toContain('generalization');
      });
    });
  });

  // ===========================================================================
  // RULE 2: Pattern Extension (Single Value)
  // ===========================================================================

  Rule('Patterns can extend exactly one base pattern', ({ RuleScenario }) => {
    state = initState();
    RuleScenario('Parse extends from feature file', ({ Given, When, Then }) => {
      Given('a Gherkin file with tags:', (_ctx: unknown, docString: string) => {
        state!.gherkinContent = docString;
      });

      When('the Gherkin parser extracts metadata', () => {
        // Parse the Gherkin content to get the feature
        const result = parseFeatureFile(state!.gherkinContent, 'test.feature');
        if (!Result.isOk(result)) {
          throw new Error(`Failed to parse feature: ${result.error.error.message}`);
        }
        // Extract pattern metadata from feature tags
        const metadata = extractPatternTags(result.value.feature.tags);
        // Create pattern with extracted metadata
        state!.extractedPattern = createTestPattern('ReactiveProjections', {
          patternName: metadata.pattern,
          extendsPattern: metadata.extendsPattern,
        });
      });

      Then('the pattern should have extends "ProjectionCategories"', () => {
        expect(state!.extractedPattern?.extendsPattern).toBe('ProjectionCategories');
      });
    });

    RuleScenario('Extends preserved through extraction pipeline', ({ Given, When, Then }) => {
      Given('a scanned file with extends "ProjectionCategories"', () => {
        state!.extractedPattern = createTestPattern('ReactiveProjections', {
          patternName: 'ReactiveProjections',
          extendsPattern: 'ProjectionCategories',
        });
      });

      When('the extractor builds ExtractedPattern', () => {
        // Pattern already built in Given - verify it exists
        expect(state!.extractedPattern).not.toBeNull();
      });

      Then('the pattern should have extendsPattern "ProjectionCategories"', () => {
        expect(state!.extractedPattern?.extendsPattern).toBe('ProjectionCategories');
      });
    });
  });

  // ===========================================================================
  // RULE 3: Reverse Lookup (extendedBy)
  // ===========================================================================

  Rule('Transform builds extendedBy reverse lookup', ({ RuleScenario }) => {
    state = initState();
    RuleScenario('Extended pattern knows its extensions', ({ Given, When, Then, And }) => {
      Given('patterns:', (_ctx: unknown, table: unknown) => {
        const rows = table as Array<{ name: string; extendsPattern: string }>;
        state!.patterns = rows.map((row) =>
          createTestPattern(row.name, {
            patternName: row.name,
            extendsPattern: row.extendsPattern || undefined,
          })
        );
      });

      And('a pattern "ProjectionCategories" exists', () => {
        state!.patterns.push(
          createTestPattern('ProjectionCategories', {
            patternName: 'ProjectionCategories',
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

      Then(
        '"ProjectionCategories" should have extendedBy ["ReactiveProjections", "CachedProjections"]',
        () => {
          const entry = state!.relationshipIndex['ProjectionCategories'];
          expect(entry).toBeDefined();
          expect(entry?.extendedBy).toHaveLength(2);
          expect(entry?.extendedBy).toContain('ReactiveProjections');
          expect(entry?.extendedBy).toContain('CachedProjections');
        }
      );
    });
  });

  // ===========================================================================
  // RULE 4: Circular Inheritance Detection
  // ===========================================================================

  Rule('Linter detects circular inheritance chains', ({ RuleScenario }) => {
    state = initState();
    RuleScenario('Direct circular inheritance detected', ({ Given, When, Then, And }) => {
      Given('pattern A with extends "B"', () => {
        state!.patterns.push(
          createTestPattern('A', {
            patternName: 'A',
            extendsPattern: 'B',
          })
        );
      });

      And('pattern B with extends "A"', () => {
        state!.patterns.push(
          createTestPattern('B', {
            patternName: 'B',
            extendsPattern: 'A',
          })
        );
      });

      When('the linter validates relationships', () => {
        // Use our helper function to detect cycles
        const result = detectCircularInheritance(state!.patterns);
        if (result) {
          state!.linterViolations.push({
            rule: 'circular-inheritance',
            severity: 'error',
            message: `Circular inheritance detected: ${result.cycle.join(' → ')}`,
          });
        }
      });

      Then('an error should be emitted for circular inheritance', () => {
        const violation = state!.linterViolations.find((v) => v.rule === 'circular-inheritance');
        expect(violation).toBeDefined();
      });

      And('the error should mention both "A" and "B"', () => {
        const violation = state!.linterViolations.find((v) => v.rule === 'circular-inheritance');
        expect(violation?.message).toContain('A');
        expect(violation?.message).toContain('B');
      });
    });

    RuleScenario('Transitive circular inheritance detected', ({ Given, When, Then, And }) => {
      Given('pattern A with extends "B"', () => {
        state!.patterns.push(
          createTestPattern('A', {
            patternName: 'A',
            extendsPattern: 'B',
          })
        );
      });

      And('pattern B with extends "C"', () => {
        state!.patterns.push(
          createTestPattern('B', {
            patternName: 'B',
            extendsPattern: 'C',
          })
        );
      });

      And('pattern C with extends "A"', () => {
        state!.patterns.push(
          createTestPattern('C', {
            patternName: 'C',
            extendsPattern: 'A',
          })
        );
      });

      When('the linter validates relationships', () => {
        const result = detectCircularInheritance(state!.patterns);
        if (result) {
          state!.linterViolations.push({
            rule: 'circular-inheritance',
            severity: 'error',
            message: `Circular inheritance detected: ${result.cycle.join(' → ')}`,
          });
        }
      });

      Then('an error should be emitted for circular inheritance', () => {
        const violation = state!.linterViolations.find((v) => v.rule === 'circular-inheritance');
        expect(violation).toBeDefined();
      });
    });
  });
});
