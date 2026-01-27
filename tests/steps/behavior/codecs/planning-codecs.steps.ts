/**
 * Planning Codecs Step Definitions
 *
 * BDD step definitions for testing the planning codecs:
 * - PlanningChecklistCodec
 * - SessionPlanCodec
 * - SessionFindingsCodec
 *
 * Tests document structure, sections, options, and content rendering.
 *
 * @libar-docs
 */
import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  createPlanningChecklistCodec,
  PlanningChecklistCodec,
  createSessionPlanCodec,
  SessionPlanCodec,
  createSessionFindingsCodec,
  SessionFindingsCodec,
} from '../../../../src/renderable/codecs/planning.js';
import type { RenderableDocument, TableBlock } from '../../../../src/renderable/schema.js';
import type { MasterDataset } from '../../../../src/validation-schemas/master-dataset.js';
import {
  createTestMasterDataset,
  createTestPattern,
  resetPatternCounter,
} from '../../../fixtures/dataset-factories.js';
import {
  findHeadings,
  findLists,
  isHeading,
  isTable,
  isParagraph,
  isList,
} from '../../../support/helpers/document-assertions.js';
import type { DataTableRow } from '../../../support/world.js';

// =============================================================================
// State Types
// =============================================================================

interface PlanningCodecState {
  dataset: MasterDataset | null;
  document: RenderableDocument | null;
}

// =============================================================================
// Module-level state (reset per scenario)
// =============================================================================

let state: PlanningCodecState | null = null;

function initState(): PlanningCodecState {
  resetPatternCounter();
  return {
    dataset: null,
    document: null,
  };
}

// =============================================================================
// Helper Functions
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

function findSectionContent(doc: RenderableDocument, sectionName: string): string {
  const headings = findHeadings(doc);
  const sectionIdx = headings.findIndex((h) => h.text.includes(sectionName));

  if (sectionIdx === -1) {
    return '';
  }

  const headingIdx = doc.sections.indexOf(headings[sectionIdx]);
  let content = '';

  for (let i = headingIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isHeading(section) && section.level <= headings[sectionIdx].level) break;

    if (isParagraph(section)) {
      content += section.text + '\n';
    }
    if (isList(section)) {
      for (const item of section.items) {
        const text = typeof item === 'string' ? item : item.text;
        content += text + '\n';
      }
    }
  }

  return content;
}

function findSectionList(doc: RenderableDocument, sectionName: string): string[] {
  const headings = findHeadings(doc);
  const sectionIdx = headings.findIndex((h) => h.text.includes(sectionName));

  if (sectionIdx === -1) {
    return [];
  }

  const headingIdx = doc.sections.indexOf(headings[sectionIdx]);

  for (let i = headingIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isHeading(section)) break;
    if (isList(section)) {
      return section.items.map((item) => (typeof item === 'string' ? item : item.text));
    }
  }

  return [];
}

// =============================================================================
// Dataset Factories
// =============================================================================

function createDatasetWithNoActionablePhases(): MasterDataset {
  const patterns = [
    createTestPattern({
      name: 'Completed Pattern',
      status: 'completed',
      phase: 1,
    }),
  ];
  return createTestMasterDataset({ patterns });
}

function createDatasetWithPlanningPatterns(): MasterDataset {
  const patterns = [
    createTestPattern({
      name: 'Foundation Pattern',
      status: 'completed',
      phase: 1,
    }),
    createTestPattern({
      name: 'Active Pattern',
      status: 'active',
      phase: 2,
    }),
    createTestPattern({
      name: 'Next Actionable Pattern',
      status: 'roadmap',
      phase: 3,
    }),
  ];
  return createTestMasterDataset({ patterns });
}

function createDatasetWithDeliverables(): MasterDataset {
  const patterns = [
    createTestPattern({
      name: 'Pattern With Deliverables',
      status: 'active',
      phase: 1,
      deliverables: [
        { name: 'Component A', status: 'complete', tests: 1, location: 'src/a/' },
        { name: 'Component B', status: 'in-progress', tests: 0, location: 'src/b/' },
      ],
    }),
  ];
  return createTestMasterDataset({ patterns });
}

