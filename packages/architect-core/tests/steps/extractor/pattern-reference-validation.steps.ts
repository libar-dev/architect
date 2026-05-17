import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  Result,
  buildPatternGraph,
  createDefaultTagRegistry,
  extractPatterns,
  type BuildResult,
  type ExtractionDiagnostic,
  type PatternValidationError,
  type ScanResults,
  scanPatterns,
} from '../../../src/index.js';

const feature = await loadFeature('tests/features/extractor/pattern-reference-validation.feature');
const packageRoot = path.resolve(import.meta.dirname, '../../..');

interface State {
  tempDir: string | null;
  scanResult: ScanResults | null;
  extractionDiagnostics: readonly ExtractionDiagnostic[];
  extractionErrors: readonly PatternValidationError[];
  buildResult: BuildResult | null;
}

let state: State | null = null;

function initState(): State {
  return {
    tempDir: null,
    scanResult: null,
    extractionDiagnostics: [],
    extractionErrors: [],
    buildResult: null,
  };
}

async function writeTempFile(relativePath: string, content: string): Promise<void> {
  if (!state?.tempDir) {
    throw new Error('Temporary workspace not initialized');
  }

  const absolutePath = path.join(state.tempDir, relativePath);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content.trim());
}

async function scanWorkspace(patterns: readonly string[], baseDir: string): Promise<ScanResults> {
  const result = await scanPatterns(
    {
      patterns,
      baseDir,
    },
    createDefaultTagRegistry(),
  );

  if (!Result.isOk(result)) throw new Error('Expected scanPatterns to succeed');
  return result.value;
}

async function buildWorkspaceGraph(): Promise<void> {
  const buildResult = await buildPatternGraph({
    input: ['src/**/*.ts', 'packages/**/*.ts'],
    features: [],
    baseDir: state!.tempDir!,
    mergeConflictStrategy: 'fatal',
    tagRegistry: createDefaultTagRegistry(),
  });

  if (!Result.isOk(buildResult)) throw new Error('Expected buildPatternGraph to succeed');
  state!.buildResult = buildResult.value;
}

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(async () => {
    if (state !== null && state.tempDir !== null) {
      await fs.rm(state.tempDir, { recursive: true, force: true });
    }
    state = null;
  });

  Background(({ Given }) => {
    Given('a pattern reference validation context', async () => {
      state = initState();
      state.tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pattern-reference-validation-'));
    });
  });

  Rule('Invalid identities fail with explicit validation feedback', ({ RuleScenario }) => {
    RuleScenario(
      'Invalid fixture skips directive with PascalCase guidance',
      ({ When, Then, And }) => {
        When('I scan the invalid pattern fixture', async () => {
          state!.scanResult = await scanWorkspace(
            ['tests/fixtures/legacy-taxonomy/invalid-pattern-name.ts'],
            packageRoot,
          );
        });

        Then('the scan skips {int} directive', (_ctx: unknown, count: number) => {
          expect(state!.scanResult?.skippedDirectives).toHaveLength(count);
        });

        And('the skipped directive reason mentions {string}', (_ctx: unknown, snippet: string) => {
          expect(state!.scanResult?.skippedDirectives[0]?.error.reason).toContain(snippet);
        });
      },
    );

    RuleScenario(
      'Heading-style inferred identity fails extraction',
      ({ Given, When, Then, And }) => {
        Given(
          'a TypeScript file {string} with content:',
          async (_ctx: unknown, filePath: string, content: string) => {
            await writeTempFile(filePath, content);
          },
        );

        When('I extract TypeScript patterns from the temporary workspace', async () => {
          const scanResult = await scanWorkspace(['src/**/*.ts'], state!.tempDir!);
          state!.scanResult = scanResult;

          const extraction = extractPatterns(
            scanResult.files,
            state!.tempDir!,
            createDefaultTagRegistry(),
          );
          state!.extractionDiagnostics = extraction.diagnostics;
          state!.extractionErrors = extraction.errors;
        });

        Then(
          'TypeScript extraction reports diagnostic code {string}',
          (_ctx: unknown, code: string) => {
            expect(
              state!.extractionDiagnostics.some((diagnostic) => diagnostic.code === code),
            ).toBe(true);
          },
        );

        And(
          'TypeScript extraction reports {int} pattern validation error',
          (_ctx: unknown, count: number) => {
            expect(state!.extractionErrors).toHaveLength(count);
          },
        );
      },
    );
  });

  Rule('Uses targets resolve only against declared patterns', ({ RuleScenario }) => {
    RuleScenario('Undeclared uses target stays dangling', ({ Given, When, Then }) => {
      Given(
        'a TypeScript file {string} with content:',
        async (_ctx: unknown, filePath: string, content: string) => {
          await writeTempFile(filePath, content);
        },
      );

      When('I build the runtime graph from the temporary workspace', async () => {
        await buildWorkspaceGraph();
      });

      Then(
        'graph validation contains dangling uses target {string} for pattern {string}',
        (_ctx: unknown, missing: string, pattern: string) => {
          expect(
            state!.buildResult?.validation.danglingReferences.some(
              (reference) =>
                reference.field === 'uses' &&
                reference.missing === missing &&
                reference.pattern === pattern,
            ),
          ).toBe(true);
        },
      );
    });

    RuleScenario('Same-package declared target links internally', ({ Given, And, When, Then }) => {
      Given(
        'a TypeScript file {string} with content:',
        async (_ctx: unknown, filePath: string, content: string) => {
          await writeTempFile(filePath, content);
        },
      );

      And(
        'a TypeScript file {string} with content:',
        async (_ctx: unknown, filePath: string, content: string) => {
          await writeTempFile(filePath, content);
        },
      );

      When('I build the runtime graph from the temporary workspace', async () => {
        await buildWorkspaceGraph();
      });

      Then('graph validation has no dangling uses targets', () => {
        const danglingUses = state!.buildResult?.validation.danglingReferences.filter(
          (reference) => reference.field === 'uses',
        );
        expect(danglingUses).toEqual([]);
      });

      And(
        'relationship entry {string} has usedBy value {string}',
        (_ctx: unknown, pattern: string, usedBy: string) => {
          expect(state!.buildResult?.graph.relationshipIndex?.[pattern]?.usedBy).toContain(usedBy);
        },
      );
    });

    RuleScenario('Cross-package declared target links externally', ({ Given, And, When, Then }) => {
      Given(
        'a TypeScript file {string} with content:',
        async (_ctx: unknown, filePath: string, content: string) => {
          await writeTempFile(filePath, content);
        },
      );

      And(
        'a TypeScript file {string} with content:',
        async (_ctx: unknown, filePath: string, content: string) => {
          await writeTempFile(filePath, content);
        },
      );

      When('I build the runtime graph from the temporary workspace', async () => {
        await buildWorkspaceGraph();
      });

      Then('graph validation has no dangling uses targets', () => {
        const danglingUses = state!.buildResult?.validation.danglingReferences.filter(
          (reference) => reference.field === 'uses',
        );
        expect(danglingUses).toEqual([]);
      });

      And(
        'relationship entry {string} preserves uses target {string}',
        (_ctx: unknown, pattern: string, target: string) => {
          expect(state!.buildResult?.graph.relationshipIndex?.[pattern]?.uses).toContain(target);
        },
      );

      And(
        'relationship entry {string} has usedBy value {string}',
        (_ctx: unknown, pattern: string, usedBy: string) => {
          expect(state!.buildResult?.graph.relationshipIndex?.[pattern]?.usedBy).toContain(usedBy);
        },
      );
    });
  });
});
