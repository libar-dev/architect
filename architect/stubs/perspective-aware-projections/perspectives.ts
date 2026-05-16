/**
 * @architect
 * @architect-pattern PerspectiveDefinitions
 * @architect-status roadmap
 * @architect-implements PerspectiveAwareProjections
 * @architect-target src/api/perspectives.ts
 * @architect-product-area:DataAPI
 * @architect-uses EnforcementConfiguration
 *
 * ## PerspectiveAwareProjections -- Perspective Definitions and API Methods
 *
 * Defines 5 named perspectives that filter PatternGraph patterns for different
 * consumer needs. Each perspective is a predicate function on ExtractedPattern.
 * Pre-filtered API methods use these perspectives for O(1) access.
 *
 * ### Design Decisions
 * AD-1: Perspectives are predicate functions on ExtractedPattern, not separate
 *   data structures -- this keeps the PatternGraph as the single read model
 *   (ADR-006) while providing filtered access.
 * AD-2: Pre-computed perspective views populated during the single-pass
 *   transform avoid filtering on every API call -- O(1) lookups via
 *   byPerspective[name].
 * AD-3: Codec default perspectives are configured in a static map, not per-
 *   codec instance -- this makes defaults discoverable and overridable.
 *
 * ### When to Use
 * - PatternGraphAPI: new methods (getDeliveryPatterns, getCandidates, etc.)
 * - Codecs: apply default perspective before decoding
 * - MCP/CLI: expose --perspective parameter that maps to a named perspective
 * - Transform pipeline: populate byPerspective views during single-pass
 *
 * See ADR-007: architect/decisions/adr-007-coordinated-taxonomy-redesign.feature
 * See: architect/specs/perspective-aware-projections.feature Rules 1, 4
 */

import type { ExtractedPattern } from '../../../../architect-core/src/validation-schemas/extracted-pattern.js';
import type { MaturityLevel } from '../../../../architect-core/src/taxonomy/maturity-values.js';

// ---------------------------------------------------------------------------
// Perspective Names
// ---------------------------------------------------------------------------

/**
 * Named perspectives for PatternGraph filtering.
 * Each maps to a predicate function with defined inclusion criteria.
 */
export declare type PerspectiveName =
  | 'delivery' // Non-candidate patterns (stakeholder progress)
  | 'architectural-review' // Design+ maturity patterns (real architecture)
  | 'planning' // Everything (full picture)
  | 'implementation-queue' // Design-ready + active (actionable work)
  | 'idea-triage'; // Candidates only (exploration inbox)

// ---------------------------------------------------------------------------
// Perspective API Methods (new on PatternGraphAPI)
// ---------------------------------------------------------------------------

/**
 * Get all non-candidate patterns (delivery perspective).
 * Excludes patterns with status:candidate.
 */
export declare function getDeliveryPatterns(): readonly ExtractedPattern[];

/**
 * Get candidate patterns only (idea-triage perspective).
 */
export declare function getCandidates(): readonly ExtractedPattern[];

/**
 * Get patterns with design+ maturity (architectural-review perspective).
 * Includes: active + completed + roadmap with design maturity.
 * Excludes: plan-level, idea-level, candidates.
 */
export declare function getArchitecturalPatterns(): readonly ExtractedPattern[];

/**
 * Get implementable patterns (implementation-queue perspective).
 * Includes: roadmap with design maturity (and deps ready) + active.
 * Excludes: plan-level, candidates, completed.
 *
 * "Deps ready" means all patterns in @architect-depends-on have status
 * active or completed. Patterns with no dependencies are deps-ready.
 */
export declare function getImplementablePatterns(): readonly ExtractedPattern[];

/**
 * Filter patterns by maturity level.
 * @param level - One of: idea, plan, design, executable
 */
export declare function getPatternsByMaturity(level: MaturityLevel): readonly ExtractedPattern[];

/**
 * Get the distribution of patterns across maturity levels.
 * @returns Record mapping each MaturityLevel to its pattern count.
 */
export declare function getMaturityDistribution(): Record<MaturityLevel, number>;

// ---------------------------------------------------------------------------
// Codec Default Perspectives
// ---------------------------------------------------------------------------

/**
 * Maps codec names to their default perspective.
 * Codecs use these defaults unless overridden via options.
 */
export declare const DEFAULT_CODEC_PERSPECTIVES: Readonly<Record<string, PerspectiveName>>;
// Values: {
//   overview: 'delivery',
//   patterns: 'planning',
//   architecture: 'architectural-review',
//   'business-rules': 'architectural-review',
//   timeline: 'delivery',
//   planning: 'planning',
//   session: 'delivery',
// }
