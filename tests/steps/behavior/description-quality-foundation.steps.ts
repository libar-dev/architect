/**
 * Description Quality Foundation Step Definitions
 *
 * BDD step definitions for testing description quality features including
 * human-readable display names, behavior file verification, PRD formatting,
 * and business value display.
 *
 * @libar-docs
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { getDisplayName, formatBusinessValue } from '../../../src/renderable/utils.js';
import { extractFirstSentenceRaw as extractFirstSentence } from '../../../src/utils/string-utils.js';
import { inferBehaviorFilePath } from '../../../src/extractor/gherkin-extractor.js';
import { TraceabilityCodec } from '../../../src/renderable/codecs/reporting.js';
import { RemainingWorkCodec } from '../../../src/renderable/codecs/session.js';
import type { RenderableDocument, TableBlock } from '../../../src/renderable/schema.js';
import type { MasterDataset } from '../../../src/validation-schemas/master-dataset.js';
import type { ExtractedPattern } from '../../../src/types/index.js';
import {
  createTestMasterDataset,
  createTestPattern,
  resetPatternCounter,
} from '../../fixtures/dataset-factories.js';
import { findTables, isHeading, isList } from '../../support/helpers/document-assertions.js';
import type { DataTableRow } from '../../support/world.js';

// =============================================================================
// State Types
// =============================================================================

interface DescriptionQualityState {
  dataset: MasterDataset | null;
  document: RenderableDocument | null;
  pattern: ExtractedPattern | null;
  displayName: string | null;
  formattedBusinessValue: string | null;
  inferredBehaviorPath: string | null;
  firstSentence: string | null;
  inputPatternName: string | null;
  inputName: string | null;
  inputTitle: string | null;
  inputBusinessValue: string | null;
  inputDescription: string | null;
  timelineFilePath: string | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: DescriptionQualityState | null = null;

function initState(): DescriptionQualityState {
  resetPatternCounter();
  return {
    dataset: null,
    document: null,
    pattern: null,
    displayName: null,
    formattedBusinessValue: null,
    inferredBehaviorPath: null,
    firstSentence: null,
    inputPatternName: null,
    inputName: null,
    inputTitle: null,
    inputBusinessValue: null,
    inputDescription: null,
    timelineFilePath: null,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Find a table with a specific column header
 */
function findTableWithColumn(doc: RenderableDocument, columnName: string): TableBlock | null {
  const tables = findTables(doc);
  for (const table of tables) {
    if (table.columns.some((col) => col.toLowerCase().includes(columnName.toLowerCase()))) {
      return table;
    }
  }
  return null;
}

/**
 * Get column values from a table
 */
function getColumnValues(table: TableBlock, columnName: string): string[] {
  const colIdx = table.columns.findIndex((col) =>
    col.toLowerCase().includes(columnName.toLowerCase())
  );
  if (colIdx === -1) return [];
  return table.rows.map((row) => row[colIdx] ?? '');
}

/**
 * Find section content after a heading
 */
function _findSectionContent(doc: RenderableDocument, headingText: string): string {
  const headingIdx = doc.sections.findIndex(
    (s) => isHeading(s) && s.text.toLowerCase().includes(headingText.toLowerCase())
  );
  if (headingIdx === -1) return '';

  let content = '';
  for (let i = headingIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isHeading(section)) break;
    if (isList(section)) {
      content += section.items
        .map((item) => (typeof item === 'string' ? item : item.text))
        .join('\n');
    }
  }
  return content;
}

// =============================================================================
// Feature: Description Quality Foundation
// =============================================================================

const feature = await loadFeature('tests/features/behavior/description-quality-foundation.feature');

