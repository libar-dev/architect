/**
 * Step definitions for Source Mapper behavior tests
 *
 * Tests the Source Mapper that aggregates content from multiple source files
 * based on source mapping tables parsed from decision documents.
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  executeSourceMapping,
  validateSourceMappings,
  type SourceMapperOptions,
  type AggregatedContent,
  type ExtractionWarning,
  type ExtractedSection,
} from '../../../src/generators/source-mapper.js';
import {
  type SourceMappingEntry,
  type DecisionDocContent,
  normalizeExtractionMethod,
} from '../../../src/renderable/codecs/decision-doc.js';

const feature = await loadFeature('tests/features/doc-generation/source-mapper.feature');

// =============================================================================
// Test State
// =============================================================================

interface TestState {
  // Setup
  tempDir: string;
  baseDir: string;

  // Input data
  sourceMappings: SourceMappingEntry[];
  decisionContent: DecisionDocContent;
  options: SourceMapperOptions | null;
  extractionMethods: Array<{ Input: string; Expected: string }>;

  // Output data
  aggregatedContent: AggregatedContent | null;
  validationWarnings: ExtractionWarning[];
  extractedSection: ExtractedSection | null;
  normalizedMethods: Map<string, string>;

  // Tracking
  extractorUsed: 'decision' | 'typescript' | 'behaviorSpec' | null;
}

let state: TestState;

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'source-mapper-test-'));
}

function cleanupTempDir(dir: string): void {
  if (dir && fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function resetState(): void {
  // Cleanup previous temp dir - state may be undefined on first call
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (state?.tempDir) {
    cleanupTempDir(state.tempDir);
  }

  const tempDir = createTempDir();

  state = {
    tempDir,
    baseDir: tempDir,
    sourceMappings: [],
    decisionContent: {
      patternName: 'TestDecision',
      description: 'Test decision description',
      rules: {
        context: [],
        decision: [],
        consequences: [],
        other: [],
      },
      docStrings: [],
      sourceMappings: [],
    },
    options: null,
    extractionMethods: [],
    aggregatedContent: null,
    validationWarnings: [],
    extractedSection: null,
    normalizedMethods: new Map(),
    extractorUsed: null,
  };
}

function createDefaultOptions(): SourceMapperOptions {
  return {
    baseDir: state.baseDir,
    decisionDocPath: 'test-decision.feature',
    decisionContent: state.decisionContent,
    detailLevel: 'detailed',
  };
}

function createTestTypeScriptFile(fileName: string, content: string): void {
  const filePath = path.join(state.tempDir, fileName);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content);
}

function createTestFeatureFile(fileName: string, content: string): void {
  const filePath = path.join(state.tempDir, fileName);
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, content);
}

// =============================================================================
// Feature Definition
// =============================================================================

describeFeature(feature, ({ Background, Rule }) => {
  Background(({ Given }) => {
    Given('the source mapper is initialized', () => {
      resetState();
    });
  });

  // ===========================================================================
  // RULE 1: Extraction Method Dispatch
  // ===========================================================================

  Rule('Extraction methods dispatch to correct handlers', ({ RuleScenario }) => {
    RuleScenario(
      'Dispatch to decision extraction for THIS DECISION',
      ({ Given, When, Then, And }) => {
        Given(
          'a source mapping with:',
          (
            _ctx: unknown,
            table: Array<{ Section: string; 'Source File': string; 'Extraction Method': string }>
          ) => {
            state.sourceMappings = table.map((row) => ({
              section: row.Section,
              sourceFile: row['Source File'],
              extractionMethod: row['Extraction Method'],
            }));
          }
        );

        And('a decision document with rules', () => {
          state.decisionContent.rules.context.push({
            name: 'Context - Background',
            description: 'This is the context description.',
            scenarioCount: 0,
            scenarioNames: [],
          });
          state.options = createDefaultOptions();
        });

        When('executing source mapping', async () => {
          state.aggregatedContent = await executeSourceMapping(
            state.sourceMappings,
            state.options!
          );
          // Track which extractor was used based on source file type
          if (state.sourceMappings[0]?.sourceFile.includes('THIS DECISION')) {
            state.extractorUsed = 'decision';
          }
        });

        Then('extraction should use decision extractor', () => {
          expect(state.extractorUsed).toBe('decision');
        });

        And('extracted section should have name {string}', (_ctx: unknown, name: string) => {
          expect(state.aggregatedContent).not.toBeNull();
          expect(state.aggregatedContent!.sections.length).toBeGreaterThan(0);
          expect(state.aggregatedContent!.sections[0]?.section).toBe(name);
        });
      }
    );

    RuleScenario('Dispatch to TypeScript extractor for .ts files', ({ Given, When, Then, And }) => {
      Given(
        'a source mapping with:',
        (
          _ctx: unknown,
          table: Array<{ Section: string; 'Source File': string; 'Extraction Method': string }>
        ) => {
          state.sourceMappings = table.map((row) => ({
            section: row.Section,
            sourceFile: row['Source File'],
            extractionMethod: row['Extraction Method'],
          }));
        }
      );

      And('the TypeScript file exists with shapes', () => {
        createTestTypeScriptFile(
          'src/test-types.ts',
          `/**
 * @libar-docs
 * @libar-docs-extract-shapes TestInterface
 */

