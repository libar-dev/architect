/**
 * @architect
 * @architect-pattern AntiPatternValidationTypes
 * @architect-validation
 * @architect-status completed
 * @architect-role:contract
 * @architect-bounded-context:validation
 *
 * ## AntiPatternValidationTypes - Type Definitions for Anti-Pattern Validation
 *
 * Types and schemas for the anti-pattern detection contract — violation
 * identifiers, thresholds, and result shapes. Follows the project's schema-first
 * pattern with Zod for runtime validation.
 *
 * ### When to Use
 *
 * - When extending anti-pattern detection rules
 * - When consuming validation results in CLI or reports
 */

import { z } from 'zod';
import type { TagRegistry } from '@libar-dev/architect-core';

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
 *
 * @architect-shape
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
 *
 * Compatibility note: the historical `tag-duplication` identifier is
 * intentionally not part of the split-package public contract because
 * `detectAntiPatterns()` does not emit it.
 *
 * @architect-shape
 */
export type AntiPatternId =
  | 'process-in-code' // Process metadata in code (should be features-only)
  | 'removed-tag' // Removed tag still present in source (silent data loss)
  | 'gherkin-tag-space-form' // Identity tag uses space-form on a .feature file; Gherkin requires colon form (silent data loss)
  | 'ts-missing-architect-marker' // Pattern JSDoc lacks a leading bare @architect (silent file skip)
  | 'ts-tags-after-prose' // Architect tags after description prose (silent tag drop)
  | 'ts-uses-space-form' // Multi-target TypeScript @architect-uses uses spaces instead of commas (silent node drop)
  | 'duplicate-pattern-identity' // Same @architect-pattern identity declared in >1 feature file (ADR-001)
  | 'magic-comments' // Generator hints in features
  | 'scenario-bloat' // Too many scenarios per feature
  | 'mega-feature'; // Feature file too large

/**
 * Zod schema for anti-pattern thresholds.
 *
 * Configurable limits for detecting anti-patterns.
 *
 * @architect-shape
 */
export const AntiPatternThresholdsSchema = z.strictObject({
  /** Maximum scenarios per feature file before warning */
  scenarioBloatThreshold: z.number().int().positive().default(30),
  /** Maximum lines per feature file before warning */
  megaFeatureLineThreshold: z.number().int().positive().default(750),
  /** Maximum magic comments before warning */
  magicCommentThreshold: z.number().int().positive().default(5),
});

export type AntiPatternThresholds = z.infer<typeof AntiPatternThresholdsSchema>;

/**
 * Default thresholds applied when none are supplied to anti-pattern detection.
 *
 * @architect-shape
 */
export const DEFAULT_THRESHOLDS: AntiPatternThresholds = {
  scenarioBloatThreshold: 30,
  megaFeatureLineThreshold: 750,
  magicCommentThreshold: 5,
};

/**
 * Anti-pattern detection result.
 *
 * Reports a specific anti-pattern violation with context
 * for remediation.
 *
 * @architect-shape
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
