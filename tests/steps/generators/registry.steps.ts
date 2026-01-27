/**
 * Generator Registry Step Definitions
 *
 * BDD step definitions for testing the GeneratorRegistry class.
 * Tests registration, lookup, duplicate detection, and listing capabilities.
 *
 * Uses Rule() + RuleScenario() pattern as feature file uses Rule: blocks.
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { GeneratorRegistry } from '../../../src/generators/registry.js';
import type {
  DocumentGenerator,
  GeneratorContext,
  GeneratorOutput,
} from '../../../src/generators/types.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/index.js';
import type { DataTableRow } from '../../support/world.js';

// =============================================================================
// State Types
// =============================================================================

interface RegistryState {
  registry: GeneratorRegistry;
  lastGenerator: DocumentGenerator | undefined;
  lastError: Error | null;
  availableList: string[];
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: RegistryState | null = null;

function initState(): RegistryState {
  return {
    registry: new GeneratorRegistry(),
    lastGenerator: undefined,
    lastError: null,
    availableList: [],
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a mock generator for testing
 */
function createMockGenerator(name: string): DocumentGenerator {
  return {
    name,
    description: `Mock ${name} generator for testing`,
    generate: (
      _patterns: readonly ExtractedPattern[],
      _context: GeneratorContext
    ): Promise<GeneratorOutput> => {
      return Promise.resolve({ files: [] });
    },
  };
}

// =============================================================================
// Feature: Generator Registry
// =============================================================================

const feature = await loadFeature('tests/features/generators/registry.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a generator registry test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Rule 1: Registration and Retrieval
  // ===========================================================================

  Rule('Registry manages generator registration and retrieval', ({ RuleScenario }) => {
    RuleScenario('Register generator with unique name', ({ Given, When, Then, And }) => {
      Given('an empty registry', () => {
        // Registry is already empty from initState
        expect(state!.registry.available().length).toBe(0);
      });

      When('registering a generator named {string}', (_ctx: unknown, name: string) => {
        try {
          state!.registry.register(createMockGenerator(name));
        } catch (error) {
          state!.lastError = error as Error;
        }
      });

      Then('the registration should succeed', () => {
        expect(state!.lastError).toBeNull();
      });

      And('the registry should have generator {string}', (_ctx: unknown, name: string) => {
        expect(state!.registry.has(name)).toBe(true);
      });
    });

    RuleScenario('Duplicate registration throws error', ({ Given, When, Then, And }) => {
      Given('a registry with generator {string} registered', (_ctx: unknown, name: string) => {
        state!.registry.register(createMockGenerator(name));
      });

      When('registering a generator named {string} again', (_ctx: unknown, name: string) => {
        try {
          state!.registry.register(createMockGenerator(name));
        } catch (error) {
          state!.lastError = error as Error;
        }
      });

      Then('an error should be thrown', () => {
        expect(state!.lastError).not.toBeNull();
      });

      And('the error message should contain {string}', (_ctx: unknown, expectedText: string) => {
        expect(state!.lastError!.message).toContain(expectedText);
      });
    });

    RuleScenario('Get registered generator', ({ Given, When, Then, And }) => {
      Given('a registry with generators:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          state!.registry.register(createMockGenerator(row.name));
        }
      });

      When('getting generator {string}', (_ctx: unknown, name: string) => {
        state!.lastGenerator = state!.registry.get(name);
      });

      Then('the generator should be returned', () => {
        expect(state!.lastGenerator).toBeDefined();
      });

      And('the generator name should be {string}', (_ctx: unknown, expectedName: string) => {
        expect(state!.lastGenerator!.name).toBe(expectedName);
      });
    });

    RuleScenario('Get unknown generator returns undefined', ({ Given, When, Then }) => {
      Given('a registry with generators:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          state!.registry.register(createMockGenerator(row.name));
        }
      });

      When('getting generator {string}', (_ctx: unknown, name: string) => {
        state!.lastGenerator = state!.registry.get(name);
      });

      Then('undefined should be returned', () => {
        expect(state!.lastGenerator).toBeUndefined();
      });
    });

    RuleScenario('Available returns sorted list', ({ Given, When, Then }) => {
      Given('a registry with generators:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        for (const row of dataTable) {
          state!.registry.register(createMockGenerator(row.name));
        }
      });

      When('calling available', () => {
        state!.availableList = state!.registry.available();
      });

      Then('the list should be:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const expectedList = dataTable.map((row) => row.name);
        expect(state!.availableList).toEqual(expectedList);
      });
    });
  });
});
