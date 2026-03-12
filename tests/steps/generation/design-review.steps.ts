/**
 * Design Review Generation Step Definitions
 *
 * BDD step definitions for testing the design review generation pipeline:
 * - SequenceIndex building from annotated business rules
 * - Step sorting by stepNumber
 * - Participant deduplication with orchestrator first
 * - Data flow type extraction from Input/Output annotations
 * - DesignReviewCodec sequence diagram generation
 * - Error scenario alt block rendering
 * - Component diagram module grouping
 * - Type hexagon rendering with fields
 * - Design questions auto-computed metrics
 * - Case-insensitive process-api sequence lookup
 * - Mermaid-safe escaping across rendered label positions
 *
 * @libar-docs
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  type DesignReviewState,
  initState,
  requireState,
  createSequenceRule,
  createPlainRule,
  buildEntry,
  generateDesignReview,
  resolveSequenceEntry,
} from '../../support/helpers/design-review-state.js';

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: DesignReviewState | null = null;

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/generation/design-review.feature');

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
    Given('a design review test context', () => {
      state = initState();
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: SequenceIndex pre-computes ordered steps from annotated rules
  // ---------------------------------------------------------------------------

  Rule('SequenceIndex pre-computes ordered steps from annotated rules', ({ RuleScenario }) => {
    RuleScenario('SequenceIndex populated for annotated pattern', ({ Given, When, Then, And }) => {
      Given(
        'a pattern with orchestrator {string} and 3 sequence-step rules',
        (_ctx: unknown, orchestrator: string) => {
          const s = requireState(state);
          s.orchestrator = orchestrator;
          s.rules = [
            createSequenceRule({
              name: 'Detect context',
              step: 1,
              modules: ['detect-context'],
              input: 'targetDir: string',
              output: 'ProjectContext -- packageJson, tsconfigExists',
            }),
            createSequenceRule({
              name: 'Run prompts',
              step: 2,
              modules: ['prompts'],
              input: 'ProjectContext',
              output: 'InitConfig -- preset, sources',
            }),
            createSequenceRule({
              name: 'Generate config',
              step: 3,
              modules: ['generate-config'],
              input: 'InitConfig',
              output: 'config file written',
            }),
          ];
        }
      );

      When('building the sequence index entry', () => {
        buildEntry(requireState(state));
      });

      Then('the entry has orchestrator {string}', (_ctx: unknown, expected: string) => {
        const s = requireState(state);
        expect(s.entry).toBeDefined();
        expect(s.entry?.orchestrator).toBe(expected);
      });

      And('the entry has 3 steps', () => {
        const s = requireState(state);
        expect(s.entry?.steps).toHaveLength(3);
      });
    });

    RuleScenario('Steps sorted by step number', ({ Given, When, Then, And }) => {
      Given('rules with step numbers 3 and 1 and 2', () => {
        const s = requireState(state);
        s.orchestrator = 'orchestrator';
        s.rules = [
          createSequenceRule({ name: 'Step C', step: 3, modules: ['mod-c'] }),
          createSequenceRule({ name: 'Step A', step: 1, modules: ['mod-a'] }),
          createSequenceRule({ name: 'Step B', step: 2, modules: ['mod-b'] }),
        ];
      });

      When('building the sequence index entry', () => {
        buildEntry(requireState(state));
      });

      Then('step 1 has stepNumber 1', () => {
        const s = requireState(state);
        expect(s.entry?.steps[0]?.stepNumber).toBe(1);
      });

      And('step 2 has stepNumber 2', () => {
        const s = requireState(state);
        expect(s.entry?.steps[1]?.stepNumber).toBe(2);
      });

      And('step 3 has stepNumber 3', () => {
        const s = requireState(state);
        expect(s.entry?.steps[2]?.stepNumber).toBe(3);
      });
    });

    RuleScenario('Patterns without sequence annotations have no entry', ({ Given, When, Then }) => {
      Given('rules with no sequence-step tags', () => {
        const s = requireState(state);
        s.orchestrator = 'orchestrator';
        s.rules = [createPlainRule('Plain rule A'), createPlainRule('Plain rule B')];
      });

      When('building the sequence index entry', () => {
        buildEntry(requireState(state));
      });

      Then('the entry is undefined', () => {
        const s = requireState(state);
        expect(s.entry).toBeUndefined();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Participants are deduplicated with orchestrator first
  // ---------------------------------------------------------------------------

  Rule('Participants are deduplicated with orchestrator first', ({ RuleScenario }) => {
    RuleScenario('Participants ordered with orchestrator first', ({ Given, When, Then }) => {
      Given(
        'a pattern with orchestrator {string} and modules {string} then {string} then {string}',
        (_ctx: unknown, orchestrator: string, mod1: string, mod2: string, mod3: string) => {
          const s = requireState(state);
          s.orchestrator = orchestrator;
          s.rules = [
            createSequenceRule({ name: 'Step 1', step: 1, modules: [mod1] }),
            createSequenceRule({ name: 'Step 2', step: 2, modules: [mod2] }),
            createSequenceRule({ name: 'Step 3', step: 3, modules: [mod3] }),
          ];
        }
      );

      When('building the sequence index entry', () => {
        buildEntry(requireState(state));
      });

      Then(
        'participants are {string} then {string} then {string}',
        (_ctx: unknown, p1: string, p2: string, p3: string) => {
          const s = requireState(state);
          expect(s.entry?.participants).toEqual([p1, p2, p3]);
        }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Data flow types are extracted from Input and Output annotations
  // ---------------------------------------------------------------------------

  Rule('Data flow types are extracted from Input and Output annotations', ({ RuleScenario }) => {
    RuleScenario('Data flow types collected from annotations', ({ Given, When, Then }) => {
      Given(
        'a rule with Input {string} and Output {string}',
        (_ctx: unknown, input: string, output: string) => {
          const s = requireState(state);
          s.orchestrator = 'orchestrator';
          s.rules = [
            createSequenceRule({
              name: 'Data flow step',
              step: 1,
              modules: ['mod-a'],
              input,
              output,
            }),
          ];
        }
      );

      When('building the sequence index entry', () => {
        buildEntry(requireState(state));
      });

      Then(
        'data flow types include {string} and {string}',
        (_ctx: unknown, type1: string, type2: string) => {
          const s = requireState(state);
          expect(s.entry?.dataFlowTypes).toContain(type1);
          expect(s.entry?.dataFlowTypes).toContain(type2);
        }
      );
    });

    RuleScenario(
      'Prose outputs are excluded from data flow types',
      ({ Given, When, Then, And }) => {
        Given(
          'a rule with Input {string} and Output {string}',
          (_ctx: unknown, input: string, output: string) => {
            const s = requireState(state);
            s.orchestrator = 'orchestrator';
            s.rules = [
              createSequenceRule({
                name: 'Filtered data flow step',
                step: 1,
                modules: ['mod-a'],
                input,
                output,
              }),
            ];
          }
        );

        When('building the sequence index entry', () => {
          buildEntry(requireState(state));
        });

        Then('data flow types include {string}', (_ctx: unknown, expected: string) => {
          const s = requireState(state);
          expect(s.entry?.dataFlowTypes).toContain(expected);
        });

        And('data flow types do not include {string}', (_ctx: unknown, expected: string) => {
          const s = requireState(state);
          expect(s.entry?.dataFlowTypes).not.toContain(expected);
        });
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Rule: DesignReviewCodec produces sequence diagram with correct participant count
  // ---------------------------------------------------------------------------

  Rule(
    'DesignReviewCodec produces sequence diagram with correct participant count',
    ({ RuleScenario }) => {
      RuleScenario('Sequence diagram has correct participant count', ({ Given, When, Then }) => {
        Given('a dataset with a pattern having orchestrator and 2 distinct modules', () => {
          const s = requireState(state);
          s.orchestrator = 'main-orch';
          s.patternName = 'TestPattern';
          s.rules = [
            createSequenceRule({
              name: 'Step A',
              step: 1,
              modules: ['module-alpha'],
              input: 'InputA',
              output: 'OutputA',
            }),
            createSequenceRule({
              name: 'Step B',
              step: 2,
              modules: ['module-beta'],
              input: 'InputB',
              output: 'OutputB',
            }),
          ];
        });

        When('generating the design review document', () => {
          generateDesignReview(requireState(state));
        });

        Then('the sequence diagram declares 4 participants', () => {
          const s = requireState(state);
          // 4 participants: User + main-orch + module-alpha + module-beta
          const participantMatches = s.markdown.match(/participant /g);
          expect(participantMatches).toHaveLength(4);
        });
      });
    }
  );

  // ---------------------------------------------------------------------------
  // Rule: Error scenarios produce alt blocks in sequence diagrams
  // ---------------------------------------------------------------------------

  Rule('Error scenarios produce alt blocks in sequence diagrams', ({ RuleScenario }) => {
    RuleScenario('Error scenarios produce alt blocks in output', ({ Given, When, Then, And }) => {
      Given(
        'a step with error scenarios {string} and {string}',
        (_ctx: unknown, err1: string, err2: string) => {
          const s = requireState(state);
          s.orchestrator = 'orch';
          s.patternName = 'TestPattern';
          s.rules = [
            createSequenceRule({
              name: 'Error step',
              step: 1,
              modules: ['error-mod'],
              input: 'SomeInput',
              output: 'SomeOutput',
              errorScenarios: [err1, err2],
            }),
          ];
        }
      );

      When('generating the design review document', () => {
        generateDesignReview(requireState(state));
      });

      Then('the rendered markdown contains {string}', (_ctx: unknown, expected: string) => {
        const s = requireState(state);
        expect(s.markdown).toContain(expected);
      });

      And('the rendered markdown contains {string}', (_ctx: unknown, expected: string) => {
        const s = requireState(state);
        expect(s.markdown).toContain(expected);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Component diagram groups modules by shared input type
  // ---------------------------------------------------------------------------

  Rule('Component diagram groups modules by shared input type', ({ RuleScenario }) => {
    RuleScenario('Modules with same input grouped together', ({ Given, When, Then }) => {
      Given('2 steps both with Input {string}', (_ctx: unknown, input: string) => {
        const s = requireState(state);
        s.orchestrator = 'orch';
        s.patternName = 'TestPattern';
        s.rules = [
          createSequenceRule({
            name: 'Config step A',
            step: 1,
            modules: ['config-reader'],
            input,
            output: 'OutputA -- fieldA',
          }),
          createSequenceRule({
            name: 'Config step B',
            step: 2,
            modules: ['config-writer'],
            input,
            output: 'OutputB -- fieldB',
          }),
        ];
      });

      When('generating the design review document', () => {
        generateDesignReview(requireState(state));
      });

      Then(
        'the component diagram contains a subgraph labeled {string}',
        (_ctx: unknown, label: string) => {
          const s = requireState(state);
          expect(s.markdown).toContain(`"Phase 1: ${label}"`);
        }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Type hexagons show field definitions from Output annotations
  // ---------------------------------------------------------------------------

  Rule('Type hexagons show field definitions from Output annotations', ({ RuleScenario }) => {
    RuleScenario('Type hexagon rendered with fields', ({ Given, When, Then }) => {
      Given('a step with Output {string}', (_ctx: unknown, output: string) => {
        const s = requireState(state);
        s.orchestrator = 'orch';
        s.patternName = 'TestPattern';
        s.rules = [
          createSequenceRule({
            name: 'Validate step',
            step: 1,
            modules: ['validator'],
            input: 'SomeInput',
            output,
          }),
        ];
      });

      When('generating the design review document', () => {
        generateDesignReview(requireState(state));
      });

      Then(
        'the component diagram contains a hexagon for {string} with fields',
        (_ctx: unknown, typeName: string) => {
          const s = requireState(state);
          // Hexagons use {{ }} syntax in Mermaid
          expect(s.markdown).toContain(typeName);
          expect(s.markdown).toContain('{{');
        }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Mermaid-sensitive text is escaped across rendered labels
  // ---------------------------------------------------------------------------

  Rule('Mermaid-sensitive text is escaped across rendered labels', ({ RuleScenario }) => {
    RuleScenario(
      'Mermaid-sensitive text is escaped in rendered markdown',
      ({ Given, When, Then, And }) => {
        Given('a rule with Mermaid-sensitive annotations', () => {
          const s = requireState(state);
          s.orchestrator = 'orch';
          s.patternName = 'TestPattern';
          s.rules = [
            createSequenceRule({
              name: 'Config "Draft" | Preview',
              step: 1,
              modules: ['module|"alpha'],
              input: 'Config "Draft" | Preview %% comment',
              output: 'SetupResult|"Quoted" -- field|"one", "two"',
            }),
          ];
        });

        When('generating the design review document', () => {
          generateDesignReview(requireState(state));
        });

        Then('the rendered markdown contains {string}', (_ctx: unknown, expected: string) => {
          const s = requireState(state);
          expect(s.markdown).toContain(expected);
        });

        And('the rendered markdown contains {string}', (_ctx: unknown, expected: string) => {
          const s = requireState(state);
          expect(s.markdown).toContain(expected);
        });

        And('the rendered markdown also contains {string}', (_ctx: unknown, expected: string) => {
          const s = requireState(state);
          expect(s.markdown).toContain(expected);
        });

        And(
          'the rendered markdown does not contain {string}',
          (_ctx: unknown, unexpected: string) => {
            const s = requireState(state);
            expect(s.markdown).not.toContain(unexpected);
          }
        );
      }
    );
  });

  // ---------------------------------------------------------------------------
  // Rule: Design questions table includes auto-computed metrics
  // ---------------------------------------------------------------------------

  Rule('Design questions table includes auto-computed metrics', ({ RuleScenario }) => {
    RuleScenario('Design questions table has correct metrics', ({ Given, When, Then }) => {
      Given('a dataset with 3 steps and 2 types and 1 error path', () => {
        const s = requireState(state);
        s.orchestrator = 'orch';
        s.patternName = 'TestPattern';
        s.rules = [
          createSequenceRule({
            name: 'Step 1',
            step: 1,
            modules: ['mod-a'],
            input: 'InputA',
            output: 'TypeAlpha -- fieldX, fieldY',
            errorScenarios: ['Error case'],
          }),
          createSequenceRule({
            name: 'Step 2',
            step: 2,
            modules: ['mod-b'],
            input: 'InputB',
            output: 'TypeBeta -- fieldZ',
          }),
          createSequenceRule({
            name: 'Step 3',
            step: 3,
            modules: ['mod-c'],
            input: 'InputC',
            output: 'plain output no dash',
          }),
        ];
      });

      When('generating the design review document', () => {
        generateDesignReview(requireState(state));
      });

      Then(
        'the design questions mention {string} and {string} and {string}',
        (_ctx: unknown, steps: string, types: string, errors: string) => {
          const s = requireState(state);
          expect(s.markdown).toContain(steps);
          expect(s.markdown).toContain(types);
          expect(s.markdown).toContain(errors);
        }
      );
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Process API sequence lookup resolves pattern names case-insensitively
  // ---------------------------------------------------------------------------

  Rule(
    'Process API sequence lookup resolves pattern names case-insensitively',
    ({ RuleScenario }) => {
      RuleScenario(
        'Sequence lookup accepts lowercase pattern name',
        ({ Given, When, Then, And }) => {
          Given(
            'a dataset with sequence data for pattern {string}',
            (_ctx: unknown, patternName: string) => {
              const s = requireState(state);
              s.orchestrator = 'init-cli';
              s.patternName = patternName;
              s.rules = [
                createSequenceRule({
                  name: 'Lookup step',
                  step: 1,
                  modules: ['lookup-module'],
                  input: 'LookupInput',
                  output: 'LookupOutput',
                }),
              ];
            }
          );

          When(
            'resolving sequence data for pattern name {string}',
            (_ctx: unknown, patternName: string) => {
              resolveSequenceEntry(requireState(state), patternName);
            }
          );

          Then('the resolved sequence entry exists', () => {
            const s = requireState(state);
            expect(s.entry).toBeDefined();
          });

          And(
            'the resolved sequence entry has orchestrator {string}',
            (_ctx: unknown, expected: string) => {
              const s = requireState(state);
              expect(s.entry?.orchestrator).toBe(expected);
            }
          );
        }
      );
    }
  );
});
