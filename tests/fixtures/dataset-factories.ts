/**
 * MasterDataset Factory Utilities for Testing
 *
 * Provides convenient factories for creating MasterDataset objects
 * for use in Gherkin step definitions and unit tests. These factories
 * wrap the pattern factories and transformToMasterDataset to produce
 * fully-formed datasets with all pre-computed views.
 *
 * @libar-docs
 */

import type { ExtractedPattern } from "../../src/validation-schemas/index.js";
import type { StatusCounts } from "../../src/validation-schemas/master-dataset.js";
import type { RuntimeMasterDataset } from "../../src/generators/pipeline/transform-dataset.js";

import { transformToMasterDataset } from "../../src/generators/pipeline/transform-dataset.js";
import { createDefaultTagRegistry } from "../../src/validation-schemas/tag-registry.js";
import {
  createTestPattern,
  createTestPatternSet,
  createDependencyGraph,
  createRoadmapPatterns,
  createTimelinePatterns,
  resetPatternCounter,
  type TestPatternOptions,
  type PatternSetOptions,
} from "./pattern-factories.js";

// ============================================================================
// Types
// ============================================================================

/**
 * Options for creating a test MasterDataset
 */
export interface TestMasterDatasetOptions {
  /**
   * Pre-built patterns to use (bypasses pattern generation)
   * If provided, all other pattern-generation options are ignored.
   */
  patterns?: ExtractedPattern[];

  /**
   * Number of patterns to generate (if patterns not provided)
   * @default 0
   */
  patternCount?: number;

  /**
   * Categories to distribute patterns across
   * @default ["core"]
   */
  categories?: string[];

  /**
   * Include relationship data (uses/usedBy/dependsOn/enables)
   * @default false
   */
  withRelationships?: boolean;

  /**
   * Include timeline metadata (phase, quarter, completed, deliverables)
   * @default false
   */
  withTimeline?: boolean;

  /**
   * Include roadmap phases
   * @default false
   */
  withRoadmap?: boolean;

  /**
   * Specific status distribution { completed: N, active: N, planned: N }
   * If total < patternCount, remaining patterns are "planned"
   */
  statusDistribution?: Partial<StatusCounts>;
}

// ============================================================================
// Primary Factory
// ============================================================================

/**
 * Create a test MasterDataset with all pre-computed views
 *
 * This is the primary factory for creating test datasets. It wraps pattern
 * generation and transformation into a single convenient call.
 *
 * @param options - Configuration for the dataset
 * @returns Fully-formed MasterDataset with all views computed
 *
 * @example
 * ```typescript
 * // Empty dataset
 * const empty = createTestMasterDataset();
 *
 * // Dataset with 10 patterns across 3 categories
 * const dataset = createTestMasterDataset({
 *   patternCount: 10,
 *   categories: ["core", "ddd", "saga"],
 * });
 *
 * // Dataset with specific status distribution
 * const mixed = createTestMasterDataset({
 *   statusDistribution: { completed: 5, active: 3, planned: 2 },
 * });
 *
 * // Dataset with relationships for dependency graph testing
 * const withDeps = createTestMasterDataset({
 *   withRelationships: true,
 * });
 * ```
 */
export function createTestMasterDataset(
  options: TestMasterDatasetOptions = {}
): RuntimeMasterDataset {
  const {
    patterns: providedPatterns,
    patternCount = 0,
    categories = ["core"],
    withRelationships = false,
    withTimeline = false,
    withRoadmap = false,
    statusDistribution,
  } = options;

  let patterns: ExtractedPattern[];

  if (providedPatterns) {
    // Use provided patterns directly
    patterns = providedPatterns;
  } else if (statusDistribution) {
    // Generate patterns with specific status distribution
    patterns = createPatternsWithStatusDistribution(statusDistribution, categories);
  } else if (withRelationships) {
    // Use dependency graph patterns
    patterns = createDependencyGraph();
  } else if (withTimeline) {
    // Use timeline patterns (with deliverables, quarters, etc.)
    patterns = createTimelinePatterns();
  } else if (withRoadmap) {
    // Use roadmap patterns (with phases, dependencies)
    patterns = createRoadmapPatterns();
  } else if (patternCount > 0) {
    // Generate specified number of patterns
    const patternsPerCategory = Math.ceil(patternCount / categories.length);
    patterns = createTestPatternSet({
      categories,
      patternsPerCategory,
      stable: true, // Use stable IDs for predictable tests
    }).slice(0, patternCount); // Trim to exact count
  } else {
    // Empty dataset
    patterns = [];
  }

  return transformToMasterDataset({
    patterns,
    tagRegistry: createDefaultTagRegistry(),
    workflow: undefined,
  });
}

// ============================================================================
// Specialized Factories
// ============================================================================

/**
 * Create an empty MasterDataset
 *
 * Useful for testing edge cases where no patterns exist.
 *
 * @returns MasterDataset with all counts at 0 and empty views
 */
export function createEmptyMasterDataset(): RuntimeMasterDataset {
  return createTestMasterDataset();
}

/**
 * Create a MasterDataset with specific status counts
 *
 * Generates patterns to match the specified status distribution.
 *
 * @param counts - Status counts to achieve
 * @returns MasterDataset with specified status distribution
 *
 * @example
 * ```typescript
 * const dataset = createMasterDatasetWithStatus({
 *   completed: 5,
 *   active: 3,
 *   planned: 2,
 * });
 *
 * expect(dataset.counts.completed).toBe(5);
 * expect(dataset.counts.active).toBe(3);
 * expect(dataset.counts.planned).toBe(2);
 * expect(dataset.counts.total).toBe(10);
 * ```
 */
