/**
 * @architect
 * @architect-validation
 * @architect-pattern DoDValidationTypes
 * @architect-status completed
 * @architect-used-by DoDValidator, AntiPatternDetector
 * @architect-extract-shapes AntiPatternId, AntiPatternViolation, AntiPatternThresholds, AntiPatternThresholdsSchema, DEFAULT_THRESHOLDS, DoDValidationResult, DoDValidationSummary, getPhaseStatusEmoji, WithTagRegistry
 *
 * ## DoDValidationTypes - Type Definitions for DoD Validation
 *
 * Types and schemas for Definition of Done (DoD) validation and anti-pattern detection.
 * Follows the project's schema-first pattern with Zod for runtime validation.
 *
 * ### When to Use
 *
 * - When implementing DoD validation logic
 * - When extending anti-pattern detection rules
 * - When consuming validation results in CLI or reports
 */

import { z } from 'zod';
import type { Deliverable } from '../validation-schemas/dual-source.js';
import type { TagRegistry } from '../validation-schemas/tag-registry.js';

// ============================================================================
// Common Options Interfaces
// ============================================================================

/**
 * Base interface for options that accept a TagRegistry for prefix-aware behavior.
 *
 * Many validation functions need to be aware of the configured tag prefix
 * (e.g., "@architect-" vs "@acme-"). This interface provides a consistent
 * way to pass that configuration.
 *
 * ### When to Use
 *
 * Extend this interface when creating options for functions that:
 * - Generate error messages referencing tag names
 * - Detect tags in source code
 * - Validate tag formats
 *
 * @example
 * ```typescript
 * export interface MyValidationOptions extends WithTagRegistry {
 *   readonly strict?: boolean;
 * }
 * ```
 */
export interface WithTagRegistry {
  /** Tag registry for prefix-aware behavior (defaults to @architect- if not provided) */
  readonly registry?: TagRegistry;
}

// ============================================================================
// Anti-Pattern Detection Types
// ============================================================================

/**
 * Anti-pattern rule identifiers
 *
 * Each ID corresponds to a specific violation of the dual-source
 * documentation architecture or process hygiene.
 */
export type AntiPatternId =
  | 'tag-duplication' // Dependencies in features (should be code-only)
  | 'process-in-code' // Process metadata in code (should be features-only)
  | 'magic-comments' // Generator hints in features
  | 'scenario-bloat' // Too many scenarios per feature
  | 'mega-feature'; // Feature file too large

/**
 * Zod schema for anti-pattern thresholds
 *
 * Configurable limits for detecting anti-patterns.
 */
export const AntiPatternThresholdsSchema = z.object({
  /** Maximum scenarios per feature file before warning */
  scenarioBloatThreshold: z.number().int().positive().default(30),
  /** Maximum lines per feature file before warning */
  megaFeatureLineThreshold: z.number().int().positive().default(750),
  /** Maximum magic comments before warning */
  magicCommentThreshold: z.number().int().positive().default(5),
});

export type AntiPatternThresholds = z.infer<typeof AntiPatternThresholdsSchema>;

/**
 * Default thresholds for anti-pattern detection
 */
export const DEFAULT_THRESHOLDS: AntiPatternThresholds = {
  scenarioBloatThreshold: 30,
  megaFeatureLineThreshold: 750,
  magicCommentThreshold: 5,
};

/**
 * Anti-pattern detection result
 *
 * Reports a specific anti-pattern violation with context
 * for remediation.
 */
export interface AntiPatternViolation {
  /** Anti-pattern identifier */
  readonly id: AntiPatternId;
  /** Human-readable description */
  readonly message: string;
  /** File where violation was found */
  readonly file: string;
  /** Line number (if applicable) */
  readonly line?: number;
  /** Severity (error = architectural violation, warning = hygiene issue) */
  readonly severity: 'error' | 'warning';
  /** Fix guidance */
  readonly fix?: string;
}

/**
 * DoD validation result for a single phase/pattern
 *
 * Reports whether a completed phase meets Definition of Done criteria:
 * 1. All deliverables must have "complete" status
 * 2. At least one @acceptance-criteria scenario must exist
 */
export interface DoDValidationResult {
  /** Pattern name being validated */
  readonly patternName: string;
  /** Phase number being validated */
  readonly phase: number;
  /** True if all DoD criteria are met */
  readonly isDoDMet: boolean;
  /** All deliverables from Background table */
  readonly deliverables: readonly Deliverable[];
  /** Deliverables that are not yet complete */
  readonly incompleteDeliverables: readonly Deliverable[];
  /** True if no @acceptance-criteria scenarios found */
  readonly missingAcceptanceCriteria: boolean;
  /** Human-readable validation messages */
  readonly messages: readonly string[];
}

/**
 * Aggregate DoD validation summary
 *
 * Summarizes validation across multiple phases for CLI output.
 */
export interface DoDValidationSummary {
  /** Per-phase validation results */
  readonly results: readonly DoDValidationResult[];
  /** Total phases validated */
  readonly totalPhases: number;
  /** Phases that passed DoD */
  readonly passedPhases: number;
  /** Phases that failed DoD */
  readonly failedPhases: number;
}

/**
 * Get status emoji for phase-level aggregates.
 *
 * @param allComplete - Whether all patterns in the phase are complete
 * @param anyActive - Whether any patterns in the phase are active/in-progress
 * @returns Status emoji: ✅ if all complete, 🚧 if any active, 📋 otherwise
 */
export function getPhaseStatusEmoji(allComplete: boolean, anyActive: boolean): string {
  if (allComplete) return '✅';
  if (anyActive) return '🚧';
  return '📋';
}
