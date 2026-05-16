/**
 * @architect
 * @architect-pattern PerspectiveViews
 * @architect-status roadmap
 * @architect-implements PerspectiveAwareProjections
 * @architect-target src/generators/pipeline/transform-dataset.ts
 * @architect-product-area:DataAPI
 * @architect-uses EnforcementConfiguration
 *
 * ## PerspectiveAwareProjections -- Pre-Computed Perspective Views
 *
 * Adds byPerspective pre-computed view to the PatternGraph, following the same
 * pattern as byStatus and byMaturity. Each perspective key maps to a filtered
 * array of ExtractedPattern populated during the single-pass transform.
 *
 * ### Design Decisions
 * AD-1: Perspective views are Record<PerspectiveName, ExtractedPattern[]>,
 *   following the same shape as byStatus (Record<string, ExtractedPattern[]>)
 *   and byMaturity (Record<string, ExtractedPattern[]>).
 * AD-2: Views are populated during the single-pass transform in
 *   transformToPatternGraph(). Each pattern is evaluated against all 5
 *   perspective predicates and added to matching perspective arrays.
 *   This is O(n * 5) = O(n) since 5 is constant.
 * AD-3: The 5 perspective keys match PerspectiveName type from perspectives.ts:
 *   delivery, architectural-review, planning, implementation-queue, idea-triage.
 * AD-4: implementation-queue perspective requires dependency readiness check.
 *   During transform, the pattern's dependsOn field is resolved against
 *   byName map to check if all dependencies have status active or completed.
 *   Patterns with no dependencies are always implementation-queue eligible.
 *
 * ### When to Use
 * - transform-dataset.ts: populate during transformToPatternGraph()
 * - pattern-graph-api.ts: expose via getDeliveryPatterns(), getCandidates(), etc.
 * - Codecs: use byPerspective[defaultPerspective] instead of filtering at render time
 *
 * See ADR-007: architect/decisions/adr-007-coordinated-taxonomy-redesign.feature
 * See: architect/specs/perspective-aware-projections.feature Rules 1, 4
 */

import type { ExtractedPattern } from '../../../../architect-core/src/validation-schemas/extracted-pattern.js';
import type { PerspectiveName } from './perspectives.js';

// ---------------------------------------------------------------------------
// Perspective Views Type
// ---------------------------------------------------------------------------

/**
 * Pre-computed views of patterns grouped by perspective.
 * Each key maps to a filtered array populated during the single-pass transform.
 *
 * Added to RuntimePatternGraph as `byPerspective: PerspectiveViews`.
 * Follows the same pattern as `byStatus: StatusGroups` and
 * `byMaturity: Record<string, ExtractedPattern[]>`.
 */
export declare type PerspectiveViews = Readonly<
  Record<PerspectiveName, readonly ExtractedPattern[]>
>;

// ---------------------------------------------------------------------------
// Transform-Time Population
// ---------------------------------------------------------------------------

/**
 * Populate perspective views from the full pattern set during the single-pass
 * transform. Evaluates each pattern against all 5 perspective predicates
 * and adds it to matching arrays.
 *
 * The byName map is required for the implementation-queue perspective's
 * dependency readiness check (isDepsReady).
 *
 * @param patterns - All extracted patterns from the transform pipeline
 * @param byName - Map of pattern name to ExtractedPattern for O(1) dep lookups
 * @returns PerspectiveViews with all 5 perspective arrays populated
 *
 * @example
 * ```typescript
 * // Inside transformToPatternGraph(), after the single-pass loop:
 * const byName = new Map(patterns.map(p => [getPatternName(p), p]));
 * const byPerspective = populatePerspectiveViews(patterns, byName);
 * ```
 */
export declare function populatePerspectiveViews(
  patterns: readonly ExtractedPattern[],
  byName: ReadonlyMap<string, ExtractedPattern>
): PerspectiveViews;

// ---------------------------------------------------------------------------
// Perspective Predicates
// ---------------------------------------------------------------------------

/**
 * Delivery perspective predicate: pattern is not a candidate.
 * Includes: roadmap, active, completed, deferred.
 * Excludes: candidate.
 *
 * Used by getDeliveryPatterns() and completion percentage calculation.
 */
export declare function isDeliveryPattern(pattern: ExtractedPattern): boolean;

/**
 * Architectural-review perspective predicate: pattern has design+
 * maturity level. Includes active and completed patterns, plus roadmap
 * patterns with design maturity. Excludes plan-level, idea-level,
 * and candidates.
 *
 * Used by getArchitecturalPatterns() for real architecture state.
 */
export declare function isArchitecturalPattern(pattern: ExtractedPattern): boolean;

/**
 * Implementation-queue perspective predicate: pattern is actionable work.
 * Includes roadmap patterns with design maturity (and deps ready) plus
 * active patterns. Excludes plan-level, candidates, and completed.
 *
 * Requires the byName map for dependency readiness check via isDepsReady().
 *
 * Used by getImplementablePatterns() for "what to work on next" queries.
 */
export declare function isImplementable(
  pattern: ExtractedPattern,
  byName: ReadonlyMap<string, ExtractedPattern>
): boolean;

// ---------------------------------------------------------------------------
// Dependency Readiness Helper
// ---------------------------------------------------------------------------

/**
 * Check if all dependencies of a pattern are ready (active or completed).
 *
 * "Deps ready" means every pattern name in the dependsOn array resolves
 * to a pattern with status 'active' or 'completed' in the byName map.
 * Patterns with empty or undefined dependsOn are always deps-ready.
 * Unresolvable dependency names (not found in byName) are treated as
 * not ready -- this prevents false positives from dangling references.
 *
 * @param dependsOn - Array of pattern names from the pattern's dependsOn field
 * @param byName - Map of pattern name to ExtractedPattern for O(1) lookups
 * @returns true if all dependencies have status active or completed
 */
export declare function isDepsReady(
  dependsOn: readonly string[] | undefined,
  byName: ReadonlyMap<string, ExtractedPattern>
): boolean;
