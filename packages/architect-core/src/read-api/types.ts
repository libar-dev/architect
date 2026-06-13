/**
 * @architect
 * @architect-pattern ReadApiResultContract
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:read-api
 * @architect-uses PatternGraph
 *
 * ## ReadApiResultContract - The Structured-Answer Envelope (ADR-006)
 *
 * The shared result vocabulary every `architect:query` verb response is shaped
 * by. Defines the `QueryResult<T>` discriminated union (`QuerySuccess<T>` /
 * `QueryError`) with its metadata envelope, plus the read-side payload shapes a
 * verb returns: `DependencyContext` (the focal-rooted, bidirectional blast-radius
 * forest), `PatternRelationships`, `StatusDistribution`, `NeighborEntry`,
 * `TransitionCheck`, `ProtectionInfo`, `BusinessRuleRef`, and the
 * `createSuccess` / `createError` factories. A read-side contract that sits over
 * the {@link PatternGraph} and never re-derives state.
 *
 * ### When to Use
 *
 * - Authoring or consuming a Data API verb that returns a `QueryResult<T>`.
 * - Shaping a blast-radius / dependency-context or relationship response.
 * - Constructing success / error envelopes via the result factories.
 */
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

export type { StatusCounts } from '../validation-schemas/pattern-graph.js';

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

/**
 * One node in a {@link DependencyContext} forest. The focal pattern is the root
 * of both forests (named by {@link DependencyContext.focal}) and is never
 * represented as a node, so there is no per-node focal flag. `truncated` is set
 * when the node has further edges in its direction that were not expanded
 * because the depth cap was reached.
 */
export interface DependencyContextNode {
  name: string;
  status?: string;
  truncated: boolean;
  children: readonly DependencyContextNode[];
}

/**
 * Focal-rooted, bidirectional transitive dependency context for a single
 * pattern. `upstream` is the cycle-safe closure over `dependsOn`∪`uses` (the
 * prerequisites / what the focal needs); `downstream` is the closure over
 * `usedBy`∪`enables` (the blast radius / what needs the focal). The focal
 * pattern is the root of both forests. `summary` precomputes the direct and
 * transitive counts so a consumer can size blast radius without re-walking.
 */
export interface DependencyContext {
  focal: string;
  upstream: readonly DependencyContextNode[];
  downstream: readonly DependencyContextNode[];
  summary: {
    upstreamDirect: number;
    upstreamTransitive: number;
    downstreamDirect: number;
    downstreamTransitive: number;
  };
  options: {
    maxDepth: number;
  };
}

/**
 * A lightweight reference to a business rule that enforces a decision — the
 * owning pattern, the rule name, and an optional invariant string. Returned by
 * the decision-scoped rule aggregation so the CLI/projection can resolve full
 * rule fragments without the kernel needing the fragment layer.
 */
export interface BusinessRuleRef {
  pattern: string;
  ruleName: string;
  invariant?: string;
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
  /**
   * Whether this protection level emits an advisory, unlock-suppressible warning
   * on the commit path (PDR-006). True for `scope` (active scope creep) and
   * `hard` (completed edits); `unlock-reason` is optional and suppresses it.
   * Never a hard block on the commit path (CI `--strict` may promote it).
   */
  unlockSuppressesWarning: boolean;
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
