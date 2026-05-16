/**
 * Pattern Factory Utilities for Testing
 *
 * Provides deterministic test data generators for ExtractedPattern
 * and related types. Used across unit, integration, and property tests.
 */

import type {
  ExtractedPattern,
  DocDirective,
  ExportInfo,
  DeliverableStatus,
  AcceptedStatusValue,
  MaturityLevel,
  BusinessRule,
  ExtractedShape,
  ScenarioRef,
} from '@libar-dev/architect-core';
import {
  asPatternId,
  asRoleName,
  asSourceFilePath,
  asDirectiveTag,
} from '@libar-dev/architect-core';

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Deliverable structure for timeline testing
 *
 * Matches the Deliverable type from dual-source.ts, with release
 * now tracked at the deliverable level (not pattern level).
 */
export interface TestDeliverable {
  name: string;
  status: DeliverableStatus;
  tests: number;
  location: string;
  finding?: string | undefined;
  /** Release version this deliverable belongs to (e.g., "v0.2.0") */
  release?: string | undefined;
}

/**
 * Options for creating a single test pattern
 */
export interface TestPatternOptions {
  /** Override pattern ID (default: auto-generated) */
  id?: string | undefined;
  /** Override pattern name (default: "Test Pattern") */
  name?: string | undefined;
  /** Optional explicit patternName field */
  patternName?: string | undefined;
  /** Override category (default: "core") */
  category?: string | undefined;
  /** Override canonical role (default: category) */
  role?: string | undefined;
  /** Override status (default: "completed") */
  status?: AcceptedStatusValue | undefined;
  /** Override unlock reason (default: none) */
  unlockReason?: string | undefined;
  /** Override maturity (default: inferred from status) */
  maturity?: MaturityLevel | undefined;
  /** Description text (default: generated) */
  description?: string | undefined;
  /** Source file path (default: generated) */
  filePath?: string | undefined;
  /** Source line numbers (default: [1, 10]) */
  lines?: readonly [number, number];
  /** Export information (default: single function export) */
  exports?: ExportInfo[] | undefined;
  /** Use cases (default: none) */
  useCases?: string[] | undefined;
  /** Scenarios (default: none) */
  scenarios?: readonly ScenarioRef[] | undefined;
  /** Uses relationships (default: none) */
  uses?: string[] | undefined;
  /** Used-by relationships (default: none) */
  usedBy?: string[] | undefined;
  /** Phase number (default: none) */
  phase?: number | undefined;
  /** When to use bullets (default: none) */
  whenToUse?: string[] | undefined;
  /** Depends on patterns (default: none) */
  dependsOn?: string[] | undefined;
  /** Enables patterns (default: none) */
  enables?: string[] | undefined;
  // Timeline-specific fields
  /** Completion date in YYYY-MM-DD format (default: none) */
  completed?: string | undefined;
  /** Quarter identifier like "Q1-2026" (default: none) */
  quarter?: string | undefined;
  /** Effort estimate like "2w", "3d", "1m" (default: none) */
  effort?: string | undefined;
  /** Team responsible (default: none) */
  team?: string | undefined;
  /** Deliverables list (default: none) */
  deliverables?: TestDeliverable[] | undefined;
  /** Workflow type for changelog mapping (default: none) */
  workflow?: string | undefined;
  /** Priority level for process tracking (default: none) */
  priority?: 'critical' | 'high' | 'medium' | 'low' | undefined;
  /** Hierarchy level for grouping (default: none) */
  level?: 'epic' | 'phase' | 'task' | undefined;
  /** Patterns this code implements (realization relationship, default: none) */
  implementsPatterns?: string[] | undefined;
  // Display and traceability fields
  /** Explicit human-readable title for display (default: none) */
  title?: string | undefined;
  /** Path to behavior file for traceability (default: none) */
  behaviorFile?: string | undefined;
  /** Executable spec file paths for traceability (default: none) */
  executableSpecs?: string[] | undefined;
  /** Whether the behavior file was verified to exist (default: none) */
  behaviorFileVerified?: boolean | undefined;
  // Discovery findings (from @discovered-* tags)
  /** Discovered gaps during implementation (default: none) */
  discoveredGaps?: string[] | undefined;
  /** Discovered improvements during implementation (default: none) */
  discoveredImprovements?: string[] | undefined;
  /** Discovered learnings during implementation (default: none) */
  discoveredLearnings?: string[] | undefined;
  /** Discovered risks during implementation (default: none) */
  discoveredRisks?: string[] | undefined;
  /** Business value statement (default: none) */
  businessValue?: string | undefined;
  /** Target implementation path for stub files (default: none) */
  targetPath?: string | undefined;
  /** Design session that created this pattern (default: none) */
  since?: string | undefined;
  /** Related patterns for cross-reference (default: none) */
  seeAlso?: string[] | undefined;
  // Architecture fields
  /** Architecture role (default: none) */
  archRole?: string | undefined;
  /** Architecture bounded context (default: none) */
  archContext?: string | undefined;
  /** Architecture layer (default: none) */
  archLayer?: string | undefined;
  /** Product area for PRD grouping (default: none) */
  productArea?: string | undefined;
  /** Cross-cutting include tags for content routing and diagram scoping (default: none) */
  include?: string[] | undefined;
  /** Convention domains for reference doc generation (default: none) */
  convention?: string[] | undefined;
  /** Business rules from Gherkin Rule: blocks (default: none) */
  rules?: BusinessRule[] | undefined;
  /** Extracted TypeScript shapes (default: none) */
  extractedShapes?: ExtractedShape[] | undefined;
}