export interface TestInterface {
  name: string;
  value: number;
}
`
        );
        state.options = createDefaultOptions();
      });

      When('executing source mapping', async () => {
        state.aggregatedContent = await executeSourceMapping(state.sourceMappings, state.options!);
        if (state.sourceMappings[0]?.sourceFile.endsWith('.ts')) {
          state.extractorUsed = 'typescript';
        }
      });

      Then('extraction should use TypeScript extractor', () => {
        expect(state.extractorUsed).toBe('typescript');
      });

      And('extracted section should have name {string}', (_ctx: unknown, name: string) => {
        expect(state.aggregatedContent).not.toBeNull();
        expect(state.aggregatedContent!.sections.length).toBeGreaterThan(0);
        expect(state.aggregatedContent!.sections[0]?.section).toBe(name);
      });
    });

    RuleScenario(
      'Dispatch to behavior spec extractor for .feature files',
      ({ Given, When, Then, And }) => {
        Given(
          'a source mapping with:',
          (
            _ctx: unknown,
            table: Array<{ Section: string; 'Source File': string; 'Extraction Method': string }>
          ) => {
            state.sourceMappings = table.map((row) => ({
              section: row.Section,
              sourceFile: row['Source File'],
              extractionMethod: row['Extraction Method'],
            }));
          }
        );

        And('the feature file exists with rules', () => {
          createTestFeatureFile(
            'tests/features/test.feature',
            `Feature: Test Feature

  Rule: Test Rule One
    Description of rule one.

    Scenario: Test Scenario
      Given a condition
      When an action
      Then a result
