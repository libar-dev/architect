/**
 * PR Changes Codec shared state and helpers
 *
 * Extracted from pr-changes-codec.steps.ts to support split test files.
 *
 * @architect
 */
import type { RenderableDocument, TableBlock } from '../../../src/renderable/schema.js';
import type { PatternGraph } from '../../../src/validation-schemas/pattern-graph.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/index.js';
import {
  createTestPatternGraph,
  createTestPattern,
  resetPatternCounter,
} from '../../fixtures/dataset-factories.js';
import {
  findHeadings,
  findTableWithHeader,
  findLists,
  isHeading,
  isTable,
  isParagraph,
  isList,
} from './document-assertions.js';
import type { DataTableRow } from '../world.js';

// =============================================================================
// State Types
// =============================================================================

export interface PrChangesCodecState {
  dataset: PatternGraph | null;
  document: RenderableDocument | null;
}

// =============================================================================
// State Management
// =============================================================================

export function initPrChangesState(): PrChangesCodecState {
  resetPatternCounter();
  return {
    dataset: null,
    document: null,
  };
}

// =============================================================================
// Helper Functions
// =============================================================================

export function findSummaryTable(doc: RenderableDocument): TableBlock | null {
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

export function findNoChangesSection(
  doc: RenderableDocument
): { heading: string; message: string } | null {
  const headings = findHeadings(doc);
  const noChangesHeading = headings.find((h) => h.text.includes('No Changes'));

  if (!noChangesHeading) {
    return null;
  }

  const headingIdx = doc.sections.indexOf(noChangesHeading);
  let message = '';

  for (let i = headingIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isParagraph(section)) {
      message = section.text;
      break;
    }
    if (isHeading(section)) break;
  }

  return { heading: noChangesHeading.text, message };
}

export function findReviewChecklistSection(doc: RenderableDocument): string | null {
  const headings = findHeadings(doc);
  const checklistHeading = headings.find((h) => h.text.includes('Review Checklist'));

  if (!checklistHeading) {
    return null;
  }

  const headingIdx = doc.sections.indexOf(checklistHeading);

  for (let i = headingIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isParagraph(section)) {
      return section.text;
    }
    if (isHeading(section)) break;
  }

  return null;
}

export function findDependenciesSection(doc: RenderableDocument): {
  dependsOn: string[];
  enables: string[];
} | null {
  const headings = findHeadings(doc);
  const depsHeading = headings.find((h) => h.text === 'Dependencies');

  if (!depsHeading) {
    return null;
  }

  const headingIdx = doc.sections.indexOf(depsHeading);
  const result = { dependsOn: [] as string[], enables: [] as string[] };

  let currentSubsection: 'dependsOn' | 'enables' | null = null;

  for (let i = headingIdx + 1; i < doc.sections.length; i++) {
    const section = doc.sections[i];
    if (isHeading(section)) {
      if (section.level <= 2) break;
      if (section.text.includes('Depends On')) {
        currentSubsection = 'dependsOn';
      } else if (section.text.includes('Enables')) {
        currentSubsection = 'enables';
      }
    }
    if (isList(section) && currentSubsection) {
      for (const item of section.items) {
        const text = typeof item === 'string' ? item : item.text;
        result[currentSubsection].push(text);
      }
    }
  }

  return result;
}

export function documentContainsSection(doc: RenderableDocument, sectionName: string): boolean {
  const headings = findHeadings(doc);
  return headings.some((h) => h.text.includes(sectionName));
}

export function getDocumentText(doc: RenderableDocument): string {
  const parts: string[] = [];

  for (const section of doc.sections) {
    if (isHeading(section) || isParagraph(section)) {
      parts.push(section.text);
    }
    if (isList(section)) {
      for (const item of section.items) {
        parts.push(typeof item === 'string' ? item : item.text);
      }
    }
  }

  return parts.join('\n');
}

// =============================================================================
// Re-exports for step files
// =============================================================================

export { findHeadings, findTableWithHeader, findLists };
export { createTestPatternGraph, createTestPattern };
export type { DataTableRow, RenderableDocument, PatternGraph, ExtractedPattern };

