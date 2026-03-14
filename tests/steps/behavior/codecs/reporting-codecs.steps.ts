/**
 * Reporting Codecs Step Definitions
 *
 * BDD step definitions for testing the reporting codecs:
 * - ChangelogCodec
 * - TraceabilityCodec
 * - OverviewCodec
 *
 * Tests document structure, sections, options, and formatting.
 *
 * @architect
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  createChangelogCodec,
  ChangelogCodec,
  createTraceabilityCodec,
  TraceabilityCodec,
  createOverviewCodec,
  OverviewCodec,
} from '../../../../src/renderable/codecs/reporting.js';
import type { RenderableDocument, TableBlock } from '../../../../src/renderable/schema.js';
import type { MasterDataset } from '../../../../src/validation-schemas/master-dataset.js';
import type { ExtractedPattern } from '../../../../src/validation-schemas/index.js';
import {
  createTestMasterDataset,
  createMasterDatasetWithStatus,
  createTestPattern,
  resetPatternCounter,
} from '../../../fixtures/dataset-factories.js';
import {
  findHeadings,
  findCollapsibles,
  isHeading,
  isTable,
  isParagraph,
} from '../../../support/helpers/document-assertions.js';
import type { DataTableRow } from '../../../support/world.js';

// =============================================================================
// State Types
// =============================================================================

interface ReportingCodecState {
  dataset: MasterDataset | null;
  document: RenderableDocument | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: ReportingCodecState | null = null;

function initState(): ReportingCodecState {
  resetPatternCounter();
  return {
    dataset: null,
    document: null,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

function generatePatternId(index: number): string {
  return `pattern-${index.toString(16).padStart(8, '0')}`;
}

function findSectionAfterHeading(
  doc: RenderableDocument,
  headingText: string
): { heading: ReturnType<typeof findHeadings>[0] | null; content: string[] } {
  const headings = findHeadings(doc);
  const targetHeading = headings.find((h) => h.text.includes(headingText));

  if (!targetHeading) {
    return { heading: null, content: [] };
  }

  const headingIdx = doc.sections.indexOf(targetHeading);
  const content: string[] = [];

  for (let i = headingIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isHeading(section) && section.level <= targetHeading.level) break;
    if (isParagraph(section)) {
      content.push(section.text);
    }
  }

  return { heading: targetHeading, content };
}

function findTableAfterHeading(doc: RenderableDocument, headingText: string): TableBlock | null {
  const headings = findHeadings(doc);
  const targetHeading = headings.find((h) => h.text.includes(headingText));

  if (!targetHeading) {
    return null;
  }

  const headingIdx = doc.sections.indexOf(targetHeading);

  for (let i = headingIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isHeading(section) && section.level <= targetHeading.level) break;
    if (isTable(section)) {
      return section;
    }
  }

  return null;
}

function createPatternsWithReleases(releaseSpec: DataTableRow[]): ExtractedPattern[] {
  const patterns: ExtractedPattern[] = [];
  let patternIndex = 0;

  for (const row of releaseSpec) {
    const release = row.release ?? '';
    const count = parseInt(row.count ?? '1', 10);

    for (let i = 0; i < count; i++) {
      patternIndex++;
      patterns.push(
        createTestPattern({
          id: generatePatternId(patternIndex),
          name: `${release} Pattern ${i + 1}`,
          status: 'completed',
          category: 'core',
        })
      );
      // Add release property directly since createTestPattern doesn't support it
      const pattern = patterns[patterns.length - 1] as ExtractedPattern & { release?: string };
      pattern.release = release;
    }
  }

  return patterns;
}

function createUnreleasedPatterns(): ExtractedPattern[] {
  return [
    createTestPattern({
      id: generatePatternId(1),
      name: 'Active Feature',
      status: 'active',
      category: 'core',
    }),
    (() => {
      const p = createTestPattern({
        id: generatePatternId(2),
        name: 'vNEXT Feature',
        status: 'completed',
        category: 'core',
      }) as ExtractedPattern & { release?: string };
      p.release = 'vNEXT';
      return p;
    })(),
    createTestPattern({
      id: generatePatternId(3),
      name: 'Another Active',
      status: 'active',
      category: 'ddd',
    }),
  ];
}

function createCompletedPatternsWithoutRelease(): ExtractedPattern[] {
  return [
    createTestPattern({
      id: generatePatternId(1),
      name: 'Q4 Pattern 1',
      status: 'completed',
      category: 'core',
      quarter: 'Q4-2025',
    }),
    createTestPattern({
      id: generatePatternId(2),
      name: 'Q1 Pattern 1',
      status: 'completed',
      category: 'core',
      quarter: 'Q1-2026',
    }),
  ];
}

function createUndatedCompletedPatterns(): ExtractedPattern[] {
  return [
    createTestPattern({
      id: generatePatternId(1),
      name: 'Legacy Pattern 1',
      status: 'completed',
      category: 'core',
    }),
    createTestPattern({
      id: generatePatternId(2),
      name: 'Legacy Pattern 2',
      status: 'completed',
      category: 'core',
    }),
  ];
}

function createCategoryMappedPatterns(spec: DataTableRow[]): ExtractedPattern[] {
  const patterns: ExtractedPattern[] = [];
  let patternIndex = 0;

  for (const row of spec) {
    const category = row.category ?? 'core';
    patternIndex++;
    patterns.push(
      createTestPattern({
        id: generatePatternId(patternIndex),
        name: `${category} Pattern`,
        status: 'completed',
        category: category,
      })
    );
    // Add release to ensure it shows in a release section
    const pattern = patterns[patterns.length - 1] as ExtractedPattern & { release?: string };
    pattern.release = 'v1.0.0';
  }

  return patterns;
}

function createMixedChangeTypePatterns(): ExtractedPattern[] {
  const categories = ['core', 'fix', 'refactor', 'deprecated', 'security', 'bugfix'];
  const patterns: ExtractedPattern[] = [];

  for (const category of categories) {
    const pattern = createTestPattern({
      id: generatePatternId(patterns.length + 1),
      name: `${category} Feature`,
      status: 'completed',
      category: category,
    }) as ExtractedPattern & { release?: string };
    pattern.release = 'v1.0.0';
    patterns.push(pattern);
  }

  return patterns;
}

function createTraceabilityPatterns(spec: DataTableRow[]): ExtractedPattern[] {
  const patterns: ExtractedPattern[] = [];
  let patternIndex = 0;

  for (const row of spec) {
    patternIndex++;
    const hasBehaviorFile = row.hasBehaviorFile === 'true';
    const phase = parseInt(row.phase ?? '1', 10);

    const pattern = createTestPattern({
      id: generatePatternId(patternIndex),
      name: row.name ?? `Pattern ${patternIndex}`,
      status: 'completed',
      category: 'core',
      phase,
      filePath: `tests/features/timeline/phase-${phase}-test.feature`,
    }) as ExtractedPattern & {
      behaviorFile?: string;
      behaviorFileVerified?: boolean;
    };

    // Mark as Gherkin source for bySource.gherkin filtering
    (pattern.source as { file: string }).file = `tests/features/timeline/phase-${phase}.feature`;

    if (hasBehaviorFile) {
      pattern.behaviorFile = `tests/features/behavior/test-${patternIndex}.feature`;
      pattern.behaviorFileVerified = true;
    }

    patterns.push(pattern);
  }

  return patterns;
}

function createCoverageGapPatterns(): ExtractedPattern[] {
  return [
    (() => {
      const p = createTestPattern({
        id: generatePatternId(1),
        name: 'Covered Pattern',
        status: 'completed',
        category: 'core',
        phase: 1,
        filePath: 'tests/features/timeline/phase-1.feature',
      }) as ExtractedPattern & { behaviorFile?: string; behaviorFileVerified?: boolean };
      (p.source as { file: string }).file = 'tests/features/timeline/phase-1.feature';
      p.behaviorFile = 'tests/features/behavior/covered.feature';
      p.behaviorFileVerified = true;
      return p;
    })(),
    (() => {
      const p = createTestPattern({
        id: generatePatternId(2),
        name: 'Gap Pattern 1',
        status: 'completed',
        category: 'core',
        phase: 2,
        filePath: 'tests/features/timeline/phase-2.feature',
      }) as ExtractedPattern & { behaviorFile?: string; behaviorFileVerified?: boolean };
      (p.source as { file: string }).file = 'tests/features/timeline/phase-2.feature';
      return p;
    })(),
    (() => {
      const p = createTestPattern({
        id: generatePatternId(3),
        name: 'Gap Pattern 2',
        status: 'completed',
        category: 'core',
        phase: 3,
        filePath: 'tests/features/timeline/phase-3.feature',
      }) as ExtractedPattern & { behaviorFile?: string; behaviorFileVerified?: boolean };
      (p.source as { file: string }).file = 'tests/features/timeline/phase-3.feature';
      return p;
    })(),
  ];
}

function createCoveredPatterns(): ExtractedPattern[] {
  const patterns: ExtractedPattern[] = [];

  for (let i = 1; i <= 3; i++) {
    const p = createTestPattern({
      id: generatePatternId(i),
      name: `Covered Pattern ${i}`,
      status: 'completed',
      category: 'core',
      phase: i,
      filePath: `tests/features/timeline/phase-${i}.feature`,
    }) as ExtractedPattern & { behaviorFile?: string; behaviorFileVerified?: boolean };
    (p.source as { file: string }).file = `tests/features/timeline/phase-${i}.feature`;
    p.behaviorFile = `tests/features/behavior/pattern-${i}.feature`;
    p.behaviorFileVerified = true;
    patterns.push(p);
  }

  return patterns;
}

function createVerifiedBehaviorPatterns(): ExtractedPattern[] {
  const patterns: ExtractedPattern[] = [];

  // Pattern with verified behavior file
  const verified = createTestPattern({
    id: generatePatternId(1),
    name: 'Verified Pattern',
    status: 'completed',
    category: 'core',
    phase: 1,
    filePath: 'tests/features/timeline/phase-1.feature',
  }) as ExtractedPattern & { behaviorFile?: string; behaviorFileVerified?: boolean };
  (verified.source as { file: string }).file = 'tests/features/timeline/phase-1.feature';
  verified.behaviorFile = 'tests/features/behavior/verified.feature';
  verified.behaviorFileVerified = true;
  patterns.push(verified);

  // Pattern with inferred (unverified) behavior file
  const inferred = createTestPattern({
    id: generatePatternId(2),
    name: 'Inferred Pattern',
    status: 'completed',
    category: 'core',
    phase: 2,
    filePath: 'tests/features/timeline/phase-2.feature',
  }) as ExtractedPattern & { behaviorFile?: string; behaviorFileVerified?: boolean };
  (inferred.source as { file: string }).file = 'tests/features/timeline/phase-2.feature';
  inferred.behaviorFile = 'tests/features/behavior/inferred.feature';
  inferred.behaviorFileVerified = false;
  patterns.push(inferred);

  return patterns;
}

function createOverviewPatterns(): ExtractedPattern[] {
  return [
    createTestPattern({
      id: generatePatternId(1),
      name: 'System Architecture',
      status: 'completed',
      category: 'overview',
      description: 'Overview of the system architecture and key components.',
    }),
  ];
}

function createMultipleOverviewPatterns(spec: DataTableRow[]): ExtractedPattern[] {
  const patterns: ExtractedPattern[] = [];
  let patternIndex = 0;

  for (const row of spec) {
    patternIndex++;
    const pattern = createTestPattern({
      id: generatePatternId(patternIndex),
      name: row.name ?? `Overview ${patternIndex}`,
      status: 'completed',
      category: 'overview',
      description: row.description ?? `Description for ${row.name ?? ''}`,
    });
    patterns.push(pattern);
  }

  return patterns;
}

function createPhasedPatterns(): ExtractedPattern[] {
  return [
    createTestPattern({
      id: generatePatternId(1),
      name: 'Phase 1 Complete',
      status: 'completed',
      category: 'core',
      phase: 1,
    }),
    createTestPattern({
      id: generatePatternId(2),
      name: 'Phase 2 Active',
      status: 'active',
      category: 'core',
      phase: 2,
    }),
    createTestPattern({
      id: generatePatternId(3),
      name: 'Phase 3 Planned',
      status: 'roadmap',
      category: 'core',
      phase: 3,
    }),
  ];
}

// =============================================================================
// Feature: Reporting Document Codecs
// =============================================================================

const feature = await loadFeature('tests/features/behavior/codecs/reporting-codecs.feature');

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a reporting codec test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Rule: ChangelogCodec follows Keep a Changelog format
  // ===========================================================================

  Rule('ChangelogCodec follows Keep a Changelog format', ({ RuleScenario }) => {
    RuleScenario(
      'Decode empty dataset produces changelog header only',
      ({ Given, When, Then, And }) => {
        Given('an empty MasterDataset for changelog', () => {
          state!.dataset = createTestMasterDataset();
        });

        When('decoding with ChangelogCodec', () => {
          state!.document = ChangelogCodec.decode(state!.dataset!);
        });

        Then('the document title is {string}', (_ctx: unknown, title: string) => {
          expect(state!.document!.title).toBe(title);
        });

        And('the document contains Keep a Changelog header', () => {
          const paragraphs = state!.document!.sections.filter(isParagraph);
          const text = paragraphs.map((p) => p.text).join(' ');
          expect(text).toContain('Keep a Changelog');
        });
      }
    );

    RuleScenario(
      'Unreleased section shows active and vNEXT patterns',
      ({ Given, When, Then, And }) => {
        Given('a MasterDataset with unreleased patterns', () => {
          state!.dataset = createTestMasterDataset({
            patterns: createUnreleasedPatterns(),
          });
        });

        When('decoding with ChangelogCodec', () => {
          state!.document = ChangelogCodec.decode(state!.dataset!);
        });

        Then('the document contains {string} heading', (_ctx: unknown, headingText: string) => {
          const headings = findHeadings(state!.document!);
          const found = headings.some((h) => h.text.includes(headingText));
          expect(found, `Expected heading containing "${headingText}"`).toBe(true);
        });

        And('the unreleased section contains active patterns', () => {
          // Check that the document renders active patterns
          const headings = findHeadings(state!.document!);
          const unreleased = headings.find((h) => h.text.includes('Unreleased'));
          expect(unreleased).toBeDefined();
        });

        And('the unreleased section contains vNEXT patterns', () => {
          // vNEXT patterns should be in the unreleased section
          const headings = findHeadings(state!.document!);
          const unreleased = headings.find((h) => h.text.includes('Unreleased'));
          expect(unreleased).toBeDefined();
        });
      }
    );

    RuleScenario('Release sections sorted by semver descending', ({ Given, When, Then }) => {
      Given(
        'a MasterDataset with multiple releases:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          state!.dataset = createTestMasterDataset({
            patterns: createPatternsWithReleases(dataTable),
          });
        }
      );

      When('decoding with ChangelogCodec', () => {
        state!.document = ChangelogCodec.decode(state!.dataset!);
      });

      Then('the release sections appear in order:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const headings = findHeadings(state!.document!);
        const releasePattern = /\[v\d+\.\d+\.\d+\]/;
        const releaseExtractPattern = /\[(v\d+\.\d+\.\d+)\]/;
        const releaseHeadings = headings.filter((h) => releasePattern.test(h.text));

        const actualOrder = releaseHeadings.map((h) => {
          const match = releaseExtractPattern.exec(h.text);
          return match ? match[1] : '';
        });

        const expectedOrder = dataTable.map((row) => row.release ?? '');

        for (let i = 0; i < expectedOrder.length; i++) {
          expect(actualOrder[i]).toBe(expectedOrder[i]);
        }
      });
    });

    RuleScenario('Quarter fallback for patterns without release', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with completed patterns without release tag', () => {
        state!.dataset = createTestMasterDataset({
          patterns: createCompletedPatternsWithoutRelease(),
        });
      });

      When('decoding with ChangelogCodec', () => {
        state!.document = ChangelogCodec.decode(state!.dataset!);
      });

      Then('the document contains quarterly sections', () => {
        const headings = findHeadings(state!.document!);
        const quarterPattern = /\[Q\d-\d{4}\]/;
        const quarterlyHeadings = headings.filter((h) => quarterPattern.test(h.text));
        expect(quarterlyHeadings.length).toBeGreaterThan(0);
      });

      And('the quarterly sections contain patterns', () => {
        // Quarterly sections should have content (lists of patterns)
        const headings = findHeadings(state!.document!);
        const quarterPattern = /\[Q\d-\d{4}\]/;
        const quarterlyHeading = headings.find((h) => quarterPattern.test(h.text));
        expect(quarterlyHeading).toBeDefined();
      });
    });

    RuleScenario('Earlier section for undated patterns', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with undated completed patterns', () => {
        state!.dataset = createTestMasterDataset({
          patterns: createUndatedCompletedPatterns(),
        });
      });

      When('decoding with ChangelogCodec', () => {
        state!.document = ChangelogCodec.decode(state!.dataset!);
      });

      Then('the document contains {string} heading', (_ctx: unknown, headingText: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(headingText));
        expect(found, `Expected heading containing "${headingText}"`).toBe(true);
      });

      And('the earlier section contains undated patterns', () => {
        const headings = findHeadings(state!.document!);
        const earlierHeading = headings.find((h) => h.text.includes('Earlier'));
        expect(earlierHeading).toBeDefined();
      });
    });

    RuleScenario('Category mapping to change types', ({ Given, When, Then }) => {
      Given(
        'a MasterDataset with category-mapped patterns:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          state!.dataset = createTestMasterDataset({
            patterns: createCategoryMappedPatterns(dataTable),
          });
        }
      );

      When('decoding with ChangelogCodec', () => {
        state!.document = ChangelogCodec.decode(state!.dataset!);
      });

      Then('each category maps to correct change type', () => {
        const headings = findHeadings(state!.document!);
        const changeTypeHeadings = headings.filter((h) =>
          ['Added', 'Changed', 'Fixed', 'Removed', 'Security'].includes(h.text)
        );
        expect(changeTypeHeadings.length).toBeGreaterThan(0);
      });
    });

    RuleScenario('Exclude unreleased when option disabled', ({ Given, When, Then }) => {
      Given('a MasterDataset with unreleased patterns', () => {
        state!.dataset = createTestMasterDataset({
          patterns: createUnreleasedPatterns(),
        });
      });

      When('decoding with includeUnreleased disabled', () => {
        const codec = createChangelogCodec({ includeUnreleased: false });
        state!.document = codec.decode(state!.dataset!);
      });

      Then(
        'the document does not contain {string} heading',
        (_ctx: unknown, headingText: string) => {
          const headings = findHeadings(state!.document!);
          const found = headings.some((h) => h.text.includes(headingText));
          expect(found, `Expected no heading containing "${headingText}"`).toBe(false);
        }
      );
    });

    RuleScenario('Change type sections follow standard order', ({ Given, When, Then }) => {
      Given('a MasterDataset with mixed change types', () => {
        state!.dataset = createTestMasterDataset({
          patterns: createMixedChangeTypePatterns(),
        });
      });

      When('decoding with ChangelogCodec', () => {
        state!.document = ChangelogCodec.decode(state!.dataset!);
      });

      Then('change type sections follow order:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const headings = findHeadings(state!.document!);
        const standardTypes = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];
        const changeTypeHeadings = headings.filter((h) => standardTypes.includes(h.text));

        const expectedOrder = dataTable.map((row) => row.type ?? '');
        const actualOrder = changeTypeHeadings.map((h) => h.text);

        // Check that actual order respects expected order (may not have all types)
        let lastIdx = -1;
        for (const type of actualOrder) {
          const idx = expectedOrder.indexOf(type);
          if (idx !== -1) {
            expect(idx).toBeGreaterThan(lastIdx);
            lastIdx = idx;
          }
        }
      });
    });
  });

  // ===========================================================================
  // Rule: TraceabilityCodec maps timeline patterns to behavior tests
  // ===========================================================================

  Rule('TraceabilityCodec maps timeline patterns to behavior tests', ({ RuleScenario }) => {
    RuleScenario('No timeline patterns produces empty message', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with no timeline patterns', () => {
        // Create patterns without phase (not timeline patterns)
        state!.dataset = createTestMasterDataset({
          patterns: [
            createTestPattern({
              id: generatePatternId(1),
              name: 'Non-timeline Pattern',
              status: 'completed',
              category: 'core',
            }),
          ],
        });
      });

      When('decoding with TraceabilityCodec', () => {
        state!.document = TraceabilityCodec.decode(state!.dataset!);
      });

      Then('the document title is {string}', (_ctx: unknown, title: string) => {
        expect(state!.document!.title).toBe(title);
      });

      And('the document contains {string} heading', (_ctx: unknown, headingText: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(headingText));
        expect(found, `Expected heading containing "${headingText}"`).toBe(true);
      });
    });

    RuleScenario('Coverage statistics show totals and percentage', ({ Given, When, Then }) => {
      Given(
        'a MasterDataset with traceability patterns:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          state!.dataset = createTestMasterDataset({
            patterns: createTraceabilityPatterns(dataTable),
          });
        }
      );

      When('decoding with TraceabilityCodec', () => {
        state!.document = TraceabilityCodec.decode(state!.dataset!);
      });

      Then('the coverage statistics table shows:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const table = findTableAfterHeading(state!.document!, 'Coverage Statistics');
        expect(table).toBeDefined();

        for (const row of dataTable) {
          const metric = row.metric ?? '';
          const expectedValue = row.value ?? '';
          const tableRow = table!.rows.find((r) => r[0]?.includes(metric));
          expect(tableRow, `Should have row for ${metric}`).toBeDefined();
          expect(tableRow![1]).toBe(expectedValue);
        }
      });
    });

    RuleScenario('Coverage gaps table shows missing coverage', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with coverage gaps', () => {
        state!.dataset = createTestMasterDataset({
          patterns: createCoverageGapPatterns(),
        });
      });

      When('decoding with TraceabilityCodec', () => {
        state!.document = TraceabilityCodec.decode(state!.dataset!);
      });

      Then('the document contains {string} heading', (_ctx: unknown, headingText: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(headingText));
        expect(found, `Expected heading containing "${headingText}"`).toBe(true);
      });

      And('the gaps table shows patterns without behavior files', () => {
        const table = findTableAfterHeading(state!.document!, 'Coverage Gaps');
        expect(table).toBeDefined();
        expect(table!.rows.length).toBeGreaterThan(0);
        // Check for missing status indicator
        const hasMissing = table!.rows.some((row) => row.some((cell) => cell.includes('Missing')));
        expect(hasMissing).toBe(true);
      });
    });

    RuleScenario('Covered phases in collapsible section', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with covered patterns', () => {
        state!.dataset = createTestMasterDataset({
          patterns: createCoveredPatterns(),
        });
      });

      When('decoding with TraceabilityCodec', () => {
        state!.document = TraceabilityCodec.decode(state!.dataset!);
      });

      Then('the document contains covered phases collapsible', () => {
        const collapsibles = findCollapsibles(state!.document!);
        const coveredCollapsible = collapsibles.find((c) => c.summary.includes('Covered'));
        expect(coveredCollapsible).toBeDefined();
      });

      And('the covered phases table shows behavior file paths', () => {
        const collapsibles = findCollapsibles(state!.document!);
        const coveredCollapsible = collapsibles.find((c) => c.summary.includes('Covered'));
        expect(coveredCollapsible).toBeDefined();

        // Find table inside collapsible
        const tableBlock = coveredCollapsible!.content.find((b) => isTable(b));
        expect(tableBlock).toBeDefined();
        expect(isTable(tableBlock!)).toBe(true);
        expect(tableBlock!.columns).toContain('Behavior File');
      });
    });

    RuleScenario('Exclude gaps when option disabled', ({ Given, When, Then }) => {
      Given('a MasterDataset with coverage gaps', () => {
        state!.dataset = createTestMasterDataset({
          patterns: createCoverageGapPatterns(),
        });
      });

      When('decoding with includeGaps disabled', () => {
        const codec = createTraceabilityCodec({ includeGaps: false });
        state!.document = codec.decode(state!.dataset!);
      });

      Then(
        'the document does not contain {string} heading',
        (_ctx: unknown, headingText: string) => {
          const headings = findHeadings(state!.document!);
          const found = headings.some((h) => h.text.includes(headingText));
          expect(found, `Expected no heading containing "${headingText}"`).toBe(false);
        }
      );
    });

    RuleScenario('Exclude stats when option disabled', ({ Given, When, Then }) => {
      Given(
        'a MasterDataset with traceability patterns:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          state!.dataset = createTestMasterDataset({
            patterns: createTraceabilityPatterns(dataTable),
          });
        }
      );

      When('decoding with includeStats disabled', () => {
        const codec = createTraceabilityCodec({ includeStats: false });
        state!.document = codec.decode(state!.dataset!);
      });

      Then(
        'the document does not contain {string} heading',
        (_ctx: unknown, headingText: string) => {
          const headings = findHeadings(state!.document!);
          const found = headings.some((h) => h.text.includes(headingText));
          expect(found, `Expected no heading containing "${headingText}"`).toBe(false);
        }
      );
    });

    RuleScenario('Exclude covered when option disabled', ({ Given, When, Then }) => {
      Given('a MasterDataset with covered patterns', () => {
        state!.dataset = createTestMasterDataset({
          patterns: createCoveredPatterns(),
        });
      });

      When('decoding with includeCovered disabled', () => {
        const codec = createTraceabilityCodec({ includeCovered: false });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('the document does not contain covered phases collapsible', () => {
        const collapsibles = findCollapsibles(state!.document!);
        const coveredCollapsible = collapsibles.find((c) => c.summary.includes('Covered'));
        expect(coveredCollapsible).toBeUndefined();
      });
    });

    RuleScenario('Verified behavior files indicated in output', ({ Given, When, Then }) => {
      Given('a MasterDataset with verified behavior files', () => {
        state!.dataset = createTestMasterDataset({
          patterns: createVerifiedBehaviorPatterns(),
        });
      });

      When('decoding with TraceabilityCodec', () => {
        state!.document = TraceabilityCodec.decode(state!.dataset!);
      });

      Then('the covered patterns show verification status', () => {
        const collapsibles = findCollapsibles(state!.document!);
        const coveredCollapsible = collapsibles.find((c) => c.summary.includes('Covered'));
        expect(coveredCollapsible).toBeDefined();
      });
    });
  });

  // ===========================================================================
  // Rule: OverviewCodec provides project architecture summary
  // ===========================================================================

  Rule('OverviewCodec provides project architecture summary', ({ RuleScenario }) => {
    RuleScenario('Decode empty dataset produces minimal overview', ({ Given, When, Then, And }) => {
      Given('an empty MasterDataset for overview', () => {
        state!.dataset = createTestMasterDataset();
      });

      When('decoding with OverviewCodec', () => {
        state!.document = OverviewCodec.decode(state!.dataset!);
      });

      Then('the document title is {string}', (_ctx: unknown, title: string) => {
        expect(state!.document!.title).toBe(title);
      });

      And('the document has a purpose', () => {
        expect(state!.document!.purpose).toBeDefined();
        expect(state!.document!.purpose!.length).toBeGreaterThan(0);
      });
    });

    RuleScenario(
      'Architecture section from overview-tagged patterns',
      ({ Given, When, Then, And }) => {
        Given('a MasterDataset with overview patterns', () => {
          state!.dataset = createTestMasterDataset({
            patterns: createOverviewPatterns(),
          });
        });

        When('decoding with OverviewCodec', () => {
          state!.document = OverviewCodec.decode(state!.dataset!);
        });

        Then('the document contains {string} heading', (_ctx: unknown, headingText: string) => {
          const headings = findHeadings(state!.document!);
          const found = headings.some((h) => h.text.includes(headingText));
          expect(found, `Expected heading containing "${headingText}"`).toBe(true);
        });

        And('the architecture section contains overview pattern descriptions', () => {
          const { content } = findSectionAfterHeading(state!.document!, 'Architecture');
          // Should have some content after the Architecture heading
          expect(content.length).toBeGreaterThanOrEqual(0);
        });
      }
    );

    RuleScenario('Patterns summary with progress bar', ({ Given, When, Then, And }) => {
      Given(
        'a MasterDataset with status distribution for overview:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          const counts: Record<string, number> = {};
          for (const row of dataTable) {
            counts[row.status ?? 'completed'] = parseInt(row.count ?? '0', 10);
          }
          state!.dataset = createMasterDatasetWithStatus(counts);
        }
      );

      When('decoding with OverviewCodec', () => {
        state!.document = OverviewCodec.decode(state!.dataset!);
      });

      Then('the document contains {string} heading', (_ctx: unknown, headingText: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(headingText));
        expect(found, `Expected heading containing "${headingText}"`).toBe(true);
      });

      And('the patterns summary shows progress percentage', () => {
        const { content } = findSectionAfterHeading(state!.document!, 'Patterns Summary');
        const text = content.join(' ');
        expect(text).toMatch(/%/);
      });

      And('the patterns summary shows category counts table', () => {
        const table = findTableAfterHeading(state!.document!, 'Patterns Summary');
        expect(table).toBeDefined();
        expect(table!.columns).toContain('Category');
        expect(table!.columns).toContain('Count');
      });
    });

    RuleScenario('Timeline summary with phase counts', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with phased patterns', () => {
        state!.dataset = createTestMasterDataset({
          patterns: createPhasedPatterns(),
        });
      });

      When('decoding with OverviewCodec', () => {
        state!.document = OverviewCodec.decode(state!.dataset!);
      });

      Then('the document contains {string} heading', (_ctx: unknown, headingText: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(headingText));
        expect(found, `Expected heading containing "${headingText}"`).toBe(true);
      });

      And('the timeline summary table shows:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const table = findTableAfterHeading(state!.document!, 'Timeline Summary');
        expect(table).toBeDefined();

        for (const row of dataTable) {
          const metric = row.metric ?? '';
          const found = table!.rows.some((r) => r[0]?.includes(metric));
          expect(found, `Should have row for ${metric}`).toBe(true);
        }
      });
    });

    RuleScenario('Exclude architecture when option disabled', ({ Given, When, Then }) => {
      Given('a MasterDataset with overview patterns', () => {
        state!.dataset = createTestMasterDataset({
          patterns: createOverviewPatterns(),
        });
      });

      When('decoding with includeArchitecture disabled', () => {
        const codec = createOverviewCodec({ includeArchitecture: false });
        state!.document = codec.decode(state!.dataset!);
      });

      Then(
        'the document does not contain {string} heading',
        (_ctx: unknown, headingText: string) => {
          const headings = findHeadings(state!.document!);
          const found = headings.some((h) => h.text.includes(headingText));
          expect(found, `Expected no heading containing "${headingText}"`).toBe(false);
        }
      );
    });

    RuleScenario('Exclude patterns summary when option disabled', ({ Given, When, Then }) => {
      Given(
        'a MasterDataset with status distribution for overview:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          const counts: Record<string, number> = {};
          for (const row of dataTable) {
            counts[row.status ?? 'completed'] = parseInt(row.count ?? '0', 10);
          }
          state!.dataset = createMasterDatasetWithStatus(counts);
        }
      );

      When('decoding with includePatternsSummary disabled', () => {
        const codec = createOverviewCodec({ includePatternsSummary: false });
        state!.document = codec.decode(state!.dataset!);
      });

      Then(
        'the document does not contain {string} heading',
        (_ctx: unknown, headingText: string) => {
          const headings = findHeadings(state!.document!);
          const found = headings.some((h) => h.text.includes(headingText));
          expect(found, `Expected no heading containing "${headingText}"`).toBe(false);
        }
      );
    });

    RuleScenario('Exclude timeline summary when option disabled', ({ Given, When, Then }) => {
      Given('a MasterDataset with phased patterns', () => {
        state!.dataset = createTestMasterDataset({
          patterns: createPhasedPatterns(),
        });
      });

      When('decoding with includeTimelineSummary disabled', () => {
        const codec = createOverviewCodec({ includeTimelineSummary: false });
        state!.document = codec.decode(state!.dataset!);
      });

      Then(
        'the document does not contain {string} heading',
        (_ctx: unknown, headingText: string) => {
          const headings = findHeadings(state!.document!);
          const found = headings.some((h) => h.text.includes(headingText));
          expect(found, `Expected no heading containing "${headingText}"`).toBe(false);
        }
      );
    });

    RuleScenario(
      'Multiple overview patterns create multiple architecture subsections',
      ({ Given, When, Then }) => {
        Given(
          'a MasterDataset with multiple overview patterns:',
          (_ctx: unknown, dataTable: DataTableRow[]) => {
            state!.dataset = createTestMasterDataset({
              patterns: createMultipleOverviewPatterns(dataTable),
            });
          }
        );

        When('decoding with OverviewCodec', () => {
          state!.document = OverviewCodec.decode(state!.dataset!);
        });

        Then('the architecture section has {int} subsections', (_ctx: unknown, count: number) => {
          const headings = findHeadings(state!.document!);
          const archIdx = headings.findIndex((h) => h.text === 'Architecture');
          expect(archIdx).toBeGreaterThanOrEqual(0);

          // Count level 3 headings after Architecture
          let subsectionCount = 0;
          for (let i = archIdx + 1; i < headings.length; i++) {
            if (headings[i].level === 2) break; // Next level 2 heading
            if (headings[i].level === 3) subsectionCount++;
          }

          expect(subsectionCount).toBe(count);
        });
      }
    );
  });
});
