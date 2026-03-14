/**
 * Context Inference Step Definitions
 *
 * BDD step definitions for testing the context auto-inference feature
 * in transformToMasterDataset. This feature infers bounded context from
 * file paths when patterns have archLayer but no explicit archContext.
 *
 * @architect
 */

import { expect } from 'vitest';
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';

import type { RuntimeMasterDataset } from '../../../src/generators/pipeline/transform-types.js';
import type { ContextInferenceRule } from '../../../src/generators/pipeline/context-inference.js';
import { transformToMasterDataset } from '../../../src/generators/pipeline/transform-dataset.js';
import { DEFAULT_CONTEXT_INFERENCE_RULES } from '../../../src/config/defaults.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/index.js';
import { createDefaultTagRegistry } from '../../../src/validation-schemas/tag-registry.js';
import { createTestPattern, resetPatternCounter } from '../../fixtures/pattern-factories.js';
import type { DataTableRow } from '../../support/world.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface ContextInferenceState {
  patterns: ExtractedPattern[];
  rules: readonly ContextInferenceRule[] | undefined;
  dataset: RuntimeMasterDataset | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: ContextInferenceState | null = null;

// =============================================================================
// Helper Functions
// =============================================================================

function initState(): ContextInferenceState {
  resetPatternCounter();
  return {
    patterns: [],
    rules: undefined,
    dataset: null,
  };
}

/**
 * Create a pattern with arch fields and specific filePath for testing inference
 */
