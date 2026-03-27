/**
 * Step definitions for Decision Doc Generator behavior tests
 *
 * Tests the Decision Doc Generator that orchestrates documentation generation
 * from decision documents (ADR/PDR in .feature format).
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  determineOutputPaths,
  generateCompactOutput,
  generateDetailedOutput,
  generateFromDecision,
  generateFromDecisionMultiLevel,
  createDecisionDocGenerator,
  type GeneratedOutputPaths,
  type DecisionDocGeneratorResult,
} from '../../../src/generators/built-in/decision-doc-generator.js';
import type { DecisionDocContent } from '../../../src/renderable/codecs/decision-doc.js';
import type { RenderableDocument } from '../../../src/renderable/schema.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/index.js';
import type { AggregatedContent, ExtractedSection } from '../../../src/generators/source-mapper.js';
import { generatorRegistry } from '../../../src/generators/registry.js';
// Import to ensure generators are registered
import '../../../src/generators/built-in/codec-generators.js';

const feature = await loadFeature('tests/features/doc-generation/decision-doc-generator.feature');

// =============================================================================
// Test State
// =============================================================================

interface TestState {
  // Setup
  tempDir: string;
  baseDir: string;

  // Input data
  patternName: string;
  section: string | undefined;
  decisionContent: DecisionDocContent;
  aggregatedContent: AggregatedContent;
  pattern: ExtractedPattern | null;
  patterns: ExtractedPattern[];

  // Output data
  outputPaths: GeneratedOutputPaths | null;
  compactOutput: RenderableDocument | null;
  detailedOutput: RenderableDocument | null;
  generationResult: DecisionDocGeneratorResult | null;
  generatorOutput: {
    files: ReadonlyArray<{ path: string; content: string }>;
    errors?: ReadonlyArray<{ type: string; message: string }>;
  } | null;
}

let state: TestState;

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'decision-doc-gen-test-'));
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
    patternName: '',
    section: undefined,
    decisionContent: {
      patternName: 'TestPattern',
      description: '',
      rules: {
        context: [],
        decision: [],
        consequences: [],
        other: [],
      },
      docStrings: [],
      sourceMappings: [],
    },
    aggregatedContent: {
      sections: [],
      warnings: [],
      success: true,
    },
    pattern: null,
    patterns: [],
    outputPaths: null,
    compactOutput: null,
    detailedOutput: null,
    generationResult: null,
    generatorOutput: null,
  };
}

function createTestPattern(overrides?: {
  directive?: {
    patternName?: string;
    status?: 'roadmap' | 'active' | 'completed' | 'deferred';
    description?: string;
  };
  claudeSection?: string;
  rules?: Array<{
    name: string;
    description: string;
    scenarioCount: number;
    scenarioNames: string[];
  }>;
  name?: string;
  patternName?: string;
  skipPatternNameDefault?: boolean;
}): ExtractedPattern {
  // Only use default 'TestPattern' if not skipping defaults
  const directivePatternName = overrides?.directive?.patternName;
  const topLevelPatternName = overrides?.patternName;
  const effectivePatternName = overrides?.skipPatternNameDefault
    ? (directivePatternName ?? topLevelPatternName)
    : (directivePatternName ?? topLevelPatternName ?? 'TestPattern');
  const effectiveName = overrides?.name ?? effectivePatternName ?? 'TestPattern';

  return {
    id: 'pattern-12345678',
    name: effectiveName,
    category: 'core',
    directive: {
      tags: [],
      examples: [],
      position: { startLine: 1, endLine: 10 },
      patternName: effectivePatternName,
      status: overrides?.directive?.status ?? 'active',
      description: overrides?.directive?.description ?? 'Test description',
    },
    code: '',
    source: {
      file: path.join(state.tempDir, 'test.feature'),
      lines: [1, 10] as readonly [number, number],
    },
    exports: [],
    extractedAt: new Date().toISOString(),
    patternName: effectivePatternName,
    status: overrides?.directive?.status ?? 'active',
    ...(overrides?.claudeSection !== undefined && { claudeSection: overrides.claudeSection }),
    rules: overrides?.rules,
  } as ExtractedPattern;
}

function createTestTypeScriptFile(fileName: string, content: string): void {
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
    Given('the decision doc generator is initialized', () => {
      resetState();
    });
  });

  // ===========================================================================
  // RULE 1: Output Path Resolution
  // ===========================================================================

  Rule('Output paths are determined from pattern metadata', ({ RuleScenario }) => {
    RuleScenario('Default output paths for pattern', ({ Given, When, Then, And }) => {
      Given('pattern name {string}', (_ctx: unknown, name: string) => {
        state.patternName = name;
      });

      When('determining output paths', () => {
        state.outputPaths = determineOutputPaths(state.patternName, {
          section: state.section,
        });
      });

      Then('compact path should be {string}', (_ctx: unknown, expected: string) => {
        expect(state.outputPaths).not.toBeNull();
        expect(state.outputPaths!.compact).toBe(expected);
      });

      And('detailed path should contain {string}', (_ctx: unknown, substring: string) => {
        expect(state.outputPaths!.detailed).toContain(substring);
      });
    });

    RuleScenario('Custom section for compact output', ({ Given, When, Then, And }) => {
      Given('pattern name {string}', (_ctx: unknown, name: string) => {
        state.patternName = name;
      });

      And('section {string}', (_ctx: unknown, section: string) => {
        state.section = section;
      });

      When('determining output paths', () => {
        state.outputPaths = determineOutputPaths(state.patternName, {
          section: state.section,
        });
      });

      Then('compact path should be {string}', (_ctx: unknown, expected: string) => {
        expect(state.outputPaths).not.toBeNull();
        expect(state.outputPaths!.compact).toBe(expected);
      });
    });

    RuleScenario('CamelCase pattern converted to kebab-case', ({ Given, When, Then }) => {
      Given('pattern name {string}', (_ctx: unknown, name: string) => {
        state.patternName = name;
      });

      When('determining output paths', () => {
        state.outputPaths = determineOutputPaths(state.patternName);
      });

      Then('compact path should contain {string}', (_ctx: unknown, substring: string) => {
        expect(state.outputPaths).not.toBeNull();
        expect(state.outputPaths!.compact).toContain(substring);
      });
    });
  });

  // ===========================================================================
  // RULE 2: Compact Output Generation
  // ===========================================================================

  Rule('Compact output includes only essential content', ({ RuleScenario }) => {
    RuleScenario('Compact output excludes full descriptions', ({ Given, When, Then, And }) => {
      Given('a decision document with context and description', () => {
        state.decisionContent = {
          patternName: 'TestPattern',
          description: 'This is a long description that should not appear in compact output.',
          rules: {
            context: [
              {
                name: 'Context - Background',
                description: 'Context description text.',
                scenarioCount: 0,
                scenarioNames: [],
              },
            ],
            decision: [],
            consequences: [],
            other: [],
          },
          docStrings: [],
          sourceMappings: [],
        };
      });

      When('generating compact output', () => {
        state.compactOutput = generateCompactOutput(state.decisionContent, state.aggregatedContent);
      });

      Then('output should have detail level {string}', (_ctx: unknown, level: string) => {
        expect(state.compactOutput).not.toBeNull();
        expect(state.compactOutput!.detailLevel).toBe(level);
      });

      And('output should have purpose containing {string}', (_ctx: unknown, substring: string) => {
        expect(state.compactOutput!.purpose).toContain(substring);
      });
    });

    RuleScenario('Compact output includes type shapes', ({ Given, When, Then }) => {
      Given('a decision document with extracted shapes', () => {
        state.decisionContent = {
          patternName: 'TestPattern',
          description: '',
          rules: { context: [], decision: [], consequences: [], other: [] },
          docStrings: [],
          sourceMappings: [],
        };
        state.aggregatedContent = {
          sections: [
            {
              section: 'Types',
              sourceFile: 'src/types.ts',
              extractionMethod: '@extract-shapes',
              content: 'interface TestType { name: string; }',
              shapes: [
                {
                  name: 'TestType',
                  kind: 'interface',
                  definition: 'interface TestType { name: string; }',
                },
              ],
            } as ExtractedSection,
          ],
          warnings: [],
          success: true,
        };
      });

      When('generating compact output', () => {
        state.compactOutput = generateCompactOutput(state.decisionContent, state.aggregatedContent);
      });

      Then('output sections should reference shapes', () => {
        expect(state.compactOutput).not.toBeNull();
        // Check that shapes are included in some form
        const sections = state.compactOutput!.sections;
        expect(sections.length).toBeGreaterThan(0);
      });
    });

    RuleScenario('Compact output handles empty content', ({ Given, When, Then }) => {
      Given('a decision document with no content', () => {
        state.decisionContent = {
          patternName: 'EmptyPattern',
          description: '',
          rules: { context: [], decision: [], consequences: [], other: [] },
          docStrings: [],
          sourceMappings: [],
        };
        state.aggregatedContent = {
          sections: [],
          warnings: [],
          success: true,
        };
      });

      When('generating compact output', () => {
        state.compactOutput = generateCompactOutput(state.decisionContent, state.aggregatedContent);
      });

      Then('output should contain placeholder text', () => {
        expect(state.compactOutput).not.toBeNull();
        // Should have at least the overview heading
        expect(state.compactOutput!.sections.length).toBeGreaterThan(0);
      });
    });
  });

  // ===========================================================================
  // RULE 3: Detailed Output Generation
  // ===========================================================================

  Rule('Detailed output includes full content', ({ RuleScenario }) => {
    RuleScenario('Detailed output includes all sections', ({ Given, When, Then, And }) => {
      Given('a decision document with context and decision rules', () => {
        state.decisionContent = {
          patternName: 'TestPattern',
          description: 'Full description here.',
          rules: {
            context: [
              {
                name: 'Context - Why we need this',
                description: 'Context explanation.',
                scenarioCount: 0,
                scenarioNames: [],
              },
            ],
            decision: [
              {
                name: 'Decision - How it works',
                description: 'Decision explanation.',
                scenarioCount: 0,
                scenarioNames: [],
              },
            ],
            consequences: [],
            other: [],
          },
          docStrings: [],
          sourceMappings: [],
        };
      });

      When('generating detailed output', () => {
        state.detailedOutput = generateDetailedOutput(
          state.decisionContent,
          state.aggregatedContent
        );
      });

      Then('output should have detail level {string}', (_ctx: unknown, level: string) => {
        expect(state.detailedOutput).not.toBeNull();
        expect(state.detailedOutput!.detailLevel).toBe(level);
      });

      And('output sections should include Context and Decision', () => {
        const hasContext = state.detailedOutput!.sections.some(
          (s) => s.type === 'heading' && s.text === 'Context'
        );
        const hasDecision = state.detailedOutput!.sections.some(
          (s) => s.type === 'heading' && s.text === 'Decision'
        );
        expect(hasContext).toBe(true);
        expect(hasDecision).toBe(true);
      });
    });

    RuleScenario('Detailed output includes consequences', ({ Given, When, Then }) => {
      Given('a decision document with consequences', () => {
        state.decisionContent = {
          patternName: 'TestPattern',
          description: '',
          rules: {
            context: [],
            decision: [],
            consequences: [
              {
                name: 'Consequences - Trade-offs',
                description: 'Benefits and costs.',
                scenarioCount: 0,
                scenarioNames: [],
              },
            ],
            other: [],
          },
          docStrings: [],
          sourceMappings: [],
        };
      });

      When('generating detailed output', () => {
        state.detailedOutput = generateDetailedOutput(
          state.decisionContent,
          state.aggregatedContent
        );
      });

      Then('output sections should include {string}', (_ctx: unknown, sectionName: string) => {
        const hasSection = state.detailedOutput!.sections.some(
          (s) => s.type === 'heading' && s.text === sectionName
        );
        expect(hasSection).toBe(true);
      });
    });

    RuleScenario('Detailed output includes DocStrings as code blocks', ({ Given, When, Then }) => {
      Given('a decision document with DocStrings', () => {
        state.decisionContent = {
          patternName: 'TestPattern',
          description: '',
          rules: { context: [], decision: [], consequences: [], other: [] },
          docStrings: [
            { language: 'typescript', content: 'const x = 1;' },
            { language: 'bash', content: 'npm install' },
          ],
          sourceMappings: [],
        };
      });

      When('generating detailed output', () => {
        state.detailedOutput = generateDetailedOutput(
          state.decisionContent,
          state.aggregatedContent
        );
      });

      Then('output should contain code blocks', () => {
        const hasCodeBlock = state.detailedOutput!.sections.some((s) => s.type === 'code');
        expect(hasCodeBlock).toBe(true);
      });
    });
  });

  // ===========================================================================
  // RULE 4: Multi-Level Generation
  // ===========================================================================

  Rule('Multi-level generation produces both outputs', ({ RuleScenario }) => {
    RuleScenario('Generate both compact and detailed outputs', ({ Given, When, Then, And }) => {
      Given('a complete decision document with source mappings', () => {
        state.pattern = createTestPattern({
          directive: {
            patternName: 'TestPattern',
            status: 'active',
            description: `Test description

| Section | Source File | Extraction Method |
| Intro | THIS DECISION | Decision rule description |`,
          },
          rules: [
            {
              name: 'Context - Background',
              description: 'Context text.',
              scenarioCount: 0,
              scenarioNames: [],
            },
          ],
        });
      });

      When('generating multi-level output', async () => {
        state.generationResult = await generateFromDecisionMultiLevel(state.pattern!, {
          baseDir: state.baseDir,
          claudeMdSection: 'test',
        });
      });

      Then('{int} output files should be produced', (_ctx: unknown, count: number) => {
        expect(state.generationResult).not.toBeNull();
        expect(state.generationResult!.files.length).toBe(count);
      });

      And(
        'files should be in both {string} and {string}',
        (_ctx: unknown, prefix1: string, prefix2: string) => {
          const hasFile1 = state.generationResult!.files.some((f) => f.path.startsWith(prefix1));
          const hasFile2 = state.generationResult!.files.some((f) => f.path.startsWith(prefix2));
          expect(hasFile1).toBe(true);
          expect(hasFile2).toBe(true);
        }
      );
    });

    RuleScenario('Pattern name falls back to pattern.name', ({ Given, When, Then }) => {
      Given('a pattern with only the name field', () => {
        state.pattern = createTestPattern({
          directive: {
            status: 'active',
            description: 'Pattern uses name fallback',
          },
          name: 'FallbackPattern',
          skipPatternNameDefault: true,
        });
      });

      When('generating multi-level output', async () => {
        state.generationResult = await generateFromDecisionMultiLevel(state.pattern!, {
          baseDir: state.baseDir,
        });
      });

      Then('generation should succeed using the name field', () => {
        expect(state.generationResult).not.toBeNull();
        // Should produce files without errors
        expect(state.generationResult!.files.length).toBeGreaterThan(0);
        // Files should use FallbackPattern in paths (lowercase in compact, uppercase in detailed)
        const hasCompact = state.generationResult!.files.some((f) =>
          f.path.toLowerCase().includes('fallback')
        );
        expect(hasCompact).toBe(true);
      });
    });

    RuleScenario('Pattern claude section routes compact output', ({ Given, When, Then }) => {
      Given(
        'a pattern named {string} with claude section {string}',
        (_ctx: unknown, name: string, claudeSection: string) => {
          state.pattern = createTestPattern({
            name,
            patternName: name,
            claudeSection,
          });
        }
      );

      When('generating multi-level output', async () => {
        state.generationResult = await generateFromDecisionMultiLevel(state.pattern!, {
          baseDir: state.baseDir,
        });
      });

      Then('compact path should be {string}', (_ctx: unknown, expected: string) => {
        expect(state.generationResult).not.toBeNull();
        const compactFile = state.generationResult!.files.find((file) =>
          file.path.startsWith('_claude-md/')
        );
        expect(compactFile?.path).toBe(expected);
      });
    });
  });

  // ===========================================================================
  // RULE 5: Generator Registration
  // ===========================================================================

  Rule('Generator is registered with the registry', ({ RuleScenario }) => {
    RuleScenario('Generator is registered with correct name', ({ When, Then, And }) => {
      When('checking generator registry', () => {
        // Registry is already loaded via import
      });

      Then('{string} should be available', (_ctx: unknown, name: string) => {
        expect(generatorRegistry.has(name)).toBe(true);
      });

      And('generator should have description about decision documents', () => {
        const generator = generatorRegistry.get('doc-from-decision');
        expect(generator).toBeDefined();
        expect(generator!.description).toContain('decision');
      });
    });

    RuleScenario(
      'Generator filters patterns by source mapping presence',
      ({ Given, When, Then }) => {
        Given('patterns without source mappings', () => {
          state.patterns = [
            createTestPattern({
              directive: {
                patternName: 'NoMappings',
                status: 'active',
                description: 'Just a description without tables.',
              },
            }),
          ];
        });

        When('running generator', async () => {
          const generator = createDecisionDocGenerator();
          state.generatorOutput = await generator.generate(state.patterns, {
            baseDir: state.baseDir,
            outputDir: state.tempDir,
            registry: {} as never, // Not used by this generator
          });
        });

        Then('generator should produce no output files', () => {
          expect(state.generatorOutput).not.toBeNull();
          expect(state.generatorOutput!.files.length).toBe(0);
        });
      }
    );

    RuleScenario('Generator processes patterns with source mappings', ({ Given, When, Then }) => {
      Given('patterns with source mapping tables', () => {
        state.patterns = [
          createTestPattern({
            directive: {
              patternName: 'WithMappings',
              status: 'active',
              description: `Description

| Section | Source File | Extraction Method |
| Intro | THIS DECISION | Decision rule description |`,
            },
            rules: [
              {
                name: 'Context - Test',
                description: 'Context content.',
                scenarioCount: 0,
                scenarioNames: [],
              },
            ],
          }),
        ];
      });

      When('running generator', async () => {
        const generator = createDecisionDocGenerator();
        state.generatorOutput = await generator.generate(state.patterns, {
          baseDir: state.baseDir,
          outputDir: state.tempDir,
          registry: {} as never, // Not used by this generator
        });
      });

      Then('generator should produce output files', () => {
        expect(state.generatorOutput).not.toBeNull();
        expect(state.generatorOutput!.files.length).toBeGreaterThan(0);
      });
    });
  });

  // ===========================================================================
  // RULE 6: Source Mapping Integration
  // ===========================================================================

  Rule('Source mappings are executed during generation', ({ RuleScenario }) => {
    RuleScenario('Source mappings are executed', ({ Given, When, Then, And }) => {
      Given('a decision document with source mappings', () => {
        state.pattern = createTestPattern({
          directive: {
            patternName: 'MappedPattern',
            status: 'active',
            description: `Description

| Section | Source File | Extraction Method |
| Types | src/types.ts | @extract-shapes tag |`,
          },
        });
      });

      And('source files exist', () => {
        createTestTypeScriptFile(
          'src/types.ts',
          `/**
 * @architect
 * @architect-extract-shapes TestType
 */