function createDatasetWithScenarios(): MasterDataset {
  const pattern = createTestPattern({
    name: 'Pattern With Scenarios',
    status: 'active',
    phase: 1,
  });
  // Add scenarios manually using the ScenarioRef schema structure
  type ScenarioRef = {
    featureFile: string;
    featureName: string;
    featureDescription: string;
    scenarioName: string;
    semanticTags: readonly string[];
    tags: readonly string[];
    steps?: ReadonlyArray<{ keyword: string; text: string }>;
  };
  (pattern as unknown as { scenarios: ScenarioRef[] }).scenarios = [
    {
      featureFile: 'tests/features/auth.feature',
      featureName: 'Authentication',
      featureDescription: 'User authentication flows',
      scenarioName: 'User can login',
      semanticTags: ['happy-path'],
      tags: ['@happy-path'],
      steps: [{ keyword: 'Given', text: 'a user' }],
    },
    {
      featureFile: 'tests/features/auth.feature',
      featureName: 'Authentication',
      featureDescription: 'User authentication flows',
      scenarioName: 'User can logout',
      semanticTags: ['happy-path'],
      tags: ['@happy-path'],
      steps: [{ keyword: 'Given', text: 'a logged in user' }],
    },
  ];
  return createTestMasterDataset({ patterns: [pattern] });
}

function createDatasetWithDependencies(): MasterDataset {
  const patterns = [
    createTestPattern({
      name: 'Completed Dependency',
      status: 'completed',
      phase: 1,
    }),
    createTestPattern({
      name: 'Active Pattern',
      status: 'active',
      phase: 2,
      dependsOn: ['Completed Dependency', 'Pending Dependency'],
    }),
    createTestPattern({
      name: 'Pending Dependency',
      status: 'active',
      phase: 2,
    }),
  ];
  return createTestMasterDataset({ patterns });
}

function createDatasetWithActiveAndPlanned(): MasterDataset {
  const patterns = [
    createTestPattern({
      name: 'Completed Base',
      status: 'completed',
      phase: 1,
    }),
    createTestPattern({
      name: 'Active Pattern 1',
      status: 'active',
      phase: 2,
    }),
    createTestPattern({
      name: 'Planned Pattern 1',
      status: 'roadmap',
      phase: 3,
    }),
    createTestPattern({
      name: 'Planned Pattern 2',
      status: 'roadmap',
      phase: 3,
    }),
  ];
  return createTestMasterDataset({ patterns });
}

function createDatasetWithOnlyCompleted(): MasterDataset {
  const patterns = [
    createTestPattern({
      name: 'Completed Pattern 1',
      status: 'completed',
      phase: 1,
    }),
    createTestPattern({
      name: 'Completed Pattern 2',
      status: 'completed',
      phase: 1,
    }),
  ];
  return createTestMasterDataset({ patterns });
}

function createDatasetWithUseCases(): MasterDataset {
  const patterns = [
    createTestPattern({
      name: 'Pattern With Use Cases',
      status: 'active',
      phase: 1,
      useCases: [
        'When implementing a new feature',
        'When refactoring existing code',
        'When adding tests',
      ],
    }),
  ];
  return createTestMasterDataset({ patterns });
}

function createDatasetWithRules(): MasterDataset {
  const pattern = createTestPattern({
    name: 'Pattern With Rules',
    status: 'active',
    phase: 1,
  });
  // Add rules manually using the BusinessRule schema structure
  type BusinessRule = {
    name: string;
    description: string;
    scenarioCount: number;
    scenarioNames: readonly string[];
  };
  (pattern as unknown as { rules: BusinessRule[] }).rules = [
    {
      name: 'Users must be authenticated',
      description: 'All users must be authenticated before accessing resources',
      scenarioCount: 2,
      scenarioNames: ['Login success', 'Login failure'],
    },
    {
      name: 'Orders must have valid items',
      description: 'Orders require at least one valid item with quantity > 0',
      scenarioCount: 3,
      scenarioNames: ['Valid order', 'Empty order', 'Invalid quantity'],
    },
  ];
  return createTestMasterDataset({ patterns: [pattern] });
}

