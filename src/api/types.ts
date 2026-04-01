/**
 * @architect
 * @architect-core
 * @architect-pattern PatternGraphAPITypes
 * @architect-status active
 * @architect-depends-on:PatternGraph
 *
 * ## Process State API Types
 *
 * Type definitions for the PatternGraphAPI query interface.
 * Designed for programmatic access by Claude Code and other tools.
 *
 * ### When to Use
 *
 * - Import types when working with PatternGraphAPI responses
 * - Use QueryResult<T> for typed response handling
 */

import type { DeliverableStatus, ProcessStatusValue } from '../taxonomy/index.js';
import type { ExtractedPattern } from '../validation-schemas/extracted-pattern.js';
import type { ImplementationRef } from '../validation-schemas/pattern-graph.js';

// =============================================================================
// Query Response Types
// =============================================================================

/**
 * Optional extended metadata for query responses.
 * Populated when the pipeline runs (not for FSM short-circuit queries).
 */
export interface QueryMetadataExtra {
  readonly validation?: {
    readonly danglingReferenceCount: number;
    readonly malformedPatternCount: number;
    readonly unknownStatusCount: number;
    readonly warningCount: number;
  };
  readonly cache?: {
    readonly hit: boolean;
    readonly ageMs?: number;
  };
  readonly pipelineMs?: number;
}

/**
 * Successful query response
 */
export interface QuerySuccess<T> {
  success: true;
  data: T;
  metadata: {
    timestamp: string;
    patternCount: number;
  } & QueryMetadataExtra;
}

/**
 * Error codes for query failures
 */
export type QueryErrorCode =
  | 'INVALID_ARGUMENT'
  | 'INVALID_STATUS'
  | 'INVALID_TRANSITION'
  | 'PATTERN_NOT_FOUND'
  | 'PHASE_NOT_FOUND'
  | 'QUARTER_NOT_FOUND'
  | 'CATEGORY_NOT_FOUND'
  | 'CONTEXT_NOT_FOUND'
  | 'STUB_NOT_FOUND'
  | 'PDR_NOT_FOUND'
  | 'CONTEXT_ASSEMBLY_ERROR'
  | 'UNKNOWN_METHOD';

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
 * Used by PatternGraphAPI.getPatternRelationships() to expose the full
 * relationship graph from the PatternGraph's relationshipIndex.
 */
export interface PatternRelationships {
  /** Patterns this pattern depends on (from @architect-depends-on) */
  dependsOn: readonly string[];
  /** Patterns this pattern enables (from @architect-enables) */
  enables: readonly string[];
  /** Patterns this pattern uses (from @architect-uses) */
  uses: readonly string[];
  /** Patterns that use this pattern (from @architect-used-by) */
  usedBy: readonly string[];
  /** Patterns this code implements (from @architect-implements) */
  implementsPatterns: readonly string[];
  /** Files that implement this pattern with metadata (computed inverse) */
  implementedBy: readonly ImplementationRef[];
  /** Pattern this extends (from @architect-extends) */
  extendsPattern: string | undefined;
  /** Patterns that extend this pattern (computed inverse) */
  extendedBy: readonly string[];
  /** Related patterns for cross-reference without dependency (from @architect-see-also) */
  seeAlso: readonly string[];
  /** File paths to implementation APIs (from @architect-api-ref) */
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
  /** Canonical deliverable status */
  status: DeliverableStatus;
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
// Architecture Query Types
// =============================================================================

/**
 * Entry for a neighboring pattern with architecture metadata.
 * Shared between ContextAssembler and ArchQueries.
 */
export interface NeighborEntry {
  readonly name: string;
  readonly status: string | undefined;
  readonly archRole: string | undefined;
  readonly archContext: string | undefined;
  readonly file: string | undefined;
}

// =============================================================================
// Helper Type for Creating Responses
// =============================================================================

/**
 * Create a success response with optional extended metadata.
 */
export function createSuccess<T>(
  data: T,
  patternCount: number,
  extra?: QueryMetadataExtra
): QuerySuccess<T> {
  return {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      patternCount,
      ...extra,
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

/**
 * Structured error for API and CLI domain errors.
 * Caught at the CLI boundary and converted to QueryError envelope.
 */
export class QueryApiError extends Error {
  readonly code: QueryErrorCode;

  constructor(code: QueryErrorCode, message: string) {
    super(message);
    this.name = 'QueryApiError';
    this.code = code;
  }
}