/**
 * Options for creating a set of test patterns
 */
export interface PatternSetOptions {
  /** Use stable/deterministic IDs and timestamps (default: false) */
  stable?: boolean;
  /** Categories to create patterns for (default: ["core", "ddd"]) */
  categories?: string[];
  /** Number of patterns per category (default: 2) */
  patternsPerCategory?: number;
  /** Include relationship data (default: false) */
  withRelationships?: boolean;
  /** Include use case data (default: false) */
  withUseCases?: boolean;
  /** Include all optional features (default: false) */
  withAllFeatures?: boolean;
}

// ============================================================================
// Factory Functions
// ============================================================================

let patternCounter = 0;

/**
 * Create a single test pattern with optional overrides
 *
 * @example
 * ```typescript
 * // Default pattern
 * const pattern = createTestPattern();
 *
 * // Custom pattern
 * const customPattern = createTestPattern({
 *   name: "CommandOrchestrator",
 *   category: "core",
 *   useCases: ["When implementing a new command"],
 * });
 * ```
 */
export function createTestPattern(options: TestPatternOptions = {}): ExtractedPattern {
  patternCounter++;

  const {
    id = `pattern-${String(patternCounter).padStart(8, '0')}`,
    name = 'Test Pattern',
    patternName,
    category = 'core',
    role,
    status = 'completed',
    unlockReason,
    maturity,
    description = `Test description for ${name}.`,
    filePath = `packages/@libar-dev/platform-${category}/src/test.ts`,
    lines = [1, 10] as const,
    exports = [{ name: name.replace(/\s+/g, ''), type: 'function' as const }],
    useCases,
    scenarios,
    uses,
    usedBy,
    phase,
    whenToUse,
    dependsOn,
    enables,
    // Timeline-specific fields
    completed,
    quarter,
    effort,
    team,
    deliverables,
    workflow,
    priority,
    level,
    implementsPatterns,
    // Display and traceability fields
    title,
    behaviorFile,
    executableSpecs,
    behaviorFileVerified,
    // Discovery findings
    discoveredGaps,
    discoveredImprovements,
    discoveredLearnings,
    discoveredRisks,
    businessValue,
    // Stub metadata
    targetPath,
    since,
    seeAlso,
    // Architecture fields
    archRole,
    archContext,
    archLayer,
    productArea,
    include,
    // Convention and rules fields
    convention,
    rules,
    extractedShapes,
  } = options;

  // Wave 1 narrowed @architect-uses to declared-pattern targets and retired
  // @architect-depends-on / @architect-used-by / @architect-enables (used-by
  // and enables now derive from the inverse of `uses`). Tests that still
  // pass `dependsOn` are folded into `uses`; usedBy/enables are accepted
  // for backward-compat but no longer authored on the pattern.
  const mergedUses = [...(uses ?? []), ...(dependsOn ?? [])];

  const directive: DocDirective = {
    tags: [asDirectiveTag(`@architect-${category}`)],
    description,
    examples: [],
    position: { startLine: lines[0], endLine: lines[1] },
    ...(useCases && useCases.length > 0 ? { useCases } : {}),
    ...(mergedUses.length > 0 ? { uses: mergedUses } : {}),
    ...(phase !== undefined ? { phase } : {}),
    ...(whenToUse && whenToUse.length > 0 ? { whenToUse } : {}),
    ...(targetPath ? { target: targetPath } : {}),
    ...(since ? { since } : {}),
    ...(seeAlso && seeAlso.length > 0 ? { seeAlso } : {}),
    ...(executableSpecs && executableSpecs.length > 0 ? { executableSpecs } : {}),
  };

  // Wave 1: maturity, archContext, archLayer were retired from the schema
  // (maturity derives from status at projection time; arch* collapsed into
  // bounded-context). Options remain accepted for backward-compat but are
  // not spread onto the returned ExtractedPattern (schema is strictObject).
  void maturity;
  void archContext;
  void archLayer;
  void usedBy;
  void enables;

  return {
    id: asPatternId(id),
    name,
    role: asRoleName(role ?? archRole ?? category),
    status,
    ...(unlockReason ? { unlockReason } : {}),
    directive,
    code: `export function ${name.replace(/\s+/g, '')}() {}`,
    source: {
      file: asSourceFilePath(filePath),
      lines,
    },
    exports,
    extractedAt: new Date().toISOString(),
    patternName: patternName ?? name,
    ...(scenarios && scenarios.length > 0 ? { scenarios } : {}),
    ...(useCases && useCases.length > 0 ? { useCases } : {}),
    ...(mergedUses.length > 0 ? { uses: mergedUses } : {}),
    ...(phase !== undefined ? { phase } : {}),
    ...(whenToUse && whenToUse.length > 0 ? { whenToUse } : {}),
    // Timeline-specific fields
    ...(completed ? { completed } : {}),
    ...(quarter ? { quarter } : {}),
    ...(effort ? { effort } : {}),
    ...(team ? { team } : {}),
    // Deliverables with release tracking (release is at deliverable level, not pattern level)
    ...(deliverables && deliverables.length > 0 ? { deliverables } : {}),
    ...(workflow ? { workflow } : {}),
    ...(priority ? { priority } : {}),
    ...(level ? { level } : {}),
    ...(implementsPatterns && implementsPatterns.length > 0 ? { implementsPatterns } : {}),
    // Display and traceability fields
    ...(title ? { title } : {}),
    ...(behaviorFile ? { behaviorFile } : {}),
    ...(executableSpecs && executableSpecs.length > 0 ? { executableSpecs } : {}),
    ...(behaviorFileVerified !== undefined ? { behaviorFileVerified } : {}),
    // Discovery findings
    ...(discoveredGaps && discoveredGaps.length > 0 ? { discoveredGaps } : {}),
    ...(discoveredImprovements && discoveredImprovements.length > 0
      ? { discoveredImprovements }
      : {}),
    ...(discoveredLearnings && discoveredLearnings.length > 0 ? { discoveredLearnings } : {}),
    ...(discoveredRisks && discoveredRisks.length > 0 ? { discoveredRisks } : {}),
    ...(businessValue ? { businessValue } : {}),
    // Stub metadata
    ...(targetPath ? { targetPath } : {}),
    ...(since ? { since } : {}),
    ...(seeAlso && seeAlso.length > 0 ? { seeAlso } : {}),
    // Architecture fields — Wave 1 retired archContext/archLayer; the
    // options are accepted for backward-compat but no longer set on the
    // returned ExtractedPattern (schema is strictObject).
    ...(productArea ? { productArea } : {}),
    ...(include && include.length > 0 ? { include } : {}),
    // Convention and rules fields
    ...(convention && convention.length > 0 ? { convention } : {}),
    ...(rules && rules.length > 0 ? { rules } : {}),
    ...(extractedShapes && extractedShapes.length > 0 ? { extractedShapes } : {}),
  } as ExtractedPattern;
}