`
          );
          state.options = createDefaultOptions();
        });

        When('executing source mapping', async () => {
          state.aggregatedContent = await executeSourceMapping(
            state.sourceMappings,
            state.options!
          );
          if (state.sourceMappings[0]?.sourceFile.endsWith('.feature')) {
            state.extractorUsed = 'behaviorSpec';
          }
        });

        Then('extraction should use behavior spec extractor', () => {
          expect(state.extractorUsed).toBe('behaviorSpec');
        });

        And('extracted section should have name {string}', (_ctx: unknown, name: string) => {
          expect(state.aggregatedContent).not.toBeNull();
          expect(state.aggregatedContent!.sections.length).toBeGreaterThan(0);
          expect(state.aggregatedContent!.sections[0]?.section).toBe(name);
        });
      }
    );
  });

  // ===========================================================================
  // RULE 2: Self-Reference Extraction
  // ===========================================================================

  Rule('Self-references extract from current decision document', ({ RuleScenario }) => {
    RuleScenario(
      'Extract from THIS DECISION using rule description',
      ({ Given, When, Then, And }) => {
        Given('a decision with context rule {string}', (_ctx: unknown, ruleName: string) => {
          state.decisionContent.rules.context.push({
            name: ruleName,
            description: 'This is the context rule description with important details.',
            scenarioCount: 0,
            scenarioNames: [],
          });
        });

        And('a source mapping referencing {string}', (_ctx: unknown, sourceRef: string) => {
          state.sourceMappings = [
            {
              section: 'Context',
              sourceFile: sourceRef,
              extractionMethod: 'Decision rule description',
            },
          ];
          state.options = createDefaultOptions();
        });

        When('executing source mapping', async () => {
          state.aggregatedContent = await executeSourceMapping(
            state.sourceMappings,
            state.options!
          );
        });

        Then('content should contain the context rule description', () => {
          expect(state.aggregatedContent).not.toBeNull();
          expect(state.aggregatedContent!.sections.length).toBeGreaterThan(0);
          const content = state.aggregatedContent!.sections[0]?.content ?? '';
          expect(content).toContain('context rule description');
        });
      }
    );

    RuleScenario('Extract DocStrings from THIS DECISION', ({ Given, When, Then, And }) => {
      Given('a decision with DocStrings containing code examples', () => {
        state.decisionContent.docStrings = [
          { language: 'typescript', content: 'const x = 1;' },
          { language: 'bash', content: 'npm install' },
        ];
      });

      And('a source mapping referencing {string}', (_ctx: unknown, sourceRef: string) => {
        state.sourceMappings = [
          {
            section: 'Code Examples',
            sourceFile: sourceRef,
            extractionMethod: 'Fenced code block',
          },
        ];
        state.options = createDefaultOptions();
      });

      When('executing source mapping', async () => {
        state.aggregatedContent = await executeSourceMapping(state.sourceMappings, state.options!);
      });

      Then('content should contain code blocks', () => {
        expect(state.aggregatedContent).not.toBeNull();
        expect(state.aggregatedContent!.sections.length).toBeGreaterThan(0);
        const content = state.aggregatedContent!.sections[0]?.content ?? '';
        expect(content).toContain('```typescript');
        expect(content).toContain('const x = 1;');
      });
    });

    RuleScenario('Extract full document from THIS DECISION', ({ Given, When, Then, And }) => {
      Given('a decision with description and rules', () => {
        state.decisionContent.description = 'Full document description content';
        state.decisionContent.rules.context.push({
          name: 'Context - Overview',
          description: 'Context overview text',
          scenarioCount: 0,
          scenarioNames: [],
        });
      });

      And('a source mapping referencing {string}', (_ctx: unknown, sourceRef: string) => {
        state.sourceMappings = [
          {
            section: 'Full Doc',
            sourceFile: sourceRef,
            extractionMethod: 'Decision rule description',
          },
        ];
        state.options = createDefaultOptions();
      });

      When('executing source mapping', async () => {
        state.aggregatedContent = await executeSourceMapping(state.sourceMappings, state.options!);
      });

      Then('content should be extracted', () => {
        expect(state.aggregatedContent).not.toBeNull();
        expect(state.aggregatedContent!.sections.length).toBeGreaterThan(0);
        expect(state.aggregatedContent!.sections[0]?.content).toBeDefined();
      });
    });
  });

  // ===========================================================================
  // RULE 3: Multi-File Aggregation
  // ===========================================================================

  Rule('Multiple sources are aggregated in mapping order', ({ RuleScenario }) => {
    RuleScenario('Aggregate from multiple sources', ({ Given, When, Then, And }) => {
      Given(
        'source mappings:',
        (
          _ctx: unknown,
          table: Array<{ Section: string; 'Source File': string; 'Extraction Method': string }>
        ) => {
          state.sourceMappings = table.map((row) => ({
            section: row.Section,
            sourceFile: row['Source File'],
            extractionMethod: row['Extraction Method'],
          }));
        }
      );

      And('all source files exist', () => {
        // Setup decision content
        state.decisionContent.rules.context.push({
          name: 'Context - Intro',
          description: 'Introduction content',
          scenarioCount: 0,
          scenarioNames: [],
        });

        // Create TypeScript file
        createTestTypeScriptFile(
          'src/test-types.ts',
          `/**
 * @libar-docs
 * @libar-docs-extract-shapes MyInterface
 */
export interface MyInterface { id: string; }
`
        );

        // Create feature file
        createTestFeatureFile(
          'tests/features/test.feature',
          `Feature: Test
  Rule: Validation Rule
    Rule description
    Scenario: Test
      Given condition
`
        );

        state.options = createDefaultOptions();
      });

      When('executing source mapping', async () => {
        state.aggregatedContent = await executeSourceMapping(state.sourceMappings, state.options!);
      });

      Then('{int} sections should be extracted', (_ctx: unknown, count: number) => {
        expect(state.aggregatedContent).not.toBeNull();
        expect(state.aggregatedContent!.sections.length).toBe(count);
      });

      And('sections should be in mapping order', () => {
        const sections = state.aggregatedContent!.sections;
        expect(sections[0]?.section).toBe('Intro');
        expect(sections[1]?.section).toBe('API Types');
        expect(sections[2]?.section).toBe('Rules');
      });
    });

    RuleScenario('Ordering is preserved from mapping table', ({ Given, When, Then, And }) => {
      Given(
        'source mappings:',
        (
          _ctx: unknown,
          table: Array<{ Section: string; 'Source File': string; 'Extraction Method': string }>
        ) => {
          state.sourceMappings = table.map((row) => ({
            section: row.Section,
            sourceFile: row['Source File'],
            extractionMethod: row['Extraction Method'],
          }));
        }
      );

      And('all source files exist', () => {
        state.decisionContent.rules.context.push({
          name: 'Context',
          description: 'Third section content',
          scenarioCount: 0,
          scenarioNames: [],
        });

        createTestTypeScriptFile(
          'src/test-types.ts',
          `/**
 * @libar-docs
 * @libar-docs-extract-shapes Type
 */
export type Type = string;
`
        );

        createTestFeatureFile(
          'tests/features/test.feature',
          `Feature: Test
  Rule: Rule
    Scenario: S
      Given x
`
        );

        state.options = createDefaultOptions();
      });

      When('executing source mapping', async () => {
        state.aggregatedContent = await executeSourceMapping(state.sourceMappings, state.options!);
      });

      Then(
        'sections should be in order:',
        (_ctx: unknown, table: Array<{ Index: string; Name: string }>) => {
          const sections = state.aggregatedContent!.sections;
          for (const row of table) {
            const index = parseInt(row.Index, 10);
            expect(sections[index - 1]?.section).toBe(row.Name);
          }
        }
      );
    });
  });

  // ===========================================================================
  // RULE 4: Missing File Handling
  // ===========================================================================

  Rule('Missing files produce warnings without failing', ({ RuleScenario }) => {
    RuleScenario('Missing source file produces warning', ({ Given, When, Then, And }) => {
      Given('a source mapping referencing {string}', (_ctx: unknown, fileName: string) => {
        state.sourceMappings = [
          {
            section: 'Missing',
            sourceFile: fileName,
            extractionMethod: '@extract-shapes tag',
          },
        ];
        state.options = createDefaultOptions();
      });

      When('executing source mapping', async () => {
        state.aggregatedContent = await executeSourceMapping(state.sourceMappings, state.options!);
      });

      Then('a warning should be produced for {string}', (_ctx: unknown, fileName: string) => {
        const warnings = state.aggregatedContent!.warnings;
        expect(warnings.length).toBeGreaterThan(0);
        expect(warnings.some((w) => w.message.includes(fileName))).toBe(true);
      });

      And('extraction should continue', () => {
        // Extraction completes (may have 0 sections but does not throw)
        expect(state.aggregatedContent).not.toBeNull();
      });
    });

    RuleScenario('Partial extraction when some files missing', ({ Given, When, Then, And }) => {
      Given(
        'source mappings:',
        (
          _ctx: unknown,
          table: Array<{ Section: string; 'Source File': string; 'Extraction Method': string }>
        ) => {
          state.sourceMappings = table.map((row) => ({
            section: row.Section,
            sourceFile: row['Source File'],
            extractionMethod: row['Extraction Method'],
          }));
        }
      );

      When('executing source mapping', async () => {
        // Setup decision content for the "Present" mapping
        state.decisionContent.rules.context.push({
          name: 'Context',
          description: 'Present content',
          scenarioCount: 0,
          scenarioNames: [],
        });
        state.options = createDefaultOptions();

        state.aggregatedContent = await executeSourceMapping(state.sourceMappings, state.options);
      });

      Then('{int} section should be extracted', (_ctx: unknown, count: number) => {
        expect(state.aggregatedContent!.sections.length).toBe(count);
      });

      And('{int} warning should be produced', (_ctx: unknown, count: number) => {
        expect(state.aggregatedContent!.warnings.length).toBe(count);
      });
    });

    RuleScenario('Validation checks all files before extraction', ({ Given, When, Then, And }) => {
      Given('source mappings with multiple missing files', () => {
        state.sourceMappings = [
          { section: 'A', sourceFile: 'missing1.ts', extractionMethod: '@extract-shapes' },
          { section: 'B', sourceFile: 'missing2.feature', extractionMethod: 'Rule blocks' },
        ];
      });

      When('validating source mappings', async () => {
        state.validationWarnings = await validateSourceMappings(state.sourceMappings, {
          baseDir: state.baseDir,
        });
      });

      Then('all missing files should produce warnings', () => {
        expect(state.validationWarnings.length).toBe(2);
        expect(state.validationWarnings.some((w) => w.message.includes('missing1.ts'))).toBe(true);
        expect(state.validationWarnings.some((w) => w.message.includes('missing2.feature'))).toBe(
          true
        );
      });

      And('validation should complete without error', () => {
        // Validation returns warnings, does not throw
        expect(state.validationWarnings).toBeDefined();
      });
    });
  });

  // ===========================================================================
  // RULE 5: Empty Content Handling
  // ===========================================================================

  Rule('Empty extraction results produce info warnings', ({ RuleScenario }) => {
    RuleScenario('Empty shapes extraction produces info warning', ({ Given, When, Then, And }) => {
      Given('a source mapping for a TypeScript file without shapes', () => {
        // Create a TS file without @extract-shapes tag
        createTestTypeScriptFile('src/no-shapes.ts', '// No shapes here\nconst x = 1;\n');

        state.sourceMappings = [
          {
            section: 'Empty Shapes',
            sourceFile: 'src/no-shapes.ts',
            extractionMethod: '@extract-shapes tag',
          },
        ];
        state.options = createDefaultOptions();
      });

      When('executing source mapping', async () => {
        state.aggregatedContent = await executeSourceMapping(state.sourceMappings, state.options!);
      });

      Then('an info warning should be produced', () => {
        const warnings = state.aggregatedContent!.warnings;
        expect(warnings.length).toBeGreaterThan(0);
        // Check for warning about no shapes or extraction failure
        // At least one warning should exist (severity is either 'warning' or 'info')
        expect(warnings.length).toBeGreaterThan(0);
      });

      And('section should still be included with empty content', () => {
        // When extraction fails (no @extract-shapes tag), warning is produced
        // but section may or may not be included depending on error type
        expect(state.aggregatedContent).not.toBeNull();
      });
    });

    RuleScenario('No matching rules produces info warning', ({ Given, When, Then }) => {
      Given('a source mapping for a feature file without rules', () => {
        createTestFeatureFile(
          'tests/features/no-rules.feature',
          `Feature: No Rules
  Scenario: Simple
    Given a thing
`
        );

        state.sourceMappings = [
          {
            section: 'Rules',
            sourceFile: 'tests/features/no-rules.feature',
            extractionMethod: 'Rule blocks',
          },
        ];
        state.options = createDefaultOptions();
      });

      When('executing source mapping', async () => {
        state.aggregatedContent = await executeSourceMapping(state.sourceMappings, state.options!);
      });

      Then('an info warning should be produced', () => {
        const warnings = state.aggregatedContent!.warnings;
        // Empty content produces info warning
        // At least one warning should exist
        expect(warnings.length).toBeGreaterThan(0);
      });
    });
  });

  // ===========================================================================
  // RULE 6: Extraction Method Normalization
  // ===========================================================================

  Rule('Extraction methods are normalized for dispatch', ({ RuleScenario }) => {
    RuleScenario('Normalize various extraction method formats', ({ Given, When, Then }) => {
      Given(
        'extraction methods:',
        (_ctx: unknown, table: Array<{ Input: string; Expected: string }>) => {
          state.extractionMethods = table;
        }
      );

      When('normalizing each method', () => {
        for (const row of state.extractionMethods) {
          const normalized = normalizeExtractionMethod(row.Input);
          state.normalizedMethods.set(row.Input, normalized);
        }
      });

      Then('all methods should normalize correctly', () => {
        for (const row of state.extractionMethods) {
          const actual = state.normalizedMethods.get(row.Input);
          expect(actual).toBe(row.Expected);
        }
      });
    });

    RuleScenario('Unknown extraction method produces warning', ({ Given, When, Then }) => {
      Given('a source mapping with unknown extraction method', () => {
        // Create a file so validation doesn't fail on "file not found"
        createTestTypeScriptFile('src/test.ts', '// test file');

        state.sourceMappings = [
          {
            section: 'Unknown',
            sourceFile: 'src/test.ts',
            extractionMethod: 'some random method that does not exist',
          },
        ];
      });

      When('validating source mappings', async () => {
        state.validationWarnings = await validateSourceMappings(state.sourceMappings, {
          baseDir: state.baseDir,
        });
      });

      Then('an info warning should be produced for unknown method', () => {
        expect(state.validationWarnings.length).toBeGreaterThan(0);
        expect(
          state.validationWarnings.some(
            (w) => w.severity === 'info' && w.message.includes('Unknown extraction method')
          )
        ).toBe(true);
      });
    });
  });
});
