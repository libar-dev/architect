/**
 * @libar-docs
 * @libar-docs-implements TagRegistrySchemasTesting
 * @libar-docs-uses TagRegistrySchema
 *
 * Tag Registry Schema Step Definitions
 *
 * BDD step definitions for testing tag registry configuration:
 * - createDefaultTagRegistry - Default registry creation from taxonomy
 * - mergeTagRegistries - Deep merge of registries by tag
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  TagRegistrySchema,
  createDefaultTagRegistry,
  mergeTagRegistries,
  type TagRegistry,
} from '../../../src/validation-schemas/tag-registry.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface TagRegistryTestState {
  // Created registry
  registry: TagRegistry | null;

  // Base registry for merge tests
  baseRegistry: TagRegistry | null;

  // Merged registry
  mergedRegistry: TagRegistry | null;

  // Schema validation result
  validationPassed: boolean;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: TagRegistryTestState | null = null;

// =============================================================================
// Helper Functions
// =============================================================================

function initState(): TagRegistryTestState {
  return {
    registry: null,
    baseRegistry: null,
    mergedRegistry: null,
    validationPassed: false,
  };
}

/**
 * Create a minimal valid TagRegistry for testing merge behavior.
 */
function createMinimalRegistry(overrides: Partial<TagRegistry> = {}): TagRegistry {
  return {
    version: overrides.version ?? '1.0.0',
    categories: overrides.categories ?? [],
    metadataTags: overrides.metadataTags ?? [],
    aggregationTags: overrides.aggregationTags ?? [],
    formatOptions: overrides.formatOptions ?? ['full', 'list', 'summary'],
    tagPrefix: overrides.tagPrefix ?? '@libar-docs-',
    fileOptInTag: overrides.fileOptInTag ?? '@libar-docs',
  };
}

// =============================================================================
// Feature: Tag Registry Schema Validation
// =============================================================================

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

  // ===========================================================================
  // createDefaultTagRegistry - Default Registry
  // ===========================================================================

  Rule(
    'createDefaultTagRegistry produces a valid registry from taxonomy source',
    ({ RuleScenario }) => {
      RuleScenario('Default registry passes schema validation', ({ When, Then }) => {
        When('I create a default tag registry', () => {
          state!.registry = createDefaultTagRegistry();
        });

        Then('the registry should pass TagRegistrySchema validation', () => {
          const result = TagRegistrySchema.safeParse(state!.registry);
          expect(result.success).toBe(true);
        });
      });

      RuleScenario('Default registry has non-empty categories', ({ When, Then }) => {
        When('I create a default tag registry', () => {
          state!.registry = createDefaultTagRegistry();
        });

        Then('the registry should have at least 1 category', () => {
          expect(state!.registry!.categories.length).toBeGreaterThanOrEqual(1);
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

        Then('the registry tag prefix should be "@libar-docs-"', () => {
          expect(state!.registry!.tagPrefix).toBe('@libar-docs-');
        });
      });
    }
  );

  // ===========================================================================
  // mergeTagRegistries - Deep Merge
  // ===========================================================================

  Rule('mergeTagRegistries deep-merges registries by tag', ({ RuleScenario }) => {
    RuleScenario('Merge overrides a category by tag', ({ Given, When, Then }) => {
      Given('a base registry with a category "core" at priority 1', () => {
        state!.baseRegistry = createMinimalRegistry({
          categories: [
            {
              tag: 'core',
              domain: 'Core',
              priority: 1,
              description: 'Core utilities',
              aliases: [],
            },
          ],
        });
      });

      When('I merge with an override that sets category "core" to priority 10', () => {
        state!.mergedRegistry = mergeTagRegistries(state!.baseRegistry!, {
          categories: [
            {
              tag: 'core',
              domain: 'Core',
              priority: 10,
              description: 'Core utilities',
              aliases: [],
            },
          ],
        });
      });

      Then('the merged registry should have category "core" at priority 10', () => {
        const coreCategory = state!.mergedRegistry!.categories.find((c) => c.tag === 'core');
        expect(coreCategory).toBeDefined();
        expect(coreCategory!.priority).toBe(10);
      });
    });

    RuleScenario('Merge adds new categories from override', ({ Given, When, Then, And }) => {
      Given('a base registry with a category "core" at priority 1', () => {
        state!.baseRegistry = createMinimalRegistry({
          categories: [
            {
              tag: 'core',
              domain: 'Core',
              priority: 1,
              description: 'Core utilities',
              aliases: [],
            },
          ],
        });
      });

      When('I merge with an override that adds category "custom" at priority 5', () => {
        state!.mergedRegistry = mergeTagRegistries(state!.baseRegistry!, {
          categories: [
            {
              tag: 'custom',
              domain: 'Custom',
              priority: 5,
              description: 'Custom category',
              aliases: [],
            },
          ],
        });
      });

      Then('the merged registry should have 2 categories', () => {
        expect(state!.mergedRegistry!.categories).toHaveLength(2);
      });

      And('the merged registry should contain category "custom"', () => {
        const customCategory = state!.mergedRegistry!.categories.find((c) => c.tag === 'custom');
        expect(customCategory).toBeDefined();
      });
    });

    RuleScenario('Merge replaces scalar fields when provided', ({ Given, When, Then }) => {
      Given('a base registry with tag prefix "@libar-docs-"', () => {
        state!.baseRegistry = createMinimalRegistry({
          tagPrefix: '@libar-docs-',
        });
      });

      When('I merge with an override that sets tag prefix "@custom-"', () => {
        state!.mergedRegistry = mergeTagRegistries(state!.baseRegistry!, {
          tagPrefix: '@custom-',
        });
      });

      Then('the merged registry tag prefix should be "@custom-"', () => {
        expect(state!.mergedRegistry!.tagPrefix).toBe('@custom-');
      });
    });

    RuleScenario('Merge preserves base when override is empty', ({ Given, When, Then, And }) => {
      Given('a base registry with a category "core" at priority 1', () => {
        state!.baseRegistry = createMinimalRegistry({
          categories: [
            {
              tag: 'core',
              domain: 'Core',
              priority: 1,
              description: 'Core utilities',
              aliases: [],
            },
          ],
        });
      });

      When('I merge with an empty override', () => {
        state!.mergedRegistry = mergeTagRegistries(state!.baseRegistry!, {});
      });

      Then('the merged registry should have 1 category', () => {
        expect(state!.mergedRegistry!.categories).toHaveLength(1);
      });

      And('the merged registry should have category "core" at priority 1', () => {
        const coreCategory = state!.mergedRegistry!.categories.find((c) => c.tag === 'core');
        expect(coreCategory).toBeDefined();
        expect(coreCategory!.priority).toBe(1);
      });
    });
  });
});