export function createMasterDatasetWithStatus(counts: Partial<StatusCounts>): RuntimeMasterDataset {
  return createTestMasterDataset({
    statusDistribution: counts,
  });
}

/**
 * Create a MasterDataset with relationship data
 *
 * Uses the diamond dependency graph for testing dependency-related features.
 *
 * @returns MasterDataset with 4 patterns in a diamond dependency structure
 */
export function createMasterDatasetWithRelationships(): RuntimeMasterDataset {
  return createTestMasterDataset({ withRelationships: true });
}

/**
 * Create a MasterDataset with timeline metadata
 *
 * Includes patterns with phases, quarters, completion dates, and deliverables.
 *
 * @returns MasterDataset with timeline-enriched patterns
 */
export function createMasterDatasetWithTimeline(): RuntimeMasterDataset {
  return createTestMasterDataset({ withTimeline: true });
}

/**
 * Create a MasterDataset with roadmap phases
 *
 * Includes patterns across multiple phases with dependencies.
 *
 * @returns MasterDataset with phase-structured patterns
 */
export function createMasterDatasetWithRoadmap(): RuntimeMasterDataset {
  return createTestMasterDataset({ withRoadmap: true });
}

/**
 * Create a MasterDataset with patterns in specific categories
 *
 * @param categories - Categories to include (e.g., ["core", "ddd", "saga"])
 * @param patternsPerCategory - Number of patterns per category
 * @returns MasterDataset with patterns distributed across categories
 *
 * @example
 * ```typescript
 * const dataset = createMasterDatasetWithCategories(
 *   ["core", "ddd", "saga"],
 *   2
 * );
 *
 * expect(dataset.categoryCount).toBe(3);
 * expect(Object.keys(dataset.byCategory)).toEqual(["core", "ddd", "saga"]);
 * ```
 */
export function createMasterDatasetWithCategories(
  categories: string[],
  patternsPerCategory = 2
): RuntimeMasterDataset {
  const patterns = createTestPatternSet({
    categories,
    patternsPerCategory,
    stable: true,
  });

  return createTestMasterDataset({ patterns });
}

/**
 * Create a MasterDataset with ADR patterns
 *
 * @param count - Number of ADR patterns to create
 * @returns MasterDataset with ADR-tagged patterns
 */
export function createMasterDatasetWithADRs(count = 3): RuntimeMasterDataset {
  const patterns: ExtractedPattern[] = [];

  for (let i = 1; i <= count; i++) {
    patterns.push(
      createTestPattern({
        id: `pattern-ad2${String(i).padStart(5, "0")}`,
        name: `ADR-${String(i).padStart(3, "0")}: Decision ${i}`,
        category: "decision",
        status: i <= count / 2 ? "completed" : "active",
        // ADR-specific fields would go in the directive metadata
      })
    );
  }

  return createTestMasterDataset({ patterns });
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create patterns with a specific status distribution
 *
 * @param counts - Desired status counts
 * @param categories - Categories to distribute patterns across
 * @returns Array of patterns matching the distribution
 */
/**
 * Generate a valid pattern ID matching /^pattern-[a-f0-9]{8}$/
 *
 * @param index - Unique index for the pattern
 * @returns Valid pattern ID string
 */
function generateValidPatternId(index: number): string {
  return `pattern-${index.toString(16).padStart(8, "0")}`;
}

function createPatternsWithStatusDistribution(
  counts: Partial<StatusCounts>,
  categories: string[]
): ExtractedPattern[] {
  const { completed = 0, active = 0, planned = 0 } = counts;
  const patterns: ExtractedPattern[] = [];
  let patternIndex = 0;

  // Helper to get next category in round-robin
  const getCategory = () => categories[patternIndex % categories.length];

  // Create completed patterns
  for (let i = 0; i < completed; i++) {
    patternIndex++;
    patterns.push(
      createTestPattern({
        id: generateValidPatternId(patternIndex),
        name: `Completed Pattern ${i + 1}`,
        category: getCategory(),
        status: "completed",
      })
    );
  }

  // Create active patterns
  for (let i = 0; i < active; i++) {
    patternIndex++;
    patterns.push(
      createTestPattern({
        id: generateValidPatternId(patternIndex),
        name: `Active Pattern ${i + 1}`,
        category: getCategory(),
        status: "active",
      })
    );
  }

  // Create planned patterns
  for (let i = 0; i < planned; i++) {
    patternIndex++;
    patterns.push(
      createTestPattern({
        id: generateValidPatternId(patternIndex),
        name: `Planned Pattern ${i + 1}`,
        category: getCategory(),
        status: "roadmap",
      })
    );
  }

  return patterns;
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export {
  // From pattern-factories.ts - for direct pattern creation
  createTestPattern,
  createTestPatternSet,
  createDependencyGraph,
  createRoadmapPatterns,
  createTimelinePatterns,
  resetPatternCounter,
  // Types
  type TestPatternOptions,
  type PatternSetOptions,
};

// Re-export TagRegistry factory for tests that need custom registries
export { createDefaultTagRegistry } from "../../src/validation-schemas/tag-registry.js";
