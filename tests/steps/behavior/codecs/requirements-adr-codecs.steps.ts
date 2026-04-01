/**
 * Requirements and ADR Codecs Step Definitions
 *
 * BDD step definitions for testing the requirements and ADR codecs:
 * - RequirementsDocumentCodec
 * - AdrDocumentCodec
 *
 * Tests document structure, groupBy options, status filtering, and detail file generation.
 *
 * @architect
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  createRequirementsCodec,
  RequirementsDocumentCodec,
} from '../../../../src/renderable/codecs/requirements.js';
import { createAdrCodec, AdrDocumentCodec } from '../../../../src/renderable/codecs/adr.js';
import type { RenderableDocument, TableBlock } from '../../../../src/renderable/schema.js';
import type { PatternGraph } from '../../../../src/validation-schemas/pattern-graph.js';
import type {
  ExtractedPattern,
  BusinessRule,
  ScenarioRef,
} from '../../../../src/validation-schemas/index.js';
import {
  createTestPatternGraph,
  createTestPattern,
  resetPatternCounter,
} from '../../../fixtures/dataset-factories.js';
import {
  findHeadings,
  findTableWithHeader,
  findCollapsibles,
  findLists,
  isHeading,
  isTable,
  isParagraph,
} from '../../../support/helpers/document-assertions.js';
import type { DataTableRow } from '../../../support/world.js';

// =============================================================================
// Type Extensions for PRD and ADR patterns
// =============================================================================

type PrdPattern = ExtractedPattern & {
  productArea?: string;
  userRole?: string;
  businessValue?: string;
};

type AdrPattern = ExtractedPattern & {
  adr?: string;
  adrStatus?: 'accepted' | 'proposed' | 'deprecated' | 'superseded';
  adrCategory?: string;
  adrSupersedes?: string;
  adrSupersededBy?: string;
};

// =============================================================================
// State Types
// =============================================================================

interface RequirementsAdrCodecState {
  dataset: PatternGraph | null;
  document: RenderableDocument | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: RequirementsAdrCodecState | null = null;

function initState(): RequirementsAdrCodecState {
  resetPatternCounter();
  return {
    dataset: null,
    document: null,
  };
}

// =============================================================================
// Helper Functions - PRD Pattern Creation
// =============================================================================

/**
 * Create patterns with PRD metadata (productArea, userRole, businessValue)
 */
function createPrdPatterns(): PrdPattern[] {
  const base1 = createTestPattern({
    name: 'User Authentication',
    status: 'completed',
    phase: 1,
  });
  const base2 = createTestPattern({
    name: 'User Registration',
    status: 'active',
    phase: 1,
  });
  const base3 = createTestPattern({
    name: 'Metrics Dashboard',
    status: 'roadmap',
    phase: 2,
  });
  const base4 = createTestPattern({
    name: 'Admin Dashboard',
    status: 'completed',
    phase: 2,
  });

  return [
    {
      ...base1,
      productArea: 'Authentication',
      userRole: 'End User',
      businessValue: 'Secure access to the platform',
    },
    {
      ...base2,
      productArea: 'Authentication',
      userRole: 'End User',
      businessValue: 'Onboard new users',
    },
    {
      ...base3,
      productArea: 'Dashboard',
      userRole: 'Admin',
      businessValue: 'Monitor system health',
    },
    {
      ...base4,
      productArea: 'Dashboard',
      userRole: 'Admin',
      businessValue: 'Manage system settings',
    },
  ];
}

/**
 * Create patterns with PRD metadata and scenarios for acceptance criteria testing
 */
function createPrdPatternsWithScenarios(): PrdPattern[] {
  const patterns = createPrdPatterns();

  // Add scenarios to the first pattern
  const scenario: ScenarioRef = {
    featureFile: '/test/features/auth.feature',
    featureName: 'User Authentication',
    featureDescription: 'Authentication feature for end users',
    scenarioName: 'User logs in with valid credentials',
    semanticTags: ['happy-path'],
    tags: ['auth'],
    steps: [
      { keyword: 'Given', text: 'a registered user with email "test@example.com"' },
      { keyword: 'When', text: 'the user submits valid credentials' },
      { keyword: 'Then', text: 'the user is authenticated successfully' },
    ],
  };

  patterns[0] = {
    ...patterns[0],
    scenarios: [scenario],
  };

  return patterns;
}

