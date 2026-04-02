/**
 * Generator Registration Step Definitions
 *
 * BDD step definitions for testing the architecture generator
 * registration in the generator registry and CLI invocation.
 *
 * @architect
 */

import { expect } from 'vitest';
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';

import { generatorRegistry } from '../../../src/generators/registry.js';
import { transformToPatternGraph } from '../../../src/generators/pipeline/transform-dataset.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/index.js';
import type { GeneratorContext, GeneratorOutput } from '../../../src/generators/types.js';
import { createDefaultTagRegistry, createTestPattern } from '../../fixtures/dataset-factories.js';
import type { DataTableRow } from '../../support/world.js';

// Import to trigger generator registration (side effect)
import '../../../src/generators/built-in/codec-generators.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface GeneratorRegistrationState {
  patterns: ExtractedPattern[];
  generatorOutput: GeneratorOutput | null;
  codecOptions: Record<string, unknown>;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: GeneratorRegistrationState | null = null;
let patternCounter = 0;

// =============================================================================
// Helper Functions
// =============================================================================

function initState(): GeneratorRegistrationState {
  patternCounter = 0;
  return {
    patterns: [],
    generatorOutput: null,
    codecOptions: {},
  };
}

/**
 * Generate a valid pattern ID matching /^pattern-[a-f0-9]{8}$/
 */
function generatePatternId(): string {
  patternCounter++;
  return `pattern-${patternCounter.toString(16).padStart(8, '0')}`;
}

/**
 * Create a pattern with arch fields
 */
function createPatternWithArch(options: {
  name: string;
  archRole?: string;
  archContext?: string;
  archLayer?: string;
}): ExtractedPattern {
  const basePattern = createTestPattern({
    id: generatePatternId(),
    name: options.name,
    status: 'completed',
  });

  return {
    ...basePattern,
    ...(options.archRole && { archRole: options.archRole }),
    ...(options.archContext && { archContext: options.archContext }),
    ...(options.archLayer && { archLayer: options.archLayer }),
  };
}

/**
 * Run the architecture generator with patterns
 */
