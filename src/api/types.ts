/**
 * @libar-docs
 * @libar-docs-core
 * @libar-docs-pattern ProcessStateTypes
 * @libar-docs-status active
 * @libar-docs-depends-on:MasterDataset
 *
 * ## Process State API Types
 *
 * Type definitions for the ProcessStateAPI query interface.
 * Designed for programmatic access by Claude Code and other tools.
 *
 * ### When to Use
 *
 * - Import types when working with ProcessStateAPI responses
 * - Use QueryResult<T> for typed response handling
 */

import type { ProcessStatusValue } from '../taxonomy/index.js';
import type { ExtractedPattern } from '../validation-schemas/extracted-pattern.js';
import type { ImplementationRef } from '../validation-schemas/master-dataset.js';

// =============================================================================
// Query Response Types
// =============================================================================

/**
 * Successful query response
 */
export interface QuerySuccess<T> {
  success: true;
  data: T;
  metadata: {
    timestamp: string;
    patternCount: number;
  };
}

/**
 * Error codes for query failures
 */
export type QueryErrorCode =
  | 'INVALID_STATUS'
  | 'INVALID_TRANSITION'
  | 'PATTERN_NOT_FOUND'
  | 'PHASE_NOT_FOUND'
  | 'QUARTER_NOT_FOUND'
  | 'CATEGORY_NOT_FOUND';

/**
 * Failed query response
 */
export interface QueryError {
  success: false;
  error: string;
  code: QueryErrorCode;
}

/**
 * Query result union type
 */
export type QueryResult<T> = QuerySuccess<T> | QueryError;

// =============================================================================
// Status Query Types
// =============================================================================

/**
 * Status counts response
 */
export interface StatusCounts {
  completed: number;
  active: number;
  planned: number;
  total: number;
}

/**
 * Status distribution with percentages
 */
export interface StatusDistribution {
  counts: StatusCounts;
  percentages: {
    completed: number;
    active: number;
    planned: number;
  };
}

// =============================================================================
// Phase Query Types
// =============================================================================

/**
 * Phase progress summary
 */
export interface PhaseProgress {
  phaseNumber: number;
  phaseName: string | undefined;
  completed: number;
  active: number;
  planned: number;
  total: number;
  completionPercentage: number;
}

/**
 * Phase group with patterns
 */
export interface PhaseGroup {
  phaseNumber: number;
  phaseName: string | undefined;
  patterns: ExtractedPattern[];
  counts: StatusCounts;
}

// =============================================================================
// Pattern Query Types
// =============================================================================

/**
 * Pattern dependencies
 */
export interface PatternDependencies {
  /** Patterns this pattern depends on */
  dependsOn: readonly string[];
  /** Patterns this pattern enables */
  enables: readonly string[];
  /** Patterns this pattern uses */
  uses: readonly string[];
  /** Patterns that use this pattern */
  usedBy: readonly string[];
}

/**
 * Complete pattern relationships (includes all relationship types)
 *
 * Used by ProcessStateAPI.getPatternRelationships() to expose the full
 * relationship graph from the MasterDataset's relationshipIndex.
 */
export interface PatternRelationships {
  /** Patterns this pattern depends on (from @libar-docs-depends-on) */
  dependsOn: readonly string[];
  /** Patterns this pattern enables (from @libar-docs-enables) */
  enables: readonly string[];
  /** Patterns this pattern uses (from @libar-docs-uses) */
  uses: readonly string[];
  /** Patterns that use this pattern (from @libar-docs-used-by) */
  usedBy: readonly string[];
  /** Patterns this code implements (from @libar-docs-implements) */
  implementsPatterns: readonly string[];
  /** Files that implement this pattern with metadata (computed inverse) */
  implementedBy: readonly ImplementationRef[];
  /** Pattern this extends (from @libar-docs-extends) */
  extendsPattern: string | undefined;
  /** Patterns that extend this pattern (computed inverse) */
  extendedBy: readonly string[];
  /** Related patterns for cross-reference without dependency (from @libar-docs-see-also) */
  seeAlso: readonly string[];
  /** File paths to implementation APIs (from @libar-docs-api-ref) */
  apiRef: readonly string[];
}

/**
 * Pattern deliverables from feature files
 *
 * Matches the DeliverableSchema structure from dual-source.ts
 */
export interface PatternDeliverable {
  /** Deliverable name/description */
  name: string;
  /** Status emoji or text */
  status: string;
  /** Number of tests */
  tests: number;
  /** Implementation location */
  location: string;
  /** Optional finding ID for review traceability */
  finding: string | undefined;
  /** Optional release version for changelog grouping */
  release: string | undefined;
}

// =============================================================================
// Timeline Query Types
// =============================================================================

/**
 * Quarter grouping
 */
export interface QuarterGroup {
  quarter: string;
  patterns: ExtractedPattern[];
  counts: StatusCounts;
}

// =============================================================================
// FSM Query Types
// =============================================================================

/**
 * Transition validation result
 */
export interface TransitionCheck {
  from: ProcessStatusValue;
  to: ProcessStatusValue;
  valid: boolean;
  error: string | undefined;
  validAlternatives: readonly ProcessStatusValue[] | undefined;
}

/**
 * Protection level info
 */
export interface ProtectionInfo {
  status: ProcessStatusValue;
  level: 'none' | 'scope' | 'hard';
  description: string;
  canAddDeliverables: boolean;
  requiresUnlock: boolean;
}

// =============================================================================
// Helper Type for Creating Responses
// =============================================================================

/**
 * Create a success response
 */
export function createSuccess<T>(data: T, patternCount: number): QuerySuccess<T> {
  return {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      patternCount,
    },
  };
}

/**
 * Create an error response
 */
export function createError(code: QueryErrorCode, message: string): QueryError {
  return {
    success: false,
    error: message,
    code,
  };
}
