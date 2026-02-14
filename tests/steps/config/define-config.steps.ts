/**
 * Define Config Step Definitions
 *
 * BDD step definitions for testing the defineConfig identity function,
 * DeliveryProcessProjectConfigSchema Zod validation, and type guard functions.
 *
 * @libar-docs
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { defineConfig } from '../../../src/config/define-config.js';
import {
  DeliveryProcessProjectConfigSchema,
  GeneratorSourceOverrideSchema,
  isProjectConfig,
  isLegacyInstance,
} from '../../../src/config/project-config-schema.js';
import type { DeliveryProcessProjectConfig } from '../../../src/config/project-config.js';

// =============================================================================
// Types
// =============================================================================

interface DefineConfigState {
  inputConfig: DeliveryProcessProjectConfig | null;
  resultConfig: DeliveryProcessProjectConfig | null;
  validationResult: { success: boolean; error?: { issues: Array<{ message: string }> } } | null;
  overrideValidationResult: {
    success: boolean;
    error?: { issues: Array<{ message: string }> };
  } | null;
  typeGuardResult: boolean | null;
  testObject: unknown;
}

// =============================================================================
// Module State
// =============================================================================

let state: DefineConfigState | null = null;

function initState(): DefineConfigState {
  return {
    inputConfig: null,
    resultConfig: null,
    validationResult: null,
    overrideValidationResult: null,
    typeGuardResult: null,
    testObject: null,
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/config/define-config.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  AfterEachScenario(() => {
    state = null;
  });

  // ---------------------------------------------------------------------------
  // Background
  // ---------------------------------------------------------------------------

  Background(({ Given }) => {
    Given('a define-config test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // defineConfig identity
  // ===========================================================================

  Rule('defineConfig is an identity function', ({ RuleScenario }) => {
    RuleScenario('defineConfig returns input unchanged', ({ Given, When, Then }) => {
      Given('a project config with preset "libar-generic"', () => {
        state!.inputConfig = { preset: 'libar-generic' };
      });

      When('calling defineConfig with the config', () => {
        state!.resultConfig = defineConfig(state!.inputConfig!);
      });

      Then('the result should be the exact same object', () => {
        expect(state!.resultConfig).toBe(state!.inputConfig);
      });
    });
  });

  // ===========================================================================
  // Schema validates correct configs
  // ===========================================================================

  Rule('Schema validates correct configurations', ({ RuleScenario }) => {
    RuleScenario('Valid minimal config passes validation', ({ Given, When, Then }) => {
      Given('a config object with only preset "libar-generic"', () => {
        state!.testObject = { preset: 'libar-generic' };
      });

      When('validating against DeliveryProcessProjectConfigSchema', () => {
        state!.validationResult = DeliveryProcessProjectConfigSchema.safeParse(state!.testObject);
      });

      Then('validation should succeed', () => {
        expect(state!.validationResult!.success).toBe(true);
      });
    });

    RuleScenario('Valid full config passes validation', ({ Given, When, Then }) => {
      Given('a config object with all fields populated', () => {
        state!.testObject = {
          preset: 'ddd-es-cqrs',
          tagPrefix: '@custom-',
          fileOptInTag: '@custom',
          categories: [
            { tag: 'core', domain: 'Core', priority: 1, description: 'Core patterns', aliases: [] },
          ],
          sources: {
            typescript: ['src/**/*.ts'],
            features: ['specs/**/*.feature'],
            stubs: ['stubs/**/*.ts'],
            exclude: ['node_modules/**'],
          },
          output: {
            directory: 'docs-output',
            overwrite: true,
          },
          generators: ['patterns', 'roadmap'],
          generatorOverrides: {
            changelog: {
              additionalFeatures: ['releases/**/*.feature'],
            },
          },
          contextInferenceRules: [{ pattern: 'src/custom/**', context: 'custom' }],
          workflowPath: 'workflow.json',
        };
      });

      When('validating against DeliveryProcessProjectConfigSchema', () => {
        state!.validationResult = DeliveryProcessProjectConfigSchema.safeParse(state!.testObject);
      });

      Then('validation should succeed', () => {
        expect(state!.validationResult!.success).toBe(true);
      });
    });
  });

  // ===========================================================================
  // Schema rejects invalid configs
  // ===========================================================================

  Rule('Schema rejects invalid configurations', ({ RuleScenario }) => {
    RuleScenario('Empty glob pattern rejected', ({ Given, When, Then, And }) => {
      Given('a config with an empty string in typescript sources', () => {
        state!.testObject = {
          sources: {
            typescript: [''],
          },
        };
      });

      When('validating against DeliveryProcessProjectConfigSchema', () => {
        state!.validationResult = DeliveryProcessProjectConfigSchema.safeParse(state!.testObject);
      });

      Then('validation should fail', () => {
        expect(state!.validationResult!.success).toBe(false);
      });

      And('the validation error should contain "empty"', () => {
        const errorMessages = state!
          .validationResult!.error!.issues.map((i) => i.message)
          .join('; ');
        expect(errorMessages.toLowerCase()).toContain('empty');
      });
    });

    RuleScenario('Parent directory traversal rejected in globs', ({ Given, When, Then, And }) => {
      Given('a config with a glob containing ".."', () => {
        state!.testObject = {
          sources: {
            typescript: ['../outside/**/*.ts'],
          },
        };
      });

      When('validating against DeliveryProcessProjectConfigSchema', () => {
        state!.validationResult = DeliveryProcessProjectConfigSchema.safeParse(state!.testObject);
      });

      Then('validation should fail', () => {
        expect(state!.validationResult!.success).toBe(false);
      });

      And('the validation error should contain "parent directory traversal"', () => {
        const errorMessages = state!
          .validationResult!.error!.issues.map((i) => i.message)
          .join('; ');
        expect(errorMessages.toLowerCase()).toContain('parent directory traversal');
      });
    });

    RuleScenario(
      'replaceFeatures and additionalFeatures mutually exclusive',
      ({ Given, When, Then, And }) => {
        Given('a generator override with both replaceFeatures and additionalFeatures', () => {
          state!.testObject = {
            replaceFeatures: ['replace/**/*.feature'],
            additionalFeatures: ['extra/**/*.feature'],
          };
        });

        When('validating the generator override against schema', () => {
          state!.overrideValidationResult = GeneratorSourceOverrideSchema.safeParse(
            state!.testObject
          );
        });

        Then('validation should fail', () => {
          expect(state!.overrideValidationResult!.success).toBe(false);
        });

        And('the validation error should contain "mutually exclusive"', () => {
          const errorMessages = state!
            .overrideValidationResult!.error!.issues.map((i) => i.message)
            .join('; ');
          expect(errorMessages.toLowerCase()).toContain('mutually exclusive');
        });
      }
    );

    RuleScenario('Invalid preset name rejected', ({ Given, When, Then }) => {
      Given('a config object with preset "nonexistent-preset"', () => {
        state!.testObject = { preset: 'nonexistent-preset' };
      });

      When('validating against DeliveryProcessProjectConfigSchema', () => {
        state!.validationResult = DeliveryProcessProjectConfigSchema.safeParse(state!.testObject);
      });

      Then('validation should fail', () => {
        expect(state!.validationResult!.success).toBe(false);
      });
    });

    RuleScenario('Unknown fields rejected in strict mode', ({ Given, When, Then }) => {
      Given('a config object with an unknown field "foobar"', () => {
        state!.testObject = { preset: 'libar-generic', foobar: 'baz' };
      });

      When('validating against DeliveryProcessProjectConfigSchema', () => {
        state!.validationResult = DeliveryProcessProjectConfigSchema.safeParse(state!.testObject);
      });

      Then('validation should fail', () => {
        expect(state!.validationResult!.success).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Type guards
  // ===========================================================================

  Rule('Type guards distinguish config formats', ({ RuleScenario }) => {
    RuleScenario('isProjectConfig returns true for new-style config', ({ Given, When, Then }) => {
      Given('a new-style config object with sources field', () => {
        state!.testObject = { sources: { typescript: ['src/**/*.ts'] } };
      });

      When('checking isProjectConfig', () => {
        state!.typeGuardResult = isProjectConfig(state!.testObject);
      });

      Then('the result should be true', () => {
        expect(state!.typeGuardResult).toBe(true);
      });
    });

    RuleScenario('isProjectConfig returns false for legacy instance', ({ Given, When, Then }) => {
      Given('a legacy instance object with registry and regexBuilders', () => {
        state!.testObject = {
          registry: { tagPrefix: '@docs-' },
          regexBuilders: { category: (): RegExp => /@docs-core/ },
        };
      });

      When('checking isProjectConfig', () => {
        state!.typeGuardResult = isProjectConfig(state!.testObject);
      });

      Then('the result should be false', () => {
        expect(state!.typeGuardResult).toBe(false);
      });
    });

    RuleScenario('isLegacyInstance returns true for legacy objects', ({ Given, When, Then }) => {
      Given('a legacy instance object with registry and regexBuilders', () => {
        state!.testObject = {
          registry: { tagPrefix: '@docs-' },
          regexBuilders: { category: (): RegExp => /@docs-core/ },
        };
      });

      When('checking isLegacyInstance', () => {
        state!.typeGuardResult = isLegacyInstance(state!.testObject);
      });

      Then('the result should be true', () => {
        expect(state!.typeGuardResult).toBe(true);
      });
    });

    RuleScenario('isLegacyInstance returns false for new-style config', ({ Given, When, Then }) => {
      Given('a new-style config object with sources field', () => {
        state!.testObject = { sources: { typescript: ['src/**/*.ts'] } };
      });

      When('checking isLegacyInstance', () => {
        state!.typeGuardResult = isLegacyInstance(state!.testObject);
      });

      Then('the result should be false', () => {
        expect(state!.typeGuardResult).toBe(false);
      });
    });
  });
});