function createPatternForInference(options: {
  filePath: string;
  archLayer?: string;
  archContext?: string;
}): ExtractedPattern {
  const basePattern = createTestPattern({
    name: `TestPattern-${options.filePath.replace(/\//g, '-')}`,
    status: 'completed',
    filePath: options.filePath,
  });

  // Add arch fields - only if provided
  return {
    ...basePattern,
    ...(options.archLayer && { archLayer: options.archLayer }),
    ...(options.archContext && { archContext: options.archContext }),
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/behavior/context-inference.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  // ---------------------------------------------------------------------------
  // Lifecycle Hooks
  // ---------------------------------------------------------------------------

  AfterEachScenario(() => {
    state = null;
  });

  // ---------------------------------------------------------------------------
  // Background
  // ---------------------------------------------------------------------------

  Background(({ Given }) => {
    Given('a context inference test context', () => {
      state = initState();
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: matchPattern supports recursive wildcard **
  // ---------------------------------------------------------------------------

  Rule('matchPattern supports recursive wildcard **', ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(
      'Recursive wildcard matches nested paths',
      (
        { Given, And, When, Then },
        variables: { pattern: string; filePath: string; expectedContext: string }
      ) => {
        Given('a pattern rule "<pattern>" for context "test-context"', () => {
          if (!state) state = initState();
          state.rules = [{ pattern: variables.pattern, context: 'test-context' }];
        });

        And('a pattern at file path "<filePath>" with archLayer "application"', () => {
          if (!state) state = initState();
          state.patterns.push(
            createPatternForInference({
              filePath: variables.filePath,
              archLayer: 'application',
            })
          );
        });

        When('transforming to master dataset with rules', () => {
          if (!state) throw new Error('State not initialized');
          state.dataset = transformToMasterDataset({
            patterns: state.patterns,
            tagRegistry: createDefaultTagRegistry(),
            workflow: undefined,
            contextInferenceRules: state.rules,
          });
        });

        Then('the pattern archContext should be "<expectedContext>"', () => {
          if (!state?.dataset) throw new Error('Dataset not initialized');
          const pattern = state.dataset.archIndex.all[0];
          if (variables.expectedContext === 'none') {
            // Pattern should NOT be in byContext at all
            const byContextKeys = Object.keys(state.dataset.archIndex.byContext);
            for (const key of byContextKeys) {
              const patterns = state.dataset.archIndex.byContext[key];
              const names = patterns.map((p) => p.name);
              expect(names).not.toContain(state.patterns[0].name);
            }
          } else {
            expect(pattern).toBeDefined();
            const contextPatterns =
              state.dataset.archIndex.byContext[variables.expectedContext] ?? [];
            expect(contextPatterns.map((p) => p.name)).toContain(state.patterns[0].name);
          }
        });
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Rule: matchPattern supports single-level wildcard /*
  // ---------------------------------------------------------------------------

  Rule('matchPattern supports single-level wildcard /*', ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(
      'Single-level wildcard matches direct children only',
      (
        { Given, And, When, Then },
        variables: { pattern: string; filePath: string; expectedContext: string }
      ) => {
        Given('a pattern rule "<pattern>" for context "test-context"', () => {
          if (!state) state = initState();
          state.rules = [{ pattern: variables.pattern, context: 'test-context' }];
        });

        And('a pattern at file path "<filePath>" with archLayer "application"', () => {
          if (!state) state = initState();
          state.patterns.push(
            createPatternForInference({
              filePath: variables.filePath,
              archLayer: 'application',
            })
          );
        });

        When('transforming to master dataset with rules', () => {
          if (!state) throw new Error('State not initialized');
          state.dataset = transformToMasterDataset({
            patterns: state.patterns,
            tagRegistry: createDefaultTagRegistry(),
            workflow: undefined,
            contextInferenceRules: state.rules,
          });
        });

        Then('the pattern archContext should be "<expectedContext>"', () => {
          if (!state?.dataset) throw new Error('Dataset not initialized');
          if (variables.expectedContext === 'none') {
            const byContextKeys = Object.keys(state.dataset.archIndex.byContext);
            for (const key of byContextKeys) {
              const patterns = state.dataset.archIndex.byContext[key];
              const names = patterns.map((p) => p.name);
              expect(names).not.toContain(state.patterns[0].name);
            }
          } else {
            const contextPatterns =
              state.dataset.archIndex.byContext[variables.expectedContext] ?? [];
            expect(contextPatterns.map((p) => p.name)).toContain(state.patterns[0].name);
          }
        });
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Rule: matchPattern supports prefix matching
  // ---------------------------------------------------------------------------

  Rule('matchPattern supports prefix matching', ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(
      'Prefix matching behavior',
      (
        { Given, And, When, Then },
        variables: { pattern: string; filePath: string; expectedContext: string }
      ) => {
        Given('a pattern rule "<pattern>" for context "test-context"', () => {
          if (!state) state = initState();
          state.rules = [{ pattern: variables.pattern, context: 'test-context' }];
        });

        And('a pattern at file path "<filePath>" with archLayer "application"', () => {
          if (!state) state = initState();
          state.patterns.push(
            createPatternForInference({
              filePath: variables.filePath,
              archLayer: 'application',
            })
          );
        });

        When('transforming to master dataset with rules', () => {
          if (!state) throw new Error('State not initialized');
          state.dataset = transformToMasterDataset({
            patterns: state.patterns,
            tagRegistry: createDefaultTagRegistry(),
            workflow: undefined,
            contextInferenceRules: state.rules,
          });
        });

        Then('the pattern archContext should be "<expectedContext>"', () => {
          if (!state?.dataset) throw new Error('Dataset not initialized');
          if (variables.expectedContext === 'none') {
            const byContextKeys = Object.keys(state.dataset.archIndex.byContext);
            for (const key of byContextKeys) {
              const patterns = state.dataset.archIndex.byContext[key];
              const names = patterns.map((p) => p.name);
              expect(names).not.toContain(state.patterns[0].name);
            }
          } else {
            const contextPatterns =
              state.dataset.archIndex.byContext[variables.expectedContext] ?? [];
            expect(contextPatterns.map((p) => p.name)).toContain(state.patterns[0].name);
          }
        });
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Rule: inferContext returns undefined when no rules match
  // ---------------------------------------------------------------------------

  Rule('inferContext returns undefined when no rules match', ({ RuleScenario }) => {
    RuleScenario('Empty rules array returns undefined', ({ Given, When, Then, And }) => {
      Given('no context inference rules', () => {
        if (!state) state = initState();
        state.rules = [];
      });

      And(
        'a pattern at file path {string} with archLayer {string}',
        (_ctx: unknown, filePath: string, archLayer: string) => {
          if (!state) state = initState();
          state.patterns.push(
            createPatternForInference({
              filePath,
              archLayer,
            })
          );
        }
      );

      When('transforming to master dataset with rules', () => {
        if (!state) throw new Error('State not initialized');
        state.dataset = transformToMasterDataset({
          patterns: state.patterns,
          tagRegistry: createDefaultTagRegistry(),
          workflow: undefined,
          contextInferenceRules: state.rules,
        });
      });

      Then('the pattern has no inferred archContext', () => {
        if (!state?.dataset) throw new Error('Dataset not initialized');
        // The pattern should still be in archIndex.all (due to archLayer)
        // but should NOT be in any byContext bucket
        const byContextKeys = Object.keys(state.dataset.archIndex.byContext);
        expect(byContextKeys.length).toBe(0);
      });

      And('the pattern is not in archIndex byContext', () => {
        if (!state?.dataset) throw new Error('Dataset not initialized');
        const byContextKeys = Object.keys(state.dataset.archIndex.byContext);
        for (const key of byContextKeys) {
          const patterns = state.dataset.archIndex.byContext[key];
          const names = patterns.map((p) => p.name);
          expect(names).not.toContain(state.patterns[0].name);
        }
      });
    });

    RuleScenario('File path does not match any rule', ({ Given, When, Then, And }) => {
      Given('default context inference rules', () => {
        if (!state) state = initState();
        state.rules = DEFAULT_CONTEXT_INFERENCE_RULES;
      });

      And(
        'a pattern at file path {string} with archLayer {string}',
        (_ctx: unknown, filePath: string, archLayer: string) => {
          if (!state) state = initState();
          state.patterns.push(
            createPatternForInference({
              filePath,
              archLayer,
            })
          );
        }
      );

      When('transforming to master dataset with rules', () => {
        if (!state) throw new Error('State not initialized');
        state.dataset = transformToMasterDataset({
          patterns: state.patterns,
          tagRegistry: createDefaultTagRegistry(),
          workflow: undefined,
          contextInferenceRules: state.rules,
        });
      });

      Then('the pattern has no inferred archContext', () => {
        if (!state?.dataset) throw new Error('Dataset not initialized');
        // Pattern is in archIndex.all due to archLayer, but not in any byContext
        const byContextKeys = Object.keys(state.dataset.archIndex.byContext);
        for (const key of byContextKeys) {
          const patterns = state.dataset.archIndex.byContext[key];
          const names = patterns.map((p) => p.name);
          expect(names).not.toContain(state.patterns[0].name);
        }
      });

      And('the pattern is not in archIndex byContext', () => {
        if (!state?.dataset) throw new Error('Dataset not initialized');
        const allContextPatterns = Object.values(state.dataset.archIndex.byContext).flat();
        const names = allContextPatterns.map((p) => p.name);
        expect(names).not.toContain(state.patterns[0].name);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: inferContext applies first matching rule
  // ---------------------------------------------------------------------------

  Rule('inferContext applies first matching rule', ({ RuleScenario }) => {
    RuleScenario('Single matching rule infers context', ({ Given, When, Then, And }) => {
      Given('default context inference rules', () => {
        if (!state) state = initState();
        state.rules = DEFAULT_CONTEXT_INFERENCE_RULES;
      });

      And(
        'a pattern at file path {string} with archLayer {string}',
        (_ctx: unknown, filePath: string, archLayer: string) => {
          if (!state) state = initState();
          state.patterns.push(
            createPatternForInference({
              filePath,
              archLayer,
            })
          );
        }
      );

      When('transforming to master dataset with rules', () => {
        if (!state) throw new Error('State not initialized');
        state.dataset = transformToMasterDataset({
          patterns: state.patterns,
          tagRegistry: createDefaultTagRegistry(),
          workflow: undefined,
          contextInferenceRules: state.rules,
        });
      });

      Then(
        'the pattern archContext should be {string}',
        (_ctx: unknown, expectedContext: string) => {
          if (!state?.dataset) throw new Error('Dataset not initialized');
          const contextPatterns = state.dataset.archIndex.byContext[expectedContext] ?? [];
          expect(contextPatterns.map((p) => p.name)).toContain(state.patterns[0].name);
        }
      );

      And(
        'the pattern appears in archIndex byContext under {string}',
        (_ctx: unknown, contextName: string) => {
          if (!state?.dataset) throw new Error('Dataset not initialized');
          const contextPatterns = state.dataset.archIndex.byContext[contextName] ?? [];
          expect(contextPatterns.length).toBeGreaterThan(0);
          expect(contextPatterns.map((p) => p.name)).toContain(state.patterns[0].name);
        }
      );
    });

    RuleScenario(
      'First matching rule wins when multiple could match',
      ({ Given, And, When, Then }) => {
        Given('context inference rules:', (_ctx: unknown, dataTable: DataTableRow[]) => {
          if (!state) state = initState();
          state.rules = dataTable.map((row) => ({
            pattern: row.pattern!,
            context: row.context!,
          }));
        });

        And(
          'a pattern at file path {string} with archLayer {string}',
          (_ctx: unknown, filePath: string, archLayer: string) => {
            if (!state) state = initState();
            state.patterns.push(
              createPatternForInference({
                filePath,
                archLayer,
              })
            );
          }
        );

        When('transforming to master dataset with rules', () => {
          if (!state) throw new Error('State not initialized');
          state.dataset = transformToMasterDataset({
            patterns: state.patterns,
            tagRegistry: createDefaultTagRegistry(),
            workflow: undefined,
            contextInferenceRules: state.rules,
          });
        });

        Then(
          'the pattern archContext should be {string}',
          (_ctx: unknown, expectedContext: string) => {
            if (!state?.dataset) throw new Error('Dataset not initialized');
            const contextPatterns = state.dataset.archIndex.byContext[expectedContext] ?? [];
            expect(contextPatterns.map((p) => p.name)).toContain(state.patterns[0].name);
            // Also verify it's NOT in the "general" context (second rule)
            const generalPatterns = state.dataset.archIndex.byContext['general'] ?? [];
            expect(generalPatterns.map((p) => p.name)).not.toContain(state.patterns[0].name);
          }
        );
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Rule: Explicit archContext is not overridden
  // ---------------------------------------------------------------------------

  Rule('Explicit archContext is not overridden', ({ RuleScenario }) => {
    RuleScenario(
      'Explicit context takes precedence over inference',
      ({ Given, When, Then, And }) => {
        Given('default context inference rules', () => {
          if (!state) state = initState();
          state.rules = DEFAULT_CONTEXT_INFERENCE_RULES;
        });

        And(
          'a pattern at file path {string} with archLayer {string} and archContext {string}',
          (_ctx: unknown, filePath: string, archLayer: string, archContext: string) => {
            if (!state) state = initState();
            state.patterns.push(
              createPatternForInference({
                filePath,
                archLayer,
                archContext,
              })
            );
          }
        );

        When('transforming to master dataset with rules', () => {
          if (!state) throw new Error('State not initialized');
          state.dataset = transformToMasterDataset({
            patterns: state.patterns,
            tagRegistry: createDefaultTagRegistry(),
            workflow: undefined,
            contextInferenceRules: state.rules,
          });
        });

        Then(
          'the pattern archContext should be {string}',
          (_ctx: unknown, expectedContext: string) => {
            if (!state?.dataset) throw new Error('Dataset not initialized');
            const contextPatterns = state.dataset.archIndex.byContext[expectedContext] ?? [];
            expect(contextPatterns.map((p) => p.name)).toContain(state.patterns[0].name);
          }
        );

        And(
          'the pattern appears in archIndex byContext under {string}',
          (_ctx: unknown, contextName: string) => {
            if (!state?.dataset) throw new Error('Dataset not initialized');
            const contextPatterns = state.dataset.archIndex.byContext[contextName] ?? [];
            expect(contextPatterns.map((p) => p.name)).toContain(state.patterns[0].name);
            // Should NOT be in "validation" (inferred would be validation from file path)
            const validationPatterns = state.dataset.archIndex.byContext['validation'] ?? [];
            expect(validationPatterns.map((p) => p.name)).not.toContain(state.patterns[0].name);
          }
        );
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Rule: Inference works independently of archLayer
  // ---------------------------------------------------------------------------

  Rule('Inference works independently of archLayer', ({ RuleScenario }) => {
    RuleScenario(
      'Pattern without archLayer is still added to byContext if context is inferred',
      ({ Given, When, Then, And }) => {
        Given('default context inference rules', () => {
          if (!state) state = initState();
          state.rules = DEFAULT_CONTEXT_INFERENCE_RULES;
        });

        And(
          'a pattern at file path {string} without archLayer',
          (_ctx: unknown, filePath: string) => {
            if (!state) state = initState();
            // Create pattern WITHOUT archLayer
            state.patterns.push(
              createPatternForInference({
                filePath,
                // No archLayer - but inference DOES still happen based on file path
              })
            );
          }
        );

        When('transforming to master dataset with rules', () => {
          if (!state) throw new Error('State not initialized');
          state.dataset = transformToMasterDataset({
            patterns: state.patterns,
            tagRegistry: createDefaultTagRegistry(),
            workflow: undefined,
            contextInferenceRules: state.rules,
          });
        });

        Then('the pattern is in archIndex all', () => {
          if (!state?.dataset) throw new Error('Dataset not initialized');
          // Pattern is in archIndex.all because inferredContext is defined (from file path match)
          expect(state.dataset.archIndex.all.length).toBe(1);
          expect(state.dataset.archIndex.all[0].name).toBe(state.patterns[0].name);
        });

        And(
          'the pattern appears in archIndex byContext under {string}',
          (_ctx: unknown, contextName: string) => {
            if (!state?.dataset) throw new Error('Dataset not initialized');
            const contextPatterns = state.dataset.archIndex.byContext[contextName] ?? [];
            expect(contextPatterns.map((p) => p.name)).toContain(state.patterns[0].name);
          }
        );
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Rule: Default rules map standard directories
  // ---------------------------------------------------------------------------

  Rule('Default rules map standard directories', ({ RuleScenarioOutline }) => {
    RuleScenarioOutline(
      'Default directory mappings',
      ({ Given, And, When, Then }, variables: { filePath: string; expectedContext: string }) => {
        Given('default context inference rules', () => {
          if (!state) state = initState();
          state.rules = DEFAULT_CONTEXT_INFERENCE_RULES;
        });

        And('a pattern at file path "<filePath>" with archLayer "application"', () => {
          if (!state) state = initState();
          state.patterns.push(
            createPatternForInference({
              filePath: variables.filePath,
              archLayer: 'application',
            })
          );
        });

        When('transforming to master dataset with rules', () => {
          if (!state) throw new Error('State not initialized');
          state.dataset = transformToMasterDataset({
            patterns: state.patterns,
            tagRegistry: createDefaultTagRegistry(),
            workflow: undefined,
            contextInferenceRules: state.rules,
          });
        });

        Then('the pattern archContext should be "<expectedContext>"', () => {
          if (!state?.dataset) throw new Error('Dataset not initialized');
          const contextPatterns =
            state.dataset.archIndex.byContext[variables.expectedContext] ?? [];
          expect(contextPatterns.map((p) => p.name)).toContain(state.patterns[0].name);
        });
      }
    );
  });
});
