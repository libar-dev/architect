/**
 * Configuration API Step Definitions
 *
 * BDD step definitions for testing the createDeliveryProcess factory
 * and configuration options.
 *
 * @libar-docs
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  createDeliveryProcess,
  createRegexBuilders,
  type CreateDeliveryProcessOptions,
} from '../../../src/config/index.js';
import type { TagRegistry } from '../../../src/validation-schemas/tag-registry.js';
import type { RegexBuilders } from '../../../src/config/types.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface ConfigurationTestState {
  options: CreateDeliveryProcessOptions;
  registry: TagRegistry | null;
  regexBuilders: RegexBuilders | null;
  content: string;
  result: boolean | null;
  normalizedTag: string | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: ConfigurationTestState | null = null;

function initState(): ConfigurationTestState {
  return {
    options: {},
    registry: null,
    regexBuilders: null,
    content: '',
    result: null,
    normalizedTag: null,
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

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

  // ===========================================================================
  // Factory Default Behavior
  // ===========================================================================

  Rule('Factory creates configured instances with correct defaults', ({ RuleScenario }) => {
    RuleScenario('Create with no arguments uses libar-generic preset', ({ When, Then, And }) => {
      When('I call createDeliveryProcess without arguments', () => {
        const dp = createDeliveryProcess();
        state!.registry = dp.registry;
      });

      Then('the registry tagPrefix should be "@libar-docs-"', () => {
        expect(state!.registry!.tagPrefix).toBe('@libar-docs-');
      });

      And('the registry fileOptInTag should be "@libar-docs"', () => {
        expect(state!.registry!.fileOptInTag).toBe('@libar-docs');
      });

      And('the registry should have exactly 3 categories', () => {
        // Default libar-generic preset has 3 categories (core, api, infra)
        expect(state!.registry!.categories).toHaveLength(3);
        const categoryTags = state!.registry!.categories.map((c) => c.tag);
        expect(categoryTags).toContain('core');
        expect(categoryTags).toContain('api');
        expect(categoryTags).toContain('infra');
      });
    });

    RuleScenario('Create with generic preset', ({ When, Then, And }) => {
      When('I call createDeliveryProcess with preset "generic"', () => {
        const dp = createDeliveryProcess({ preset: 'generic' });
        state!.registry = dp.registry;
      });

      Then('the registry tagPrefix should be "@docs-"', () => {
        expect(state!.registry!.tagPrefix).toBe('@docs-');
      });

      And('the registry fileOptInTag should be "@docs"', () => {
        expect(state!.registry!.fileOptInTag).toBe('@docs');
      });

      And('the registry should have exactly 3 categories', () => {
        // Generic preset categories REPLACE base taxonomy (not merged)
        expect(state!.registry!.categories).toHaveLength(3);
        // The preset's 3 categories (core, api, infra) should be included
        const categoryTags = state!.registry!.categories.map((c) => c.tag);
        expect(categoryTags).toContain('core');
        expect(categoryTags).toContain('api');
        expect(categoryTags).toContain('infra');
      });
    });

    RuleScenario('Create with libar-generic preset', ({ When, Then, And }) => {
      When('I call createDeliveryProcess with preset "libar-generic"', () => {
        const dp = createDeliveryProcess({ preset: 'libar-generic' });
        state!.registry = dp.registry;
      });

      Then('the registry tagPrefix should be "@libar-docs-"', () => {
        expect(state!.registry!.tagPrefix).toBe('@libar-docs-');
      });

      And('the registry fileOptInTag should be "@libar-docs"', () => {
        expect(state!.registry!.fileOptInTag).toBe('@libar-docs');
      });

      And('the registry should have exactly 3 categories', () => {
        // Libar-generic preset categories REPLACE base taxonomy (not merged)
        expect(state!.registry!.categories).toHaveLength(3);
        const categoryTags = state!.registry!.categories.map((c) => c.tag);
        expect(categoryTags).toContain('core');
        expect(categoryTags).toContain('api');
        expect(categoryTags).toContain('infra');
      });
    });

    RuleScenario('Create with ddd-es-cqrs preset explicitly', ({ When, Then, And }) => {
      When('I call createDeliveryProcess with preset "ddd-es-cqrs"', () => {
        const dp = createDeliveryProcess({ preset: 'ddd-es-cqrs' });
        state!.registry = dp.registry;
      });

      Then('the registry tagPrefix should be "@libar-docs-"', () => {
        expect(state!.registry!.tagPrefix).toBe('@libar-docs-');
      });

      And('the registry fileOptInTag should be "@libar-docs"', () => {
        expect(state!.registry!.fileOptInTag).toBe('@libar-docs');
      });

      And('the registry should have 21 categories', () => {
        expect(state!.registry!.categories).toHaveLength(21);
      });
    });
  });

  // ===========================================================================
  // Custom Prefix Configuration
  // ===========================================================================

  Rule('Custom prefix configuration works correctly', ({ RuleScenario }) => {
    RuleScenario('Custom tag prefix overrides preset', ({ When, Then }) => {
      When('I call createDeliveryProcess with tagPrefix "@custom-"', () => {
        const dp = createDeliveryProcess({ tagPrefix: '@custom-' });
        state!.registry = dp.registry;
      });

      Then('the registry tagPrefix should be "@custom-"', () => {
        expect(state!.registry!.tagPrefix).toBe('@custom-');
      });
    });

    RuleScenario('Custom file opt-in tag overrides preset', ({ When, Then }) => {
      When('I call createDeliveryProcess with fileOptInTag "@my-docs"', () => {
        const dp = createDeliveryProcess({ fileOptInTag: '@my-docs' });
        state!.registry = dp.registry;
      });

      Then('the registry fileOptInTag should be "@my-docs"', () => {
        expect(state!.registry!.fileOptInTag).toBe('@my-docs');
      });
    });

    RuleScenario('Both prefix and opt-in tag can be customized together', ({ When, Then, And }) => {
      When('I call createDeliveryProcess with tagPrefix "@proj-" and fileOptInTag "@proj"', () => {
        const dp = createDeliveryProcess({ tagPrefix: '@proj-', fileOptInTag: '@proj' });
        state!.registry = dp.registry;
      });

      Then('the registry tagPrefix should be "@proj-"', () => {
        expect(state!.registry!.tagPrefix).toBe('@proj-');
      });

      And('the registry fileOptInTag should be "@proj"', () => {
        expect(state!.registry!.fileOptInTag).toBe('@proj');
      });
    });
  });

  // ===========================================================================
  // Preset Categories Replace Base Categories
  // ===========================================================================

  Rule('Preset categories replace base categories entirely', ({ RuleScenario }) => {
    RuleScenario('Generic preset excludes DDD categories', ({ When, Then, And }) => {
      When('I call createDeliveryProcess with preset "generic"', () => {
        const dp = createDeliveryProcess({ preset: 'generic' });
        state!.registry = dp.registry;
      });

      Then('the registry should NOT include category "ddd"', () => {
        const categoryTags = state!.registry!.categories.map((c) => c.tag);
        expect(categoryTags).not.toContain('ddd');
      });

      And('the registry should NOT include category "event-sourcing"', () => {
        const categoryTags = state!.registry!.categories.map((c) => c.tag);
        expect(categoryTags).not.toContain('event-sourcing');
      });

      And('the registry should NOT include category "cqrs"', () => {
        const categoryTags = state!.registry!.categories.map((c) => c.tag);
        expect(categoryTags).not.toContain('cqrs');
      });

      And('the registry should NOT include category "saga"', () => {
        const categoryTags = state!.registry!.categories.map((c) => c.tag);
        expect(categoryTags).not.toContain('saga');
      });
    });

    RuleScenario('Libar-generic preset excludes DDD categories', ({ When, Then, And }) => {
      When('I call createDeliveryProcess with preset "libar-generic"', () => {
        const dp = createDeliveryProcess({ preset: 'libar-generic' });
        state!.registry = dp.registry;
      });

      Then('the registry should NOT include category "ddd"', () => {
        const categoryTags = state!.registry!.categories.map((c) => c.tag);
        expect(categoryTags).not.toContain('ddd');
      });

      And('the registry should NOT include category "event-sourcing"', () => {
        const categoryTags = state!.registry!.categories.map((c) => c.tag);
        expect(categoryTags).not.toContain('event-sourcing');
      });

      And('the registry should NOT include category "cqrs"', () => {
        const categoryTags = state!.registry!.categories.map((c) => c.tag);
        expect(categoryTags).not.toContain('cqrs');
      });

      And('the registry should NOT include category "saga"', () => {
        const categoryTags = state!.registry!.categories.map((c) => c.tag);
        expect(categoryTags).not.toContain('saga');
      });
    });
  });

  // ===========================================================================
  // Regex Builders Integration
  // ===========================================================================

  Rule('Regex builders use configured prefix', ({ RuleScenario }) => {
    RuleScenario('hasFileOptIn detects configured opt-in tag', ({ Given, And, When, Then }) => {
      Given('a registry with fileOptInTag "@custom"', () => {
        state!.regexBuilders = createRegexBuilders('@test-', '@custom');
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
      Given('a registry with fileOptInTag "@custom"', () => {
        state!.regexBuilders = createRegexBuilders('@test-', '@custom');
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
      Given('a registry with tagPrefix "@my-"', () => {
        state!.regexBuilders = createRegexBuilders('@my-', '@my');
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
      Given('a registry with tagPrefix "@my-"', () => {
        state!.regexBuilders = createRegexBuilders('@my-', '@my');
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
      Given('a registry with tagPrefix "@docs-"', () => {
        state!.regexBuilders = createRegexBuilders('@docs-', '@docs');
      });

      When('I normalize tag "@docs-pattern"', () => {
        state!.normalizedTag = state!.regexBuilders!.normalizeTag('@docs-pattern');
      });

      Then('the normalized tag should be "pattern"', () => {
        expect(state!.normalizedTag).toBe('pattern');
      });
    });

    RuleScenario('normalizeTag handles tag without prefix', ({ Given, When, Then }) => {
      Given('a registry with tagPrefix "@docs-"', () => {
        state!.regexBuilders = createRegexBuilders('@docs-', '@docs');
      });

      When('I normalize tag "pattern"', () => {
        state!.normalizedTag = state!.regexBuilders!.normalizeTag('pattern');
      });

      Then('the normalized tag should be "pattern"', () => {
        expect(state!.normalizedTag).toBe('pattern');
      });
    });
  });
});
