/**
 * Taxonomy Tags Step Definitions
 *
 * Tests for @architect-target tag registration. The `since` tag was retired
 * in Wave 1 — git history is the canonical creation-timing record.
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { buildRegistry, METADATA_TAGS_BY_GROUP, type TagRegistry } from '@libar-dev/architect-core';

const feature = await loadFeature('tests/features/api/stub-integration/taxonomy-tags.feature');

interface TagTestState {
  registry: TagRegistry | null;
  targetTag: { tag: string; format: string } | undefined;
}

let state: TagTestState | null = null;

describeFeature(feature, ({ Rule }) => {
  Rule('Taxonomy tags are registered in the registry', ({ RuleScenario }) => {
    RuleScenario('Target tag exists in registry', ({ Given, When, Then }) => {
      Given('the default tag registry', () => {
        state = { registry: buildRegistry(), targetTag: undefined };
      });

      When('looking up the "target" metadata tag', () => {
        state!.targetTag = state!.registry!.metadataTags.find((t) => t.tag === 'target');
      });

      Then('the tag exists with format "value"', () => {
        expect(state!.targetTag).toBeDefined();
        expect(state!.targetTag!.format).toBe('value');
      });
    });
  });

  Rule('Tags are part of the stub metadata group', ({ RuleScenario }) => {
    RuleScenario('Built registry groups target as a stub tag', ({ Given, When, Then }) => {
      Given('the default tag registry', () => {
        state = { registry: buildRegistry(), targetTag: undefined };
      });

      When('I look up tags in the "stub" metadata group', () => {
        // Registry is built, group lookup happens in Then
      });

      Then('the group contains {string}', (_ctx: unknown, tagName: string) => {
        const stubGroup = METADATA_TAGS_BY_GROUP.stub;
        expect(stubGroup).toContain(tagName);
      });
    });
  });
});
