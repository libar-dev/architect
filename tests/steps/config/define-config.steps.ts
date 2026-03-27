/**
 * Define Config Step Definitions
 *
 * BDD step definitions for testing the defineConfig identity function,
 * ArchitectProjectConfigSchema Zod validation, and type guard functions.
 *
 * @architect
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { defineConfig } from '../../../src/config/define-config.js';
import {
  ArchitectProjectConfigSchema,
  GeneratorSourceOverrideSchema,
  isProjectConfig,
} from '../../../src/config/project-config-schema.js';
import type { ArchitectProjectConfig } from '../../../src/config/project-config.js';

// =============================================================================
// Types
// =============================================================================

interface DefineConfigState {
  inputConfig: ArchitectProjectConfig | null;
  resultConfig: ArchitectProjectConfig | null;
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
      Given('a project config with only tagPrefix "@custom-"', () => {
        state!.inputConfig = { tagPrefix: '@custom-' };
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
      Given('a config object with only tagPrefix "@custom-"', () => {
        state!.testObject = { tagPrefix: '@custom-' };
      });

      When('validating against ArchitectProjectConfigSchema', () => {
        state!.validationResult = ArchitectProjectConfigSchema.safeParse(state!.testObject);
      });

      Then('validation should succeed', () => {
        expect(state!.validationResult!.success).toBe(true);
      });
    });

    RuleScenario('Valid minimal file-opt-in config passes validation', ({ Given, When, Then }) => {
      Given('a config object with only fileOptInTag "@custom"', () => {
        state!.testObject = { fileOptInTag: '@custom' };
      });

      When('validating against ArchitectProjectConfigSchema', () => {
        state!.validationResult = ArchitectProjectConfigSchema.safeParse(state!.testObject);
      });

      Then('validation should succeed', () => {
        expect(state!.validationResult!.success).toBe(true);
      });
    });

    RuleScenario('Valid reference-doc config passes validation', ({ Given, When, Then }) => {
      Given('a config object with referenceDocConfigs only', () => {
        state!.testObject = { referenceDocConfigs: [] };
      });

      When('validating against ArchitectProjectConfigSchema', () => {
        state!.validationResult = ArchitectProjectConfigSchema.safeParse(state!.testObject);
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

      When('validating against ArchitectProjectConfigSchema', () => {
        state!.validationResult = ArchitectProjectConfigSchema.safeParse(state!.testObject);
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

      When('validating against ArchitectProjectConfigSchema', () => {
        state!.validationResult = ArchitectProjectConfigSchema.safeParse(state!.testObject);
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

      When('validating against ArchitectProjectConfigSchema', () => {
        state!.validationResult = ArchitectProjectConfigSchema.safeParse(state!.testObject);
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

      When('validating against ArchitectProjectConfigSchema', () => {
        state!.validationResult = ArchitectProjectConfigSchema.safeParse(state!.testObject);
      });

      Then('validation should fail', () => {
        expect(state!.validationResult!.success).toBe(false);
      });
    });

    RuleScenario('Legacy preset alias rejected', ({ Given, When, Then }) => {
      Given('a config object with preset "generic"', () => {
        state!.testObject = { preset: 'generic' };
      });

      When('validating against ArchitectProjectConfigSchema', () => {
        state!.validationResult = ArchitectProjectConfigSchema.safeParse(state!.testObject);
      });

      Then('validation should fail', () => {
        expect(state!.validationResult!.success).toBe(false);
      });
    });

    RuleScenario('Unknown fields rejected in strict mode', ({ Given, When, Then }) => {
      Given('a config object with an unknown field "foobar"', () => {
        state!.testObject = { preset: 'libar-generic', foobar: 'baz' };
      });

      When('validating against ArchitectProjectConfigSchema', () => {
        state!.validationResult = ArchitectProjectConfigSchema.safeParse(state!.testObject);
      });

      Then('validation should fail', () => {
        expect(state!.validationResult!.success).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Type guards
  // ===========================================================================

  Rule('Type guard validates config format', ({ RuleScenario }) => {
    RuleScenario('isProjectConfig returns true for minimal config', ({ Given, When, Then }) => {
      Given('a config object with only tagPrefix "@custom-"', () => {
        state!.testObject = { tagPrefix: '@custom-' };
      });

      When('checking isProjectConfig', () => {
        state!.typeGuardResult = isProjectConfig(state!.testObject);
      });

      Then('the result should be true', () => {
        expect(state!.typeGuardResult).toBe(true);
      });
    });

    RuleScenario(
      'isProjectConfig returns true for file-opt-in-only config',
      ({ Given, When, Then }) => {
        Given('a config object with only fileOptInTag "@custom"', () => {
          state!.testObject = { fileOptInTag: '@custom' };
        });

        When('checking isProjectConfig', () => {
          state!.typeGuardResult = isProjectConfig(state!.testObject);
        });

        Then('the result should be true', () => {
          expect(state!.typeGuardResult).toBe(true);
        });
      }
    );

    RuleScenario(
      'isProjectConfig returns true for reference-doc config',
      ({ Given, When, Then }) => {
        Given('a config object with referenceDocConfigs only', () => {
          state!.testObject = { referenceDocConfigs: [] };
        });

        When('checking isProjectConfig', () => {
          state!.typeGuardResult = isProjectConfig(state!.testObject);
        });

        Then('the result should be true', () => {
          expect(state!.typeGuardResult).toBe(true);
        });
      }
    );

    RuleScenario('isProjectConfig returns false for non-config object', ({ Given, When, Then }) => {
      Given('an object with registry and regexBuilders only', () => {
        state!.testObject = {
          registry: { tagPrefix: '@test-' },
          regexBuilders: { category: (): RegExp => /@test-core/ },
        };
      });

      When('checking isProjectConfig', () => {
        state!.typeGuardResult = isProjectConfig(state!.testObject);
      });

      Then('the result should be false', () => {
        expect(state!.typeGuardResult).toBe(false);
      });
    });
  });
});
