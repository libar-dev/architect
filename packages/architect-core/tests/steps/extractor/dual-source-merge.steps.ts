import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  combineSources,
  validateDualSource,
  type DualSourcePattern,
  type DualSourceResults,
  type ExtractedPattern,
  type ScannedGherkinFile,
  type ValidationSummary,
} from '../../../src/index.js';

const feature = await loadFeature('tests/features/extractor/dual-source-merge.feature');

interface DualSourceMergeState {
  codePatterns: ExtractedPattern[];
  featureFiles: ScannedGherkinFile[];
  results: DualSourceResults | null;
  summary: ValidationSummary | null;
}

let state: DualSourceMergeState | null = null;
let patternCounter = 0;

function initState(): DualSourceMergeState {
  return {
    codePatterns: [],
    featureFiles: [],
    results: null,
    summary: null,
  };
}

function createCodePattern(
  patternName: string,
  status: 'candidate' | 'roadmap' | 'active' | 'completed' | 'deferred' = 'roadmap',
): ExtractedPattern {
  patternCounter += 1;
  return {
    id: `pattern-${String(patternCounter).padStart(8, '0')}`,
    name: patternName,
    patternName,
    role: 'core',
    status,
    directive: {
      tags: [],
      description: '',
      examples: [],
      position: { startLine: 1, endLine: 1 },
    },
    code: `export const ${patternName} = true;`,
    source: { file: `src/${patternName.toLowerCase()}.ts`, lines: [1, 3] },
    exports: [{ type: 'const', name: patternName }],
    extractedAt: '2026-01-01T00:00:00.000Z',
  } as unknown as ExtractedPattern;
}

function createFeatureFile(
  patternName: string,
  options: { status?: string; deliverable?: string } = {},
): ScannedGherkinFile {
  const headers = ['Deliverable', 'Status', 'Tests', 'Location'];
  const rows =
    options.deliverable === undefined
      ? []
      : [
          {
            Deliverable: options.deliverable,
            Status: 'pending',
            Tests: '0',
            Location: `src/${patternName.toLowerCase()}.ts`,
          },
        ];

  return {
    filePath: `architect/specs/${patternName.toLowerCase()}.feature`,
    feature: {
      name: `${patternName} feature`,
      description: '',
      tags: [`pattern:${patternName}`, `status:${options.status ?? 'roadmap'}`],
      language: 'en',
      line: 1,
    },
    ...(rows.length > 0
      ? {
          background: {
            name: 'Deliverables',
            steps: [
              {
                keyword: 'Given',
                text: 'the deliverables are defined',
                dataTable: {
                  headers,
                  rows,
                },
              },
            ],
            line: 4,
          },
        }
      : {}),
    scenarios: [],
  } as ScannedGherkinFile;
}

function getCombinedPattern(name: string): DualSourcePattern {
  const pattern = state?.results?.patterns.find((entry) => entry.patternName === name);
  expect(pattern).toBeDefined();
  return pattern!;
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a dual-source merge integration context', () => {
      state = initState();
    });
  });

  Rule(
    'Dual-source merge outcomes stay explicit across roadmap and validation paths',
    ({ RuleScenario }) => {
      RuleScenario(
        'Annotation-only roadmap pattern warns about missing feature coverage',
        ({ Given, When, Then, And }) => {
          Given('an annotation-only roadmap pattern {string}', (_ctx: unknown, name: string) => {
            state!.codePatterns = [createCodePattern(name)];
          });

          When('I combine and validate the dual-source inputs', () => {
            state!.results = combineSources(state!.codePatterns, state!.featureFiles);
            state!.summary = validateDualSource(state!.results);
          });

          Then('{int} combined patterns are produced', (_ctx: unknown, count: number) => {
            expect(state!.results!.patterns).toHaveLength(count);
          });

          And('{int} annotation-only patterns remain', (_ctx: unknown, count: number) => {
            expect(state!.results!.codeOnly).toHaveLength(count);
          });

          And(
            'validation reports {int} missing feature warning',
            (_ctx: unknown, count: number) => {
              expect(state!.summary!.warnings).toHaveLength(count);
              expect(state!.summary!.warnings[0]).toContain('has code stub but no feature file');
            },
          );
        },
      );

      RuleScenario(
        'Spec-only roadmap pattern warns about missing code coverage',
        ({ Given, When, Then, And }) => {
          Given(
            'a spec-only roadmap feature for pattern {string}',
            (_ctx: unknown, name: string) => {
              state!.featureFiles = [createFeatureFile(name)];
            },
          );

          When('I combine and validate the dual-source inputs', () => {
            state!.results = combineSources(state!.codePatterns, state!.featureFiles);
            state!.summary = validateDualSource(state!.results);
          });

          Then('{int} combined patterns are produced', (_ctx: unknown, count: number) => {
            expect(state!.results!.patterns).toHaveLength(count);
          });

          And('{int} spec-only patterns remain', (_ctx: unknown, count: number) => {
            expect(state!.results!.featureOnly).toHaveLength(count);
          });

          And('validation reports {int} missing code warning', (_ctx: unknown, count: number) => {
            expect(state!.summary!.warnings).toHaveLength(count);
            expect(state!.summary!.warnings[0]).toContain('has no code stub');
          });
        },
      );

      RuleScenario(
        'Matching code and feature merge process metadata and deliverables',
        ({ Given, And, When, Then }) => {
          Given('a code pattern {string}', (_ctx: unknown, name: string) => {
            state!.codePatterns = [createCodePattern(name)];
          });

          And(
            'a feature file for pattern {string} with deliverable {string}',
            (_ctx: unknown, name: string, deliverable: string) => {
              state!.featureFiles = [createFeatureFile(name, { deliverable })];
            },
          );

          When('I combine and validate the dual-source inputs', () => {
            state!.results = combineSources(state!.codePatterns, state!.featureFiles);
            state!.summary = validateDualSource(state!.results);
          });

          Then('{int} combined patterns are produced', (_ctx: unknown, count: number) => {
            expect(state!.results!.patterns).toHaveLength(count);
          });

          And('combined pattern {string} has process metadata', (_ctx: unknown, name: string) => {
            expect(getCombinedPattern(name).process?.pattern).toBe(name);
          });

          And(
            'combined pattern {string} has {int} deliverable',
            (_ctx: unknown, name: string, count: number) => {
              expect(getCombinedPattern(name).deliverables).toHaveLength(count);
            },
          );

          And('validation passes without errors', () => {
            expect(state!.summary!.isValid).toBe(true);
            expect(state!.summary!.errors).toHaveLength(0);
          });
        },
      );
    },
  );
});