async function runArchitectureGenerator(): Promise<void> {
  if (!state) throw new Error('State not initialized');

  const generator = generatorRegistry.get('architecture');
  if (!generator) throw new Error('Architecture generator not found in registry');

  // Build dataset with patterns
  const tagRegistry = createDefaultTagRegistry();
  const patternGraph = transformToPatternGraph({
    patterns: state.patterns,
    tagRegistry,
    workflow: undefined,
  });

  // Create context
  const context: GeneratorContext = {
    baseDir: '/test',
    outputDir: '/test/output',
    registry: tagRegistry,
    patternGraph,
    codecOptions: state.codecOptions,
  };

  state.generatorOutput = await generator.generate(state.patterns, context);
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature(
  'tests/features/behavior/architecture-diagrams/generator-registration.feature'
);

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
    Given('the generator registry is initialized', () => {
      state = initState();
      // Registry is already initialized by the import side effect
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Architecture generator is registered in the registry
  // ---------------------------------------------------------------------------

  Rule('Architecture generator is registered in the registry', ({ RuleScenario }) => {
    RuleScenario('Generator is available in registry', ({ When, Then, And }) => {
      When('checking available generators', () => {
        // Just verify the registry is loaded - actual check is in Then
      });

      Then('the registry contains generator {string}', (_ctx: unknown, name: string) => {
        expect(generatorRegistry.has(name)).toBe(true);
      });

      And('the generator description includes {string}', (_ctx: unknown, expectedDesc: string) => {
        const generator = generatorRegistry.get('architecture');
        expect(generator?.description).toContain(expectedDesc);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Architecture generator produces component diagram by default
  // ---------------------------------------------------------------------------

  Rule('Architecture generator produces component diagram by default', ({ RuleScenario }) => {
    RuleScenario('Default generation produces component diagram', ({ Given, When, Then, And }) => {
      Given(
        'patterns with architecture annotations:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          if (!state) state = initState();
          for (const row of dataTable) {
            state.patterns.push(
              createPatternWithArch({
                name: row.name,
                archRole: row.archRole !== '-' ? row.archRole : undefined,
                archContext: row.archContext !== '-' ? row.archContext : undefined,
              })
            );
          }
        }
      );

      When('the architecture generator runs', async () => {
        await runArchitectureGenerator();
      });

      Then('the output contains file {string}', (_ctx: unknown, filename: string) => {
        const files = state?.generatorOutput?.files ?? [];
        const found = files.some((f) => f.path === filename);
        expect(found).toBe(true);
      });

      And('the file contains required elements:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const files = state?.generatorOutput?.files ?? [];
        const archFile = files.find((f) => f.path === 'ARCHITECTURE.md');
        for (const row of dataTable) {
          expect(archFile?.content).toContain(row.text);
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Architecture generator supports diagram type options
  // ---------------------------------------------------------------------------

  Rule('Architecture generator supports diagram type options', ({ RuleScenario }) => {
    RuleScenario('Generate layered diagram with options', ({ Given, When, Then, And }) => {
      Given(
        'patterns with architecture annotations:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          if (!state) state = initState();
          for (const row of dataTable) {
            state.patterns.push(
              createPatternWithArch({
                name: row.name,
                archRole: row.archRole !== '-' ? row.archRole : undefined,
                archContext: row.archContext !== '-' ? row.archContext : undefined,
                archLayer: row.archLayer !== '-' ? row.archLayer : undefined,
              })
            );
          }
        }
      );

      And('codec options for diagram type {string}', (_ctx: unknown, diagramType: string) => {
        if (!state) state = initState();
        state.codecOptions = {
          architecture: { diagramType },
        };
      });

      When('the architecture generator runs', async () => {
        await runArchitectureGenerator();
      });

      Then('the output contains file {string}', (_ctx: unknown, filename: string) => {
        const files = state?.generatorOutput?.files ?? [];
        const found = files.some((f) => f.path === filename);
        expect(found).toBe(true);
      });

      And('the file contains {string}', (_ctx: unknown, text: string) => {
        const files = state?.generatorOutput?.files ?? [];
        const archFile = files.find((f) => f.path === 'ARCHITECTURE.md');
        expect(archFile?.content).toContain(text);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Rule: Architecture generator supports context filtering
  // ---------------------------------------------------------------------------

  Rule('Architecture generator supports context filtering', ({ RuleScenario }) => {
    RuleScenario('Filter to specific contexts', ({ Given, When, Then, And }) => {
      Given(
        'patterns with architecture annotations:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          if (!state) state = initState();
          for (const row of dataTable) {
            state.patterns.push(
              createPatternWithArch({
                name: row.name,
                archRole: row.archRole !== '-' ? row.archRole : undefined,
                archContext: row.archContext !== '-' ? row.archContext : undefined,
              })
            );
          }
        }
      );

      And('codec options filtering to contexts {string}', (_ctx: unknown, contexts: string) => {
        if (!state) state = initState();
        state.codecOptions = {
          architecture: { filterContexts: contexts.split(',').map((c) => c.trim()) },
        };
      });

      When('the architecture generator runs', async () => {
        await runArchitectureGenerator();
      });

      Then('the file contains {string}', (_ctx: unknown, text: string) => {
        const files = state?.generatorOutput?.files ?? [];
        const archFile = files.find((f) => f.path === 'ARCHITECTURE.md');
        expect(archFile?.content).toContain(text);
      });

      And('the file does not contain {string}', (_ctx: unknown, text: string) => {
        const files = state?.generatorOutput?.files ?? [];
        const archFile = files.find((f) => f.path === 'ARCHITECTURE.md');
        expect(archFile?.content).not.toContain(text);
      });
    });
  });
});