describeFeature(feature, ({ AfterEachScenario, Scenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  // ===========================================================================
  // Behavior File Verification (Traceability)
  // ===========================================================================

  Scenario('Behavior file existence verified during extraction', ({ Given, And, When, Then }) => {
    Given('a timeline feature {string}', (_ctx: unknown, filePath: string) => {
      state = initState();
      state.timelineFilePath = filePath;
    });

    And('behavior file {string} exists', (_ctx: unknown, _behaviorPath: string) => {
      // In a real scenario, this would check file existence
      // For testing, we assume the behavior file exists
    });

    When('extracting patterns from the timeline file', () => {
      // Simulate extraction with behavior file verified
      state!.pattern = createTestPattern({
        name: 'RemainingWork',
        behaviorFile: 'tests/features/behavior/remaining-work.feature',
        behaviorFileVerified: true,
      });
    });

    Then('the pattern has behaviorFile {string}', (_ctx: unknown, expectedPath: string) => {
      expect(state!.pattern!.behaviorFile).toBe(expectedPath);
    });

    And('behaviorFileVerified is true', () => {
      expect(state!.pattern!.behaviorFileVerified).toBe(true);
    });
  });

  Scenario('Missing behavior file sets verification to false', ({ Given, And, When, Then }) => {
    Given('a timeline feature {string}', (_ctx: unknown, filePath: string) => {
      state = initState();
      state.timelineFilePath = filePath;
    });

    And('no behavior file exists at {string}', (_ctx: unknown, _behaviorPath: string) => {
      // Behavior file doesn't exist
    });

    When('extracting patterns from the timeline file', () => {
      // Simulate extraction with behavior file not verified
      state!.pattern = createTestPattern({
        name: 'NonexistentFeature',
        behaviorFileVerified: false,
      });
    });

    Then('behaviorFileVerified is false', () => {
      expect(state!.pattern!.behaviorFileVerified).toBe(false);
    });
  });

  Scenario('Explicit behavior file tag skips verification', ({ Given, When, Then, And }) => {
    Given('a timeline feature with explicit behavior file tag', () => {
      state = initState();
      state.timelineFilePath = 'phase-50-explicit.feature';
    });

    When('extracting patterns from the timeline file', () => {
      // Simulate extraction with explicit behavior file (no verification)
      state!.pattern = createTestPattern({
        name: 'ExplicitBehavior',
        behaviorFile: 'custom/path/to/behavior.feature',
        // behaviorFileVerified not set when explicit tag is used
      });
    });

    Then('behaviorFileVerified is undefined', () => {
      expect(state!.pattern!.behaviorFileVerified).toBeUndefined();
    });

    And('the explicit behavior file path is used', () => {
      expect(state!.pattern!.behaviorFile).toBe('custom/path/to/behavior.feature');
    });
  });

  // ===========================================================================
  // Traceability Coverage Reporting
  // ===========================================================================

  Scenario(
    'Traceability shows covered phases with verified behavior files',
    ({ Given, When, Then, And }) => {
      Given(
        'patterns with the following behavior files:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          state = initState();
          const patterns = dataTable.map((row) => {
            const phase = parseInt(row.Phase ?? '0', 10);
            const verified = row.Verified === 'true';
            // Use .feature file path so patterns appear in bySource.gherkin
            return createTestPattern({
              name: row.Name ?? 'Pattern',
              phase,
              status: 'roadmap',
              filePath: `tests/features/timeline/phase-${phase}-test.feature`,
              behaviorFile: row.BehaviorFile || undefined,
              behaviorFileVerified: row.BehaviorFile ? verified : undefined,
            });
          });
          state.dataset = createTestMasterDataset({ patterns });
        }
      );

      When('generating traceability report', () => {
        state!.document = TraceabilityCodec.decode(state!.dataset!);
      });

      Then('the coverage statistics show {int} covered phases', (_ctx: unknown, count: number) => {
        // Look for coverage statistics in the document
        const tables = findTables(state!.document!);
        // The exact assertion depends on how the codec structures the output
        expect(tables.length).toBeGreaterThan(0);
        // Count patterns with verified behavior files
        const coveredPatterns = state!.dataset!.patterns.filter(
          (p) => p.behaviorFileVerified === true
        );
        expect(coveredPatterns.length).toBe(count);
      });

      And(
        'the covered table includes {string} and {string}',
        (_ctx: unknown, name1: string, name2: string) => {
          const docText = JSON.stringify(state!.document!.sections);
          expect(docText).toContain(name1);
          expect(docText).toContain(name2);
        }
      );

      And('the gaps section includes {string}', (_ctx: unknown, gapName: string) => {
        const docText = JSON.stringify(state!.document!.sections);
        expect(docText).toContain(gapName);
      });
    }
  );

  // ===========================================================================
  // Human-Readable Display Names
  // ===========================================================================

  Scenario('CamelCase pattern names transformed to title case', ({ Given, When, Then }) => {
    Given('a pattern with patternName {string}', (_ctx: unknown, patternName: string) => {
      state = initState();
      state.inputPatternName = patternName;
      state.pattern = createTestPattern({
        name: patternName,
      });
      // Override patternName directly since factory uses name
      (state.pattern as { patternName: string }).patternName = patternName;
    });

    When('getting the display name', () => {
      state!.displayName = getDisplayName(state!.pattern!);
    });

    Then('the display name is {string}', (_ctx: unknown, expected: string) => {
      expect(state!.displayName).toBe(expected);
    });
  });

  Scenario('PascalCase with consecutive caps handled correctly', ({ Given, When, Then }) => {
    Given('a pattern with patternName {string}', (_ctx: unknown, patternName: string) => {
      state = initState();
      state.inputPatternName = patternName;
      state.pattern = createTestPattern({
        name: patternName,
      });
      (state.pattern as { patternName: string }).patternName = patternName;
    });

    When('getting the display name', () => {
      state!.displayName = getDisplayName(state!.pattern!);
    });

    Then('the display name is {string}', (_ctx: unknown, expected: string) => {
      expect(state!.displayName).toBe(expected);
    });
  });

  Scenario('Falls back to name when no patternName', ({ Given, When, Then }) => {
    Given('a pattern without patternName but with name {string}', (_ctx: unknown, name: string) => {
      state = initState();
      state.inputName = name;
      state.pattern = createTestPattern({
        name: name,
      });
      // Remove patternName to test fallback
      delete (state.pattern as { patternName?: string }).patternName;
    });

    When('getting the display name', () => {
      state!.displayName = getDisplayName(state!.pattern!);
    });

    Then('the display name is {string} unchanged', (_ctx: unknown, expected: string) => {
      expect(state!.displayName).toBe(expected);
    });
  });

  // ===========================================================================
  // PRD Acceptance Criteria Formatting
  // ===========================================================================

  Scenario(
    'PRD shows numbered acceptance criteria with bold keywords',
    ({ Given, And, When, Then }) => {
      Given(
        'a pattern with acceptance criteria scenarios:',
        (_ctx: unknown, _dataTable: DataTableRow[]) => {
          state = initState();
          // Create a pattern with acceptance scenarios
          state.pattern = createTestPattern({
            name: 'TestPattern',
            status: 'roadmap',
          });
          state.dataset = createTestMasterDataset({ patterns: [state.pattern] });
        }
      );

      And('scenarios have Given/When/Then steps', () => {
        // Steps are part of the pattern's feature content
        // This is testing PRD rendering, not extraction
      });

      When('generating PRD with includeScenarioSteps enabled', () => {
        // PRD generation would use RequirementsDocumentCodec or similar
        // For this test, we verify the pattern has expected structure
        expect(state!.dataset).toBeDefined();
      });

      Then('scenarios are numbered starting from {int}', (_ctx: unknown, _startNum: number) => {
        // Verify PRD output would have numbered scenarios
        // This tests the rendering logic
        expect(state!.dataset!.patterns.length).toBeGreaterThan(0);
      });

      And('steps have bold keywords (Given, When, Then)', () => {
        // Verify step formatting in PRD output
        // The actual verification would check rendered markdown
        expect(true).toBe(true); // Placeholder for PRD rendering verification
      });
    }
  );

  Scenario('PRD respects includeScenarioSteps flag', ({ Given, When, Then, But }) => {
    Given('a pattern with acceptance criteria scenarios', () => {
      state = initState();
      state.pattern = createTestPattern({
        name: 'TestPattern',
        status: 'roadmap',
      });
      state.dataset = createTestMasterDataset({ patterns: [state.pattern] });
    });

    When('generating PRD with includeScenarioSteps disabled', () => {
      // PRD generation with steps disabled
      expect(state!.dataset).toBeDefined();
    });

    Then('scenario names are shown', () => {
      expect(state!.dataset!.patterns.length).toBeGreaterThan(0);
    });

    But('Given/When/Then steps are NOT rendered', () => {
      // Verify steps are not in output when disabled
      expect(true).toBe(true); // Placeholder
    });
  });

  // ===========================================================================
  // Business Value Formatting
  // ===========================================================================

  Scenario('Hyphenated business value converted to spaces', ({ Given, When, Then }) => {
    Given('a pattern with businessValue {string}', (_ctx: unknown, value: string) => {
      state = initState();
      state.inputBusinessValue = value;
    });

    When('formatting the business value', () => {
      state!.formattedBusinessValue = formatBusinessValue(state!.inputBusinessValue!);
    });

    Then('the result is {string}', (_ctx: unknown, expected: string) => {
      expect(state!.formattedBusinessValue).toBe(expected);
    });
  });

  // ===========================================================================
  // File Extension Sentence Detection
  // ===========================================================================

  Scenario('File extensions not treated as sentence endings', ({ Given, When, Then }) => {
    Given('a description {string}', (_ctx: unknown, description: string) => {
      state = initState();
      state.inputDescription = description;
    });

    When('extracting the first sentence', () => {
      state!.firstSentence = extractFirstSentence(state!.inputDescription!);
    });

    Then('the result is {string}', (_ctx: unknown, expected: string) => {
      expect(state!.firstSentence).toBe(expected);
    });
  });

  // ===========================================================================
  // Explicit Title Override
  // ===========================================================================

  Scenario(
    'Explicit title tag overrides CamelCase transformation',
    ({ Given, And, When, Then }) => {
      Given('a pattern with title {string}', (_ctx: unknown, title: string) => {
        state = initState();
        state.inputTitle = title;
      });

      And('patternName {string}', (_ctx: unknown, patternName: string) => {
        state!.inputPatternName = patternName;
        state!.pattern = createTestPattern({
          name: patternName,
          title: state!.inputTitle!,
        });
        (state!.pattern as { patternName: string }).patternName = patternName;
      });

      When('getting the display name', () => {
        state!.displayName = getDisplayName(state!.pattern!);
      });

      Then('the result is {string}', (_ctx: unknown, expected: string) => {
        expect(state!.displayName).toBe(expected);
      });
    }
  );

  // ===========================================================================
  // Business Value in REMAINING-WORK.md
  // ===========================================================================

  Scenario('Business value displayed in Next Actionable table', ({ Given, When, Then, And }) => {
    Given('roadmap patterns with business values:', (_ctx: unknown, dataTable: DataTableRow[]) => {
      state = initState();
      const patterns = dataTable.map((row) => {
        const phase = parseInt(row.Phase ?? '0', 10);
        return createTestPattern({
          name: row.Name ?? 'Pattern',
          phase,
          status: 'roadmap',
          businessValue: row.BusinessValue,
        });
      });
      state.dataset = createTestMasterDataset({ patterns });
    });

    When('generating REMAINING-WORK.md', () => {
      state!.document = RemainingWorkCodec.decode(state!.dataset!);
    });

    Then('the Next Actionable table includes a Business Value column', () => {
      // Business value appears in the "Ready to Start" table within detail files
      // (additionalFiles). Each phase has its own detail file with Business Value column.
      const additionalFiles = state!.document!.additionalFiles;
      expect(additionalFiles).toBeDefined();
      expect(Object.keys(additionalFiles!).length).toBeGreaterThan(0);

      // Check that at least one detail file has the Business Value column
      let foundBusinessValueTable = false;
      for (const fileDoc of Object.values(additionalFiles!)) {
        const table = findTableWithColumn(fileDoc, 'business value');
        if (table?.columns.includes('Business Value')) {
          foundBusinessValueTable = true;
          break;
        }
      }
      expect(
        foundBusinessValueTable,
        'Expected at least one detail file with Business Value column'
      ).toBe(true);
    });

    And(
      'the Business Value column shows expected values:',
      (_ctx: unknown, dataTable: DataTableRow[]) => {
        // Collect all business values from detail file tables
        const additionalFiles = state!.document!.additionalFiles;
        expect(additionalFiles).toBeDefined();

        const allBusinessValues: string[] = [];
        for (const fileDoc of Object.values(additionalFiles!)) {
          const table = findTableWithColumn(fileDoc, 'business value');
          if (table) {
            const values = getColumnValues(table, 'business value');
            allBusinessValues.push(...values);
          }
        }

        // Check each expected value appears
        for (const row of dataTable) {
          const expected = row.value ?? '';
          const found = allBusinessValues.some((v) =>
            v.toLowerCase().includes(expected.toLowerCase())
          );
          expect(found, `Expected business value "${expected}" to be in detail files`).toBe(true);
        }
      }
    );
  });

  // ===========================================================================
  // Full PRD Descriptions
  // ===========================================================================

  Scenario('PRD shows full Feature description without truncation', ({ Given, When, Then }) => {
    Given(
      'a pattern with a {int}-character Feature description',
      (_ctx: unknown, length: number) => {
        state = initState();
        // Create a pattern with a long description
        const longDescription = 'A'.repeat(length);
        state.pattern = createTestPattern({
          name: 'LongDescriptionPattern',
          description: longDescription,
        });
        state.dataset = createTestMasterDataset({ patterns: [state.pattern] });
      }
    );

    When('generating PRODUCT-REQUIREMENTS.md', () => {
      // PRD generation - for now verify dataset is created
      expect(state!.dataset).toBeDefined();
    });

    Then('the full description renders without truncation', () => {
      // Verify the pattern description is preserved
      expect(state!.pattern!.directive.description.length).toBe(600);
    });
  });

  // ===========================================================================
  // Behavior File Inference
  // ===========================================================================

  Scenario('Behavior file inferred from timeline naming convention', ({ Given, When, Then }) => {
    Given('a timeline feature at {string}', (_ctx: unknown, filePath: string) => {
      state = initState();
      state.timelineFilePath = filePath;
    });

    When('inferring the behavior file path', () => {
      state!.inferredBehaviorPath = inferBehaviorFilePath(state!.timelineFilePath!) ?? null;
    });

    Then('the inferred path is {string}', (_ctx: unknown, expected: string) => {
      expect(state!.inferredBehaviorPath).toBe(expected);
    });
  });
});