/**
 * Create a set of test patterns with configurable options
 *
 * @example
 * ```typescript
 * // Simple set
 * const patterns = createTestPatternSet({
 *   categories: ["ddd", "core"],
 *   patternsPerCategory: 3,
 * });
 *
 * // Full-featured set for comprehensive testing
 * const fullPatterns = createTestPatternSet({
 *   stable: true,
 *   withAllFeatures: true,
 *   categories: ["ddd", "core", "saga"],
 *   patternsPerCategory: 5,
 * });
 * ```
 */
export function createTestPatternSet(options: PatternSetOptions = {}): ExtractedPattern[] {
  const {
    stable = false,
    categories = ['core', 'ddd'],
    patternsPerCategory = 2,
    withRelationships = false,
    withUseCases = false,
    withAllFeatures = false,
  } = options;

  const patterns: ExtractedPattern[] = [];
  let patternIndex = 0;

  for (const category of categories) {
    for (let i = 0; i < patternsPerCategory; i++) {
      patternIndex++;

      // Stable mode uses deterministic IDs and timestamps
      const id = stable
        ? `pattern-${String(patternIndex).padStart(8, '0')}`
        : `pattern-${Math.random().toString(36).slice(2, 10)}`;

      const timestamp = stable ? '2024-01-01T00:00:00.000Z' : new Date().toISOString();

      const name = `${capitalize(category)} Pattern ${i + 1}`;
      const isFirstInCategory = i === 0;

      const patternOptions: TestPatternOptions = {
        id,
        name,
        category,
        status: isFirstInCategory ? 'completed' : 'active',
        description: `Description for ${category} pattern ${i + 1}. This pattern demonstrates best practices.`,
        filePath: `src/${category}/pattern-${i + 1}.ts`,
        lines: [10 * patternIndex, 10 * patternIndex + 5],
        exports: [{ name: name.replace(/\s+/g, ''), type: 'function' as const }],
      };

      // Add use cases
      if (withUseCases || withAllFeatures) {
        patternOptions.useCases = [
          `When implementing ${category} logic`,
          `When refactoring existing ${category} code`,
        ];
      }

      // Add relationships
      if (withRelationships || withAllFeatures) {
        if (i > 0) {
          patternOptions.uses = [`${capitalize(category)} Pattern ${i}`];
        }
        if (i < patternsPerCategory - 1) {
          patternOptions.usedBy = [`${capitalize(category)} Pattern ${i + 2}`];
        }
      }

      // Add all features
      if (withAllFeatures) {
        patternOptions.phase = Math.floor(i / 2) + 1;
        patternOptions.whenToUse = [
          `When you need ${category} functionality`,
          `When integrating with external systems`,
        ];
      }

      const pattern = createTestPattern(patternOptions);

      // Override extractedAt for stable mode
      if (stable) {
        (pattern as { extractedAt: string }).extractedAt = timestamp;
      }

      patterns.push(pattern);
    }
  }

  return patterns;
}

