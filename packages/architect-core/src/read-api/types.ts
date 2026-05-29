import type { ExtractedPattern } from '../validation-schemas/extracted-pattern.js';
import type { ImplementationRef, StatusCounts } from '../validation-schemas/pattern-graph.js';
import type { ProcessStatusValue } from '../taxonomy/index.js';

export interface QueryMetadataExtra {
  readonly validation?: {
    readonly danglingReferenceCount: number;
    readonly unknownStatusCount: number;
    readonly warningCount: number;
  };
  readonly cache?: {
    readonly hit: boolean;
    readonly ageMs?: number;
  };
  readonly pipelineMs?: number;
}

export interface RoleInfo {
  readonly tag: string;
  readonly domain: string;
  readonly priority: number;
  readonly count: number;
  readonly description?: string;
}

export interface QuerySuccess<T> {
  success: true;
  data: T;
  metadata: {
    timestamp: string;
    patternCount: number;
  } & QueryMetadataExtra;
}

export type QueryErrorCode =
  | 'INVALID_ARGUMENT'
  | 'INVALID_STATUS'
  | 'INVALID_TRANSITION'
  | 'PATTERN_NOT_FOUND'
  | 'PHASE_NOT_FOUND'
  | 'QUARTER_NOT_FOUND'
  | 'ROLE_NOT_FOUND'
  | 'CONTEXT_NOT_FOUND'
  | 'LAYER_NOT_FOUND'
  | 'STUB_NOT_FOUND'
  | 'PDR_NOT_FOUND'
  | 'CONTEXT_ASSEMBLY_ERROR'
  | 'UNKNOWN_METHOD';

export interface QueryError {
  success: false;
  error: string;
  code: QueryErrorCode;
}

export type QueryResult<T> = QuerySuccess<T> | QueryError;

export type { PhaseGroup, StatusCounts } from '../validation-schemas/pattern-graph.js';

export interface StatusDistribution {
  counts: StatusCounts;
  /**
   * Percentages of the delivery pipeline (completed + active + planned), each
   * over the delivery base `total - candidate`. These three fields share one
   * denominator and sum to exactly 100 (when the delivery base is non-zero).
   */
  deliveryPercentages: {
    completed: number;
    active: number;
    planned: number;
  };
  /**
   * Candidate share over the grand total (`total`). Kept structurally separate
   * from {@link StatusDistribution.deliveryPercentages} because it uses a
   * different denominator — the two groups must never be summed together.
   */
  candidateShare: number;
}

export interface PhaseProgress {
  phaseNumber: number;
  phaseName: string | undefined;
  completed: number;
  active: number;
  planned: number;
  candidate: number;
  total: number;
  completionPercentage: number;
}

export interface PatternDependencies {
  dependsOn: readonly string[];
  enables: readonly string[];
  uses: readonly string[];
  usedBy: readonly string[];
}

export interface PatternRelationships {
  dependsOn: readonly string[];
  enables: readonly string[];
  uses: readonly string[];
  usedBy: readonly string[];
  implementsPatterns: readonly string[];
  implementedBy: readonly ImplementationRef[];
  extendsPattern: string | undefined;
  extendedBy: readonly string[];
  seeAlso: readonly string[];
  apiRef: readonly string[];
}

export interface QuarterGroup {
  quarter: string;
  patterns: ExtractedPattern[];
  counts: StatusCounts;
}

export interface TransitionCheck {
  from: string;
  to: string;
  valid: boolean;
  error?: string;
  validAlternatives?: readonly ProcessStatusValue[];
}

export interface ProtectionInfo {
  status: ProcessStatusValue;
  level: 'none' | 'scope' | 'hard';
  description: string;
  canAddDeliverables: boolean;
  requiresUnlock: boolean;
}

export interface NeighborEntry {
  name: string;
  status: string | undefined;
  role: string | undefined;
  archContext: string | undefined;
  file: string | undefined;
}

export class QueryApiError extends Error {
  constructor(
    readonly code: QueryErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'QueryApiError';
  }
}

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

export function createError(code: QueryErrorCode, error: string): QueryError {
  return { success: false, code, error };
}
