/**
 * Handoff Generator Step Definitions
 *
 * Tests for generateHandoff, formatHandoff, and session type inference.
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  generateHandoff,
  formatHandoff,
  type HandoffDocument,
} from '../../../../src/api/handoff-generator.js';
import { QueryApiError } from '../../../../src/api/types.js';
import { createTestPattern } from '../../../fixtures/pattern-factories.js';
import { createTestMasterDataset } from '../../../fixtures/dataset-factories.js';
import { createProcessStateAPI } from '../../../../src/api/process-state.js';
import type { ProcessStateAPI } from '../../../../src/api/process-state.js';
import type { ExtractedPattern } from '../../../../src/validation-schemas/index.js';
import type { MasterDataset } from '../../../../src/validation-schemas/master-dataset.js';

const feature = await loadFeature('tests/features/api/session-support/handoff-generator.feature');

// =============================================================================
// Test State
// =============================================================================

interface HandoffTestState {
  api: ProcessStateAPI | null;
  dataset: MasterDataset | null;
  doc: HandoffDocument | null;
  formattedOutput: string;
  thrownError: unknown;
}

let state: HandoffTestState | null = null;

function initState(): HandoffTestState {
  return {
    api: null,
    dataset: null,
    doc: null,
    formattedOutput: '',
    thrownError: null,
  };
}

function buildApiAndDataset(patterns: ExtractedPattern[]): {
  api: ProcessStateAPI;
  dataset: MasterDataset;
} {
  const dataset = createTestMasterDataset({ patterns });
  const api = createProcessStateAPI(dataset);
  return { api, dataset };
}

// =============================================================================
// Feature
// =============================================================================

describeFeature(feature, ({ Rule }) => {
  // ===========================================================================
  // Rule 1: Handoff generates compact session state summary
  // ===========================================================================

  Rule('Handoff generates compact session state summary', ({ RuleScenario }) => {
    RuleScenario('Generate handoff for in-progress pattern', ({ Given, When, Then, And }) => {
      Given('an active pattern with completed and remaining deliverables', () => {
        state = initState();
      });

      When('generating a handoff document', () => {
        const focal = createTestPattern({
          name: 'ActivePattern',
          status: 'active',
          filePath: 'specs/active-pattern.feature',
          deliverables: [
            { name: 'D1', status: 'complete', tests: 3, location: 'src/d1.ts' },
            { name: 'D2', status: 'complete', tests: 2, location: 'src/d2.ts' },
            { name: 'D3', status: 'in-progress', tests: 1, location: 'src/d3.ts' },
            { name: 'D4', status: 'pending', tests: 0, location: 'src/d4.ts' },
          ],
        });

        const { api, dataset } = buildApiAndDataset([focal]);
        state!.api = api;
        state!.dataset = dataset;
        state!.doc = generateHandoff(api, dataset, {
          patternName: 'ActivePattern',
        });
      });

      Then('the handoff shows the session summary header', () => {
        expect(state!.doc!.pattern).toBe('ActivePattern');
        expect(state!.doc!.sessionType).toBe('implement');
        expect(state!.doc!.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });

      And('the handoff lists completed deliverables', () => {
        const completedSection = state!.doc!.sections.find((s) => s.title === 'COMPLETED');
        expect(completedSection).toBeDefined();
        expect(completedSection!.items).toHaveLength(2);
      });

      And('the handoff lists in-progress deliverables', () => {
        const inProgressSection = state!.doc!.sections.find((s) => s.title === 'IN PROGRESS');
        expect(inProgressSection).toBeDefined();
        // D3 has 'in-progress' status — should appear here
        // D4 has 'pending' status — excluded by isStatusPending
        expect(inProgressSection!.items).toHaveLength(1);
        expect(inProgressSection!.items[0]).toContain('D3');
      });

      And('the handoff lists remaining deliverables as next priorities', () => {
        const nextSection = state!.doc!.sections.find((s) => s.title === 'NEXT SESSION');
        expect(nextSection).toBeDefined();
        expect(nextSection!.items).toHaveLength(2);
      });
    });

    RuleScenario('Handoff captures discovered items', ({ Given, When, Then, And }) => {
      Given('a pattern with discovery tags', () => {
        state = initState();
      });

      When('generating a handoff document', () => {
        const focal = createTestPattern({
          name: 'DiscoveryPattern',
          status: 'active',
          filePath: 'specs/discovery.feature',
          deliverables: [{ name: 'D1', status: 'complete', tests: 1, location: 'src/d1.ts' }],
          discoveredGaps: ['Missing validation for edge case'],
          discoveredImprovements: ['Could cache dependency lookups'],
          discoveredLearnings: ['FSM transitions require explicit ordering'],
        });

        const { api, dataset } = buildApiAndDataset([focal]);
        state!.api = api;
        state!.dataset = dataset;
        state!.doc = generateHandoff(api, dataset, {
          patternName: 'DiscoveryPattern',
        });
      });

      Then('the handoff includes discovered gaps', () => {
        const discovered = state!.doc!.sections.find((s) => s.title === 'DISCOVERED');
        expect(discovered).toBeDefined();
        const gapItem = discovered!.items.find((i) => i.startsWith('Gaps:'));
        expect(gapItem).toBeDefined();
      });

      And('the handoff includes discovered improvements', () => {
        const discovered = state!.doc!.sections.find((s) => s.title === 'DISCOVERED');
        const improvementItem = discovered!.items.find((i) => i.startsWith('Improvements:'));
        expect(improvementItem).toBeDefined();
      });

      And('the handoff includes discovered learnings', () => {
        const discovered = state!.doc!.sections.find((s) => s.title === 'DISCOVERED');
        const learningItem = discovered!.items.find((i) => i.startsWith('Learnings:'));
        expect(learningItem).toBeDefined();
      });
    });

    RuleScenario('Session type is inferred from status', ({ Given, When, Then }) => {
      Given('a roadmap pattern', () => {
        state = initState();
      });

      When('generating a handoff document without explicit session type', () => {
        const focal = createTestPattern({
          name: 'RoadmapPattern',
          status: 'roadmap',
          filePath: 'specs/roadmap.feature',
        });

        const { api, dataset } = buildApiAndDataset([focal]);
        state!.api = api;
        state!.dataset = dataset;
        state!.doc = generateHandoff(api, dataset, {
          patternName: 'RoadmapPattern',
        });
      });

      Then('the inferred session type is design', () => {
        expect(state!.doc!.sessionType).toBe('design');
      });
    });

    RuleScenario('Completed pattern infers review session type', ({ Given, When, Then }) => {
      Given('a completed pattern', () => {
        state = initState();
      });

      When('generating a handoff document without explicit session type', () => {
        const focal = createTestPattern({
          name: 'CompletedPattern',
          status: 'completed',
          filePath: 'specs/completed-pattern.feature',
        });

        const { api, dataset } = buildApiAndDataset([focal]);
        state!.api = api;
        state!.dataset = dataset;
        state!.doc = generateHandoff(api, dataset, {
          patternName: 'CompletedPattern',
        });
      });

      Then('the inferred session type is review', () => {
        expect(state!.doc!.sessionType).toBe('review');
      });
    });

    RuleScenario('Deferred pattern infers design session type', ({ Given, When, Then }) => {
      Given('a deferred pattern', () => {
        state = initState();
      });

      When('generating a handoff document without explicit session type', () => {
        const focal = createTestPattern({
          name: 'DeferredPattern',
          status: 'deferred',
          filePath: 'specs/deferred-pattern.feature',
        });

        const { api, dataset } = buildApiAndDataset([focal]);
        state!.api = api;
        state!.dataset = dataset;
        state!.doc = generateHandoff(api, dataset, {
          patternName: 'DeferredPattern',
        });
      });

      Then('the inferred session type is design', () => {
        expect(state!.doc!.sessionType).toBe('design');
      });
    });

    RuleScenario('Files modified section included when provided', ({ Given, When, Then }) => {
      Given('an active pattern with completed and remaining deliverables', () => {
        state = initState();
      });

      When('generating a handoff with modified files', () => {
        const focal = createTestPattern({
          name: 'ActivePattern',
          status: 'active',
          filePath: 'specs/active-pattern.feature',
          deliverables: [
            { name: 'D1', status: 'complete', tests: 1, location: 'src/d1.ts' },
            { name: 'D2', status: 'pending', tests: 0, location: 'src/d2.ts' },
          ],
        });

        const { api, dataset } = buildApiAndDataset([focal]);
        state!.api = api;
        state!.dataset = dataset;
        state!.doc = generateHandoff(api, dataset, {
          patternName: 'ActivePattern',
          modifiedFiles: ['src/d1.ts', 'tests/d1.steps.ts'],
        });
      });

      Then('the handoff includes a files modified section', () => {
        const filesSection = state!.doc!.sections.find((s) => s.title === 'FILES MODIFIED');
        expect(filesSection).toBeDefined();
        expect(filesSection!.items).toHaveLength(2);
        expect(filesSection!.items).toContain('src/d1.ts');
      });
    });

    RuleScenario('Blockers section shows incomplete dependencies', ({ Given, When, Then }) => {
      Given('a pattern with an incomplete dependency', () => {
        state = initState();
      });

      When('generating a handoff document', () => {
        const dep = createTestPattern({
          name: 'IncompleteDep',
          status: 'roadmap',
          filePath: 'specs/incomplete-dep.feature',
        });
        const focal = createTestPattern({
          name: 'BlockedPattern',
          status: 'active',
          filePath: 'specs/blocked.feature',
          dependsOn: ['IncompleteDep'],
          deliverables: [{ name: 'D1', status: 'pending', tests: 0, location: 'src/d1.ts' }],
        });

        const { api, dataset } = buildApiAndDataset([focal, dep]);
        state!.api = api;
        state!.dataset = dataset;
        state!.doc = generateHandoff(api, dataset, {
          patternName: 'BlockedPattern',
        });
      });

      Then('the handoff shows the incomplete dependency as a blocker', () => {
        const blockersSection = state!.doc!.sections.find((s) => s.title === 'BLOCKERS');
        expect(blockersSection).toBeDefined();
        expect(blockersSection!.items.length).toBeGreaterThan(0);
        expect(blockersSection!.items[0]).not.toBe('None');
        expect(blockersSection!.items[0]).toContain('IncompleteDep');
      });
    });

    RuleScenario('Pattern not found throws error', ({ Given, When, Then }) => {
      Given('no patterns in the dataset', () => {
        state = initState();
        const { api, dataset } = buildApiAndDataset([]);
        state.api = api;
        state.dataset = dataset;
      });

      When('generating a handoff for a nonexistent pattern', () => {
        try {
          generateHandoff(state!.api!, state!.dataset!, {
            patternName: 'NonexistentPattern',
          });
        } catch (err: unknown) {
          state!.thrownError = err;
        }
      });

      Then('a PATTERN_NOT_FOUND error is thrown', () => {
        expect(state!.thrownError).toBeInstanceOf(QueryApiError);
        const error = state!.thrownError as QueryApiError;
        expect(error.code).toBe('PATTERN_NOT_FOUND');
      });
    });
  });

  // ===========================================================================
  // Rule 2: Formatter
  // ===========================================================================

  Rule('Formatter produces structured text output', ({ RuleScenario }) => {
    RuleScenario('Handoff formatter produces markers per ADR-008', ({ Given, When, Then, And }) => {
      Given('a handoff document for pattern TestPattern', () => {
        state = initState();
        state.doc = {
          pattern: 'TestPattern',
          sessionType: 'implement',
          date: '2026-02-08',
          status: 'active',
          sections: [
            {
              title: 'COMPLETED',
              items: ['[x] D1 (src/d1.ts)'],
            },
            {
              title: 'BLOCKERS',
              items: ['None'],
            },
          ],
        };
      });

      When('formatting the handoff document', () => {
        state!.formattedOutput = formatHandoff(state!.doc!);
      });

      Then('the output contains the handoff header', () => {
        expect(state!.formattedOutput).toContain('=== HANDOFF: TestPattern (implement) ===');
      });

      And('the output contains section markers', () => {
        expect(state!.formattedOutput).toContain('=== COMPLETED ===');
        expect(state!.formattedOutput).toContain('=== BLOCKERS ===');
      });
    });
  });
});
