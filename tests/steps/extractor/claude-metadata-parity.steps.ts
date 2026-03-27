/**
 * Step definitions for Claude metadata parity tests.
 *
 * Verifies TypeScript directive propagation and sync/async Gherkin parity
 * for Claude routing metadata and ADR metadata.
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import * as path from 'node:path';
import { createTempDir, writeTempFile } from '../../support/helpers/file-system.js';
import { Result } from '../../../src/types/index.js';
import { buildRegistry } from '../../../src/taxonomy/index.js';
import { parseFileDirectives } from '../../../src/scanner/ast-parser.js';
import { buildPattern } from '../../../src/extractor/doc-extractor.js';
import {
  extractPatternsFromGherkin,
  extractPatternsFromGherkinAsync,
} from '../../../src/extractor/gherkin-extractor.js';
import type { ExtractedPattern } from '../../../src/types/index.js';
import type { ScannedGherkinFile } from '../../../src/validation-schemas/feature.js';

const feature = await loadFeature('tests/features/extractor/claude-metadata-parity.feature');

interface TestState {
  tempDir: string | null;
  cleanup: (() => Promise<void>) | null;
  tsFilePath: string | null;
  tsSource: string;
  tsPattern: ExtractedPattern | null;
  gherkinFile: ScannedGherkinFile | null;
  syncPattern: ExtractedPattern | null;
  asyncPattern: ExtractedPattern | null;
}

interface MetadataSnapshot {
  claudeModule?: string;
  claudeSection?: string;
  claudeTags?: readonly string[];
  adrTheme?: string;
  adrLayer?: string;
  effortActual?: string;
}

type MetadataField = keyof MetadataSnapshot;

let state: TestState | null = null;

function resetState(): TestState {
  return {
    tempDir: null,
    cleanup: null,
    tsFilePath: null,
    tsSource: '',
    tsPattern: null,
    gherkinFile: null,
    syncPattern: null,
    asyncPattern: null,
  };
}

function metadataSlice(pattern: ExtractedPattern | null): MetadataSnapshot {
  if (pattern === null) {
    throw new Error('Pattern not extracted');
  }

  return {
    claudeModule: pattern.claudeModule,
    claudeSection: pattern.claudeSection,
    claudeTags: pattern.claudeTags,
    adrTheme: pattern.adrTheme,
    adrLayer: pattern.adrLayer,
    effortActual: pattern.effortActual,
  };
}

function createTsSource(): string {
  return `
/**
 * @architect
 *
 * @architect-core
 * @architect-pattern ClaudeMetadataPattern
 * @architect-status completed
 * @architect-claude-module process-guard
 * @architect-claude-section process
 * @architect-claude-tags core-mandatory, workflow
 *
 * Pattern used to verify Claude metadata propagation.
 */