/**
 * Create patterns with PRD metadata and business rules
 */
function createPrdPatternsWithRules(): PrdPattern[] {
  const patterns = createPrdPatterns();

  const rules: BusinessRule[] = [
    {
      name: 'Password Complexity',
      description: 'Passwords must be at least 8 characters with mixed case and numbers',
      scenarioCount: 0,
      scenarioNames: [],
    },
    {
      name: 'Session Timeout',
      description: 'Sessions expire after 30 minutes of inactivity',
      scenarioCount: 0,
      scenarioNames: [],
    },
  ];

  patterns[0] = {
    ...patterns[0],
    rules,
  };

  return patterns;
}

// =============================================================================
// Helper Functions - ADR Pattern Creation
// =============================================================================

/**
 * Create patterns with ADR metadata
 */
function createAdrPatterns(): AdrPattern[] {
  const base1 = createTestPattern({
    name: 'Event Sourcing',
    status: 'completed',
    phase: 1,
  });
  const base2 = createTestPattern({
    name: 'CQRS Pattern',
    status: 'completed',
    phase: 1,
  });
  const base3 = createTestPattern({
    name: 'Workflow Automation',
    status: 'active',
    phase: 2,
  });
  const base4 = createTestPattern({
    name: 'Use Temporal',
    status: 'completed',
    phase: 2,
  });

  return [
    {
      ...base1,
      adr: '001',
      adrStatus: 'accepted',
      adrCategory: 'architecture',
    },
    {
      ...base2,
      adr: '002',
      adrStatus: 'accepted',
      adrCategory: 'architecture',
    },
    {
      ...base3,
      adr: '003',
      adrStatus: 'proposed',
      adrCategory: 'process',
    },
    {
      ...base4,
      adr: '004',
      adrStatus: 'superseded',
      adrCategory: 'process',
      adrSupersededBy: '005',
    },
  ];
}

/**
 * Create ADR patterns with quarter metadata
 */
function createAdrPatternsWithQuarters(): AdrPattern[] {
  const patterns = createAdrPatterns();
  patterns[0] = { ...patterns[0], quarter: 'Q4-2025' };
  patterns[1] = { ...patterns[1], quarter: 'Q4-2025' };
  patterns[2] = { ...patterns[2], quarter: 'Q1-2026' };
  patterns[3] = { ...patterns[3], quarter: 'Q1-2026' };
  return patterns;
}

/**
 * Create ADR patterns with semantic Rule: keywords (Context, Decision, Consequences)
 */
function createAdrPatternsWithSemanticRules(): AdrPattern[] {
  const patterns = createAdrPatterns();

  const rules: BusinessRule[] = [
    {
      name: 'Context - Event Sourcing Need',
      description: 'We need to track all state changes for audit and debugging purposes.',
      scenarioCount: 0,
      scenarioNames: [],
    },
    {
      name: 'Decision - Use Event Sourcing',
      description: 'We will use event sourcing to capture all domain events as immutable facts.',
      scenarioCount: 0,
      scenarioNames: [],
    },
    {
      name: 'Consequences - Event Store Required',
      description: 'We will need an event store and eventual consistency across read models.',
      scenarioCount: 0,
      scenarioNames: [],
    },
  ];

  patterns[0] = {
    ...patterns[0],
    rules,
  };

  return patterns;
}

/**
 * Create ADR patterns with supersession relationships
 */
function createAdrPatternsWithSupersession(): AdrPattern[] {
  const base1 = createTestPattern({
    name: 'Old Messaging Pattern',
    status: 'completed',
    phase: 1,
  });
  const base2 = createTestPattern({
    name: 'New Messaging Pattern',
    status: 'completed',
    phase: 2,
  });

  return [
    {
      ...base1,
      adr: '001',
      adrStatus: 'superseded',
      adrCategory: 'architecture',
      adrSupersededBy: '002',
    },
    {
      ...base2,
      adr: '002',
      adrStatus: 'accepted',
      adrCategory: 'architecture',
      adrSupersedes: '001',
    },
  ];
}

