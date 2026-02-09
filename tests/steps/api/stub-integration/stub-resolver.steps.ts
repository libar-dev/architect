/**
 * Stub Resolver Step Definitions
 *
 * Tests for findStubPatterns, resolveStubs, groupStubsByPattern,
 * extractDecisionItems, and findPdrReferences.
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  findStubPatterns,
  resolveStubs,
  groupStubsByPattern,
  extractDecisionItems,
  findPdrReferences,
  type StubResolution,
  type StubSummary,
  type DecisionItem,
  type PdrReference,
} from '../../../../src/api/stub-resolver.js';
import { createTestPattern } from '../../../fixtures/pattern-factories.js';
import { createTestMasterDataset } from '../../../fixtures/dataset-factories.js';
import type { ExtractedPattern } from '../../../../src/validation-schemas/index.js';
import type { MasterDataset } from '../../../../src/validation-schemas/master-dataset.js';

const feature = await loadFeature('tests/features/api/stub-integration/stub-resolver.feature');

// =============================================================================
// Test State
// =============================================================================

interface StubResolverTestState {
  dataset: MasterDataset | null;
  patterns: ExtractedPattern[];
  stubPatterns: readonly ExtractedPattern[];
  resolutions: readonly StubResolution[];
  summaries: readonly StubSummary[];
  decisions: readonly DecisionItem[];
  pdrRefs: readonly PdrReference[];
  fileExistsMap: Map<string, boolean>;
}

let state: StubResolverTestState | null = null;

function initState(): StubResolverTestState {
  return {
    dataset: null,
    patterns: [],
    stubPatterns: [],
    resolutions: [],
    summaries: [],
    decisions: [],
    pdrRefs: [],
    fileExistsMap: new Map(),
  };
}

// =============================================================================
// Feature
// =============================================================================

describeFeature(feature, ({ Rule }) => {
  Rule('Stubs are identified by path or target metadata', ({ RuleScenario }) => {
    RuleScenario('Patterns in stubs directory are identified as stubs', ({ Given, When, Then }) => {
      Given('patterns where some have file paths containing "/stubs/"', () => {
        state = initState();
        const stubPattern = createTestPattern({
          name: 'StubA',
          filePath: 'delivery-process/stubs/my-feature/stub-a.ts',
          status: 'roadmap',
        });
        const normalPattern = createTestPattern({
          name: 'NormalA',
          filePath: 'src/api/normal-a.ts',
          status: 'active',
        });
        state.patterns = [stubPattern, normalPattern];
        state.dataset = createTestMasterDataset({ patterns: state.patterns });
      });

      When('finding stub patterns from the dataset', () => {
        state!.stubPatterns = findStubPatterns(state!.dataset!);
      });

      Then('only patterns from the stubs directory are returned', () => {
        expect(state!.stubPatterns).toHaveLength(1);
        expect(state!.stubPatterns[0]!.source.file).toContain('/stubs/');
      });
    });

    RuleScenario('Patterns with targetPath are identified as stubs', ({ Given, When, Then }) => {
      Given('patterns where some have a targetPath field', () => {
        state = initState();
        const withTarget = createTestPattern({
          name: 'WithTarget',
          filePath: 'src/somewhere.ts',
          targetPath: 'src/api/resolved.ts',
          status: 'roadmap',
        });
        const withoutTarget = createTestPattern({
          name: 'NoTarget',
          filePath: 'src/elsewhere.ts',
          status: 'active',
        });
        state.patterns = [withTarget, withoutTarget];
        state.dataset = createTestMasterDataset({ patterns: state.patterns });
      });

      When('finding stub patterns from the dataset', () => {
        state!.stubPatterns = findStubPatterns(state!.dataset!);
      });

      Then('patterns with targetPath are included in results', () => {
        expect(state!.stubPatterns).toHaveLength(1);
        expect(state!.stubPatterns[0]!.targetPath).toBe('src/api/resolved.ts');
      });
    });
  });

  Rule('Stubs are resolved against the filesystem', ({ RuleScenario }) => {
    RuleScenario('Resolved stubs show target existence status', ({ Given, When, Then, And }) => {
      Given('stub patterns with target paths', () => {
        state = initState();
        state.patterns = [
          createTestPattern({
            name: 'ResolvedStub',
            filePath: 'delivery-process/stubs/feat/resolved.ts',
            targetPath: 'src/api/resolved.ts',
            since: 'DS-A',
            implementsPatterns: ['FeatureA'],
          }),
          createTestPattern({
            name: 'UnresolvedStub',
            filePath: 'delivery-process/stubs/feat/unresolved.ts',
            targetPath: 'src/api/unresolved.ts',
            since: 'DS-A',
            implementsPatterns: ['FeatureA'],
          }),
        ];
      });

      And('some target files exist on disk', () => {
        state!.fileExistsMap.set('/base/src/api/resolved.ts', true);
        // /base/src/api/unresolved.ts is not in the map -> doesn't exist
      });

      When('resolving stubs against the filesystem', () => {
        const fileExists = (p: string): boolean => state!.fileExistsMap.get(p) === true;
        state!.resolutions = resolveStubs(state!.patterns, '/base', fileExists);
      });

      Then('each resolution shows whether the target exists', () => {
        expect(state!.resolutions).toHaveLength(2);
      });

      And('resolved stubs have targetExists true', () => {
        const resolved = state!.resolutions.find((r) => r.stubName === 'ResolvedStub');
        expect(resolved).toBeDefined();
        expect(resolved!.targetExists).toBe(true);
      });

      And('unresolved stubs have targetExists false', () => {
        const unresolved = state!.resolutions.find((r) => r.stubName === 'UnresolvedStub');
        expect(unresolved).toBeDefined();
        expect(unresolved!.targetExists).toBe(false);
      });
    });

    RuleScenario('Stubs are grouped by implementing pattern', ({ Given, When, Then, And }) => {
      Given('resolved stubs for 2 different patterns', () => {
        state = initState();
        state.resolutions = [
          {
            stubName: 'StubA1',
            stubFile: 'stubs/a/stub1.ts',
            targetPath: 'src/a.ts',
            since: 'DS-1',
            implementsPattern: 'PatternA',
            targetExists: true,
          },
          {
            stubName: 'StubA2',
            stubFile: 'stubs/a/stub2.ts',
            targetPath: 'src/a2.ts',
            since: 'DS-1',
            implementsPattern: 'PatternA',
            targetExists: false,
          },
          {
            stubName: 'StubB1',
            stubFile: 'stubs/b/stub1.ts',
            targetPath: 'src/b.ts',
            since: 'DS-2',
            implementsPattern: 'PatternB',
            targetExists: true,
          },
        ];
      });

      When('grouping stubs by pattern', () => {
        state!.summaries = groupStubsByPattern(state!.resolutions);
      });

      Then('the result contains 2 groups', () => {
        expect(state!.summaries).toHaveLength(2);
      });

      And('each group has correct resolved and unresolved counts', () => {
        const groupA = state!.summaries.find((s) => s.pattern === 'PatternA');
        expect(groupA).toBeDefined();
        expect(groupA!.resolvedCount).toBe(1);
        expect(groupA!.unresolvedCount).toBe(1);

        const groupB = state!.summaries.find((s) => s.pattern === 'PatternB');
        expect(groupB).toBeDefined();
        expect(groupB!.resolvedCount).toBe(1);
        expect(groupB!.unresolvedCount).toBe(0);
      });
    });
  });

  Rule('Decision items are extracted from descriptions', ({ RuleScenario }) => {
    RuleScenario('AD-N items are extracted from description text', ({ Given, When, Then, And }) => {
      Given('a description containing AD-1 and AD-2 decision items', () => {
        state = initState();
      });

      When('extracting decision items', () => {
        const text = [
          '## Feature Design',
          'AD-1: Unified action model (PDR-011)',
          'Some other text',
          'AD-2: Router maps command types to orchestrator',
        ].join('\n');
        state!.decisions = extractDecisionItems(text);
      });

      Then('2 decision items are returned', () => {
        expect(state!.decisions).toHaveLength(2);
      });

      And('the first has id "AD-1" and a PDR reference', () => {
        expect(state!.decisions[0]!.id).toBe('AD-1');
        expect(state!.decisions[0]!.description).toBe('Unified action model');
        expect(state!.decisions[0]!.pdr).toBe('PDR-011');
      });

      And('the second has id "AD-2" without a PDR reference', () => {
        expect(state!.decisions[1]!.id).toBe('AD-2');
        expect(state!.decisions[1]!.description).toBe('Router maps command types to orchestrator');
        expect(state!.decisions[1]!.pdr).toBeUndefined();
      });
    });

    RuleScenario('Empty description returns no decision items', ({ Given, When, Then }) => {
      Given('a stub pattern with empty description', () => {
        state = initState();
      });

      When('extracting decision items from the stub description', () => {
        state!.decisions = extractDecisionItems('');
      });

      Then('{int} decision items are returned', (_ctx: unknown, count: number) => {
        expect(state!.decisions).toHaveLength(count);
      });
    });

    RuleScenario('Malformed AD items are skipped', ({ Given, When, Then }) => {
      Given('a stub pattern with description {string}', (_ctx: unknown, description: string) => {
        state = initState();
        state.patterns = [createTestPattern({ name: 'MalformedStub', description })];
      });

      When('extracting decision items from the stub description', () => {
        state!.decisions = extractDecisionItems(state!.patterns[0]!.directive);
      });

      Then('{int} decision items are returned', (_ctx: unknown, count: number) => {
        expect(state!.decisions).toHaveLength(count);
      });
    });
  });

  Rule('PDR references are found across patterns', ({ RuleScenario }) => {
    RuleScenario('Patterns referencing a PDR are found', ({ Given, When, Then }) => {
      Given('patterns where some reference PDR-012 in descriptions', () => {
        state = initState();
        state.patterns = [
          createTestPattern({
            name: 'PatternWithPDR',
            description: 'See PDR-012 for rationale.',
          }),
          createTestPattern({
            name: 'PatternWithout',
            description: 'No decision references here.',
          }),
          createTestPattern({
            name: 'PatternWithSeeAlso',
            description: 'Another pattern.',
            seeAlso: ['PDR-012-related'],
          }),
        ];
      });

      When('finding PDR references for "012"', () => {
        state!.pdrRefs = findPdrReferences(state!.patterns, '012');
      });

      Then('the referencing patterns are returned with source locations', () => {
        // Expect exactly 2: one from description, one from seeAlso
        expect(state!.pdrRefs.length).toBe(2);
        const descRef = state!.pdrRefs.find(
          (r) => r.pattern === 'PatternWithPDR' && r.source === 'description'
        );
        expect(descRef).toBeDefined();
        const seeAlsoRef = state!.pdrRefs.find(
          (r) => r.pattern === 'PatternWithSeeAlso' && r.source === 'seeAlso'
        );
        expect(seeAlsoRef).toBeDefined();
      });
    });

    RuleScenario('No references returns empty result', ({ Given, When, Then }) => {
      Given('patterns that do not reference PDR-999', () => {
        state = initState();
        state.patterns = [createTestPattern({ name: 'SomePattern', description: 'No PDR here.' })];
      });

      When('finding PDR references for "999"', () => {
        state!.pdrRefs = findPdrReferences(state!.patterns, '999');
      });

      Then('the result is empty', () => {
        expect(state!.pdrRefs).toHaveLength(0);
      });
    });
  });
});
