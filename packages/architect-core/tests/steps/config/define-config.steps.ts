import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  defineConfig,
  ArchitectProjectConfigSchema,
  GeneratorSourceOverrideSchema,
  isProjectConfig,
  type ArchitectProjectConfig,
} from '../../../src/index.js';

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

const feature = await loadFeature('tests/features/config/define-config.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a define-config test context', () => {
      state = initState();
    });
  });

  Rule('defineConfig is an identity function', ({ RuleScenario }) => {
    RuleScenario('defineConfig returns input unchanged', ({ Given, When, Then }) => {
      Given('a project config with only tagPrefix {string}', (_ctx: unknown, tagPrefix: string) => {
        state!.inputConfig = { tagPrefix };
      });

      When('calling defineConfig with the config', () => {
        state!.resultConfig = defineConfig(state!.inputConfig!);
      });

      Then('the result should be the exact same object', () => {
        expect(state!.resultConfig).toBe(state!.inputConfig);
      });
    });
  });

  Rule('Schema validates correct configurations', ({ RuleScenario }) => {
    RuleScenario('Valid minimal config passes validation', ({ Given, When, Then }) => {
      Given('a config object with only tagPrefix {string}', (_ctx: unknown, tagPrefix: string) => {
        state!.testObject = { tagPrefix };
      });

      When('validating against ArchitectProjectConfigSchema', () => {
        state!.validationResult = ArchitectProjectConfigSchema.safeParse(state!.testObject);
      });

      Then('validation should succeed', () => {
        expect(state!.validationResult!.success).toBe(true);
      });
    });

    RuleScenario('Valid minimal file-opt-in config passes validation', ({ Given, When, Then }) => {
      Given(
        'a config object with only fileOptInTag {string}',
        (_ctx: unknown, fileOptInTag: string) => {
          state!.testObject = { fileOptInTag };
        },
      );

      When('validating against ArchitectProjectConfigSchema', () => {
        state!.validationResult = ArchitectProjectConfigSchema.safeParse(state!.testObject);
      });

      Then('validation should succeed', () => {
        expect(state!.validationResult!.success).toBe(true);
      });
    });

    RuleScenario('Reference-doc config is rejected in core', ({ Given, When, Then }) => {
      Given('a config object with referenceDocConfigs only', () => {
        state!.testObject = { referenceDocConfigs: [] };
      });

      When('validating against ArchitectProjectConfigSchema', () => {
        state!.validationResult = ArchitectProjectConfigSchema.safeParse(state!.testObject);
      });

      Then('validation should fail', () => {
        expect(state!.validationResult!.success).toBe(false);
      });
    });

    RuleScenario('Valid full config passes validation', ({ Given, When, Then }) => {
      Given('a config object with all fields populated', () => {
        state!.testObject = {
          tagPrefix: '@custom-',
          fileOptInTag: '@custom',
          roles: [{ tag: 'service', domain: 'Service', priority: 1 }],
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

  Rule('Schema rejects invalid configurations', ({ RuleScenario }) => {
    RuleScenario('Empty glob pattern rejected', ({ Given, When, Then, And }) => {
      Given('a config with an empty string in typescript sources', () => {
        state!.testObject = { sources: { typescript: [''] } };
      });

      When('validating against ArchitectProjectConfigSchema', () => {
        state!.validationResult = ArchitectProjectConfigSchema.safeParse(state!.testObject);
      });

      Then('validation should fail', () => {
        expect(state!.validationResult!.success).toBe(false);
      });

      And('the validation error should contain {string}', (_ctx: unknown, text: string) => {
        expect(
          state!.validationResult!.error!.issues.map((issue) => issue.message).join('; '),
        ).toContain(text);
      });
    });

    RuleScenario('Parent directory traversal rejected in globs', ({ Given, When, Then, And }) => {
      Given('a config with a glob containing {string}', (_ctx: unknown, fragment: string) => {
        state!.testObject = { sources: { typescript: [`${fragment}/outside/**/*.ts`] } };
      });

      When('validating against ArchitectProjectConfigSchema', () => {
        state!.validationResult = ArchitectProjectConfigSchema.safeParse(state!.testObject);
      });

      Then('validation should fail', () => {
        expect(state!.validationResult!.success).toBe(false);
      });

      And('the validation error should contain {string}', (_ctx: unknown, text: string) => {
        expect(
          state!.validationResult!.error!.issues.map((issue) => issue.message).join('; '),
        ).toContain(text);
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
            state!.testObject,
          );
        });

        Then('validation should fail', () => {
          expect(state!.overrideValidationResult!.success).toBe(false);
        });

        And('the validation error should contain {string}', (_ctx: unknown, text: string) => {
          expect(
            state!.overrideValidationResult!.error!.issues.map((issue) => issue.message).join('; '),
          ).toContain(text);
        });
      },
    );

    RuleScenario('Removed preset field rejected', ({ Given, When, Then }) => {
      Given('a config object with removed preset field', () => {
        state!.testObject = { preset: 'libar-generic' };
      });

      When('validating against ArchitectProjectConfigSchema', () => {
        state!.validationResult = ArchitectProjectConfigSchema.safeParse(state!.testObject);
      });

      Then('validation should fail', () => {
        expect(state!.validationResult!.success).toBe(false);
      });
    });

    RuleScenario('Removed categories field rejected', ({ Given, When, Then }) => {
      Given('a config object with removed categories field', () => {
        state!.testObject = {
          categories: [
            { tag: 'core', domain: 'Core', priority: 1, description: 'Core patterns', aliases: [] },
          ],
        };
      });

      When('validating against ArchitectProjectConfigSchema', () => {
        state!.validationResult = ArchitectProjectConfigSchema.safeParse(state!.testObject);
      });

      Then('validation should fail', () => {
        expect(state!.validationResult!.success).toBe(false);
      });
    });

    RuleScenario('Unknown fields rejected in strict mode', ({ Given, When, Then }) => {
      Given('a config object with an unknown field {string}', (_ctx: unknown, field: string) => {
        state!.testObject = { roles: [], [field]: 'baz' };
      });

      When('validating against ArchitectProjectConfigSchema', () => {
        state!.validationResult = ArchitectProjectConfigSchema.safeParse(state!.testObject);
      });

      Then('validation should fail', () => {
        expect(state!.validationResult!.success).toBe(false);
      });
    });
  });

  Rule('Type guard validates config format', ({ RuleScenario }) => {
    RuleScenario('isProjectConfig returns true for minimal config', ({ Given, When, Then }) => {
      Given('a config object with only tagPrefix {string}', (_ctx: unknown, tagPrefix: string) => {
        state!.testObject = { tagPrefix };
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
        Given(
          'a config object with only fileOptInTag {string}',
          (_ctx: unknown, fileOptInTag: string) => {
            state!.testObject = { fileOptInTag };
          },
        );

        When('checking isProjectConfig', () => {
          state!.typeGuardResult = isProjectConfig(state!.testObject);
        });

        Then('the result should be true', () => {
          expect(state!.typeGuardResult).toBe(true);
        });
      },
    );

    RuleScenario(
      'isProjectConfig returns false for reference-doc config',
      ({ Given, When, Then }) => {
        Given('a config object with referenceDocConfigs only', () => {
          state!.testObject = { referenceDocConfigs: [] };
        });

        When('checking isProjectConfig', () => {
          state!.typeGuardResult = isProjectConfig(state!.testObject);
        });

        Then('the result should be false', () => {
          expect(state!.typeGuardResult).toBe(false);
        });
      },
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
