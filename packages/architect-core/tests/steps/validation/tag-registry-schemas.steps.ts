import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  TagRegistrySchema,
  createDefaultTagRegistry,
  mergeTagRegistries,
  type TagRegistry,
} from '../../../src/validation-schemas/tag-registry.js';

interface TagRegistryTestState {
  registry: TagRegistry | null;
  baseRegistry: TagRegistry | null;
  mergedRegistry: TagRegistry | null;
  validationPassed: boolean;
}

let state: TagRegistryTestState | null = null;

function initState(): TagRegistryTestState {
  return { registry: null, baseRegistry: null, mergedRegistry: null, validationPassed: false };
}

function createMinimalRegistry(overrides: Partial<TagRegistry> = {}): TagRegistry {
  return {
    version: overrides.version ?? '1.0.0',
    roles: overrides.roles ?? [],
    metadataTags: overrides.metadataTags ?? [],
    aggregationTags: overrides.aggregationTags ?? [],
    formatOptions: overrides.formatOptions ?? ['full', 'list', 'summary'],
    tagPrefix: overrides.tagPrefix ?? '@architect-',
    fileOptInTag: overrides.fileOptInTag ?? '@architect',
  };
}

const feature = await loadFeature('tests/features/validation/tag-registry-schemas.feature');

describeFeature(feature, ({ Rule, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a tag registry test context', () => {
      state = initState();
    });
  });

  Rule(
    'createDefaultTagRegistry produces a valid registry from taxonomy source',
    ({ RuleScenario }) => {
      RuleScenario('Default registry passes schema validation', ({ When, Then }) => {
        When('I create a default tag registry', () => {
          state!.registry = createDefaultTagRegistry();
        });
        Then('the registry should pass TagRegistrySchema validation', () => {
          expect(TagRegistrySchema.safeParse(state!.registry).success).toBe(true);
        });
      });

      RuleScenario('Default registry has non-empty roles', ({ When, Then }) => {
        When('I create a default tag registry', () => {
          state!.registry = createDefaultTagRegistry();
        });
        Then('the registry should have at least 1 role', () => {
          expect(state!.registry!.roles.length).toBeGreaterThanOrEqual(1);
        });
      });

      RuleScenario('Default registry has non-empty metadata tags', ({ When, Then }) => {
        When('I create a default tag registry', () => {
          state!.registry = createDefaultTagRegistry();
        });
        Then('the registry should have at least 1 metadata tag', () => {
          expect(state!.registry!.metadataTags.length).toBeGreaterThanOrEqual(1);
        });
      });

      RuleScenario('Default registry has expected tag prefix', ({ When, Then }) => {
        When('I create a default tag registry', () => {
          state!.registry = createDefaultTagRegistry();
        });
        Then('the registry tag prefix should be "@architect-"', () => {
          expect(state!.registry!.tagPrefix).toBe('@architect-');
        });
      });
    }
  );

  Rule('mergeTagRegistries deep-merges registries by tag', ({ RuleScenario }) => {
    RuleScenario('Merge overrides a role by tag', ({ Given, When, Then }) => {
      Given('a base registry with a role "service" at priority 1', () => {
        state!.baseRegistry = createMinimalRegistry({
          roles: [
            {
              tag: 'service',
              domain: 'Service',
              priority: 1,
              description: 'Service patterns',
              aliases: [],
            },
          ],
        });
      });
      When('I merge with an override that sets role "service" to priority 10', () => {
        state!.mergedRegistry = mergeTagRegistries(state!.baseRegistry!, {
          roles: [
            {
              tag: 'service',
              domain: 'Service',
              priority: 10,
              description: 'Service patterns',
              aliases: [],
            },
          ],
        });
      });
      Then('the merged registry should have role "service" at priority 10', () => {
        const serviceRole = state!.mergedRegistry!.roles.find((role) => role.tag === 'service');
        expect(serviceRole).toBeDefined();
        expect(serviceRole!.priority).toBe(10);
      });
    });

    RuleScenario('Merge adds new roles from override', ({ Given, When, Then, And }) => {
      Given('a base registry with a role "service" at priority 1', () => {
        state!.baseRegistry = createMinimalRegistry({
          roles: [
            {
              tag: 'service',
              domain: 'Service',
              priority: 1,
              description: 'Service patterns',
              aliases: [],
            },
          ],
        });
      });
      When('I merge with an override that adds role "custom" at priority 5', () => {
        state!.mergedRegistry = mergeTagRegistries(state!.baseRegistry!, {
          roles: [
            {
              tag: 'custom',
              domain: 'Custom',
              priority: 5,
              description: 'Custom role',
              aliases: [],
            },
          ],
        });
      });
      Then('the merged registry should have 2 roles', () => {
        expect(state!.mergedRegistry!.roles).toHaveLength(2);
      });
      And('the merged registry should contain role "custom"', () => {
        expect(state!.mergedRegistry!.roles.find((role) => role.tag === 'custom')).toBeDefined();
      });
    });

    RuleScenario('Merge replaces scalar fields when provided', ({ Given, When, Then }) => {
      Given('a base registry with tag prefix "@architect-"', () => {
        state!.baseRegistry = createMinimalRegistry({ tagPrefix: '@architect-' });
      });
      When('I merge with an override that sets tag prefix "@custom-"', () => {
        state!.mergedRegistry = mergeTagRegistries(state!.baseRegistry!, { tagPrefix: '@custom-' });
      });
      Then('the merged registry tag prefix should be "@custom-"', () => {
        expect(state!.mergedRegistry!.tagPrefix).toBe('@custom-');
      });
    });

    RuleScenario('Merge preserves base when override is empty', ({ Given, When, Then, And }) => {
      Given('a base registry with a role "service" at priority 1', () => {
        state!.baseRegistry = createMinimalRegistry({
          roles: [
            {
              tag: 'service',
              domain: 'Service',
              priority: 1,
              description: 'Service patterns',
              aliases: [],
            },
          ],
        });
      });
      When('I merge with an empty override', () => {
        state!.mergedRegistry = mergeTagRegistries(state!.baseRegistry!, {});
      });
      Then('the merged registry should have 1 role', () => {
        expect(state!.mergedRegistry!.roles).toHaveLength(1);
      });
      And('the merged registry should have role "service" at priority 1', () => {
        const serviceRole = state!.mergedRegistry!.roles.find((role) => role.tag === 'service');
        expect(serviceRole).toBeDefined();
        expect(serviceRole!.priority).toBe(1);
      });
    });

    RuleScenario('Merge preserves roles when override is empty', ({ Given, When, Then, And }) => {
      Given('a base registry with a role "service" at priority 1', () => {
        state!.baseRegistry = createMinimalRegistry({
          roles: [
            {
              tag: 'service',
              domain: 'Service',
              priority: 1,
              description: 'Service patterns',
              aliases: [],
            },
          ],
        });
      });
      When('I merge with an empty override', () => {
        state!.mergedRegistry = mergeTagRegistries(state!.baseRegistry!, {});
      });
      Then('the merged registry should have 1 role', () => {
        expect(state!.mergedRegistry!.roles).toHaveLength(1);
      });
      And('the merged registry should include role "service"', () => {
        const serviceRole = state!.mergedRegistry!.roles.find((role) => role.tag === 'service');
        expect(serviceRole).toBeDefined();
        expect(serviceRole?.priority).toBe(1);
      });
    });
  });
});
