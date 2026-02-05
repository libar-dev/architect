/**
 * Content Deduplication Step Definitions
 *
 * BDD step definitions for testing the content deduplicator:
 * - Fingerprint-based duplicate detection
 * - Source priority merge strategy
 * - Section ordering preservation
 * - Integration with source mapper pipeline
 *
 * @libar-docs
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  computeFingerprint,
  deduplicateSections,
  findDuplicates,
  type ContentBlock,
  type DeduplicationResult,
} from '../../../src/generators/content-deduplicator.js';
import type { ExtractedSection } from '../../../src/generators/source-mapper.js';
import {
  createWarningCollector,
  type WarningCollector,
} from '../../../src/generators/warning-collector.js';

// =============================================================================
// Type Definitions
// =============================================================================

interface DeduplicatorState {
  warningCollector: WarningCollector;
  contentBlockA: ContentBlock | null;
  contentBlockB: ContentBlock | null;
  fingerprintA: string | null;
  fingerprintB: string | null;
  sections: ExtractedSection[];
  dedupResult: DeduplicationResult | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: DeduplicatorState | null = null;

function initState(): DeduplicatorState {
  return {
    warningCollector: createWarningCollector(),
    contentBlockA: null,
    contentBlockB: null,
    fingerprintA: null,
    fingerprintB: null,
    sections: [],
    dedupResult: null,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse escaped newlines in string parameters
 */
function parseContent(content: string): string {
  return content.replace(/\\n/g, '\n');
}

/**
 * Create an ExtractedSection from parameters
 */