/**
 * Reset the pattern counter (useful between test suites)
 */
export function resetPatternCounter(): void {
  patternCounter = 0;
}

// ============================================================================
// Specialized Factories
// ============================================================================

/**
 * Create patterns with a complete dependency graph for testing relationships
 *
 * Creates a diamond dependency structure:
 * ```
 *        Top
 *       /   \
 *    Left   Right
 *       \   /
 *       Bottom
 * ```
 */
export function createDependencyGraph(): ExtractedPattern[] {
  return [
    createTestPattern({
      id: 'pattern-b0770000',
      name: 'Bottom Pattern',
      category: 'core',
      uses: [],
      usedBy: ['Left Pattern', 'Right Pattern'],
    }),
    createTestPattern({
      id: 'pattern-1ef70001',
      name: 'Left Pattern',
      category: 'ddd',
      uses: ['Bottom Pattern'],
      usedBy: ['Top Pattern'],
    }),
    createTestPattern({
      id: 'pattern-f1907002',
      name: 'Right Pattern',
      category: 'ddd',
      uses: ['Bottom Pattern'],
      usedBy: ['Top Pattern'],
    }),
    createTestPattern({
      id: 'pattern-70900003',
      name: 'Top Pattern',
      category: 'core',
      uses: ['Left Pattern', 'Right Pattern'],
      usedBy: [],
    }),
  ];
}

/**
 * Create patterns representing a multi-phase roadmap
 */