// =============================================================================
// Pattern Factory Helpers
// =============================================================================

export function createActivePatterns(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Active Pattern 1',
      status: 'active',
      phase: 1,
      filePath: 'src/commands/order.ts',
    }),
    createTestPattern({
      name: 'Active Pattern 2',
      status: 'active',
      phase: 2,
      filePath: 'src/events/order-created.ts',
    }),
  ];
}

export function createPrRelevantPatterns(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Completed Feature',
      status: 'completed',
      phase: 1,
      filePath: 'src/core/feature.ts',
    }),
    createTestPattern({
      name: 'Active Feature 1',
      status: 'active',
      phase: 1,
      filePath: 'src/commands/cmd.ts',
    }),
    createTestPattern({
      name: 'Active Feature 2',
      status: 'active',
      phase: 2,
      filePath: 'src/events/event.ts',
    }),
  ];
}

export function createPatternsWithDeliverables(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Pattern With Deliverables',
      status: 'active',
      phase: 1,
      filePath: 'src/feature.ts',
      deliverables: [
        {
          name: 'Component A',
          status: 'complete',
          tests: 1,
          location: 'src/componentA/',
          release: 'v0.2.0',
        },
        {
          name: 'Component B',
          status: 'in-progress',
          tests: 0,
          location: 'src/componentB/',
          release: 'v0.2.0',
        },
      ],
    }),
  ];
}

export function createPatternsWithMixedReleaseDeliverables(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Pattern With Mixed Releases',
      status: 'active',
      phase: 1,
      filePath: 'src/feature.ts',
      deliverables: [
        {
          name: 'v0.2.0 Component',
          status: 'complete',
          tests: 1,
          location: 'src/v020/',
          release: 'v0.2.0',
        },
        {
          name: 'v0.3.0 Component',
          status: 'in-progress',
          tests: 0,
          location: 'src/v030/',
          release: 'v0.3.0',
        },
      ],
    }),
  ];
}

export function createPatternsInMultiplePhases(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Phase 1 Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/phase1.ts',
    }),
    createTestPattern({
      name: 'Phase 2 Pattern',
      status: 'active',
      phase: 2,
      filePath: 'src/phase2.ts',
    }),
    createTestPattern({
      name: 'Another Phase 1 Pattern',
      status: 'completed',
      phase: 1,
      filePath: 'src/phase1b.ts',
    }),
  ];
}

export function createPatternsWithPriorities(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'High Priority Pattern',
      status: 'active',
      phase: 1,
      priority: 'high',
      filePath: 'src/high.ts',
    }),
    createTestPattern({
      name: 'Medium Priority Pattern',
      status: 'active',
      phase: 1,
      priority: 'medium',
      filePath: 'src/medium.ts',
    }),
    createTestPattern({
      name: 'Low Priority Pattern',
      status: 'active',
      phase: 1,
      priority: 'low',
      filePath: 'src/low.ts',
    }),
  ];
}

export function createDetailedPattern(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Detailed Pattern',
      status: 'active',
      phase: 2,
      filePath: 'src/detailed.ts',
      description: 'This is a detailed description of the pattern explaining its purpose.',
    }),
  ];
}

export function createPatternWithBusinessValue(): ExtractedPattern[] {
  const pattern = createTestPattern({
    name: 'Business Value Pattern',
    status: 'active',
    phase: 1,
    filePath: 'src/business-value.ts',
  });

  // Add businessValue directly (not supported by factory but allowed by schema)
  (pattern as { businessValue?: string }).businessValue = 'Improves user experience';

  return [pattern];
}

export function createPatternsWithScenarios(): ExtractedPattern[] {
  const pattern = createTestPattern({
    name: 'Pattern With Scenarios',
    status: 'active',
    phase: 1,
    filePath: 'src/with-scenarios.ts',
  });

  // Add scenarios to the pattern
  (pattern as { scenarios?: unknown[] }).scenarios = [
    {
      featureFile: 'tests/features/test.feature',
      featureName: 'Test Feature',
      featureDescription: 'Test description',
      scenarioName: 'Test Scenario',
      semanticTags: ['@happy-path'],
      tags: ['@test'],
      steps: [
        { keyword: 'Given', text: 'a precondition' },
        { keyword: 'When', text: 'an action occurs' },
        { keyword: 'Then', text: 'a result is expected' },
      ],
    },
  ];

  return [pattern];
}

