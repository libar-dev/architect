/**
 * Codec-Based Generator Step Definitions
 *
 * BDD step definitions for testing the CodecBasedGenerator class.
 * Tests codec delegation, error handling for missing MasterDataset,
 * and codec options pass-through.
 *
 * Uses Rule() + RuleScenario() pattern as feature file uses Rule: blocks.
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { CodecBasedGenerator } from '../../../src/generators/codec-based.js';
import type { GeneratorContext, GeneratorOutput } from '../../../src/generators/types.js';
import type { GenerationError } from '../../../src/generators/orchestrator.js';
import type { DocumentType } from '../../../src/renderable/generate.js';
import {
  createTestMasterDataset,
  createDefaultTagRegistry,
  createTestPattern,
} from '../../fixtures/dataset-factories.js';
import type { DataTableRow } from '../../support/world.js';

// =============================================================================
// State Types
// =============================================================================

/**
 * Extended GeneratorOutput that includes the errors array
 * returned by CodecBasedGenerator when MasterDataset is missing.
 */
interface CodecBasedGeneratorOutput extends GeneratorOutput {
  readonly errors?: readonly GenerationError[];
}

interface CodecBasedState {
  generator: CodecBasedGenerator | null;
  context: GeneratorContext | null;
  output: CodecBasedGeneratorOutput | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: CodecBasedState | null = null;

function initState(): CodecBasedState {
  return {
    generator: null,
    context: null,
    output: null,
  };
}

// =============================================================================
// Feature: Codec-Based Generator
// =============================================================================

const feature = await loadFeature('tests/features/generators/codec-based.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a codec-based generator test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Rule 1: CodecBasedGenerator adapts codecs to generator interface
  // ===========================================================================

  Rule('CodecBasedGenerator adapts codecs to generator interface', ({ RuleScenario }) => {
    // -------------------------------------------------------------------------
    // Scenario: Generator delegates to codec (happy path)
    // -------------------------------------------------------------------------
    RuleScenario('Generator delegates to codec', ({ Given, And, When, Then }) => {
      Given(
        'a CodecBasedGenerator wrapping {string} document type',
        (_ctx: unknown, documentType: string) => {
          state!.generator = new CodecBasedGenerator(
            `${documentType}-generator`,
            documentType as DocumentType
          );
        }
      );

      And('a context with MasterDataset containing patterns', () => {
        const dataset = createTestMasterDataset({
          patterns: [
            createTestPattern({
              id: 'pattern-00000001',
              name: 'TestPattern',
              category: 'core',
              status: 'completed',
            }),
          ],
        });

        state!.context = {
          baseDir: '/test',
          outputDir: '/test/output',
          registry: createDefaultTagRegistry(),
          masterDataset: dataset,
        };
      });

      When('the generator generate method is called', async () => {
        const result = await state!.generator!.generate([], state!.context!);
        state!.output = result as CodecBasedGeneratorOutput;
      });

      Then(
        'the output should contain a file with path {string}',
        (_ctx: unknown, expectedPath: string) => {
          expect(state!.output).not.toBeNull();
          expect(state!.output!.files.length).toBeGreaterThan(0);

          const filePaths = state!.output!.files.map((f) => f.path);
          expect(filePaths).toContain(expectedPath);
        }
      );

      And('the output should have no errors', () => {
        const errors = state!.output!.errors ?? [];
        expect(errors).toHaveLength(0);
      });
    });

    // -------------------------------------------------------------------------
    // Scenario: Missing MasterDataset returns error (validation)
    // -------------------------------------------------------------------------
    RuleScenario('Missing MasterDataset returns error', ({ Given, And, When, Then }) => {
      Given(
        'a CodecBasedGenerator for {string} document type',
        (_ctx: unknown, documentType: string) => {
          state!.generator = new CodecBasedGenerator(
            `${documentType}-generator`,
            documentType as DocumentType
          );
        }
      );

      And('a context WITHOUT MasterDataset', () => {
        state!.context = {
          baseDir: '/test',
          outputDir: '/test/output',
          registry: createDefaultTagRegistry(),
          // masterDataset intentionally omitted
        };
      });

      When('the generator generate method is called', async () => {
        const result = await state!.generator!.generate([], state!.context!);
        state!.output = result as CodecBasedGeneratorOutput;
      });

      Then('the output should have no files', () => {
        expect(state!.output).not.toBeNull();
        expect(state!.output!.files).toHaveLength(0);
      });

      And(
        'the output should contain an error mentioning {string}',
        (_ctx: unknown, expectedText: string) => {
          const errors = state!.output!.errors;
          expect(errors).toBeDefined();
          expect(errors!.length).toBeGreaterThan(0);

          const errorMessages = errors!.map((e) => e.message);
          const hasExpectedText = errorMessages.some((msg) => msg.includes(expectedText));
          expect(hasExpectedText).toBe(true);
        }
      );
    });

    // -------------------------------------------------------------------------
    // Scenario: Codec options are passed through (happy path)
    // -------------------------------------------------------------------------
    RuleScenario('Codec options are passed through', ({ Given, And, When, Then }) => {
      Given(
        'a CodecBasedGenerator for {string} document type',
        (_ctx: unknown, documentType: string) => {
          state!.generator = new CodecBasedGenerator(
            `${documentType}-generator`,
            documentType as DocumentType
          );
        }
      );

      And('a context with MasterDataset', () => {
        // Create patterns with file paths matching the filter
        const dataset = createTestMasterDataset({
          patterns: [
            createTestPattern({
              id: 'pattern-00000001',
              name: 'CoreTypes',
              category: 'core',
              status: 'completed',
              filePath: 'src/core/types.ts',
            }),
            createTestPattern({
              id: 'pattern-00000002',
              name: 'ApiIndex',
              category: 'api',
              status: 'completed',
              filePath: 'src/api/index.ts',
            }),
            createTestPattern({
              id: 'pattern-00000003',
              name: 'OtherPattern',
              category: 'core',
              status: 'completed',
              filePath: 'src/other/file.ts',
            }),
          ],
        });

        state!.context = {
          baseDir: '/test',
          outputDir: '/test/output',
          registry: createDefaultTagRegistry(),
          masterDataset: dataset,
        };
      });

      And('codecOptions with changedFiles filter:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const changedFiles = dataTable.map((row) => row.file);

        // Update context with codecOptions
        state!.context = {
          ...state!.context!,
          codecOptions: {
            'pr-changes': {
              changedFiles,
            },
          },
        };
      });

      When('the generator generate method is called', async () => {
        const result = await state!.generator!.generate([], state!.context!);
        state!.output = result as CodecBasedGeneratorOutput;
      });

      Then(
        'the output should contain a file with path {string}',
        (_ctx: unknown, expectedPath: string) => {
          expect(state!.output).not.toBeNull();
          expect(state!.output!.files.length).toBeGreaterThan(0);

          const filePaths = state!.output!.files.map((f) => f.path);
          expect(filePaths).toContain(expectedPath);
        }
      );
    });
  });
});