// =============================================================================
// Helper Functions - Document Inspection
// =============================================================================

function findSummaryTable(doc: RenderableDocument): TableBlock | null {
  const summaryIdx = doc.sections.findIndex((s) => isHeading(s) && s.text === 'Summary');

  if (summaryIdx === -1) {
    return null;
  }

  for (let i = summaryIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isTable(section)) {
      return section;
    }
    if (isHeading(section)) break;
  }

  return null;
}

function findProductAreaSection(doc: RenderableDocument, areaName: string): boolean {
  const headings = findHeadings(doc);
  return headings.some((h) => h.text === areaName || h.text.includes(areaName));
}

function findCategorySection(doc: RenderableDocument, categoryName: string): boolean {
  const headings = findHeadings(doc);
  return headings.some((h) => h.text.toLowerCase().includes(categoryName.toLowerCase()));
}

function documentContainsText(doc: RenderableDocument, text: string): boolean {
  // Check headings
  const headings = findHeadings(doc);
  if (headings.some((h) => h.text.includes(text))) return true;

  // Check all sections
  for (const section of doc.sections) {
    if (isParagraph(section) && section.text.includes(text)) return true;
    if (isTable(section)) {
      // Check table columns
      if (section.columns.some((col) => col.includes(text))) return true;
      // Check table rows
      if (section.rows.some((row) => row.some((cell) => cell.includes(text)))) return true;
    }
    // Check lists
    if (section.type === 'list') {
      if (
        section.items.some((item) => {
          const itemText = typeof item === 'string' ? item : item.text;
          return itemText.includes(text);
        })
      )
        return true;
    }
    // Check link-out blocks
    if (section.type === 'link-out') {
      if (section.text.includes(text) || section.path.includes(text)) return true;
    }
  }

  // Check additional files
  if (doc.additionalFiles) {
    for (const file of Object.values(doc.additionalFiles)) {
      if (documentContainsText(file, text)) return true;
    }
  }

  return false;
}

function findAdrIndexTable(doc: RenderableDocument): TableBlock | null {
  // Find the table under the "ADR Index" heading specifically
  const headings = findHeadings(doc);
  const indexIdx = headings.findIndex((h) => h.text.includes('ADR Index'));

  if (indexIdx === -1) {
    // Fallback to finding any table with ADR header
    return findTableWithHeader(doc, 'ADR');
  }

  const headingIdx = doc.sections.indexOf(headings[indexIdx]);
  for (let i = headingIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isTable(section)) return section;
    if (isHeading(section)) break;
  }

  return null;
}

function getAllFeaturesTable(doc: RenderableDocument): TableBlock | null {
  const headings = findHeadings(doc);
  const allFeaturesIdx = headings.findIndex((h) => h.text.includes('All Features'));

  if (allFeaturesIdx === -1) return null;

  const headingIdx = doc.sections.indexOf(headings[allFeaturesIdx]);
  for (let i = headingIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isTable(section)) return section;
    if (isHeading(section)) break;
  }

  return null;
}

// =============================================================================
// Feature: Requirements and ADR Document Codecs
// =============================================================================