export interface TestType {
  id: string;
  name: string;
}
`
        );
      });

      When('generating from decision', async () => {
        state.generationResult = await generateFromDecision(state.pattern!, {
          baseDir: state.baseDir,
          detailLevel: 'detailed',
        });
      });

      Then('aggregated content should be included', () => {
        expect(state.generationResult).not.toBeNull();
        expect(state.generationResult!.files.length).toBeGreaterThan(0);
        // Content should be present (either in file or warnings indicate extraction happened)
      });
    });

    RuleScenario(
      'Missing source files are reported as validation errors',
      ({ Given, When, Then }) => {
        Given('a decision document referencing missing files', () => {
          state.pattern = createTestPattern({
            directive: {
              patternName: 'MissingFiles',
              status: 'active',
              description: `Description

| Section | Source File | Extraction Method |
| Types | nonexistent.ts | @extract-shapes tag |`,
            },
          });
        });

        When('generating from decision', async () => {
          state.generationResult = await generateFromDecision(state.pattern!, {
            baseDir: state.baseDir,
            detailLevel: 'detailed',
          });
        });

        Then('validation errors are reported for missing files', () => {
          expect(state.generationResult).not.toBeNull();
          // Validation should fail with errors about missing files
          expect(state.generationResult!.errors.length).toBeGreaterThan(0);
          expect(state.generationResult!.errors[0]).toContain('nonexistent.ts');
        });
      }
    );
  });
});
