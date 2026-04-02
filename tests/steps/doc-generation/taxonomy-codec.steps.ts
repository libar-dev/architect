/**
 * Step definitions for Taxonomy Codec behavior tests
 *
 * Tests the Taxonomy Codec that transforms PatternGraph into a
 * RenderableDocument for tag taxonomy reference documentation (TAXONOMY.md).
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  createTaxonomyCodec,
  type TaxonomyCodecOptions,
} from '../../../src/renderable/codecs/taxonomy.js';
import type { RenderableDocument, SectionBlock } from '../../../src/renderable/schema.js';
import { createTestPatternGraph } from '../../fixtures/dataset-factories.js';
import type { PatternGraph } from '../../../src/validation-schemas/pattern-graph.js';
import {
  createDefaultTagRegistry,
  type MetadataTagDefinition,
} from '../../../src/validation-schemas/tag-registry.js';

const feature = await loadFeature('tests/features/doc-generation/taxonomy-codec.feature');

// =============================================================================
// Test State
// =============================================================================

interface TestState {
  // Input
  options: Partial<TaxonomyCodecOptions>;
  dataset: PatternGraph | null;
  customMetadataTags: MetadataTagDefinition[];

  // Output
  document: RenderableDocument | null;
}

let state: TestState;

function resetState(): void {
  state = {
    options: {},
    dataset: null,
    customMetadataTags: [],
    document: null,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Find a section block by heading text (level 2 headings only for main sections)
 */
function findSectionByHeading(
  sections: SectionBlock[],
  headingText: string,
  level = 2
): SectionBlock | undefined {
  for (const block of sections) {
    if (block.type === 'heading' && block.level === level && block.text.includes(headingText)) {
      return block;
    }
  }
  return undefined;
}

/**
 * Get all blocks between a heading and the next heading of same or higher level
 */
function getSectionContent(sections: SectionBlock[], headingText: string): SectionBlock[] {
  const result: SectionBlock[] = [];
  let inSection = false;
  let sectionLevel = 0;

  for (const block of sections) {
    if (block.type === 'heading') {
      if (block.text.includes(headingText)) {
        inSection = true;
        sectionLevel = block.level;
        result.push(block);
        continue;
      }
      if (inSection && block.level <= sectionLevel) {
        break;
      }
    }
    if (inSection) {
      result.push(block);
    }
  }
  return result;
}

/**
 * Find a table block within sections
 */
function findTable(sections: SectionBlock[]): SectionBlock | undefined {
  return sections.find((b) => b.type === 'table');
}

/**
 * Find a linkOut block by path
 */
function findLinkOut(sections: SectionBlock[], targetPath: string): SectionBlock | undefined {
  return sections.find((b) => b.type === 'link-out' && 'path' in b && b.path === targetPath);
}

/**
 * Check if a subsection exists within a parent section
 */
function hasSubsection(
  sections: SectionBlock[],
  parentHeading: string,
  subsectionText: string
): boolean {
  const parentContent = getSectionContent(sections, parentHeading);
  return parentContent.some((b) => b.type === 'heading' && b.text.includes(subsectionText));
}

/**
 * Create a custom tag registry with specific metadata tags
 */
function createTagRegistryWithMetadataTags(
  tagNames: string[]
): ReturnType<typeof createDefaultTagRegistry> {
  const baseRegistry = createDefaultTagRegistry();
  const customMetadataTags: MetadataTagDefinition[] = tagNames.map((tag) => ({
    tag,
    format: 'value' as const,
    purpose: `Test tag ${tag}`,
    required: false,
  }));

  return {
    ...baseRegistry,
    metadataTags: customMetadataTags,
  };
}

/**
 * Check if tags are in a specific domain subsection
 */
function tagsInDomain(sections: SectionBlock[], tagNames: string[], domainName: string): boolean {
  const metadataContent = getSectionContent(sections, 'Metadata Tags');
  const domainContent = getSectionContent(metadataContent, domainName);

  const tableBlock = findTable(domainContent);
  if (tableBlock?.type !== 'table') {
    return false;
  }

  // Check if all tag names appear in the table rows
  const tableContent = JSON.stringify(tableBlock.rows);
  return tagNames.every((tag) => tableContent.includes(tag));
}