function createDatasetWithoutFindings(): MasterDataset {
  const patterns = [
    createTestPattern({
      name: 'Completed Pattern',
      status: 'completed',
      phase: 1,
    }),
  ];
  return createTestMasterDataset({ patterns });
}

function createDatasetWithFindings(): MasterDataset {
  const pattern1 = createTestPattern({
    name: 'Pattern With Findings',
    status: 'completed',
    phase: 1,
  });
  // Add findings manually
  const patternWithFindings = pattern1 as unknown as {
    discoveredGaps: string[];
    discoveredImprovements: string[];
    discoveredRisks: string[];
    discoveredLearnings: string[];
    risk: string;
  };
  patternWithFindings.discoveredGaps = ['Missing error handling', 'No retry logic'];
  patternWithFindings.discoveredImprovements = ['Could use caching', 'Consider batching'];
  patternWithFindings.discoveredRisks = ['Performance bottleneck'];
  patternWithFindings.discoveredLearnings = [
    'Event sourcing patterns work well',
    'CQRS simplifies reads',
  ];
  patternWithFindings.risk = 'Scaling concerns';

  return createTestMasterDataset({ patterns: [pattern1] });
}

function createDatasetWithDiscoveredGaps(): MasterDataset {
  const pattern = createTestPattern({
    name: 'Pattern With Gaps',
    status: 'completed',
    phase: 1,
  });
  (pattern as unknown as { discoveredGaps: string[] }).discoveredGaps = [
    'Gap 1: Missing validation',
    'Gap 2: No error messages',
  ];
  return createTestMasterDataset({ patterns: [pattern] });
}

function createDatasetWithDiscoveredImprovements(): MasterDataset {
  const pattern = createTestPattern({
    name: 'Pattern With Improvements',
    status: 'completed',
    phase: 1,
  });
  (pattern as unknown as { discoveredImprovements: string[] }).discoveredImprovements = [
    'Improvement 1: Add caching',
    'Improvement 2: Optimize queries',
  ];
  return createTestMasterDataset({ patterns: [pattern] });
}

function createDatasetWithDiscoveredRisks(): MasterDataset {
  const pattern = createTestPattern({
    name: 'Pattern With Risks',
    status: 'completed',
    phase: 1,
  });
  const patternWithRisks = pattern as unknown as {
    discoveredRisks: string[];
    risk: string;
  };
  patternWithRisks.discoveredRisks = ['Risk 1: Security vulnerability'];
  patternWithRisks.risk = 'Risk 2: Performance issue';
  return createTestMasterDataset({ patterns: [pattern] });
}

function createDatasetWithDiscoveredLearnings(): MasterDataset {
  const pattern = createTestPattern({
    name: 'Pattern With Learnings',
    status: 'completed',
    phase: 1,
  });
  (pattern as unknown as { discoveredLearnings: string[] }).discoveredLearnings = [
    'Learning 1: Use composition',
    'Learning 2: Prefer immutability',
  ];
  return createTestMasterDataset({ patterns: [pattern] });
}

function createDatasetWithFindingsAcrossPhases(): MasterDataset {
  const pattern1 = createTestPattern({
    name: 'Phase 1 Pattern',
    status: 'completed',
    phase: 1,
  });
  (pattern1 as unknown as { discoveredGaps: string[] }).discoveredGaps = ['Phase 1 gap'];

  const pattern2 = createTestPattern({
    name: 'Phase 2 Pattern',
    status: 'completed',
    phase: 2,
  });
  (pattern2 as unknown as { discoveredGaps: string[] }).discoveredGaps = ['Phase 2 gap'];

  return createTestMasterDataset({ patterns: [pattern1, pattern2] });
}

