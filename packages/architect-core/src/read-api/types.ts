/**
 * @architect
 * @architect-pattern ReadApiResultContract
 * @architect-status active
 * @architect-role:contract
 * @architect-bounded-context:read-api
 * @architect-uses PatternGraph
 *
 * ## ReadApiResultContract - Named read payloads
 *
 * Shared payload shapes used by pure read kernels and graph consumers:
 * `PatternRelationships`, `StatusDistribution`, `NeighborEntry`,
 * `TransitionCheck`, `ProtectionInfo`, and `BusinessRuleRef`. These contracts
 * sit over the {@link PatternGraph} and never re-derive canonical state.
 *
 * ### When to Use
 *
 * - Shaping a named relationship, transition, protection, or inventory result.
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