const feature = await loadFeature('tests/features/behavior/codecs/requirements-adr-codecs.feature');

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a requirements and ADR codec test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Rule: RequirementsDocumentCodec generates PRD-style documentation from patterns
  // ===========================================================================

  Rule(
    'RequirementsDocumentCodec generates PRD-style documentation from patterns',
    ({ RuleScenario }) => {
      RuleScenario(
        'No patterns with PRD metadata produces empty message',
        ({ Given, When, Then, And }) => {
          Given('an empty PatternGraph', () => {
            state!.dataset = createTestPatternGraph();
          });

          When('decoding with RequirementsDocumentCodec', () => {
            state!.document = RequirementsDocumentCodec.decode(state!.dataset!);
          });

          Then('the document title is {string}', (_ctx: unknown, title: string) => {
            expect(state!.document!.title).toBe(title);
          });

          And('the document contains {string}', (_ctx: unknown, text: string) => {
            const headings = findHeadings(state!.document!);
            const found = headings.some((h) => h.text.includes(text));
            expect(found, `Document should contain "${text}"`).toBe(true);
          });
        }
      );

      RuleScenario('Summary shows counts and groupings', ({ Given, When, Then, And }) => {
        Given('a PatternGraph with PRD patterns', () => {
          state!.dataset = createTestPatternGraph({ patterns: createPrdPatterns() });
        });

        When('decoding with RequirementsDocumentCodec', () => {
          state!.document = RequirementsDocumentCodec.decode(state!.dataset!);
        });

        Then('the document title is {string}', (_ctx: unknown, title: string) => {
          expect(state!.document!.title).toBe(title);
        });

        And('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
          const headings = findHeadings(state!.document!);
          const found = headings.some((h) => h.text.includes(sectionName));
          expect(found, `Document should contain "${sectionName}" section`).toBe(true);
        });

        And('the summary table shows:', (_ctx: unknown, dataTable: DataTableRow[]) => {
          const table = findSummaryTable(state!.document!);
          expect(table).toBeDefined();

          for (const row of dataTable) {
            const metric = row.metric ?? '';
            const expectedValue = row.value;
            const tableRow = table!.rows.find((r) => r[0]?.includes(metric));
            expect(tableRow, `Should have row for ${metric}`).toBeDefined();
            expect(tableRow![1]).toBe(expectedValue);
          }
        });
      });

      RuleScenario(
        'By product area section groups patterns correctly',
        ({ Given, When, Then, And }) => {
          Given('a PatternGraph with PRD patterns', () => {
            state!.dataset = createTestPatternGraph({ patterns: createPrdPatterns() });
          });

          When('decoding with RequirementsDocumentCodec', () => {
            state!.document = RequirementsDocumentCodec.decode(state!.dataset!);
          });

          Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
            const headings = findHeadings(state!.document!);
            const found = headings.some((h) => h.text.includes(sectionName));
            expect(found, `Document should contain "${sectionName}" section`).toBe(true);
          });

          And('the product areas show their features', () => {
            expect(findProductAreaSection(state!.document!, 'Authentication')).toBe(true);
            expect(findProductAreaSection(state!.document!, 'Dashboard')).toBe(true);
          });
        }
      );

      RuleScenario('By user role section uses collapsible groups', ({ Given, When, Then, And }) => {
        Given('a PatternGraph with PRD patterns', () => {
          state!.dataset = createTestPatternGraph({ patterns: createPrdPatterns() });
        });

        When('decoding with RequirementsDocumentCodec', () => {
          state!.document = RequirementsDocumentCodec.decode(state!.dataset!);
        });

        Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
          const headings = findHeadings(state!.document!);
          const found = headings.some((h) => h.text.includes(sectionName));
          expect(found, `Document should contain "${sectionName}" section`).toBe(true);
        });

        And('user role sections are collapsible', () => {
          const collapsibles = findCollapsibles(state!.document!);
          expect(collapsibles.length).toBeGreaterThan(0);
        });
      });

      RuleScenario(
        'Group by phase option changes primary grouping',
        ({ Given, When, Then, And }) => {
          Given('a PatternGraph with PRD patterns', () => {
            state!.dataset = createTestPatternGraph({ patterns: createPrdPatterns() });
          });

          When('decoding with RequirementsDocumentCodec using groupBy phase', () => {
            const codec = createRequirementsCodec({ groupBy: 'phase' });
            state!.document = codec.decode(state!.dataset!);
          });

          Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
            const headings = findHeadings(state!.document!);
            const found = headings.some((h) => h.text.includes(sectionName));
            expect(found, `Document should contain "${sectionName}" section`).toBe(true);
          });

          And('phase {int} shows its features', (_ctx: unknown, phaseNum: number) => {
            const headings = findHeadings(state!.document!);
            const found = headings.some((h) => h.text.includes(`Phase ${phaseNum}`));
            expect(found, `Phase ${phaseNum} section should exist`).toBe(true);
          });
        }
      );

      RuleScenario('Filter by status option limits patterns', ({ Given, When, Then }) => {
        Given('a PatternGraph with PRD patterns', () => {
          state!.dataset = createTestPatternGraph({ patterns: createPrdPatterns() });
        });

        When('decoding with RequirementsDocumentCodec filtering to completed status', () => {
          const codec = createRequirementsCodec({ filterStatus: ['completed'] });
          state!.document = codec.decode(state!.dataset!);
        });

        Then('the document shows only completed patterns', () => {
          const table = findSummaryTable(state!.document!);
          expect(table).toBeDefined();
          // With filter, only completed patterns should be counted
          const totalRow = table!.rows.find((r) => r[0]?.includes('Total Features'));
          expect(totalRow).toBeDefined();
          expect(totalRow![1]).toBe('2'); // Only 2 completed patterns
        });
      });

      RuleScenario('All features table shows complete list', ({ Given, When, Then, And }) => {
        Given('a PatternGraph with PRD patterns', () => {
          state!.dataset = createTestPatternGraph({ patterns: createPrdPatterns() });
        });

        When('decoding with RequirementsDocumentCodec', () => {
          state!.document = RequirementsDocumentCodec.decode(state!.dataset!);
        });

        Then('the document contains an {string} section', (_ctx: unknown, sectionName: string) => {
          const headings = findHeadings(state!.document!);
          const found = headings.some((h) => h.text.includes(sectionName));
          expect(found, `Document should contain "${sectionName}" section`).toBe(true);
        });

        And('the all features table has columns:', (_ctx: unknown, dataTable: DataTableRow[]) => {
          const table = getAllFeaturesTable(state!.document!);
          expect(table).toBeDefined();

          for (const row of dataTable) {
            expect(table!.columns).toContain(row.column);
          }
        });
      });

      RuleScenario('Business value rendering when enabled', ({ Given, When, Then }) => {
        Given('a PatternGraph with PRD patterns with business value', () => {
          state!.dataset = createTestPatternGraph({ patterns: createPrdPatterns() });
        });

        When('decoding with RequirementsDocumentCodec', () => {
          state!.document = RequirementsDocumentCodec.decode(state!.dataset!);
        });

        Then('the feature list shows business value descriptions', () => {
          const lists = findLists(state!.document!);
          // Business value should be shown in feature lists
          const hasBusinessValue = lists.some((l) =>
            l.items.some((item) => {
              const text = typeof item === 'string' ? item : item.text;
              return text.includes('Secure access') || text.includes('Monitor system');
            })
          );
          expect(hasBusinessValue).toBe(true);
        });
      });

      RuleScenario(
        'Generate individual requirement detail files when enabled',
        ({ Given, When, Then }) => {
          Given('a PatternGraph with PRD patterns', () => {
            state!.dataset = createTestPatternGraph({ patterns: createPrdPatterns() });
          });

          When('decoding with generateDetailFiles enabled for requirements', () => {
            const codec = createRequirementsCodec({ generateDetailFiles: true });
            state!.document = codec.decode(state!.dataset!);
          });

          Then(
            'the document has requirement detail files:',
            (_ctx: unknown, dataTable: DataTableRow[]) => {
              expect(state!.document!.additionalFiles).toBeDefined();
              const files = Object.keys(state!.document!.additionalFiles!);

              for (const row of dataTable) {
                expect(files).toContain(row.path);
              }
            }
          );
        }
      );

      RuleScenario(
        'Requirement detail file contains acceptance criteria from scenarios',
        ({ Given, When, Then, And }) => {
          Given('a PatternGraph with PRD patterns with scenarios', () => {
            state!.dataset = createTestPatternGraph({
              patterns: createPrdPatternsWithScenarios(),
            });
          });

          When('decoding with generateDetailFiles enabled for requirements', () => {
            const codec = createRequirementsCodec({ generateDetailFiles: true });
            state!.document = codec.decode(state!.dataset!);
          });

          Then('the requirement detail files contain acceptance criteria sections', () => {
            expect(state!.document!.additionalFiles).toBeDefined();
            const files = Object.values(state!.document!.additionalFiles!);
            const hasAcceptanceCriteria = files.some((file) => {
              const headings = findHeadings(file);
              return headings.some((h) => h.text.includes('Acceptance Criteria'));
            });
            expect(hasAcceptanceCriteria).toBe(true);
          });

          And('the acceptance criteria shows scenario steps', () => {
            const files = Object.values(state!.document!.additionalFiles!);
            const hasSteps = files.some((file) => documentContainsText(file, 'Given'));
            expect(hasSteps).toBe(true);
          });
        }
      );

      RuleScenario(
        'Requirement detail file contains business rules section',
        ({ Given, When, Then }) => {
          Given('a PatternGraph with PRD patterns with rules', () => {
            state!.dataset = createTestPatternGraph({ patterns: createPrdPatternsWithRules() });
          });

          When('decoding with generateDetailFiles enabled for requirements', () => {
            const codec = createRequirementsCodec({ generateDetailFiles: true });
            state!.document = codec.decode(state!.dataset!);
          });

          Then('the requirement detail files contain business rules sections', () => {
            expect(state!.document!.additionalFiles).toBeDefined();
            const files = Object.values(state!.document!.additionalFiles!);
            const hasBusinessRules = files.some((file) => {
              const headings = findHeadings(file);
              return headings.some((h) => h.text.includes('Business Rules'));
            });
            expect(hasBusinessRules).toBe(true);
          });
        }
      );

      RuleScenario('Implementation links from relationshipIndex', ({ Given, When, Then }) => {
        Given('a PatternGraph with PRD patterns with implementations', () => {
          // Create patterns with implementations via relationshipIndex
          const patterns = createPrdPatterns();
          state!.dataset = createTestPatternGraph({ patterns });

          // Manually add relationshipIndex entries with full structure
          const patternKey = patterns[0].patternName ?? patterns[0].name;
          (
            state!.dataset as unknown as { relationshipIndex: Record<string, unknown> }
          ).relationshipIndex = {
            [patternKey]: {
              uses: [],
              usedBy: [],
              dependsOn: [],
              enables: [],
              implementsPatterns: [],
              implementedBy: [
                { name: 'LoginHandler', file: 'src/auth/login.ts', description: 'Login handler' },
              ],
              extendedBy: [],
              seeAlso: [],
              apiRef: [],
            },
          };
        });

        When('decoding with generateDetailFiles enabled for requirements', () => {
          const codec = createRequirementsCodec({ generateDetailFiles: true });
          state!.document = codec.decode(state!.dataset!);
        });

        Then('the requirement detail files contain implementations sections', () => {
          expect(state!.document!.additionalFiles).toBeDefined();
          const files = Object.values(state!.document!.additionalFiles!);
          const hasImplementations = files.some((file) => {
            const headings = findHeadings(file);
            return headings.some((h) => h.text.includes('Implementations'));
          });
          expect(hasImplementations).toBe(true);
        });
      });
    }
  );

  // ===========================================================================
  // Rule: AdrDocumentCodec documents architecture decisions
  // ===========================================================================

  Rule('AdrDocumentCodec documents architecture decisions', ({ RuleScenario }) => {
    RuleScenario('No ADR patterns produces empty message', ({ Given, When, Then, And }) => {
      Given('a PatternGraph with no ADR patterns', () => {
        // Empty dataset has no ADR patterns
        state!.dataset = createTestPatternGraph();
      });

      When('decoding with AdrDocumentCodec', () => {
        state!.document = AdrDocumentCodec.decode(state!.dataset!);
      });

      Then('the document title is {string}', (_ctx: unknown, title: string) => {
        expect(state!.document!.title).toBe(title);
      });

      And('the document contains {string}', (_ctx: unknown, text: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(text));
        expect(found, `Document should contain "${text}"`).toBe(true);
      });
    });

    RuleScenario('Summary shows status counts and categories', ({ Given, When, Then, And }) => {
      Given('a PatternGraph with ADR patterns', () => {
        state!.dataset = createTestPatternGraph({ patterns: createAdrPatterns() });
      });

      When('decoding with AdrDocumentCodec', () => {
        state!.document = AdrDocumentCodec.decode(state!.dataset!);
      });

      Then('the document title is {string}', (_ctx: unknown, title: string) => {
        expect(state!.document!.title).toBe(title);
      });

      And('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('the ADR summary table shows:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const table = findSummaryTable(state!.document!);
        expect(table).toBeDefined();

        for (const row of dataTable) {
          const metric = row.metric ?? '';
          const expectedValue = row.value;
          const tableRow = table!.rows.find((r) => r[0]?.includes(metric));
          expect(tableRow, `Should have row for ${metric}`).toBeDefined();
          expect(tableRow![1]).toBe(expectedValue);
        }
      });
    });

    RuleScenario('ADRs grouped by category', ({ Given, When, Then, And }) => {
      Given('a PatternGraph with ADR patterns', () => {
        state!.dataset = createTestPatternGraph({ patterns: createAdrPatterns() });
      });

      When('decoding with AdrDocumentCodec', () => {
        state!.document = AdrDocumentCodec.decode(state!.dataset!);
      });

      Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('the ADR categories show their decisions', () => {
        expect(findCategorySection(state!.document!, 'architecture')).toBe(true);
        expect(findCategorySection(state!.document!, 'process')).toBe(true);
      });
    });

    RuleScenario('ADRs grouped by phase option', ({ Given, When, Then, And }) => {
      Given('a PatternGraph with ADR patterns', () => {
        state!.dataset = createTestPatternGraph({ patterns: createAdrPatterns() });
      });

      When('decoding with AdrDocumentCodec using groupBy phase', () => {
        const codec = createAdrCodec({ groupBy: 'phase' });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('ADR phase sections are collapsible', () => {
        const collapsibles = findCollapsibles(state!.document!);
        expect(collapsibles.length).toBeGreaterThan(0);
      });
    });

    RuleScenario('ADRs grouped by date (quarter) option', ({ Given, When, Then, And }) => {
      Given('a PatternGraph with ADR patterns with quarters', () => {
        state!.dataset = createTestPatternGraph({ patterns: createAdrPatternsWithQuarters() });
      });

      When('decoding with AdrDocumentCodec using groupBy date', () => {
        const codec = createAdrCodec({ groupBy: 'date' });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('ADR date sections show quarters', () => {
        const collapsibles = findCollapsibles(state!.document!);
        const hasQuarters = collapsibles.some(
          (c) => c.summary.includes('Q4-2025') || c.summary.includes('Q1-2026')
        );
        expect(hasQuarters).toBe(true);
      });
    });

    RuleScenario('ADR index table with all decisions', ({ Given, When, Then, And }) => {
      Given('a PatternGraph with ADR patterns', () => {
        state!.dataset = createTestPatternGraph({ patterns: createAdrPatterns() });
      });

      When('decoding with AdrDocumentCodec', () => {
        state!.document = AdrDocumentCodec.decode(state!.dataset!);
      });

      Then('the document contains an {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('the ADR index table has columns:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const table = findAdrIndexTable(state!.document!);
        expect(table).toBeDefined();

        for (const row of dataTable) {
          expect(table!.columns).toContain(row.column);
        }
      });
    });

    RuleScenario('ADR entries use clean text without emojis', ({ Given, When, Then }) => {
      Given('a PatternGraph with ADR patterns', () => {
        state!.dataset = createTestPatternGraph({ patterns: createAdrPatterns() });
      });

      When('decoding with AdrDocumentCodec', () => {
        state!.document = AdrDocumentCodec.decode(state!.dataset!);
      });

      Then('ADR index entries contain no emojis', () => {
        const table = findAdrIndexTable(state!.document!);
        expect(table).toBeDefined();

        // Verify no emoji characters appear in any table cell
        const hasEmoji = table!.rows.some((r) =>
          r.some(
            (cell) =>
              cell.includes('✅') ||
              cell.includes('📋') ||
              cell.includes('🔄') ||
              cell.includes('⚠️')
          )
        );
        expect(hasEmoji).toBe(false);
      });
    });

    RuleScenario(
      'Context, Decision, Consequences sections from Rule keywords',
      ({ Given, When, Then }) => {
        Given('a PatternGraph with ADR patterns with semantic rules', () => {
          state!.dataset = createTestPatternGraph({
            patterns: createAdrPatternsWithSemanticRules(),
          });
        });

        When('decoding with AdrDocumentCodec', () => {
          // Use generateDetailFiles to get level-2 headings in detail files
          const codec = createAdrCodec({ generateDetailFiles: true });
          state!.document = codec.decode(state!.dataset!);
        });

        Then('ADR entries contain semantic sections', () => {
          // Check the detail files for semantic section headings
          expect(state!.document!.additionalFiles).toBeDefined();
          const files = Object.values(state!.document!.additionalFiles!);

          // At least one file should have the semantic sections
          const hasContext = files.some((file) => {
            const headings = findHeadings(file);
            return headings.some((h) => h.text === 'Context');
          });
          const hasDecision = files.some((file) => {
            const headings = findHeadings(file);
            return headings.some((h) => h.text === 'Decision');
          });
          const hasConsequences = files.some((file) => {
            const headings = findHeadings(file);
            return headings.some((h) => h.text === 'Consequences');
          });

          expect(hasContext, 'ADR detail files should contain "Context" section').toBe(true);
          expect(hasDecision, 'ADR detail files should contain "Decision" section').toBe(true);
          expect(hasConsequences, 'ADR detail files should contain "Consequences" section').toBe(
            true
          );
        });
      }
    );

    RuleScenario('ADR supersedes rendering', ({ Given, When, Then, And }) => {
      Given('a PatternGraph with ADR patterns with supersession', () => {
        state!.dataset = createTestPatternGraph({ patterns: createAdrPatternsWithSupersession() });
      });

      When('decoding with AdrDocumentCodec', () => {
        state!.document = AdrDocumentCodec.decode(state!.dataset!);
      });

      Then('ADR entries show supersedes relationships', () => {
        expect(documentContainsText(state!.document!, 'Supersedes')).toBe(true);
      });

      And('ADR entries show supersededBy relationships', () => {
        expect(documentContainsText(state!.document!, 'Superseded By')).toBe(true);
      });
    });

    RuleScenario('Generate individual ADR detail files when enabled', ({ Given, When, Then }) => {
      Given('a PatternGraph with ADR patterns', () => {
        state!.dataset = createTestPatternGraph({ patterns: createAdrPatterns() });
      });

      When('decoding with generateDetailFiles enabled for ADR', () => {
        const codec = createAdrCodec({ generateDetailFiles: true });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('the document has ADR detail files:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        expect(state!.document!.additionalFiles).toBeDefined();
        const files = Object.keys(state!.document!.additionalFiles!);

        for (const row of dataTable) {
          expect(files).toContain(row.path);
        }
      });
    });

    RuleScenario('ADR detail file contains full content', ({ Given, When, Then, And }) => {
      Given('a PatternGraph with ADR patterns with semantic rules', () => {
        state!.dataset = createTestPatternGraph({
          patterns: createAdrPatternsWithSemanticRules(),
        });
      });

      When('decoding with generateDetailFiles enabled for ADR', () => {
        const codec = createAdrCodec({ generateDetailFiles: true });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('the ADR detail files contain overview sections', () => {
        expect(state!.document!.additionalFiles).toBeDefined();
        const files = Object.values(state!.document!.additionalFiles!);
        const hasOverview = files.some((file) => {
          const headings = findHeadings(file);
          return headings.some((h) => h.text.includes('Overview'));
        });
        expect(hasOverview).toBe(true);
      });

      And('the ADR detail files contain back links', () => {
        const files = Object.values(state!.document!.additionalFiles!);
        const hasBackLink = files.some((file) => documentContainsText(file, 'Back to'));
        expect(hasBackLink).toBe(true);
      });
    });
  });
});
