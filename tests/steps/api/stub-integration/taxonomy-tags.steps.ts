/**
 * Taxonomy Tags Step Definitions
 *
 * Tests for @architect-target and @architect-since tag registration.
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
    RuleScenario(
      'Built registry groups target and since as stub tags',
      ({ Given, When, Then, And }) => {
        Given('the default tag registry', () => {
          state = { registry: buildRegistry(), targetTag: undefined, sinceTag: undefined };
        });

        When('I look up tags in the "stub" metadata group', () => {
          // Registry is built, group lookup happens in Then
        });

        Then('the group contains {string}', (_ctx: unknown, tagName: string) => {
          const stubGroup = METADATA_TAGS_BY_GROUP.stub;
          expect(stubGroup).toContain(tagName);
        });

        And('the group contains {string}', (_ctx: unknown, tagName: string) => {
          const stubGroup = METADATA_TAGS_BY_GROUP.stub;
          expect(stubGroup).toContain(tagName);
        });
      }
    );
  });
});