export function createRoadmapPatterns(): ExtractedPattern[] {
  return [
    createTestPattern({
      id: 'pattern-f0da0101',
      name: 'Foundation Types',
      category: 'core',
      status: 'completed',
      phase: 1,
    }),
    createTestPattern({
      id: 'pattern-ba5e0102',
      name: 'Base Utilities',
      category: 'core',
      status: 'completed',
      phase: 1,
    }),
    createTestPattern({
      id: 'pattern-d0da0201',
      name: 'Domain Model',
      category: 'ddd',
      status: 'active',
      phase: 2,
      dependsOn: ['Foundation Types'],
    }),
    createTestPattern({
      id: 'pattern-adff0301',
      name: 'Advanced Features',
      category: 'saga',
      status: 'roadmap',
      phase: 3,
      dependsOn: ['Domain Model', 'Base Utilities'],
    }),
  ];
}

/**
 * Create patterns with comprehensive use case coverage
 */
export function createUseCasePatterns(): ExtractedPattern[] {
  return [
    createTestPattern({
      id: 'pattern-c0a0d001',
      name: 'Command Handler',
      category: 'cqrs',
      useCases: [
        'When implementing a new command',
        'When adding validation logic',
        'When orchestrating multiple services',
      ],
      whenToUse: [
        'Complex business operations',
        'Operations that modify state',
        'Operations requiring transaction boundaries',
      ],
    }),
    createTestPattern({
      id: 'pattern-00e27002',
      name: 'Query Handler',
      category: 'cqrs',
      useCases: ['When implementing read operations', 'When optimizing for performance'],
      whenToUse: ['Read-only operations', 'Operations that benefit from caching'],
    }),
  ];
}

/**
 * Create patterns representing completed timeline milestones with deliverables
 *
 * Useful for testing:
 * - completed-phases section renderer
 * - timeline-summary section renderer
 * - Status filtering with timeline metadata
 */
export function createTimelinePatterns(): ExtractedPattern[] {
  return [
    createTestPattern({
      id: 'pattern-71a10001',
      name: 'Foundation Types',
      category: 'core',
      status: 'completed',
      phase: 1,
      completed: '2025-12-15',
      quarter: 'Q4-2025',
      effort: '2w',
      team: 'platform',
      deliverables: [
        { name: 'Decider interface', status: 'complete', tests: 1, location: 'src/decider/' },
        { name: 'FSM module', status: 'complete', tests: 1, location: 'src/fsm/' },
      ],
    }),
    createTestPattern({
      id: 'pattern-71a10002',
      name: 'CMS Integration',
      category: 'core',
      status: 'completed',
      phase: 2,
      completed: '2026-01-02',
      quarter: 'Q1-2026',
      effort: '1w',
      team: 'platform',
      deliverables: [{ name: 'CMS types', status: 'complete', tests: 1, location: 'src/cms/' }],
    }),
    createTestPattern({
      id: 'pattern-71a10003',
      name: 'Event Store Enhancement',
      category: 'event-sourcing',
      status: 'active',
      phase: 3,
      quarter: 'Q1-2026',
      effort: '3w',
      team: 'platform',
      dependsOn: ['Foundation Types', 'CMS Integration'],
    }),
    createTestPattern({
      id: 'pattern-71a10004',
      name: 'Advanced Projections',
      category: 'projection',
      status: 'roadmap',
      phase: 4,
      quarter: 'Q2-2026',
      effort: '2w',
      team: 'platform',
      dependsOn: ['Event Store Enhancement'],
    }),
  ];
}

// ============================================================================
// Utilities
// ============================================================================

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Merge multiple pattern arrays, deduplicating by ID
 */
export function mergePatterns(...patternSets: ExtractedPattern[][]): ExtractedPattern[] {
  const seen = new Set<string>();
  const result: ExtractedPattern[] = [];

  for (const patterns of patternSets) {
    for (const pattern of patterns) {
      if (!seen.has(pattern.id)) {
        seen.add(pattern.id);
        result.push(pattern);
      }
    }
  }

  return result;
}

/**
 * Filter patterns by category
 */
export function filterByCategory(
  patterns: ExtractedPattern[],
  category: string
): ExtractedPattern[] {
  return patterns.filter((p) => p.role === category);
}

/**
 * Get unique categories from patterns
 */
export function getCategories(patterns: ExtractedPattern[]): string[] {
  return [
    ...new Set(patterns.map((p) => p.role).filter((role): role is string => role !== undefined)),
  ].sort();
}
