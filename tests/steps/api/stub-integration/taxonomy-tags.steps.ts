/**
 * Taxonomy Tags Step Definitions
 *
 * Tests for @libar-docs-target and @libar-docs-since tag registration.
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  buildRegistry,
  METADATA_TAGS_BY_GROUP,
} from '../../../../src/taxonomy/registry-builder.js';
import type { TagRegistry } from '../../../../src/validation-schemas/tag-registry.js';

const feature = await loadFeature('tests/features/api/stub-integration/taxonomy-tags.feature');

// =============================================================================
// Test State
// =============================================================================

interface TagTestState {
  registry: TagRegistry | null;
  targetTag: { tag: string; format: string } | undefined;
  sinceTag: { tag: string; format: string } | undefined;
}

let state: TagTestState | null = null;

// =============================================================================
// Feature
// =============================================================================

describeFeature(feature, ({ Rule }) => {
  Rule('Taxonomy tags are registered in the registry', ({ RuleScenario }) => {
    RuleScenario('Target and since tags exist in registry', ({ Given, When, Then, And }) => {
      Given('the default tag registry', () => {
        state = { registry: buildRegistry(), targetTag: undefined, sinceTag: undefined };
      });

      When('looking up the "target" metadata tag', () => {
        state!.targetTag = state!.registry!.metadataTags.find((t) => t.tag === 'target');
        state!.sinceTag = state!.registry!.metadataTags.find((t) => t.tag === 'since');
      });

      Then('the tag exists with format "value"', () => {
        expect(state!.targetTag).toBeDefined();
        expect(state!.targetTag!.format).toBe('value');
      });

      And('the "since" tag also exists with format "value"', () => {
        expect(state!.sinceTag).toBeDefined();
        expect(state!.sinceTag!.format).toBe('value');
      });
    });
  });

  Rule('Tags are part of the stub metadata group', ({ RuleScenario }) => {
    RuleScenario('Stub group contains target and since', ({ Given, When, Then }) => {
      Given('the metadata tags by group', () => {
        state = { registry: null, targetTag: undefined, sinceTag: undefined };
      });

      When('checking the "stub" group', () => {
        // Just verify the constant
      });

      Then('it contains "target" and "since"', () => {
        const stubGroup = METADATA_TAGS_BY_GROUP.stub;
        expect(stubGroup).toContain('target');
        expect(stubGroup).toContain('since');
      });
    });
  });
});
