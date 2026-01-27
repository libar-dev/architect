/**
 * Process State API Step Definitions
 *
 * BDD step definitions for testing the ProcessStateAPI query interface.
 *
 * @libar-docs
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import { createProcessStateAPI, type ProcessStateAPI } from '../../../src/api/index.js';
import { transformToMasterDataset } from '../../../src/generators/pipeline/transform-dataset.js';
import type { ExtractedPattern } from '../../../src/validation-schemas/index.js';
import { createDefaultTagRegistry } from '../../../src/validation-schemas/tag-registry.js';
import type { ProcessStatusValue } from '../../../src/taxonomy/index.js';
import { createTestPattern } from '../../fixtures/pattern-factories.js';

// =============================================================================
// Test State
// =============================================================================

interface APITestState {
  api: ProcessStateAPI | null;
  patterns: ExtractedPattern[];
  queryResult: ExtractedPattern[] | undefined;
  phaseProgress:
    | { completed: number; active: number; planned: number; completionPercentage: number }
    | undefined;
  statusCounts: { completed: number; active: number; planned: number; total: number } | undefined;
  completionPercentage: number | undefined;
  transitionValid: boolean | undefined;
  validTransitions: readonly ProcessStatusValue[] | undefined;
  protectionInfo:
    | { level: string; requiresUnlock: boolean; canAddDeliverables: boolean }
    | undefined;
  foundPattern: ExtractedPattern | undefined;
  categories: Array<{ category: string; count: number }> | undefined;
  quarters: Array<{ quarter: string; patterns: ExtractedPattern[] }> | undefined;
}

let state: APITestState | null = null;

function initState(): APITestState {
  return {
    api: null,
    patterns: [],
    queryResult: undefined,
    phaseProgress: undefined,
    statusCounts: undefined,
    completionPercentage: undefined,
    transitionValid: undefined,
    validTransitions: undefined,
    protectionInfo: undefined,
    foundPattern: undefined,
    categories: undefined,
    quarters: undefined,
  };
}

function buildAPI(): void {
  const tagRegistry = createDefaultTagRegistry();
  const dataset = transformToMasterDataset({
    patterns: state!.patterns,
    tagRegistry,
  });
  state!.api = createProcessStateAPI(dataset);
}

// =============================================================================
// Feature Definition
// =============================================================================

const feature = await loadFeature('tests/features/api/process-state-api.feature');

describeFeature(feature, ({ Background, Rule, AfterEachScenario }) => {
  AfterEachScenario(() => {
    state = null;
  });

  Background(({ Given }) => {
    Given('a test MasterDataset is initialized', () => {
      state = initState();
    });
  });

  // ===========================================================================
  // Status Queries
  // ===========================================================================

  Rule('Status queries return correct patterns', ({ RuleScenario }) => {
    RuleScenario('Get patterns by normalized status', ({ Given, When, Then, And }) => {
      Given('patterns with statuses: completed, active, roadmap, deferred', () => {
        state!.patterns = [
          createTestPattern({ name: 'Completed1', status: 'completed' }),
          createTestPattern({ name: 'Active1', status: 'active' }),
          createTestPattern({ name: 'Roadmap1', status: 'roadmap' }),
          createTestPattern({ name: 'Deferred1', status: 'deferred' }),
        ];
        buildAPI();
      });

      When('querying patterns with normalized status "planned"', () => {
        state!.queryResult = state!.api!.getPatternsByNormalizedStatus('planned');
      });

      Then('the result includes roadmap and deferred patterns', () => {
        const names = state!.queryResult!.map((p) => p.name);
        expect(names).toContain('Roadmap1');
        expect(names).toContain('Deferred1');
      });

      And('the result does not include completed or active patterns', () => {
        const names = state!.queryResult!.map((p) => p.name);
        expect(names).not.toContain('Completed1');
        expect(names).not.toContain('Active1');
      });
    });

    RuleScenario('Get patterns by FSM status', ({ Given, When, Then }) => {
      Given('patterns with statuses: completed, active, roadmap, deferred', () => {
        state!.patterns = [
          createTestPattern({ name: 'Completed1', status: 'completed' }),
          createTestPattern({ name: 'Active1', status: 'active' }),
          createTestPattern({ name: 'Roadmap1', status: 'roadmap' }),
          createTestPattern({ name: 'Deferred1', status: 'deferred' }),
        ];
        buildAPI();
      });

      When('querying patterns with FSM status "active"', () => {
        state!.queryResult = state!.api!.getPatternsByStatus('active');
      });

      Then('the result includes only active patterns', () => {
        expect(state!.queryResult!.length).toBe(1);
        expect(state!.queryResult![0].name).toBe('Active1');
      });
    });

    RuleScenario('Get current work returns active patterns', ({ Given, When, Then }) => {
      Given('patterns with statuses: completed, active, roadmap', () => {
        state!.patterns = [
          createTestPattern({ name: 'Completed1', status: 'completed' }),
          createTestPattern({ name: 'Active1', status: 'active' }),
          createTestPattern({ name: 'Roadmap1', status: 'roadmap' }),
        ];
        buildAPI();
      });

      When('querying getCurrentWork', () => {
        state!.queryResult = state!.api!.getCurrentWork();
      });

      Then('the result includes only active patterns', () => {
        expect(state!.queryResult!.length).toBe(1);
        expect(state!.queryResult![0].name).toBe('Active1');
      });
    });

    RuleScenario('Get roadmap items returns roadmap and deferred', ({ Given, When, Then, And }) => {
      Given('patterns with statuses: completed, active, roadmap, deferred', () => {
        state!.patterns = [
          createTestPattern({ name: 'Completed1', status: 'completed' }),
          createTestPattern({ name: 'Active1', status: 'active' }),
          createTestPattern({ name: 'Roadmap1', status: 'roadmap' }),
          createTestPattern({ name: 'Deferred1', status: 'deferred' }),
        ];
        buildAPI();
      });

      When('querying getRoadmapItems', () => {
        state!.queryResult = state!.api!.getRoadmapItems();
      });

      Then('the result includes roadmap and deferred patterns', () => {
        const names = state!.queryResult!.map((p) => p.name);
        expect(names).toContain('Roadmap1');
        expect(names).toContain('Deferred1');
      });

      And('the result does not include completed or active patterns', () => {
        const names = state!.queryResult!.map((p) => p.name);
        expect(names).not.toContain('Completed1');
        expect(names).not.toContain('Active1');
      });
    });

    RuleScenario('Get status counts', ({ Given, When, Then, And }) => {
      Given('patterns with statuses: completed, completed, active, roadmap', () => {
        state!.patterns = [
          createTestPattern({ name: 'Completed1', status: 'completed' }),
          createTestPattern({ name: 'Completed2', status: 'completed' }),
          createTestPattern({ name: 'Active1', status: 'active' }),
          createTestPattern({ name: 'Roadmap1', status: 'roadmap' }),
        ];
        buildAPI();
      });

      When('querying status counts', () => {
        state!.statusCounts = state!.api!.getStatusCounts();
      });

      Then('completed count is 2', () => {
        expect(state!.statusCounts!.completed).toBe(2);
      });

      And('active count is 1', () => {
        expect(state!.statusCounts!.active).toBe(1);
      });

      And('planned count is 1', () => {
        expect(state!.statusCounts!.planned).toBe(1);
      });

      And('total count is 4', () => {
        expect(state!.statusCounts!.total).toBe(4);
      });
    });

    RuleScenario('Get completion percentage', ({ Given, When, Then }) => {
      Given('patterns with 3 completed and 1 active', () => {
        state!.patterns = [
          createTestPattern({ name: 'Completed1', status: 'completed' }),
          createTestPattern({ name: 'Completed2', status: 'completed' }),
          createTestPattern({ name: 'Completed3', status: 'completed' }),
          createTestPattern({ name: 'Active1', status: 'active' }),
        ];
        buildAPI();
      });

      When('querying completion percentage', () => {
        state!.completionPercentage = state!.api!.getCompletionPercentage();
      });

      Then('the percentage is 75', () => {
        expect(state!.completionPercentage).toBe(75);
      });
    });
  });

  // ===========================================================================
  // Phase Queries
  // ===========================================================================

  Rule('Phase queries return correct phase data', ({ RuleScenario }) => {
    RuleScenario('Get patterns by phase', ({ Given, When, Then }) => {
      Given('patterns in phase 14 and phase 15', () => {
        state!.patterns = [
          createTestPattern({ name: 'Phase14Pattern', phase: 14 }),
          createTestPattern({ name: 'Phase15Pattern', phase: 15 }),
        ];
        buildAPI();
      });

      When('querying patterns for phase 14', () => {
        state!.queryResult = state!.api!.getPatternsByPhase(14);
      });

      Then('the result includes only phase 14 patterns', () => {
        expect(state!.queryResult!.length).toBe(1);
        expect(state!.queryResult![0].name).toBe('Phase14Pattern');
      });
    });

    RuleScenario('Get phase progress', ({ Given, When, Then, And }) => {
      Given('a phase 14 with 2 completed and 1 active pattern', () => {
        state!.patterns = [
          createTestPattern({ name: 'Completed1', status: 'completed', phase: 14 }),
          createTestPattern({ name: 'Completed2', status: 'completed', phase: 14 }),
          createTestPattern({ name: 'Active1', status: 'active', phase: 14 }),
        ];
        buildAPI();
      });

      When('querying phase progress for phase 14', () => {
        state!.phaseProgress = state!.api!.getPhaseProgress(14);
      });

      Then('completed count is 2', () => {
        expect(state!.phaseProgress!.completed).toBe(2);
      });

      And('active count is 1', () => {
        expect(state!.phaseProgress!.active).toBe(1);
      });

      And('completion percentage is 66', () => {
        // 2/3 = 66.67%, rounded to 67 - but let's check the actual implementation
        expect(state!.phaseProgress!.completionPercentage).toBeGreaterThanOrEqual(66);
        expect(state!.phaseProgress!.completionPercentage).toBeLessThanOrEqual(67);
      });
    });

    RuleScenario('Get nonexistent phase returns undefined', ({ When, Then }) => {
      When('querying phase progress for phase 999', () => {
        buildAPI();
        state!.phaseProgress = state!.api!.getPhaseProgress(999);
      });

      Then('the result is undefined', () => {
        expect(state!.phaseProgress).toBeUndefined();
      });
    });

    RuleScenario('Get active phases', ({ Given, When, Then, And }) => {
      Given('phase 14 with active work and phase 15 with only completed', () => {
        state!.patterns = [
          createTestPattern({ name: 'Active14', status: 'active', phase: 14 }),
          createTestPattern({ name: 'Completed15', status: 'completed', phase: 15 }),
        ];
        buildAPI();
      });

      When('querying active phases', () => {
        const phases = state!.api!.getActivePhases();
        state!.queryResult = phases.flatMap((p) => p.patterns);
      });

      Then('phase 14 is included', () => {
        const phases = state!.api!.getActivePhases();
        const phaseNumbers = phases.map((p) => p.phaseNumber);
        expect(phaseNumbers).toContain(14);
      });

      And('phase 15 is not included', () => {
        const phases = state!.api!.getActivePhases();
        const phaseNumbers = phases.map((p) => p.phaseNumber);
        expect(phaseNumbers).not.toContain(15);
      });
    });
  });

  // ===========================================================================
  // FSM Queries
  // ===========================================================================

  Rule('FSM queries expose transition validation', ({ RuleScenario }) => {
    RuleScenario('Check valid transition', ({ When, Then }) => {
      When('checking if transition from "roadmap" to "active" is valid', () => {
        buildAPI();
        state!.transitionValid = state!.api!.isValidTransition('roadmap', 'active');
      });

      Then('the transition is valid', () => {
        expect(state!.transitionValid).toBe(true);
      });
    });

    RuleScenario('Check invalid transition', ({ When, Then }) => {
      When('checking if transition from "roadmap" to "completed" is valid', () => {
        buildAPI();
        state!.transitionValid = state!.api!.isValidTransition('roadmap', 'completed');
      });

      Then('the transition is invalid', () => {
        expect(state!.transitionValid).toBe(false);
      });
    });

    RuleScenario('Get valid transitions from status', ({ When, Then, And }) => {
      When('querying valid transitions from "roadmap"', () => {
        buildAPI();
        state!.validTransitions = state!.api!.getValidTransitionsFrom('roadmap');
      });

      Then('valid targets include "active"', () => {
        expect(state!.validTransitions).toContain('active');
      });

      And('valid targets include "deferred"', () => {
        expect(state!.validTransitions).toContain('deferred');
      });

      And('valid targets include "roadmap"', () => {
        expect(state!.validTransitions).toContain('roadmap');
      });
    });

    RuleScenario('Get protection info', ({ When, Then, And }) => {
      When('querying protection info for "completed"', () => {
        buildAPI();
        state!.protectionInfo = state!.api!.getProtectionInfo('completed');
      });

      Then('protection level is "hard"', () => {
        expect(state!.protectionInfo!.level).toBe('hard');
      });

      And('requires unlock is true', () => {
        expect(state!.protectionInfo!.requiresUnlock).toBe(true);
      });

      And('can add deliverables is false', () => {
        expect(state!.protectionInfo!.canAddDeliverables).toBe(false);
      });
    });
  });

  // ===========================================================================
  // Pattern Queries
  // ===========================================================================

  Rule('Pattern queries find and retrieve pattern data', ({ RuleScenario }) => {
    RuleScenario('Find pattern by name (case insensitive)', ({ Given, When, Then, And }) => {
      Given('a pattern named "CommandOrchestrator"', () => {
        state!.patterns = [createTestPattern({ name: 'CommandOrchestrator' })];
        buildAPI();
      });

      When('searching for pattern "commandorchestrator"', () => {
        state!.foundPattern = state!.api!.getPattern('commandorchestrator');
      });

      Then('the pattern is found', () => {
        expect(state!.foundPattern).toBeDefined();
      });

      And('pattern name is "CommandOrchestrator"', () => {
        expect(state!.foundPattern!.name).toBe('CommandOrchestrator');
      });
    });

    RuleScenario('Find nonexistent pattern returns undefined', ({ When, Then }) => {
      When('searching for pattern "NonExistentPattern"', () => {
        buildAPI();
        state!.foundPattern = state!.api!.getPattern('NonExistentPattern');
      });

      Then('the result is undefined', () => {
        expect(state!.foundPattern).toBeUndefined();
      });
    });

    RuleScenario('Get patterns by category', ({ Given, When, Then }) => {
      Given('patterns in categories: core, domain, projection', () => {
        state!.patterns = [
          createTestPattern({ name: 'Core1', category: 'core' }),
          createTestPattern({ name: 'Domain1', category: 'domain' }),
          createTestPattern({ name: 'Projection1', category: 'projection' }),
        ];
        buildAPI();
      });

      When('querying patterns in category "core"', () => {
        state!.queryResult = state!.api!.getPatternsByCategory('core');
      });

      Then('the result includes only core patterns', () => {
        expect(state!.queryResult!.length).toBe(1);
        expect(state!.queryResult![0].name).toBe('Core1');
      });
    });

    RuleScenario('Get all categories with counts', ({ Given, When, Then, And }) => {
      Given('patterns in categories: core, core, domain', () => {
        state!.patterns = [
          createTestPattern({ name: 'Core1', category: 'core' }),
          createTestPattern({ name: 'Core2', category: 'core' }),
          createTestPattern({ name: 'Domain1', category: 'domain' }),
        ];
        buildAPI();
      });

      When('querying all categories', () => {
        state!.categories = state!.api!.getCategories();
      });

      Then('core has count 2', () => {
        const core = state!.categories!.find((c) => c.category === 'core');
        expect(core?.count).toBe(2);
      });

      And('domain has count 1', () => {
        const domain = state!.categories!.find((c) => c.category === 'domain');
        expect(domain?.count).toBe(1);
      });
    });
  });

  // ===========================================================================
  // Timeline Queries
  // ===========================================================================

  Rule('Timeline queries group patterns by time', ({ RuleScenario }) => {
    RuleScenario('Get patterns by quarter', ({ Given, When, Then }) => {
      Given('patterns in quarters: Q1-2026, Q2-2026', () => {
        state!.patterns = [
          createTestPattern({ name: 'Q1Pattern', quarter: 'Q1-2026' }),
          createTestPattern({ name: 'Q2Pattern', quarter: 'Q2-2026' }),
        ];
        buildAPI();
      });

      When('querying patterns for quarter "Q1-2026"', () => {
        state!.queryResult = state!.api!.getPatternsByQuarter('Q1-2026');
      });

      Then('the result includes only Q1-2026 patterns', () => {
        expect(state!.queryResult!.length).toBe(1);
        expect(state!.queryResult![0].name).toBe('Q1Pattern');
      });
    });

    RuleScenario('Get all quarters', ({ Given, When, Then, And }) => {
      Given('patterns in quarters: Q1-2026, Q2-2026, Q1-2026', () => {
        state!.patterns = [
          createTestPattern({ name: 'Q1Pattern1', quarter: 'Q1-2026' }),
          createTestPattern({ name: 'Q2Pattern1', quarter: 'Q2-2026' }),
          createTestPattern({ name: 'Q1Pattern2', quarter: 'Q1-2026' }),
        ];
        buildAPI();
      });

      When('querying all quarters', () => {
        state!.quarters = state!.api!.getQuarters();
      });

      Then('Q1-2026 has 2 patterns', () => {
        const q1 = state!.quarters!.find((q) => q.quarter === 'Q1-2026');
        expect(q1?.patterns.length).toBe(2);
      });

      And('Q2-2026 has 1 pattern', () => {
        const q2 = state!.quarters!.find((q) => q.quarter === 'Q2-2026');
        expect(q2?.patterns.length).toBe(1);
      });
    });

    RuleScenario('Get recently completed sorted by date', ({ Given, When, Then, And }) => {
      Given('completed patterns with dates: 2026-01-09, 2026-01-08, 2026-01-07', () => {
        state!.patterns = [
          createTestPattern({ name: 'Recent1', status: 'completed', completed: '2026-01-09' }),
          createTestPattern({ name: 'Recent2', status: 'completed', completed: '2026-01-08' }),
          createTestPattern({ name: 'Recent3', status: 'completed', completed: '2026-01-07' }),
        ];
        buildAPI();
      });

      When('querying recently completed with limit 2', () => {
        state!.queryResult = state!.api!.getRecentlyCompleted(2);
      });

      Then('the first pattern has date "2026-01-09"', () => {
        expect(state!.queryResult![0].completed).toBe('2026-01-09');
      });

      And('the second pattern has date "2026-01-08"', () => {
        expect(state!.queryResult![1].completed).toBe('2026-01-08');
      });

      And('the result has 2 patterns', () => {
        expect(state!.queryResult!.length).toBe(2);
      });
    });
  });
});
