/**
 * Design Review Generator lifecycle step definitions.
 *
 * Covers orphan cleanup for stale design-review markdown files.
 *
 * @architect
 * @architect-uses DesignReviewGenerator
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import type { GeneratorOutput } from '../../../src/generators/types.js';
import { createDesignReviewGenerator } from '../../../src/generators/built-in/design-review-generator.js';
import { createDefaultTagRegistry } from '../../../src/validation-schemas/tag-registry.js';
import type { RuntimePatternGraph } from '../../../src/generators/pipeline/transform-types.js';
import {
  createTempDir,
  writeTempFile,
  type TempDirContext,
} from '../../support/helpers/file-system.js';
import { createTestPatternGraph, createTestPattern } from '../../fixtures/dataset-factories.js';
import { createSequenceRule } from '../../support/helpers/design-review-state.js';

interface DesignReviewGeneratorState {
  tempContext: TempDirContext | null;
  dataset: RuntimePatternGraph | null;
  output: GeneratorOutput | null;
}

let state: DesignReviewGeneratorState | null = null;

function requireState(): DesignReviewGeneratorState {
  if (!state) throw new Error('Design review generator state not initialized');
  return state;
}

const feature = await loadFeature('tests/features/generation/design-review-generator.feature');

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(async () => {
    if (state?.tempContext) {
      await state.tempContext.cleanup();
    }
    state = null;
  });

  Background(({ Given }) => {
    Given('a temporary design review output directory', async () => {
      state = {
        tempContext: await createTempDir({ prefix: 'design-review-generator-' }),
        dataset: null,
        output: null,
      };
    });
  });

  Rule('Orphaned design review files are scheduled for deletion', ({ RuleScenario }) => {
    RuleScenario(
      'Renamed pattern schedules stale design review for deletion',
      ({ Given, And, When, Then }) => {
        Given(
          'an existing design review file {string}',
          async (_ctx: unknown, relativePath: string) => {
            await writeTempFile(
              requireState().tempContext!.tempDir,
              relativePath,
              '# stale review\n'
            );
          }
        );

        And(
          'a dataset with sequence data for pattern {string}',
          (_ctx: unknown, patternName: string) => {
            const pattern = createTestPattern({
              name: patternName,
              status: 'active',
              filePath: 'architect/specs/test-pattern.feature',
              sequenceOrchestrator: 'orch',
              rules: [
                createSequenceRule({
                  name: 'Generate review',
                  step: 1,
                  modules: ['writer'],
                  input: 'InputConfig',
                  output: 'OutputModel -- id',
                }),
              ],
            });

            requireState().dataset = createTestPatternGraph({ patterns: [pattern] });
          }
        );

        When('generating design review files', async () => {
          const current = requireState();
          const generator = createDesignReviewGenerator();
          if (!current.dataset) {
            throw new Error('Dataset not initialized');
          }
          current.output = await generator.generate(current.dataset.patterns, {
            baseDir: current.tempContext!.tempDir,
            outputDir: '.',
            registry: createDefaultTagRegistry(),
            patternGraph: current.dataset,
          });
        });

        Then('the generator output should include files to delete', () => {
          expect(requireState().output?.filesToDelete?.length ?? 0).toBeGreaterThan(0);
        });

        And(
          'the files to delete should include {string}',
          (_ctx: unknown, relativePath: string) => {
            expect(requireState().output?.filesToDelete).toContain(relativePath);
          }
        );

        And(
          'the files to delete should not include {string}',
          (_ctx: unknown, relativePath: string) => {
            expect(requireState().output?.filesToDelete ?? []).not.toContain(relativePath);
          }
        );

        And(
          'the generated files should include {string}',
          (_ctx: unknown, relativePath: string) => {
            const generatedPaths = requireState().output?.files.map((file) => file.path) ?? [];
            expect(generatedPaths).toContain(relativePath);
          }
        );
      }
    );
  });
});