export function createPatternsWithBusinessRules(): ExtractedPattern[] {
  const pattern = createTestPattern({
    name: 'Pattern With Rules',
    status: 'active',
    phase: 1,
    filePath: 'src/with-rules.ts',
  });

  // Add business rules to the pattern
  (pattern as { rules?: unknown[] }).rules = [
    {
      name: 'Business Rule 1',
      description: 'This rule ensures consistency.',
      scenarioCount: 2,
      scenarioNames: ['Scenario A', 'Scenario B'],
    },
  ];

  return [pattern];
}

export function createPatternsWithDependsOn(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Dependent Pattern',
      status: 'active',
      phase: 2,
      filePath: 'src/dependent.ts',
      dependsOn: ['Foundation Types', 'Base Utilities'],
    }),
  ];
}

export function createPatternsWithEnables(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Enabling Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/enabling.ts',
      enables: ['Advanced Features', 'Domain Model'],
    }),
  ];
}

export function createPatternsWithDependencies(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Pattern With Deps',
      status: 'active',
      phase: 2,
      filePath: 'src/deps.ts',
      dependsOn: ['Foundation Types'],
      enables: ['Advanced Features'],
    }),
  ];
}

export function createPatternsWithoutDependencies(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Independent Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/independent.ts',
    }),
  ];
}

export function createPatternsFromVariousFiles(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Commands Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/commands/order.ts',
    }),
    createTestPattern({
      name: 'Events Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/events/order-created.ts',
    }),
    createTestPattern({
      name: 'Domain Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/domain/order.ts',
    }),
  ];
}

export function createPatternsWithDifferentReleases(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'v0.2.0 Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/v020.ts',
      deliverables: [
        {
          name: 'Deliverable',
          status: 'complete',
          tests: 1,
          location: 'src/v020/',
          release: 'v0.2.0',
        },
      ],
    }),
    createTestPattern({
      name: 'v0.3.0 Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/v030.ts',
      deliverables: [
        {
          name: 'Deliverable',
          status: 'complete',
          tests: 1,
          location: 'src/v030/',
          release: 'v0.3.0',
        },
      ],
    }),
  ];
}

export function createPatternsMatchingFileOrRelease(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'File Match Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/commands/order.ts',
    }),
    createTestPattern({
      name: 'Release Match Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/other/path.ts',
      deliverables: [
        {
          name: 'Deliverable',
          status: 'complete',
          tests: 1,
          location: 'src/other/',
          release: 'v0.2.0',
        },
      ],
    }),
  ];
}

export function createPatternMatchingBothFileAndRelease(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Both Match Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/commands/order.ts',
      deliverables: [
        {
          name: 'Deliverable',
          status: 'complete',
          tests: 1,
          location: 'src/commands/',
          release: 'v0.2.0',
        },
      ],
    }),
  ];
}

export function createPatternsOfAllStatuses(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Completed Pattern',
      status: 'completed',
      phase: 1,
      filePath: 'src/completed.ts',
    }),
    createTestPattern({
      name: 'Active Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/active.ts',
    }),
    createTestPattern({
      name: 'Roadmap Pattern',
      status: 'roadmap',
      phase: 2,
      filePath: 'src/roadmap.ts',
    }),
  ];
}

export function createDeferredPatterns(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Active Pattern',
      status: 'active',
      phase: 1,
      filePath: 'src/active.ts',
    }),
    createTestPattern({
      name: 'Deferred Pattern',
      status: 'deferred',
      phase: 2,
      filePath: 'src/deferred.ts',
    }),
  ];
}

export function createCompletedPatterns(): ExtractedPattern[] {
  return [
    createTestPattern({
      name: 'Completed Pattern 1',
      status: 'completed',
      phase: 1,
      filePath: 'src/completed1.ts',
    }),
    createTestPattern({
      name: 'Completed Pattern 2',
      status: 'completed',
      phase: 1,
      filePath: 'src/completed2.ts',
    }),
  ];
}
