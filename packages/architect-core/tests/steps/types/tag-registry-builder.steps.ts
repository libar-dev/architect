import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

import { buildRegistry, type MetadataTagDefinition, type TagRegistry } from '../../../src/index.js';
import { applyKnownTransform } from '../../../src/taxonomy/metadata-transforms.js';
import type { DataTableRow } from '../../support/world.js';

interface TagRegistryTestState {
  registry: TagRegistry | null;
  foundTag: MetadataTagDefinition | null;
  transformResult: string;
}

let state: TagRegistryTestState | null = null;

function initState(): TagRegistryTestState {
  return {
    registry: null,
    foundTag: null,
    transformResult: '',
  };
}

function findMetadataTag(
  registry: TagRegistry,
  tagName: string,
): MetadataTagDefinition | undefined {
  return registry.metadataTags.find((tag) => tag.tag === tagName);
}

const feature = await loadFeature('tests/features/types/tag-registry-builder.feature');

describeFeature(feature, ({ Rule, Background, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a tag registry test context', () => {
      state = initState();
    });
  });

  Rule('buildRegistry returns a well-formed TagRegistry', ({ RuleScenario }) => {
    RuleScenario('Registry has correct version', ({ When, Then }) => {
      When('I build the tag registry', () => {
        state!.registry = buildRegistry();
      });

      Then('the registry version is {string}', (_ctx: unknown, expected: string) => {
        expect(state!.registry!.version).toBe(expected);
      });
    });

    RuleScenario('Registry has required metadata tags', ({ When, Then }) => {
      When('I build the tag registry', () => {
        state!.registry = buildRegistry();
      });

      Then('the registry contains these metadata tags:', (_ctx: unknown, table: DataTableRow[]) => {
        for (const row of table) {
          const tagName = row['tag'] ?? '';
          const tag = findMetadataTag(state!.registry!, tagName);
          expect(tag, `metadata tag "${tagName}" should exist`).toBeDefined();
          expect(tag!.format).toBe(row['format']);
        }
      });
    });
  });

  Rule('Metadata tags have correct configuration', ({ RuleScenario }) => {
    RuleScenario('Pattern tag is marked as required', ({ When, Then }) => {
      When('I build the tag registry', () => {
        state!.registry = buildRegistry();
      });

      Then(
        'the metadata tag {string} has required set to true',
        (_ctx: unknown, tagName: string) => {
          const tag = findMetadataTag(state!.registry!, tagName);
          expect(tag).toBeDefined();
          expect(tag!.required).toBe(true);
        },
      );
    });

    RuleScenario('Status tag has default value', ({ When, Then }) => {
      When('I build the tag registry', () => {
        state!.registry = buildRegistry();
      });

      Then('the metadata tag {string} has a default value', (_ctx: unknown, tagName: string) => {
        const tag = findMetadataTag(state!.registry!, tagName);
        expect(tag).toBeDefined();
        expect(tag!.default).toBeDefined();
        expect(tag!.default!.length).toBeGreaterThan(0);
      });
    });

    RuleScenario('Transform functions work correctly', ({ When, Then, And }) => {
      When('I build the tag registry', () => {
        state!.registry = buildRegistry();
      });

      Then(
        'the metadata tag {string} has a transform function',
        (_ctx: unknown, tagName: string) => {
          const tag = findMetadataTag(state!.registry!, tagName);
          expect(tag).toBeDefined();
          expect(tag!.transform).toBeDefined();
          expect(typeof tag!.transform).toBe('string');
          state!.foundTag = tag!;
        },
      );

      And(
        'applying the {string} transform to {string} produces {string}',
        (_ctx: unknown, _tagName: string, input: string, expected: string) => {
          expect(state!.foundTag).toBeDefined();
          expect(state!.foundTag!.transform).toBeDefined();
          state!.transformResult = applyKnownTransform(state!.foundTag!.transform, input);
          expect(state!.transformResult).toBe(expected);
        },
      );
    });
  });

  Rule('Registry includes standard prefixes and opt-in tag', ({ RuleScenario }) => {
    RuleScenario('Registry has standard tag prefix and opt-in tag', ({ When, Then, And }) => {
      When('I build the tag registry', () => {
        state!.registry = buildRegistry();
      });

      Then('the tag prefix is not empty', () => {
        expect(state!.registry!.tagPrefix.length).toBeGreaterThan(0);
      });

      And('the file opt-in tag is not empty', () => {
        expect(state!.registry!.fileOptInTag.length).toBeGreaterThan(0);
      });
    });
  });
});