/**
 * Check if format type is documented in Format Types section
 */
function formatTypeDocumented(sections: SectionBlock[], formatName: string): boolean {
  const formatContent = getSectionContent(sections, 'Format Types');
  const tableBlock = findTable(formatContent);
  if (tableBlock?.type !== 'table') {
    return false;
  }
  const tableContent = JSON.stringify(tableBlock.rows);
  return tableContent.includes(formatName);
}

// =============================================================================
// Feature Definition
// =============================================================================

describeFeature(feature, ({ Background, Rule }) => {
  Background(({ Given }) => {
    Given('the taxonomy codec is initialized', () => {
      resetState();
    });
  });

  // ===========================================================================
  // RULE 1: Document Metadata
  // ===========================================================================

  Rule('Document metadata is correctly set', ({ RuleScenario }) => {
    RuleScenario('Document title is Taxonomy Reference', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestPatternGraph();
        const codec = createTaxonomyCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('document title should be {string}', (_ctx: unknown, expectedTitle: string) => {
        expect(state.document).not.toBeNull();
        expect(state.document!.title).toBe(expectedTitle);
      });
    });

    RuleScenario('Document purpose describes tag taxonomy', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestPatternGraph();
        const codec = createTaxonomyCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('document purpose should contain {string}', (_ctx: unknown, expectedText: string) => {
        expect(state.document).not.toBeNull();
        expect(state.document!.purpose?.toLowerCase()).toContain(expectedText.toLowerCase());
      });
    });

    RuleScenario('Detail level reflects generateDetailFiles option', ({ When, Then }) => {
      When('decoding with generateDetailFiles disabled', () => {
        state.dataset = createTestPatternGraph();
        const codec = createTaxonomyCodec({ generateDetailFiles: false });
        state.document = codec.decode(state.dataset);
      });

      Then('document detailLevel should be {string}', (_ctx: unknown, expectedLevel: string) => {
        expect(state.document).not.toBeNull();
        expect(state.document!.detailLevel).toBe(expectedLevel);
      });
    });
  });

  // ===========================================================================
  // RULE 2: Categories Section
  // ===========================================================================

  Rule('Categories section is generated from TagRegistry', ({ RuleScenario }) => {
    RuleScenario('Categories section is included in output', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestPatternGraph();
        const codec = createTaxonomyCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('a section with heading {string} should exist', (_ctx: unknown, headingText: string) => {
        expect(state.document).not.toBeNull();
        const section = findSectionByHeading(state.document!.sections, headingText);
        expect(section).toBeDefined();
      });
    });

    RuleScenario('Category table has correct columns', ({ When, Then, And }) => {
      When('decoding with default options', () => {
        state.dataset = createTestPatternGraph();
        const codec = createTaxonomyCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('the Categories section should have a table', () => {
        const content = getSectionContent(state.document!.sections, 'Categories');
        const tableBlock = findTable(content);
        expect(tableBlock).toBeDefined();
      });

      And(
        'the table should have columns {string}, {string}, {string}, {string}',
        (_ctx: unknown, col1: string, col2: string, col3: string, col4: string) => {
          const content = getSectionContent(state.document!.sections, 'Categories');
          const tableBlock = findTable(content);
          expect(tableBlock?.type).toBe('table');
          if (tableBlock?.type === 'table') {
            // Table uses 'columns' property, not 'headers'
            expect(tableBlock.columns).toContain(col1);
            expect(tableBlock.columns).toContain(col2);
            expect(tableBlock.columns).toContain(col3);
            expect(tableBlock.columns).toContain(col4);
          }
        }
      );
    });

    RuleScenario('LinkOut to detail file when generateDetailFiles enabled', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestPatternGraph();
        const codec = createTaxonomyCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('a linkOut to {string} should exist', (_ctx: unknown, targetPath: string) => {
        const linkOutBlock = findLinkOut(state.document!.sections, targetPath);
        expect(linkOutBlock).toBeDefined();
      });
    });
  });

  // ===========================================================================
  // RULE 3: Metadata Tags Domain Grouping
  // ===========================================================================

  Rule('Metadata tags can be grouped by domain', ({ RuleScenario }) => {
    RuleScenario(
      'With groupByDomain enabled tags are grouped into subsections',
      ({ When, Then }) => {
        When('decoding with groupByDomain enabled', () => {
          state.dataset = createTestPatternGraph();
          const codec = createTaxonomyCodec({ groupByDomain: true });
          state.document = codec.decode(state.dataset);
        });

        Then(
          'the Metadata Tags section should have subsection {string}',
          (_ctx: unknown, subsectionName: string) => {
            expect(state.document).not.toBeNull();
            const hasSubsec = hasSubsection(
              state.document!.sections,
              'Metadata Tags',
              subsectionName
            );
            expect(hasSubsec).toBe(true);
          }
        );
      }
    );

    RuleScenario('With groupByDomain disabled single table rendered', ({ When, Then, And }) => {
      When('decoding with groupByDomain disabled', () => {
        state.dataset = createTestPatternGraph();
        const codec = createTaxonomyCodec({ groupByDomain: false });
        state.document = codec.decode(state.dataset);
      });

      Then(
        'the Metadata Tags section should not have subsection {string}',
        (_ctx: unknown, subsectionName: string) => {
          expect(state.document).not.toBeNull();
          const hasSubsec = hasSubsection(
            state.document!.sections,
            'Metadata Tags',
            subsectionName
          );
          expect(hasSubsec).toBe(false);
        }
      );

      And('the Metadata Tags section should have a single table', () => {
        const content = getSectionContent(state.document!.sections, 'Metadata Tags');
        const tables = content.filter((b) => b.type === 'table');
        expect(tables.length).toBe(1);
      });
    });
  });

  // ===========================================================================
  // RULE 4: Hardcoded Domain Classification
  // ===========================================================================

  Rule('Tags are classified into domains by hardcoded mapping', ({ RuleScenario }) => {
    RuleScenario('Core tags correctly classified', ({ Given, When, Then }) => {
      Given(
        'a tag registry with metadata tags {string}, {string}, {string}',
        (_ctx: unknown, tag1: string, tag2: string, tag3: string) => {
          state.customMetadataTags = [tag1, tag2, tag3].map((tag) => ({
            tag,
            format: 'value' as const,
            purpose: `Test tag ${tag}`,
            required: false,
          }));
        }
      );

      When('decoding with groupByDomain enabled', () => {
        const customRegistry = createTagRegistryWithMetadataTags(
          state.customMetadataTags.map((t) => t.tag)
        );
        state.dataset = createTestPatternGraph();
        // Override the tag registry in the dataset
        (state.dataset as { tagRegistry: typeof customRegistry }).tagRegistry = customRegistry;
        const codec = createTaxonomyCodec({ groupByDomain: true });
        state.document = codec.decode(state.dataset);
      });

      Then(
        'tags {string}, {string}, {string} should be in domain {string}',
        (_ctx: unknown, tag1: string, tag2: string, tag3: string, domain: string) => {
          expect(state.document).not.toBeNull();
          const inDomain = tagsInDomain(state.document!.sections, [tag1, tag2, tag3], domain);
          expect(inDomain).toBe(true);
        }
      );
    });

    RuleScenario('Relationship tags correctly classified', ({ Given, When, Then }) => {
      Given(
        'a tag registry with metadata tags {string}, {string}, {string}',
        (_ctx: unknown, tag1: string, tag2: string, tag3: string) => {
          state.customMetadataTags = [tag1, tag2, tag3].map((tag) => ({
            tag,
            format: 'value' as const,
            purpose: `Test tag ${tag}`,
            required: false,
          }));
        }
      );

      When('decoding with groupByDomain enabled', () => {
        const customRegistry = createTagRegistryWithMetadataTags(
          state.customMetadataTags.map((t) => t.tag)
        );
        state.dataset = createTestPatternGraph();
        (state.dataset as { tagRegistry: typeof customRegistry }).tagRegistry = customRegistry;
        const codec = createTaxonomyCodec({ groupByDomain: true });
        state.document = codec.decode(state.dataset);
      });

      Then(
        'tags {string}, {string}, {string} should be in domain {string}',
        (_ctx: unknown, tag1: string, tag2: string, tag3: string, domain: string) => {
          expect(state.document).not.toBeNull();
          const inDomain = tagsInDomain(state.document!.sections, [tag1, tag2, tag3], domain);
          expect(inDomain).toBe(true);
        }
      );
    });

    RuleScenario('Timeline tags correctly classified', ({ Given, When, Then }) => {
      Given(
        'a tag registry with metadata tags {string}, {string}, {string}',
        (_ctx: unknown, tag1: string, tag2: string, tag3: string) => {
          state.customMetadataTags = [tag1, tag2, tag3].map((tag) => ({
            tag,
            format: 'value' as const,
            purpose: `Test tag ${tag}`,
            required: false,
          }));
        }
      );

      When('decoding with groupByDomain enabled', () => {
        const customRegistry = createTagRegistryWithMetadataTags(
          state.customMetadataTags.map((t) => t.tag)
        );
        state.dataset = createTestPatternGraph();
        (state.dataset as { tagRegistry: typeof customRegistry }).tagRegistry = customRegistry;
        const codec = createTaxonomyCodec({ groupByDomain: true });
        state.document = codec.decode(state.dataset);
      });

      Then(
        'tags {string}, {string}, {string} should be in domain {string}',
        (_ctx: unknown, tag1: string, tag2: string, tag3: string, domain: string) => {
          expect(state.document).not.toBeNull();
          const inDomain = tagsInDomain(state.document!.sections, [tag1, tag2, tag3], domain);
          expect(inDomain).toBe(true);
        }
      );
    });

    RuleScenario('ADR prefix matching works', ({ Given, When, Then }) => {
      Given(
        'a tag registry with metadata tags {string}, {string}',
        (_ctx: unknown, tag1: string, tag2: string) => {
          state.customMetadataTags = [tag1, tag2].map((tag) => ({
            tag,
            format: 'value' as const,
            purpose: `Test tag ${tag}`,
            required: false,
          }));
        }
      );

      When('decoding with groupByDomain enabled', () => {
        const customRegistry = createTagRegistryWithMetadataTags(
          state.customMetadataTags.map((t) => t.tag)
        );
        state.dataset = createTestPatternGraph();
        (state.dataset as { tagRegistry: typeof customRegistry }).tagRegistry = customRegistry;
        const codec = createTaxonomyCodec({ groupByDomain: true });
        state.document = codec.decode(state.dataset);
      });

      Then(
        'tags {string}, {string} should be in domain {string}',
        (_ctx: unknown, tag1: string, tag2: string, domain: string) => {
          expect(state.document).not.toBeNull();
          const inDomain = tagsInDomain(state.document!.sections, [tag1, tag2], domain);
          expect(inDomain).toBe(true);
        }
      );
    });

    RuleScenario('Unknown tags go to Other Tags group', ({ Given, When, Then }) => {
      Given(
        'a tag registry with metadata tags {string}, {string}',
        (_ctx: unknown, tag1: string, tag2: string) => {
          state.customMetadataTags = [tag1, tag2].map((tag) => ({
            tag,
            format: 'value' as const,
            purpose: `Test tag ${tag}`,
            required: false,
          }));
        }
      );

      When('decoding with groupByDomain enabled', () => {
        const customRegistry = createTagRegistryWithMetadataTags(
          state.customMetadataTags.map((t) => t.tag)
        );
        state.dataset = createTestPatternGraph();
        (state.dataset as { tagRegistry: typeof customRegistry }).tagRegistry = customRegistry;
        const codec = createTaxonomyCodec({ groupByDomain: true });
        state.document = codec.decode(state.dataset);
      });

      Then(
        'tags {string}, {string} should be in domain {string}',
        (_ctx: unknown, tag1: string, tag2: string, domain: string) => {
          expect(state.document).not.toBeNull();
          const inDomain = tagsInDomain(state.document!.sections, [tag1, tag2], domain);
          expect(inDomain).toBe(true);
        }
      );
    });
  });

  // ===========================================================================
  // RULE 5: Optional Sections
  // ===========================================================================

  Rule('Optional sections can be disabled via codec options', ({ RuleScenario }) => {
    RuleScenario('includeFormatTypes disabled excludes Format Types section', ({ When, Then }) => {
      When('decoding with includeFormatTypes disabled', () => {
        state.dataset = createTestPatternGraph();
        const codec = createTaxonomyCodec({ includeFormatTypes: false });
        state.document = codec.decode(state.dataset);
      });

      Then(
        'a section with heading {string} should not exist',
        (_ctx: unknown, headingText: string) => {
          expect(state.document).not.toBeNull();
          const section = findSectionByHeading(state.document!.sections, headingText);
          expect(section).toBeUndefined();
        }
      );
    });

    RuleScenario('includePresets disabled excludes Presets section', ({ When, Then }) => {
      When('decoding with includePresets disabled', () => {
        state.dataset = createTestPatternGraph();
        const codec = createTaxonomyCodec({ includePresets: false });
        state.document = codec.decode(state.dataset);
      });

      Then(
        'a section with heading {string} should not exist',
        (_ctx: unknown, headingText: string) => {
          expect(state.document).not.toBeNull();
          const section = findSectionByHeading(state.document!.sections, headingText);
          expect(section).toBeUndefined();
        }
      );
    });

    RuleScenario('includeArchDiagram disabled excludes Architecture section', ({ When, Then }) => {
      When('decoding with includeArchDiagram disabled', () => {
        state.dataset = createTestPatternGraph();
        const codec = createTaxonomyCodec({ includeArchDiagram: false });
        state.document = codec.decode(state.dataset);
      });

      Then(
        'a section with heading {string} should not exist',
        (_ctx: unknown, headingText: string) => {
          expect(state.document).not.toBeNull();
          const section = findSectionByHeading(state.document!.sections, headingText);
          expect(section).toBeUndefined();
        }
      );
    });
  });

  // ===========================================================================
  // RULE 6: Detail File Generation
  // ===========================================================================

  Rule('Detail files are generated for progressive disclosure', ({ RuleScenario }) => {
    RuleScenario('generateDetailFiles creates 3 additional files', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestPatternGraph();
        const codec = createTaxonomyCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('additionalFiles should have {int} entries', (_ctx: unknown, count: number) => {
        expect(state.document).not.toBeNull();
        const fileCount = Object.keys(state.document!.additionalFiles ?? {}).length;
        expect(fileCount).toBe(count);
      });
    });

    RuleScenario('Detail files have correct paths', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestPatternGraph();
        const codec = createTaxonomyCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('additionalFiles should contain all taxonomy detail files', () => {
        expect(state.document).not.toBeNull();
        const additionalFiles = state.document!.additionalFiles ?? {};
        expect(additionalFiles).toHaveProperty('taxonomy/categories.md');
        expect(additionalFiles).toHaveProperty('taxonomy/metadata-tags.md');
        expect(additionalFiles).toHaveProperty('taxonomy/format-types.md');
      });
    });

    RuleScenario('generateDetailFiles disabled creates no additional files', ({ When, Then }) => {
      When('decoding with generateDetailFiles disabled', () => {
        state.dataset = createTestPatternGraph();
        const codec = createTaxonomyCodec({ generateDetailFiles: false });
        state.document = codec.decode(state.dataset);
      });

      Then('additionalFiles should have {int} entries', (_ctx: unknown, count: number) => {
        expect(state.document).not.toBeNull();
        const fileCount = Object.keys(state.document!.additionalFiles ?? {}).length;
        expect(fileCount).toBe(count);
      });
    });
  });

  // ===========================================================================
  // RULE 7: Format Types Reference
  // ===========================================================================

  Rule('Format types are documented with descriptions and examples', ({ RuleScenario }) => {
    RuleScenario('All 6 format types are documented', ({ When, Then }) => {
      When('decoding with default options', () => {
        state.dataset = createTestPatternGraph();
        const codec = createTaxonomyCodec();
        state.document = codec.decode(state.dataset);
      });

      Then('all format types should be documented', () => {
        expect(state.document).not.toBeNull();
        const formatTypes = ['value', 'enum', 'quoted-value', 'csv', 'number', 'flag'];
        for (const format of formatTypes) {
          expect(formatTypeDocumented(state.document!.sections, format)).toBe(true);
        }
      });
    });
  });
});