// =============================================================================
// Feature: Planning Document Codecs
// =============================================================================

const feature = await loadFeature('tests/features/behavior/codecs/planning-codecs.feature');

describeFeature(feature, ({ Background, AfterEachScenario, Rule }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a planning codec test context', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Rule: PlanningChecklistCodec prepares for implementation sessions
  // ===========================================================================

  Rule('PlanningChecklistCodec prepares for implementation sessions', ({ RuleScenario }) => {
    RuleScenario('No actionable phases produces empty message', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with no actionable phases', () => {
        state!.dataset = createDatasetWithNoActionablePhases();
      });

      When('decoding with PlanningChecklistCodec', () => {
        state!.document = PlanningChecklistCodec.decode(state!.dataset!);
      });

      Then('the document title is {string}', (_ctx: unknown, title: string) => {
        expect(state!.document!.title).toBe(title);
      });

      And('the document contains {string}', (_ctx: unknown, text: string) => {
        const allText = getAllDocumentText(state!.document!);
        expect(allText).toContain(text);
      });
    });

    RuleScenario('Summary shows phases to plan count', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with planning patterns', () => {
        state!.dataset = createDatasetWithPlanningPatterns();
      });

      When('decoding with PlanningChecklistCodec', () => {
        state!.document = PlanningChecklistCodec.decode(state!.dataset!);
      });

      Then('the document title is {string}', (_ctx: unknown, title: string) => {
        expect(state!.document!.title).toBe(title);
      });

      And('the summary table shows:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const table = findSummaryTable(state!.document!);
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

    RuleScenario('Pre-planning questions section', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with planning patterns', () => {
        state!.dataset = createDatasetWithPlanningPatterns();
      });

      When('decoding with PlanningChecklistCodec', () => {
        state!.document = PlanningChecklistCodec.decode(state!.dataset!);
      });

      Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And(
        'the pre-planning section contains checklist items:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          const content = findSectionContent(state!.document!, 'Pre-Planning');

          for (const row of dataTable) {
            const item = row.item ?? '';
            expect(content).toContain(item);
          }
        }
      );
    });

    RuleScenario('Definition of Done with deliverables', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with patterns with deliverables', () => {
        state!.dataset = createDatasetWithDeliverables();
      });

      When('decoding with PlanningChecklistCodec', () => {
        state!.document = PlanningChecklistCodec.decode(state!.dataset!);
      });

      Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('the DoD section shows deliverable items', () => {
        const content = findSectionContent(state!.document!, 'Definition of Done');
        expect(content).toContain('Component A');
        expect(content).toContain('Component B');
      });
    });

    RuleScenario('Acceptance criteria from scenarios', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with patterns with scenarios', () => {
        state!.dataset = createDatasetWithScenarios();
      });

      When('decoding with PlanningChecklistCodec', () => {
        state!.document = PlanningChecklistCodec.decode(state!.dataset!);
      });

      Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('the DoD section shows acceptance criteria from scenarios', () => {
        const content = findSectionContent(state!.document!, 'Definition of Done');
        expect(content).toContain('User can login');
        expect(content).toContain('User can logout');
      });
    });

    RuleScenario('Risk assessment section', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with planning patterns', () => {
        state!.dataset = createDatasetWithPlanningPatterns();
      });

      When('decoding with includeRiskAssessment enabled', () => {
        const codec = createPlanningChecklistCodec({ includeRiskAssessment: true });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And(
        'the risk assessment contains checklist items:',
        (_ctx: unknown, dataTable: DataTableRow[]) => {
          const content = findSectionContent(state!.document!, 'Risk Assessment');

          for (const row of dataTable) {
            const item = row.item ?? '';
            expect(content).toContain(item);
          }
        }
      );
    });

    RuleScenario('Dependency status shows met vs unmet', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with patterns with dependencies', () => {
        state!.dataset = createDatasetWithDependencies();
      });

      When('decoding with PlanningChecklistCodec', () => {
        state!.document = PlanningChecklistCodec.decode(state!.dataset!);
      });

      Then('the document shows dependency status', () => {
        const allText = getAllDocumentText(state!.document!);
        expect(allText).toContain('Dependencies');
      });

      And('met dependencies show completed marker', () => {
        const allText = getAllDocumentText(state!.document!);
        // Completed dependencies should have a checkmark
        expect(allText).toMatch(/[✅].*Completed Dependency/);
      });

      And('unmet dependencies show pending marker', () => {
        const allText = getAllDocumentText(state!.document!);
        // Pending dependencies should have a pending marker
        expect(allText).toMatch(/[⏳].*Pending Dependency/);
      });
    });

    RuleScenario('forActivePhases option', ({ Given, When, Then }) => {
      Given('a MasterDataset with active and planned patterns', () => {
        state!.dataset = createDatasetWithActiveAndPlanned();
      });

      When('decoding with forActivePhases enabled and forNextActionable disabled', () => {
        const codec = createPlanningChecklistCodec({
          forActivePhases: true,
          forNextActionable: false,
        });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('only active phases are shown in checklist', () => {
        const allText = getAllDocumentText(state!.document!);
        expect(allText).toContain('Active Pattern 1');
        expect(allText).not.toContain('Planned Pattern 1');
      });
    });

    RuleScenario('forNextActionable option', ({ Given, When, Then }) => {
      Given('a MasterDataset with active and planned patterns', () => {
        state!.dataset = createDatasetWithActiveAndPlanned();
      });

      When('decoding with forActivePhases disabled and forNextActionable enabled', () => {
        const codec = createPlanningChecklistCodec({
          forActivePhases: false,
          forNextActionable: true,
        });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('only next actionable phases are shown in checklist', () => {
        const allText = getAllDocumentText(state!.document!);
        expect(allText).not.toContain('Active Pattern 1');
        expect(allText).toContain('Planned Pattern 1');
      });
    });
  });

  // ===========================================================================
  // Rule: SessionPlanCodec generates implementation plans
  // ===========================================================================

  Rule('SessionPlanCodec generates implementation plans', ({ RuleScenario }) => {
    RuleScenario('No phases to plan produces empty message', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with only completed patterns', () => {
        state!.dataset = createDatasetWithOnlyCompleted();
      });

      When('decoding with SessionPlanCodec', () => {
        state!.document = SessionPlanCodec.decode(state!.dataset!);
      });

      Then('the document title is {string}', (_ctx: unknown, title: string) => {
        expect(state!.document!.title).toBe(title);
      });

      And('the document contains {string}', (_ctx: unknown, text: string) => {
        const allText = getAllDocumentText(state!.document!);
        expect(allText).toContain(text);
      });
    });

    RuleScenario('Summary shows status counts', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with planning patterns', () => {
        state!.dataset = createDatasetWithPlanningPatterns();
      });

      When('decoding with SessionPlanCodec', () => {
        state!.document = SessionPlanCodec.decode(state!.dataset!);
      });

      Then('the document title is {string}', (_ctx: unknown, title: string) => {
        expect(state!.document!.title).toBe(title);
      });

      And('the summary table shows:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const table = findSummaryTable(state!.document!);
        expect(table).toBeDefined();

        for (const row of dataTable) {
          const status = row.status ?? '';
          const expectedCount = row.count ?? '';
          const tableRow = table!.rows.find((r) => r[0]?.includes(status));
          expect(tableRow, `Should have row for ${status}`).toBeDefined();
          expect(tableRow![1]).toBe(expectedCount);
        }
      });
    });

    RuleScenario('Implementation approach from useCases', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with patterns with useCases', () => {
        state!.dataset = createDatasetWithUseCases();
      });

      When('decoding with SessionPlanCodec', () => {
        state!.document = SessionPlanCodec.decode(state!.dataset!);
      });

      Then('the document contains an {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('the implementation approach shows use cases', () => {
        const items = findSectionList(state!.document!, 'Implementation Approach');
        expect(items.length).toBeGreaterThan(0);
        expect(items.some((item) => item.includes('implementing a new feature'))).toBe(true);
      });
    });

    RuleScenario('Deliverables rendering', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with patterns with deliverables', () => {
        state!.dataset = createDatasetWithDeliverables();
      });

      When('decoding with SessionPlanCodec', () => {
        state!.document = SessionPlanCodec.decode(state!.dataset!);
      });

      Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('the deliverables section shows items with status', () => {
        // Check that deliverables are rendered somewhere in the document with status indicators
        const allText = getAllDocumentText(state!.document!);
        // Items should have status indicators (emoji)
        const hasStatusIndicator = /[✅🚧📋]/.test(allText);
        expect(
          hasStatusIndicator,
          'Document should contain deliverables with status indicators'
        ).toBe(true);
        // Check for deliverable names
        expect(allText).toContain('Component A');
        expect(allText).toContain('Component B');
      });
    });

    RuleScenario('Acceptance criteria with steps', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with patterns with scenarios', () => {
        state!.dataset = createDatasetWithScenarios();
      });

      When('decoding with SessionPlanCodec', () => {
        state!.document = SessionPlanCodec.decode(state!.dataset!);
      });

      Then('the document contains an {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('the acceptance criteria shows scenario names', () => {
        const allText = getAllDocumentText(state!.document!);
        expect(allText).toContain('User can login');
        expect(allText).toContain('User can logout');
      });
    });

    RuleScenario('Business rules section', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with patterns with rules', () => {
        state!.dataset = createDatasetWithRules();
      });

      When('decoding with SessionPlanCodec', () => {
        state!.document = SessionPlanCodec.decode(state!.dataset!);
      });

      Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('the business rules section shows rule names', () => {
        const allText = getAllDocumentText(state!.document!);
        expect(allText).toContain('Users must be authenticated');
        expect(allText).toContain('Orders must have valid items');
      });
    });

    RuleScenario('statusFilter option for active only', ({ Given, When, Then }) => {
      Given('a MasterDataset with planning patterns', () => {
        state!.dataset = createDatasetWithPlanningPatterns();
      });

      When('decoding with statusFilter set to active only', () => {
        const codec = createSessionPlanCodec({ statusFilter: ['active'] });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('only active patterns are shown in plan', () => {
        const allText = getAllDocumentText(state!.document!);
        expect(allText).toContain('Active Pattern');
        expect(allText).not.toContain('Next Actionable Pattern');
      });
    });

    RuleScenario('statusFilter option for planned only', ({ Given, When, Then }) => {
      Given('a MasterDataset with planning patterns', () => {
        state!.dataset = createDatasetWithPlanningPatterns();
      });

      When('decoding with statusFilter set to planned only', () => {
        const codec = createSessionPlanCodec({ statusFilter: ['planned'] });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('only planned patterns are shown in plan', () => {
        const allText = getAllDocumentText(state!.document!);
        expect(allText).toContain('Next Actionable Pattern');
        expect(allText).not.toContain('Active Pattern');
      });
    });
  });

  // ===========================================================================
  // Rule: SessionFindingsCodec captures retrospective discoveries
  // ===========================================================================

  Rule('SessionFindingsCodec captures retrospective discoveries', ({ RuleScenario }) => {
    RuleScenario('No findings produces empty message', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with patterns without findings', () => {
        state!.dataset = createDatasetWithoutFindings();
      });

      When('decoding with SessionFindingsCodec', () => {
        state!.document = SessionFindingsCodec.decode(state!.dataset!);
      });

      Then('the document title is {string}', (_ctx: unknown, title: string) => {
        expect(state!.document!.title).toBe(title);
      });

      And('the document contains {string}', (_ctx: unknown, text: string) => {
        const allText = getAllDocumentText(state!.document!);
        expect(allText).toContain(text);
      });
    });

    RuleScenario('Summary shows finding type counts', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with patterns with findings', () => {
        state!.dataset = createDatasetWithFindings();
      });

      When('decoding with SessionFindingsCodec', () => {
        state!.document = SessionFindingsCodec.decode(state!.dataset!);
      });

      Then('the document title is {string}', (_ctx: unknown, title: string) => {
        expect(state!.document!.title).toBe(title);
      });

      And('the summary table shows:', (_ctx: unknown, dataTable: DataTableRow[]) => {
        const table = findSummaryTable(state!.document!);
        expect(table).toBeDefined();

        for (const row of dataTable) {
          const type = row.type ?? '';
          const expectedCount = row.count ?? '';
          const tableRow = table!.rows.find((r) => r[0]?.includes(type));
          expect(tableRow, `Should have row for ${type}`).toBeDefined();
          expect(tableRow![1]).toBe(expectedCount);
        }
      });
    });

    RuleScenario('Gaps section', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with patterns with discovered gaps', () => {
        state!.dataset = createDatasetWithDiscoveredGaps();
      });

      When('decoding with SessionFindingsCodec', () => {
        state!.document = SessionFindingsCodec.decode(state!.dataset!);
      });

      Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('the gaps section shows discovered gaps', () => {
        const items = findSectionList(state!.document!, 'Gaps');
        expect(items.length).toBeGreaterThan(0);
        expect(items.some((item) => item.includes('Missing validation'))).toBe(true);
      });
    });

    RuleScenario('Improvements section', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with patterns with discovered improvements', () => {
        state!.dataset = createDatasetWithDiscoveredImprovements();
      });

      When('decoding with SessionFindingsCodec', () => {
        state!.document = SessionFindingsCodec.decode(state!.dataset!);
      });

      Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('the improvements section shows discovered improvements', () => {
        const items = findSectionList(state!.document!, 'Improvements');
        expect(items.length).toBeGreaterThan(0);
        expect(items.some((item) => item.includes('Add caching'))).toBe(true);
      });
    });

    RuleScenario('Risks section includes risk field', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with patterns with discovered risks', () => {
        state!.dataset = createDatasetWithDiscoveredRisks();
      });

      When('decoding with SessionFindingsCodec', () => {
        state!.document = SessionFindingsCodec.decode(state!.dataset!);
      });

      Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('the risks section shows discovered risks', () => {
        const items = findSectionList(state!.document!, 'Risks');
        expect(items.length).toBeGreaterThan(0);
        // Should include both discoveredRisks and the risk field
        expect(items.some((item) => item.includes('Security vulnerability'))).toBe(true);
        expect(items.some((item) => item.includes('Performance issue'))).toBe(true);
      });
    });

    RuleScenario('Learnings section', ({ Given, When, Then, And }) => {
      Given('a MasterDataset with patterns with discovered learnings', () => {
        state!.dataset = createDatasetWithDiscoveredLearnings();
      });

      When('decoding with SessionFindingsCodec', () => {
        state!.document = SessionFindingsCodec.decode(state!.dataset!);
      });

      Then('the document contains a {string} section', (_ctx: unknown, sectionName: string) => {
        const headings = findHeadings(state!.document!);
        const found = headings.some((h) => h.text.includes(sectionName));
        expect(found, `Document should contain "${sectionName}" section`).toBe(true);
      });

      And('the learnings section shows discovered learnings', () => {
        const items = findSectionList(state!.document!, 'Learnings');
        expect(items.length).toBeGreaterThan(0);
        expect(items.some((item) => item.includes('Use composition'))).toBe(true);
      });
    });

    RuleScenario('groupBy category option', ({ Given, When, Then }) => {
      Given('a MasterDataset with patterns with findings', () => {
        state!.dataset = createDatasetWithFindings();
      });

      When('decoding with groupBy set to category', () => {
        const codec = createSessionFindingsCodec({ groupBy: 'category' });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('findings are grouped by finding type', () => {
        const headings = findHeadings(state!.document!);
        // Should have headings for each finding type
        const hasGaps = headings.some((h) => h.text.includes('Gaps'));
        const hasImprovements = headings.some((h) => h.text.includes('Improvements'));
        expect(hasGaps || hasImprovements).toBe(true);
      });
    });

    RuleScenario('groupBy phase option', ({ Given, When, Then }) => {
      Given('a MasterDataset with patterns with findings', () => {
        state!.dataset = createDatasetWithFindingsAcrossPhases();
      });

      When('decoding with groupBy set to phase', () => {
        const codec = createSessionFindingsCodec({ groupBy: 'phase' });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('findings are grouped by source phase', () => {
        const headings = findHeadings(state!.document!);
        // Should have phase headings
        const hasPhaseHeadings = headings.some((h) => h.text.includes('Phase'));
        expect(hasPhaseHeadings).toBe(true);
      });
    });

    RuleScenario('groupBy type option', ({ Given, When, Then }) => {
      Given('a MasterDataset with patterns with findings', () => {
        state!.dataset = createDatasetWithFindings();
      });

      When('decoding with groupBy set to type', () => {
        const codec = createSessionFindingsCodec({ groupBy: 'type' });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('findings are grouped by finding type', () => {
        const headings = findHeadings(state!.document!);
        // Should have type headings (Gaps, Improvements, etc.)
        const hasTypeHeadings = headings.some(
          (h) => h.text.includes('Gaps') || h.text.includes('Improvements')
        );
        expect(hasTypeHeadings).toBe(true);
      });
    });

    RuleScenario('showSourcePhase option enabled', ({ Given, When, Then }) => {
      Given('a MasterDataset with patterns with findings', () => {
        state!.dataset = createDatasetWithFindingsAcrossPhases();
      });

      When('decoding with showSourcePhase enabled', () => {
        const codec = createSessionFindingsCodec({ showSourcePhase: true });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('findings show phase attribution', () => {
        const allText = getAllDocumentText(state!.document!);
        // Should show phase information
        expect(allText).toMatch(/Phase \d/);
      });
    });

    RuleScenario('showSourcePhase option disabled', ({ Given, When, Then }) => {
      Given('a MasterDataset with patterns with findings', () => {
        state!.dataset = createDatasetWithFindingsAcrossPhases();
      });

      When('decoding with showSourcePhase disabled', () => {
        const codec = createSessionFindingsCodec({ showSourcePhase: false });
        state!.document = codec.decode(state!.dataset!);
      });

      Then('findings do not show phase attribution', () => {
        // Get just the list items, not headings
        const lists = findLists(state!.document!);
        const listText = lists
          .flatMap((l) => l.items.map((item) => (typeof item === 'string' ? item : item.text)))
          .join('\n');
        // Should not show phase attribution in list items
        expect(listText).not.toMatch(/\(Phase \d+\)/);
      });
    });
  });
});

// =============================================================================
// Helper function to get all document text
// =============================================================================

function getAllDocumentText(doc: RenderableDocument): string {
  const parts: string[] = [doc.title];

  if (doc.purpose) parts.push(doc.purpose);

  function collectFromBlocks(sections: RenderableDocument['sections']): void {
    for (const block of sections) {
      switch (block.type) {
        case 'heading':
        case 'paragraph':
          parts.push(block.text);
          break;
        case 'table':
          parts.push(...block.columns);
          for (const row of block.rows) {
            parts.push(...row);
          }
          break;
        case 'list':
          for (const item of block.items) {
            if (typeof item === 'string') {
              parts.push(item);
            } else {
              parts.push(item.text);
            }
          }
          break;
        case 'code':
        case 'mermaid':
          parts.push(block.content);
          break;
        case 'collapsible':
          parts.push(block.summary);
          collectFromBlocks(block.content);
          break;
        case 'link-out':
          parts.push(block.text, block.path);
          break;
      }
    }
  }

  collectFromBlocks(doc.sections);

  return parts.join(' ');
}