export function buildClaudeMetadata(): void {}
`.trim();
}

function createGherkinFile(tempDir: string): ScannedGherkinFile {
  const filePath = path.join(tempDir, 'claude-metadata.feature');

  return {
    filePath,
    feature: {
      name: 'Claude metadata parity',
      description: 'Feature to verify extractor metadata parity.',
      tags: [
        'architect',
        'pattern:ClaudeMetadataPattern',
        'status:active',
        'core',
        'claude-module:process-guard',
        'claude-section:process',
        'claude-tags:core-mandatory, workflow',
        'adr-theme:persistence',
        'adr-layer:foundation',
        'effort-actual:3h',
      ],
      language: 'en',
      line: 1,
    },
    scenarios: [
      {
        name: 'parity scenario',
        description: 'Scenario used to keep when-to-use data populated.',
        tags: ['acceptance-criteria'],
        steps: [
          {
            keyword: 'Given',
            text: 'the extractor parity test is running',
          },
        ],
        line: 12,
      },
    ],
  };
}

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(async () => {
    if (state?.cleanup) {
      await state.cleanup();
    }
    state = null;
  });

  Background(({ Given }) => {
    Given('the extractor parity test context is initialized', async () => {
      state = resetState();
      const tempDirContext = await createTempDir({ prefix: 'extractor-parity-' });
      state.tempDir = tempDirContext.tempDir;
      state.cleanup = tempDirContext.cleanup;
    });
  });

  Rule('TypeScript extraction preserves Claude metadata', ({ RuleScenario }) => {
    RuleScenario('Extracted TypeScript pattern keeps Claude metadata', ({ Given, When, Then }) => {
      Given('a TypeScript source file with Claude metadata directives', async () => {
        if (state?.tempDir === null) {
          throw new Error('Temporary directory not initialized');
        }
        state.tsSource = createTsSource();
        state.tsFilePath = await writeTempFile(state.tempDir, 'claude-metadata.ts', state.tsSource);
      });

      When('extracting the TypeScript pattern', () => {
        if (state?.tempDir === null || state.tsFilePath === null) {
          throw new Error('TypeScript test file not initialized');
        }

        const parseResult = parseFileDirectives(state.tsSource, state.tsFilePath, buildRegistry());
        if (!Result.isOk(parseResult)) {
          throw new Error(`Directive parsing failed: ${parseResult.error.message}`);
        }

        const parsedDirective = parseResult.value.directives[0];
        if (parsedDirective === undefined) {
          throw new Error('No directive found in TypeScript source');
        }

        const buildResult = buildPattern(
          parsedDirective.directive,
          parsedDirective.code,
          parsedDirective.exports,
          state.tsFilePath,
          state.tempDir,
          buildRegistry()
        );

        if (!Result.isOk(buildResult)) {
          throw new Error(`Pattern build failed: ${buildResult.error.message}`);
        }

        state.tsPattern = buildResult.value;
      });

      Then(
        'the extracted pattern should include metadata:',
        (_ctx: unknown, table: Array<{ field: MetadataField; value: string }>) => {
          const metadata = metadataSlice(state?.tsPattern ?? null);
          for (const row of table) {
            const actual = metadata[row.field];
            if (Array.isArray(actual)) {
              expect(actual.join(', ')).toBe(row.value);
            } else {
              expect(String(actual)).toBe(row.value);
            }
          }
        }
      );
    });
  });

  Rule(
    'Gherkin sync and async extraction keep Claude and ADR metadata aligned',
    ({ RuleScenario }) => {
      RuleScenario(
        'Sync and async Gherkin extraction return the same metadata',
        ({ Given, When, Then, And }) => {
          Given('a Gherkin feature file with Claude and ADR metadata', () => {
            if (state?.tempDir === null) {
              throw new Error('Temporary directory not initialized');
            }
            state.gherkinFile = createGherkinFile(state.tempDir);
          });

          When('extracting the Gherkin pattern synchronously and asynchronously', async () => {
            if (state?.tempDir === null || state.gherkinFile === null) {
              throw new Error('Gherkin test file not initialized');
            }

            const syncResult = extractPatternsFromGherkin([state.gherkinFile], {
              baseDir: state.tempDir,
            });
            expect(syncResult.errors).toHaveLength(0);
            expect(syncResult.patterns).toHaveLength(1);
            state.syncPattern = syncResult.patterns[0] ?? null;

            const asyncResult = await extractPatternsFromGherkinAsync([state.gherkinFile], {
              baseDir: state.tempDir,
            });
            expect(asyncResult.errors).toHaveLength(0);
            expect(asyncResult.patterns).toHaveLength(1);
            state.asyncPattern = asyncResult.patterns[0] ?? null;
          });

          Then(
            'the sync and async metadata should match for fields:',
            (_ctx: unknown, table: Array<{ field: MetadataField }>) => {
              const syncMetadata = metadataSlice(state?.syncPattern ?? null);
              const asyncMetadata = metadataSlice(state?.asyncPattern ?? null);

              for (const row of table) {
                expect(syncMetadata[row.field]).toEqual(asyncMetadata[row.field]);
              }
            }
          );

          And(
            'the extracted metadata should include:',
            (_ctx: unknown, table: Array<{ field: MetadataField; value: string }>) => {
              const metadata = metadataSlice(state?.syncPattern ?? null);
              for (const row of table) {
                const actual = metadata[row.field];
                if (Array.isArray(actual)) {
                  expect(actual.join(', ')).toBe(row.value);
                } else {
                  expect(String(actual)).toBe(row.value);
                }
              }
            }
          );
        }
      );
    }
  );
});
