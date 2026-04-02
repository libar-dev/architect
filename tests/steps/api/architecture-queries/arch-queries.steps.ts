/**
 * Architecture Queries Step Definitions
 *
 * Tests for computeNeighborhood(), compareContexts(), aggregateTagUsage(),
 * buildSourceInventory(), and findUnusedTaxonomy().
 */

import { loadFeature, describeFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';
import {
  computeNeighborhood,
  compareContexts,
  aggregateTagUsage,
  buildSourceInventory,
  type NeighborhoodResult,
  type ContextComparison,
  type TagUsageReport,
  type SourceInventory,
} from '../../../../src/api/arch-queries.js';
import {
  findUnusedTaxonomy,
  type UnusedTaxonomyReport,
} from '../../../../src/api/coverage-analyzer.js';
import type { RuntimePatternGraph } from '../../../../src/generators/pipeline/transform-types.js';
import type { ExtractedPattern } from '../../../../src/validation-schemas/index.js';
import {
  createTestPattern,
  createTestPatternGraph,
  resetPatternCounter,
} from '../../../fixtures/dataset-factories.js';

const feature = await loadFeature('tests/features/api/architecture-queries/arch-queries.feature');

// =============================================================================
// Test State
// =============================================================================

interface TestState {
  dataset: RuntimePatternGraph | null;
  patterns: ExtractedPattern[];
  neighborhood: NeighborhoodResult | undefined;
  comparison: ContextComparison | undefined;
  tagReport: TagUsageReport | null;
  sourceInventory: SourceInventory | null;
  unusedTaxonomy: UnusedTaxonomyReport | null;
}

let state: TestState | null = null;

function initState(): TestState {
  resetPatternCounter();
  return {
    dataset: null,
    patterns: [],
    neighborhood: undefined,
    comparison: undefined,
    tagReport: null,
    sourceInventory: null,
    unusedTaxonomy: null,
  };
}

function buildDataset(): void {
  if (state === null) return;
  state.dataset = createTestPatternGraph({ patterns: state.patterns });
}

// =============================================================================
// Feature
// =============================================================================

describeFeature(feature, ({ Rule }) => {
  // ===========================================================================
  // Rule 1: Neighborhood and comparison views
  // ===========================================================================

  Rule('Neighborhood and comparison views', ({ RuleScenario }) => {
    // -------------------------------------------------------------------------
    // Scenario: Pattern neighborhood shows direct connections
    // -------------------------------------------------------------------------
    RuleScenario('Pattern neighborhood shows direct connections', ({ Given, When, Then, And }) => {
      Given('a pattern "OrderSaga" in context "orders" with role "saga"', () => {
        state = initState();
        state.patterns.push(
          createTestPattern({
            name: 'OrderSaga',
            archContext: 'orders',
            archRole: 'saga',
            archLayer: 'domain',
            filePath: 'src/orders/order-saga.ts',
            uses: ['CommandBus', 'EventStore'],
            usedBy: ['SagaRouter'],
          })
        );
      });

      And('"OrderSaga" uses "CommandBus" and "EventStore"', () => {
        state!.patterns.push(
          createTestPattern({ name: 'CommandBus', filePath: 'src/infra/command-bus.ts' }),
          createTestPattern({ name: 'EventStore', filePath: 'src/infra/event-store.ts' })
        );
      });

      And('"OrderSaga" is used by "SagaRouter"', () => {
        state!.patterns.push(
          createTestPattern({
            name: 'SagaRouter',
            filePath: 'src/infra/saga-router.ts',
            uses: ['OrderSaga'],
          })
        );
      });

      And('a sibling "OrderProjection" in context "orders"', () => {
        state!.patterns.push(
          createTestPattern({
            name: 'OrderProjection',
            archContext: 'orders',
            archRole: 'projection',
            filePath: 'src/orders/order-projection.ts',
          })
        );
        buildDataset();
      });

      When('computing the neighborhood of "OrderSaga"', () => {
        state!.neighborhood = computeNeighborhood('OrderSaga', state!.dataset!);
      });

      Then('the neighborhood uses list contains "CommandBus" and "EventStore"', () => {
        const names = state!.neighborhood!.uses.map((n) => n.name);
        expect(names).toContain('CommandBus');
        expect(names).toContain('EventStore');
      });

      And('the neighborhood usedBy list contains "SagaRouter"', () => {
        const names = state!.neighborhood!.usedBy.map((n) => n.name);
        expect(names).toContain('SagaRouter');
      });

      And('the neighborhood sameContext list contains "OrderProjection"', () => {
        const names = state!.neighborhood!.sameContext.map((n) => n.name);
        expect(names).toContain('OrderProjection');
      });

      And('the neighborhood context is "orders"', () => {
        expect(state!.neighborhood!.context).toBe('orders');
      });

      And('the neighborhood role is "saga"', () => {
        expect(state!.neighborhood!.role).toBe('saga');
      });
    });

    // -------------------------------------------------------------------------
    // Scenario: Cross-context comparison
    // -------------------------------------------------------------------------
    RuleScenario(
      'Cross-context comparison shows shared and unique dependencies',
      ({ Given, When, Then, And }) => {
        Given('context "orders" with patterns "OrderSaga" and "OrderProjection"', () => {
          state = initState();
          state.patterns.push(
            createTestPattern({
              name: 'OrderSaga',
              archContext: 'orders',
              uses: ['EventStore'],
              filePath: 'src/orders/saga.ts',
            }),
            createTestPattern({
              name: 'OrderProjection',
              archContext: 'orders',
              uses: ['EventStore', 'ReadModel'],
              filePath: 'src/orders/projection.ts',
            })
          );
        });

        And('"OrderSaga" uses "EventStore"', () => {
          // Already set in uses above
        });

        And('"OrderProjection" uses "EventStore" and "ReadModel"', () => {
          // Already set in uses above
        });

        And('context "inventory" with patterns "StockChecker" and "StockProjection"', () => {
          state!.patterns.push(
            createTestPattern({
              name: 'StockChecker',
              archContext: 'inventory',
              uses: ['EventStore'],
              filePath: 'src/inventory/checker.ts',
            }),
            createTestPattern({
              name: 'StockProjection',
              archContext: 'inventory',
              uses: ['ReadModel', 'CacheLayer'],
              filePath: 'src/inventory/projection.ts',
            })
          );
        });

        And('"StockChecker" uses "EventStore"', () => {
          // Already set
        });

        And('"StockProjection" uses "ReadModel" and "CacheLayer"', () => {
          // Add shared deps as patterns so they exist in dataset
          state!.patterns.push(
            createTestPattern({ name: 'EventStore', filePath: 'src/infra/event-store.ts' }),
            createTestPattern({ name: 'ReadModel', filePath: 'src/infra/read-model.ts' }),
            createTestPattern({ name: 'CacheLayer', filePath: 'src/infra/cache.ts' })
          );
          buildDataset();
        });

        When('comparing contexts "orders" and "inventory"', () => {
          state!.comparison = compareContexts('orders', 'inventory', state!.dataset!);
        });

        Then('shared dependencies include "EventStore" and "ReadModel"', () => {
          expect(state!.comparison).toBeDefined();
          expect(state!.comparison!.sharedDependencies).toContain('EventStore');
          expect(state!.comparison!.sharedDependencies).toContain('ReadModel');
        });

        And('unique to "orders" is empty', () => {
          expect(state!.comparison!.uniqueToContext1).toHaveLength(0);
        });

        And('unique to "inventory" contains "CacheLayer"', () => {
          expect(state!.comparison!.uniqueToContext2).toContain('CacheLayer');
        });
      }
    );

    // -------------------------------------------------------------------------
    // Scenario: Nonexistent pattern
    // -------------------------------------------------------------------------
    RuleScenario(
      'Neighborhood for nonexistent pattern returns undefined',
      ({ Given, When, Then }) => {
        Given('a dataset with no pattern named "NonExistent"', () => {
          state = initState();
          state.patterns.push(createTestPattern({ name: 'SomePattern' }));
          buildDataset();
        });

        When('computing the neighborhood of "NonExistent"', () => {
          state!.neighborhood = computeNeighborhood('NonExistent', state!.dataset!);
        });

        Then('the neighborhood result is undefined', () => {
          expect(state!.neighborhood).toBeUndefined();
        });
      }
    );
  });

  // ===========================================================================
  // Rule 2: Taxonomy discovery via tags and sources
  // ===========================================================================

  Rule('Taxonomy discovery via tags and sources', ({ RuleScenario }) => {
    // -------------------------------------------------------------------------
    // Scenario: Tag aggregation
    // -------------------------------------------------------------------------
    RuleScenario('Tag aggregation counts values across patterns', ({ Given, When, Then, And }) => {
      Given('patterns with various statuses and categories', () => {
        state = initState();
        state.patterns.push(
          createTestPattern({ name: 'P1', status: 'completed', category: 'core' }),
          createTestPattern({ name: 'P2', status: 'completed', category: 'core' }),
          createTestPattern({ name: 'P3', status: 'active', category: 'saga' }),
          createTestPattern({ name: 'P4', status: 'roadmap', category: 'saga' }),
          createTestPattern({ name: 'P5', status: 'roadmap', category: 'projection' })
        );
        buildDataset();
      });

      When('aggregating tag usage', () => {
        state!.tagReport = aggregateTagUsage(state!.dataset!);
      });

      Then('the report shows status with correct value counts', () => {
        const statusEntry = state!.tagReport!.tags.find((t) => t.tag === 'status');
        expect(statusEntry).toBeDefined();
        const completedCount = statusEntry!.values!.find((v) => v.value === 'completed');
        expect(completedCount!.count).toBe(2);
        const roadmapCount = statusEntry!.values!.find((v) => v.value === 'roadmap');
        expect(roadmapCount!.count).toBe(2);
      });

      And('the report shows category with correct value counts', () => {
        const catEntry = state!.tagReport!.tags.find((t) => t.tag === 'category');
        expect(catEntry).toBeDefined();
        expect(catEntry!.count).toBe(5); // All patterns have a category
      });

      And('tags are sorted by count descending', () => {
        const counts = state!.tagReport!.tags.map((t) => t.count);
        for (let i = 1; i < counts.length; i++) {
          expect(counts[i]).toBeLessThanOrEqual(counts[i - 1]!);
        }
      });
    });

    // -------------------------------------------------------------------------
    // Scenario: Source inventory
    // -------------------------------------------------------------------------
    RuleScenario('Source inventory categorizes files by type', ({ Given, When, Then, And }) => {
      Given('patterns from TypeScript, Gherkin, and stub sources', () => {
        state = initState();
        state.patterns.push(
          createTestPattern({ name: 'TsPattern', filePath: 'src/core/handler.ts' }),
          createTestPattern({ name: 'FeaturePattern', filePath: 'specs/handler.feature' }),
          createTestPattern({
            name: 'StubPattern',
            filePath: 'architect/stubs/handler/stub.ts',
          })
        );
        buildDataset();
      });

      When('building source inventory', () => {
        state!.sourceInventory = buildSourceInventory(state!.dataset!);
      });

      Then('the inventory groups files by type', () => {
        expect(state!.sourceInventory!.types.length).toBeGreaterThanOrEqual(3);
        expect(state!.sourceInventory!.totalFiles).toBe(3);
      });

      And('TypeScript files are categorized as "TypeScript (annotated)"', () => {
        const ts = state!.sourceInventory!.types.find((t) => t.type === 'TypeScript (annotated)');
        expect(ts).toBeDefined();
        expect(ts!.count).toBe(1);
      });

      And('feature files are categorized as "Gherkin (features)"', () => {
        const gherkin = state!.sourceInventory!.types.find((t) => t.type === 'Gherkin (features)');
        expect(gherkin).toBeDefined();
        expect(gherkin!.count).toBe(1);
      });

      And('stub files are categorized as "Stubs"', () => {
        const stubs = state!.sourceInventory!.types.find((t) => t.type === 'Stubs');
        expect(stubs).toBeDefined();
        expect(stubs!.count).toBe(1);
      });
    });

    // -------------------------------------------------------------------------
    // Scenario: Empty tags
    // -------------------------------------------------------------------------
    RuleScenario('Tags with no patterns returns empty report', ({ Given, When, Then, And }) => {
      Given('an empty dataset', () => {
        state = initState();
        buildDataset();
      });

      When('aggregating tag usage', () => {
        state!.tagReport = aggregateTagUsage(state!.dataset!);
      });

      Then('the report has 0 pattern count', () => {
        expect(state!.tagReport!.patternCount).toBe(0);
      });

      And('no tag entries are listed', () => {
        expect(state!.tagReport!.tags).toHaveLength(0);
      });
    });
  });

  // ===========================================================================
  // Rule 3: Coverage analysis reports annotation completeness
  // ===========================================================================

  Rule('Coverage analysis reports annotation completeness', ({ RuleScenario }) => {
    // -------------------------------------------------------------------------
    // Scenario: Unused taxonomy detection
    // -------------------------------------------------------------------------
    RuleScenario('Unused taxonomy detection', ({ Given, When, Then, And }) => {
      Given('patterns using only some taxonomy values', () => {
        state = initState();
        // Only use 'saga' role and 'domain' layer — the others should be unused
        state.patterns.push(
          createTestPattern({ name: 'P1', archRole: 'saga', archLayer: 'domain' }),
          createTestPattern({ name: 'P2', archRole: 'saga', archLayer: 'domain' })
        );
        buildDataset();
      });

      When('computing unused taxonomy', () => {
        state!.unusedTaxonomy = findUnusedTaxonomy(state!.dataset!, state!.dataset!.tagRegistry);
      });

      Then('unused roles lists values defined but not applied', () => {
        // The registry defines many roles (bounded-context, command-handler, projection, etc.)
        // Only 'saga' is used, so others should be in unused
        expect(state!.unusedTaxonomy!.unusedRoles.length).toBeGreaterThan(0);
        expect(state!.unusedTaxonomy!.unusedRoles).not.toContain('saga');
      });

      And('unused layers lists values defined but not applied', () => {
        // Only 'domain' is used, so 'application' and 'infrastructure' should be unused
        expect(state!.unusedTaxonomy!.unusedLayers).toContain('application');
        expect(state!.unusedTaxonomy!.unusedLayers).toContain('infrastructure');
        expect(state!.unusedTaxonomy!.unusedLayers).not.toContain('domain');
      });
    });

    // -------------------------------------------------------------------------
    // Scenario: Integration points
    // -------------------------------------------------------------------------
    RuleScenario('Cross-context comparison with integration points', ({ Given, When, Then }) => {
      Given('"OrderSaga" in context "orders" uses "StockChecker" in context "inventory"', () => {
        state = initState();
        state.patterns.push(
          createTestPattern({
            name: 'OrderSaga',
            archContext: 'orders',
            uses: ['StockChecker'],
            filePath: 'src/orders/saga.ts',
          }),
          createTestPattern({
            name: 'StockChecker',
            archContext: 'inventory',
            filePath: 'src/inventory/checker.ts',
          })
        );
        buildDataset();
      });

      When('comparing contexts "orders" and "inventory"', () => {
        state!.comparison = compareContexts('orders', 'inventory', state!.dataset!);
      });

      Then(
        'integration points include a "uses" relationship from "OrderSaga" to "StockChecker"',
        () => {
          expect(state!.comparison).toBeDefined();
          const point = state!.comparison!.integrationPoints.find(
            (ip) => ip.from === 'OrderSaga' && ip.to === 'StockChecker'
          );
          expect(point).toBeDefined();
          expect(point!.relationship).toBe('uses');
          expect(point!.fromContext).toBe('orders');
          expect(point!.toContext).toBe('inventory');
        }
      );
    });

    // -------------------------------------------------------------------------
    // Scenario: Implements relationships in neighborhood
    // -------------------------------------------------------------------------
    RuleScenario('Neighborhood includes implements relationships', ({ Given, When, Then }) => {
      Given('"OrderHandler" implements "OrderSaga"', () => {
        state = initState();
        state.patterns.push(
          createTestPattern({
            name: 'OrderSaga',
            archContext: 'orders',
            filePath: 'src/orders/saga.ts',
          }),
          createTestPattern({
            name: 'OrderHandler',
            implementsPatterns: ['OrderSaga'],
            filePath: 'src/orders/handler.ts',
          })
        );
        buildDataset();
      });

      When('computing the neighborhood of "OrderSaga"', () => {
        state!.neighborhood = computeNeighborhood('OrderSaga', state!.dataset!);
      });

      Then('the neighborhood implementedBy list contains "OrderHandler"', () => {
        expect(state!.neighborhood).toBeDefined();
        expect(state!.neighborhood!.implementedBy).toContain('OrderHandler');
      });
    });

    // -------------------------------------------------------------------------
    // Scenario: dependsOn and enables in neighborhood
    // -------------------------------------------------------------------------
    RuleScenario(
      'Neighborhood includes dependsOn and enables relationships',
      ({ Given, And, When, Then }) => {
        Given(
          'a pattern {string} that depends on {string}',
          (_ctx: unknown, name: string, dep: string) => {
            state = initState();
            state.patterns.push(
              createTestPattern({
                name,
                filePath: `src/${name.toLowerCase()}.ts`,
                dependsOn: [dep],
              }),
              createTestPattern({
                name: dep,
                filePath: `src/${dep.toLowerCase()}.ts`,
              })
            );
          }
        );

        And('{string} enables {string} via reverse computation', () => {
          // Reverse computation happens in createTestPatternGraph -> transformToPatternGraph
          buildDataset();
        });

        When('computing the neighborhood of {string}', (_ctx: unknown, name: string) => {
          state!.neighborhood = computeNeighborhood(name, state!.dataset!);
        });

        Then('the neighborhood dependsOn list contains {string}', (_ctx: unknown, dep: string) => {
          expect(state!.neighborhood).toBeDefined();
          expect(state!.neighborhood!.dependsOn.map((n) => n.name)).toContain(dep);
        });

        And(
          'the neighborhood enables list for {string} contains {string}',
          (_ctx: unknown, target: string, enabled: string) => {
            // Compute neighborhood for the target pattern to check enables
            const targetNeighborhood = computeNeighborhood(target, state!.dataset!);
            expect(targetNeighborhood).toBeDefined();
            expect(targetNeighborhood!.enables.map((n) => n.name)).toContain(enabled);
          }
        );
      }
    );
  });
});
