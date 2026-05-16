import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import {
  createArchitect,
  createRegexBuilders,
  type RegexBuilders,
  type TagRegistry,
} from '../../../src/index.js';

type DataTableRow = Record<string, string>;

interface ConfigurationTestState {
  registry: TagRegistry | null;
  regexBuilders: RegexBuilders | null;
  content: string;
  result: boolean | null;
  normalizedTag: string | null;
}

let state: ConfigurationTestState | null = null;

function initState(): ConfigurationTestState {
  return {
    registry: null,
    regexBuilders: null,
    content: '',
    result: null,
    normalizedTag: null,
  };
}

function requireRegistry(): TagRegistry {
  expect(state?.registry).not.toBeNull();
  return state!.registry!;
}

const feature = await loadFeature('tests/features/config/configuration-api.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a clean configuration environment', () => {
      state = initState();
    });
  });

  Rule('Factory creates configured instances with correct defaults', ({ RuleScenario }) => {
    RuleScenario('Create with no arguments uses DEFAULT_ROLES', ({ When, Then, And }) => {
      When('I call createArchitect without arguments', () => {
        state!.registry = createArchitect().registry;
      });

      Then('the registry tagPrefix should be {string}', (_ctx: unknown, tagPrefix: string) => {
        expect(requireRegistry().tagPrefix).toBe(tagPrefix);
      });

      And('the registry fileOptInTag should be {string}', (_ctx: unknown, fileOptInTag: string) => {
        expect(requireRegistry().fileOptInTag).toBe(fileOptInTag);
      });

      And('the registry should have exactly {int} roles', (_ctx: unknown, count: number) => {
        expect(requireRegistry().roles).toHaveLength(count);
      });
    });

    RuleScenario('Create with explicit empty roles disables defaults', ({ When, Then, And }) => {
      When('I call createArchitect with explicit empty roles', () => {
        state!.registry = createArchitect({ roles: [] }).registry;
      });

      Then('the registry tagPrefix should be {string}', (_ctx: unknown, tagPrefix: string) => {
        expect(requireRegistry().tagPrefix).toBe(tagPrefix);
      });

      And('the registry fileOptInTag should be {string}', (_ctx: unknown, fileOptInTag: string) => {
        expect(requireRegistry().fileOptInTag).toBe(fileOptInTag);
      });

      And('the registry should have exactly {int} roles', (_ctx: unknown, count: number) => {
        expect(requireRegistry().roles).toHaveLength(count);
      });
    });

    RuleScenario('Create with explicit custom roles', ({ When, Then, And }) => {
      When('I call createArchitect with one explicit custom role', () => {
        state!.registry = createArchitect({
          roles: [{ tag: 'service', domain: 'Service', priority: 1 }],
        }).registry;
      });

      Then('the registry tagPrefix should be {string}', (_ctx: unknown, tagPrefix: string) => {
        expect(requireRegistry().tagPrefix).toBe(tagPrefix);
      });

      And('the registry fileOptInTag should be {string}', (_ctx: unknown, fileOptInTag: string) => {
        expect(requireRegistry().fileOptInTag).toBe(fileOptInTag);
      });

      And('the registry should have exactly {int} roles', (_ctx: unknown, count: number) => {
        expect(requireRegistry().roles).toHaveLength(count);
      });

      And('the registry should include role {string}', (_ctx: unknown, tag: string) => {
        expect(requireRegistry().roles.map((role) => role.tag)).toContain(tag);
      });
    });
  });

  Rule('Custom prefix configuration works correctly', ({ RuleScenario }) => {
    RuleScenario('Custom tag prefix overrides defaults', ({ When, Then }) => {
      When('I call createArchitect with tagPrefix {string}', (_ctx: unknown, tagPrefix: string) => {
        state!.registry = createArchitect({ tagPrefix }).registry;
      });

      Then('the registry tagPrefix should be {string}', (_ctx: unknown, tagPrefix: string) => {
        expect(requireRegistry().tagPrefix).toBe(tagPrefix);
      });
    });

    RuleScenario('Custom file opt-in tag overrides defaults', ({ When, Then }) => {
      When(
        'I call createArchitect with fileOptInTag {string}',
        (_ctx: unknown, fileOptInTag: string) => {
          state!.registry = createArchitect({ fileOptInTag }).registry;
        }
      );

      Then(
        'the registry fileOptInTag should be {string}',
        (_ctx: unknown, fileOptInTag: string) => {
          expect(requireRegistry().fileOptInTag).toBe(fileOptInTag);
        }
      );
    });

    RuleScenario('Both prefix and opt-in tag can be customized together', ({ When, Then, And }) => {
      When(
        'I call createArchitect with tagPrefix {string} and fileOptInTag {string}',
        (_ctx: unknown, tagPrefix: string, fileOptInTag: string) => {
          state!.registry = createArchitect({ tagPrefix, fileOptInTag }).registry;
        }
      );

      Then('the registry tagPrefix should be {string}', (_ctx: unknown, tagPrefix: string) => {
        expect(requireRegistry().tagPrefix).toBe(tagPrefix);
      });

      And('the registry fileOptInTag should be {string}', (_ctx: unknown, fileOptInTag: string) => {
        expect(requireRegistry().fileOptInTag).toBe(fileOptInTag);
      });
    });
  });

  Rule('Explicit roles replace default roles entirely', ({ RuleScenario }) => {
    RuleScenario('Explicit custom roles exclude default roles', ({ When, Then }) => {
      When('I call createArchitect with one explicit custom role', () => {
        state!.registry = createArchitect({
          roles: [{ tag: 'service', domain: 'Service', priority: 1 }],
        }).registry;
      });

      Then('the registry should NOT include roles:', (_ctx: unknown, table: DataTableRow[]) => {
        const tags = requireRegistry().roles.map((role) => role.tag);
        for (const row of table) {
          expect(tags).not.toContain(row['tag']);
        }
      });
    });
  });

  Rule('Regex builders use configured prefix', ({ RuleScenario }) => {
    RuleScenario('hasFileOptIn detects configured opt-in tag', ({ Given, And, When, Then }) => {
      Given('a registry with fileOptInTag {string}', (_ctx: unknown, fileOptInTag: string) => {
        state!.regexBuilders = createRegexBuilders('@test-', fileOptInTag);
      });

      And('file content containing the opt-in marker', () => {
        state!.content = '/** @custom */';
      });

      When('I check hasFileOptIn', () => {
        state!.result = state!.regexBuilders!.hasFileOptIn(state!.content);
      });

      Then('it should return true', () => {
        expect(state!.result).toBe(true);
      });
    });

    RuleScenario('hasFileOptIn rejects wrong opt-in tag', ({ Given, And, When, Then }) => {
      Given('a registry with fileOptInTag {string}', (_ctx: unknown, fileOptInTag: string) => {
        state!.regexBuilders = createRegexBuilders('@test-', fileOptInTag);
      });

      And('file content containing a different opt-in marker', () => {
        state!.content = '/** @other */';
      });

      When('I check hasFileOptIn', () => {
        state!.result = state!.regexBuilders!.hasFileOptIn(state!.content);
      });

      Then('it should return false', () => {
        expect(state!.result).toBe(false);
      });
    });

    RuleScenario('hasDocDirectives detects configured prefix', ({ Given, And, When, Then }) => {
      Given('a registry with tagPrefix {string}', (_ctx: unknown, tagPrefix: string) => {
        state!.regexBuilders = createRegexBuilders(tagPrefix, '@my');
      });

      And('file content containing a directive with that prefix', () => {
        state!.content = '@my-pattern Test';
      });

      When('I check hasDocDirectives', () => {
        state!.result = state!.regexBuilders!.hasDocDirectives(state!.content);
      });

      Then('it should return true', () => {
        expect(state!.result).toBe(true);
      });
    });

    RuleScenario('hasDocDirectives rejects wrong prefix', ({ Given, And, When, Then }) => {
      Given('a registry with tagPrefix {string}', (_ctx: unknown, tagPrefix: string) => {
        state!.regexBuilders = createRegexBuilders(tagPrefix, '@my');
      });

      And('file content containing a directive with wrong prefix', () => {
        state!.content = '@other-pattern Test';
      });

      When('I check hasDocDirectives', () => {
        state!.result = state!.regexBuilders!.hasDocDirectives(state!.content);
      });

      Then('it should return false', () => {
        expect(state!.result).toBe(false);
      });
    });

    RuleScenario('normalizeTag removes configured prefix', ({ Given, When, Then }) => {
      Given('a registry with tagPrefix {string}', (_ctx: unknown, tagPrefix: string) => {
        state!.regexBuilders = createRegexBuilders(tagPrefix, '@architect');
      });

      When('I normalize tag {string}', (_ctx: unknown, tag: string) => {
        state!.normalizedTag = state!.regexBuilders!.normalizeTag(tag);
      });

      Then('the normalized tag should be {string}', (_ctx: unknown, tag: string) => {
        expect(state!.normalizedTag).toBe(tag);
      });
    });

    RuleScenario('normalizeTag handles tag without prefix', ({ Given, When, Then }) => {
      Given('a registry with tagPrefix {string}', (_ctx: unknown, tagPrefix: string) => {
        state!.regexBuilders = createRegexBuilders(tagPrefix, '@architect');
      });

      When('I normalize tag {string}', (_ctx: unknown, tag: string) => {
        state!.normalizedTag = state!.regexBuilders!.normalizeTag(tag);
      });

      Then('the normalized tag should be {string}', (_ctx: unknown, tag: string) => {
        expect(state!.normalizedTag).toBe(tag);
      });
    });
  });
});