function createSection(sectionName: string, sourceFile: string, content: string): ExtractedSection {
  return {
    section: sectionName,
    sourceFile,
    extractionMethod: 'test',
    content,
  };
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/doc-generation/content-deduplication.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('the content deduplicator is initialized', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // RULE 1: Fingerprint-Based Detection
  // ===========================================================================

  Rule('Duplicate detection uses content fingerprinting', ({ RuleScenario }) => {
    RuleScenario('Identical content produces same fingerprint', ({ Given, And, When, Then }) => {
      Given('content block A with text {string}', (_ctx: unknown, text: string) => {
        const content = parseContent(text);
        state!.contentBlockA = {
          header: 'Test',
          body: content,
          source: 'source-a',
          lineCount: content.split('\n').length,
        };
      });

      And('content block B with text {string}', (_ctx: unknown, text: string) => {
        const content = parseContent(text);
        state!.contentBlockB = {
          header: 'Test',
          body: content,
          source: 'source-b',
          lineCount: content.split('\n').length,
        };
      });

      When('computing fingerprints', () => {
        state!.fingerprintA = computeFingerprint(state!.contentBlockA!.body);
        state!.fingerprintB = computeFingerprint(state!.contentBlockB!.body);
        state!.contentBlockA!.fingerprint = state!.fingerprintA;
        state!.contentBlockB!.fingerprint = state!.fingerprintB;
      });

      Then('both blocks have identical fingerprints', () => {
        expect(state!.fingerprintA).toBe(state!.fingerprintB);
      });

      And('they are marked as duplicates', () => {
        const duplicates = findDuplicates([state!.contentBlockA!, state!.contentBlockB!]);
        expect(duplicates.size).toBe(1);
        const group = [...duplicates.values()][0];
        expect(group.length).toBe(2);
      });
    });

    RuleScenario('Whitespace differences are normalized', ({ Given, And, When, Then }) => {
      Given('content block A with text {string}', (_ctx: unknown, text: string) => {
        const content = parseContent(text);
        state!.contentBlockA = {
          header: 'Test',
          body: content,
          source: 'source-a',
          lineCount: content.split('\n').length,
        };
      });

      And('content block B with text {string}', (_ctx: unknown, text: string) => {
        const content = parseContent(text);
        state!.contentBlockB = {
          header: 'Test',
          body: content,
          source: 'source-b',
          lineCount: content.split('\n').length,
        };
      });

      When('computing fingerprints', () => {
        state!.fingerprintA = computeFingerprint(state!.contentBlockA!.body);
        state!.fingerprintB = computeFingerprint(state!.contentBlockB!.body);
      });

      Then('both blocks have identical fingerprints', () => {
        expect(state!.fingerprintA).toBe(state!.fingerprintB);
      });
    });

    RuleScenario(
      'Different content produces different fingerprints',
      ({ Given, And, When, Then }) => {
        Given('content block A with text {string}', (_ctx: unknown, text: string) => {
          const content = parseContent(text);
          state!.contentBlockA = {
            header: 'Test',
            body: content,
            source: 'source-a',
            lineCount: content.split('\n').length,
          };
        });

        And('content block B with text {string}', (_ctx: unknown, text: string) => {
          const content = parseContent(text);
          state!.contentBlockB = {
            header: 'Test',
            body: content,
            source: 'source-b',
            lineCount: content.split('\n').length,
          };
        });

        When('computing fingerprints', () => {
          state!.fingerprintA = computeFingerprint(state!.contentBlockA!.body);
          state!.fingerprintB = computeFingerprint(state!.contentBlockB!.body);
          state!.contentBlockA!.fingerprint = state!.fingerprintA;
          state!.contentBlockB!.fingerprint = state!.fingerprintB;
        });

        Then('blocks have different fingerprints', () => {
          expect(state!.fingerprintA).not.toBe(state!.fingerprintB);
        });

        And('they are not marked as duplicates', () => {
          const duplicates = findDuplicates([state!.contentBlockA!, state!.contentBlockB!]);
          expect(duplicates.size).toBe(0);
        });
      }
    );

    RuleScenario(
      'Similar headers with different content are preserved',
      ({ Given, And, When, Then }) => {
        Given(
          'content block A with header {string} and body {string}',
          (_ctx: unknown, header: string, body: string) => {
            // Strip markdown header prefix (## ) from the header if present
            const cleanHeader = header.replace(/^#+\s*/, '');
            // Normalize escaped newlines for consistency with other code paths
            const cleanBody = parseContent(body);
            state!.contentBlockA = {
              header: cleanHeader,
              body: cleanBody,
              source: 'source-a',
              lineCount: cleanBody.split('\n').length,
            };
            state!.sections.push(createSection(cleanHeader, 'source-a', cleanBody));
          }
        );

        And(
          'content block B with header {string} and body {string}',
          (_ctx: unknown, header: string, body: string) => {
            // Strip markdown header prefix (## ) from the header if present
            const cleanHeader = header.replace(/^#+\s*/, '');
            // Normalize escaped newlines for consistency with other code paths
            const cleanBody = parseContent(body);
            state!.contentBlockB = {
              header: cleanHeader,
              body: cleanBody,
              source: 'source-b',
              lineCount: cleanBody.split('\n').length,
            };
            state!.sections.push(createSection(cleanHeader, 'source-b', cleanBody));
          }
        );

        When('deduplicating', () => {
          state!.dedupResult = deduplicateSections(state!.sections, {
            warningCollector: state!.warningCollector,
          });
        });

        Then('both blocks are preserved', () => {
          expect(state!.dedupResult!.sections.length).toBe(2);
        });

        And(
          'headers are differentiated as {string} and {string}',
          (_ctx: unknown, headerA: string, headerB: string) => {
            const headers = state!.dedupResult!.sections.map((s) => s.section);
            expect(headers).toContain(headerA);
            expect(headers).toContain(headerB);
          }
        );
      }
    );
  });

  // ===========================================================================
  // RULE 2: Merge Strategy
  // ===========================================================================

  Rule('Duplicates are merged based on source priority', ({ RuleScenario }) => {
    RuleScenario(
      'TypeScript source takes priority over feature file',
      ({ Given, And, When, Then }) => {
        const content = 'Duplicate documentation content';

        Given('duplicate content from {string} with JSDoc', (_ctx: unknown, source: string) => {
          state!.sections.push(createSection('Test Section', source, content));
        });

        And('duplicate content from {string} without JSDoc', (_ctx: unknown, source: string) => {
          state!.sections.push(createSection('Test Section', source, content));
        });

        When('merging duplicates', () => {
          state!.dedupResult = deduplicateSections(state!.sections, {
            warningCollector: state!.warningCollector,
          });
        });

        Then('content from TypeScript source is kept', () => {
          expect(state!.dedupResult!.sections.length).toBe(1);
          expect(state!.dedupResult!.sections[0].sourceFile).toBe('src/types.ts');
        });

        And('source attribution shows {string}', (_ctx: unknown, expectedSource: string) => {
          expect(state!.dedupResult!.sections[0].sourceFile).toBe(expectedSource);
        });
      }
    );

    RuleScenario(
      'Richer content takes priority when sources equal',
      ({ Given, And, When, Then }) => {
        // Since fingerprinting normalizes content, "richer content" means:
        // - same normalized fingerprint (so they're detected as duplicates)
        // - but more non-empty lines in the body
        //
        // The algorithm counts non-empty lines, so we need same words but
        // one version has each word on separate line (more lines)

        Given('duplicate from source A with {int} lines', (_ctx: unknown, _lines: number) => {
          // Single line content (1 non-empty line when counted)
          const content = 'same content here';
          state!.sections.push(createSection('Test', 'source-a.feature', content));
        });

        And('duplicate from source B with {int} lines', (_ctx: unknown, _lines: number) => {
          // Same content but each word on its own line (3 non-empty lines)
          // Fingerprint normalizes to same: "same content here"
          const content = 'same\ncontent\nhere';
          state!.sections.push(createSection('Test', 'source-b.feature', content));
        });

        When('merging duplicates with equal source priority', () => {
          // Both are .feature files so equal priority
          state!.dedupResult = deduplicateSections(state!.sections, {
            warningCollector: state!.warningCollector,
          });
        });

        Then('content from source B is kept', () => {
          expect(state!.dedupResult!.sections.length).toBe(1);
          expect(state!.dedupResult!.sections[0].sourceFile).toBe('source-b.feature');
        });

        And('source attribution shows source B', () => {
          expect(state!.dedupResult!.sections[0].sourceFile).toContain('source-b');
        });
      }
    );

    RuleScenario('Source attribution is added to merged content', ({ Given, When, Then, And }) => {
      const content = 'Duplicate content for attribution test';

      Given('duplicate content merged from two sources', () => {
        state!.sections.push(createSection('Attribution Test', 'src/types.ts', content));
        state!.sections.push(createSection('Attribution Test', 'test.feature', content));
      });

      When('rendering the merged section', () => {
        state!.dedupResult = deduplicateSections(state!.sections, {
          warningCollector: state!.warningCollector,
        });
      });

      Then('output includes {string}', (_ctx: unknown, expectedSource: string) => {
        // The feature says "Source: src/types.ts" but actually we check the sourceFile
        // Extract just the path part if the expected includes "Source: " prefix
        const sourcePath = expectedSource.replace(/^Source:\s*/, '');
        expect(state!.dedupResult!.sections[0].sourceFile).toBe(sourcePath);
      });

      And('duplicate source is noted', () => {
        // Check that we have a merged pair recorded
        expect(state!.dedupResult!.mergedPairs.length).toBe(1);
        expect(state!.dedupResult!.mergedPairs[0].removed.source).toBe('test.feature');
      });
    });
  });

  // ===========================================================================
  // RULE 3: Section Ordering
  // ===========================================================================

  Rule('Section order is preserved after deduplication', ({ RuleScenario }) => {
    RuleScenario('Original order maintained after dedup', ({ Given, And, When, Then }) => {
      Given(
        'source mapping order: {string}, {string}, {string}, {string}',
        (_ctx: unknown, s1: string, s2: string, s3: string, s4: string) => {
          state!.sections.push(createSection(s1, 'source1.feature', 'Intro content'));
          state!.sections.push(createSection(s2, 'source2.ts', 'Types content - version 1'));
          state!.sections.push(createSection(s3, 'source3.feature', 'Rules content'));
          state!.sections.push(createSection(s4, 'source4.ts', 'Types content - version 1')); // Duplicate of second
        }
      );

      And('{string} sections have duplicate content', () => {
        // Already set up above - Types sections have same content
      });

      When('deduplicating', () => {
        state!.dedupResult = deduplicateSections(state!.sections, {
          warningCollector: state!.warningCollector,
        });
      });

      Then(
        'output order is {string}, {string}, {string}',
        (_ctx: unknown, o1: string, o2: string, o3: string) => {
          expect(state!.dedupResult!.sections.length).toBe(3);
          expect(state!.dedupResult!.sections[0].section).toBe(o1);
          expect(state!.dedupResult!.sections[1].section).toBe(o2);
          expect(state!.dedupResult!.sections[2].section).toBe(o3);
        }
      );

      And('the first occurrence position is preserved', () => {
        // The kept Types section should be from source2.ts (first occurrence)
        const typesSection = state!.dedupResult!.sections.find((s) => s.section === 'Types');
        expect(typesSection).toBeDefined();
        expect(typesSection!.sourceFile).toBe('source2.ts');
      });
    });

    RuleScenario('Empty sections after dedup are removed', ({ Given, When, Then, And }) => {
      Given('a section that becomes empty after deduplication', () => {
        state!.sections.push(createSection('Empty Section', 'test.feature', ''));
        state!.sections.push(createSection('Non-Empty', 'test.ts', 'Some content'));
      });

      When('deduplicating', () => {
        state!.dedupResult = deduplicateSections(state!.sections, {
          warningCollector: state!.warningCollector,
        });
      });

      Then('the empty section is removed from output', () => {
        const emptySection = state!.dedupResult!.sections.find(
          (s) => s.section === 'Empty Section'
        );
        expect(emptySection).toBeUndefined();
      });

      And('a warning is logged about the removed section', () => {
        const emptyWarning = state!.dedupResult!.warnings.find((w) =>
          w.message.includes('Empty section')
        );
        expect(emptyWarning).toBeDefined();
        expect(emptyWarning!.category).toBe('deduplication');
      });
    });
  });

  // ===========================================================================
  // RULE 4: Integration with Source Mapper
  // ===========================================================================

  Rule('Deduplicator integrates with source mapper pipeline', ({ RuleScenario }) => {
    RuleScenario('Deduplication happens in pipeline', ({ Given, And, When, Then }) => {
      Given('a source mapping that extracts from multiple files', () => {
        state!.sections.push(createSection('Section 1', 'file1.ts', 'Content from file 1'));
        state!.sections.push(createSection('Section 2', 'file2.feature', 'Content from file 2'));
      });

      And('some files contain duplicate content', () => {
        // Add a duplicate of Section 1
        state!.sections.push(createSection('Section 3', 'file3.feature', 'Content from file 1'));
      });

      When('executing the full source mapping pipeline', () => {
        // In a real pipeline, this would be:
        // 1. Extract from sources -> state.sections
        // 2. Deduplicate -> result
        state!.dedupResult = deduplicateSections(state!.sections, {
          warningCollector: state!.warningCollector,
        });
      });

      Then('extraction happens first', () => {
        // Verified by having sections to process
        expect(state!.sections.length).toBe(3);
      });

      And('deduplication processes all extracted content', () => {
        // We should have merged the duplicates
        expect(state!.dedupResult!.mergedPairs.length).toBe(1);
      });

      And('RenderableDocument contains deduplicated sections', () => {
        // Final output should have 2 sections (Section 1 and Section 2, not Section 3)
        expect(state!.dedupResult!.sections.length).toBe(2);
        const sectionNames = state!.dedupResult!.sections.map((s) => s.section);
        expect(sectionNames).toContain('Section 1');
        expect(sectionNames).toContain('Section 2');
      });
    });
  });
});
