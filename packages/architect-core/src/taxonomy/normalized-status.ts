/**
 * @architect
 * @architect-pattern StatusNormalization
 * @architect-status active
 * @architect-role:service
 * @architect-bounded-context:domain
 *
 * ## StatusNormalization - Reporting-Bucket Fold for @architect-status
 *
 * The 13-importer reporting-bucket fold. `normalizeStatus` plus
 * `STATUS_NORMALIZATION_MAP` collapse the authored `@architect-status` values
 * into the derived reporting vocabulary, mapping `roadmap` and `deferred` down
 * to the synthetic `planned` bucket. A root primitive of the taxonomy with no
 * outbound pattern edges; its weight is fan-in.
 *
 * Distinct concern from `StatusValueDomain`: that owns the authored value
 * domain, this owns the projection-side fold of authored statuses into the
 * `planned` reporting bucket that `StatusFilterSchema` is composed from.
 *
 * ### When to Use
 *
 * - Folding a raw `@architect-status` into a `NormalizedStatus` reporting bucket.
 * - Testing whether a pattern is complete / active / planned / candidate.
 * - Sourcing the `planned` bucket word for the consumer-facing status filter.
 */
export const NORMALIZED_STATUS_VALUES = ['completed', 'active', 'planned', 'candidate'] as const;

export type NormalizedStatus = (typeof NORMALIZED_STATUS_VALUES)[number];

/**
 * Normalized bucket words that are NOT authored FSM/accepted status values.
 *
 * `planned` is a derived reporting bucket (roadmap ∪ deferred), never an
 * authored `@architect-status` value and never an FSM transition state. It is
 * the named source from which the consumer-facing status FILTER vocabulary
 * (StatusFilterSchema in domain-enums.ts) is composed, so the filter union is
 * built from a taxonomy constant rather than an inline literal.
 */
export const NORMALIZED_ONLY_STATUS_VALUES = ['planned'] as const;

export type NormalizedOnlyStatusValue = (typeof NORMALIZED_ONLY_STATUS_VALUES)[number];

export const STATUS_NORMALIZATION_MAP: Readonly<Record<string, NormalizedStatus>> = {
  completed: 'completed',
  active: 'active',
  roadmap: 'planned',
  deferred: 'planned',
  candidate: 'candidate',
};

export function normalizeStatus(status: string | undefined): NormalizedStatus {
  if (!status) return 'planned';
  return STATUS_NORMALIZATION_MAP[status.toLowerCase()] ?? 'planned';
}

export function isPatternComplete(status: string | undefined): boolean {
  return normalizeStatus(status) === 'completed';
}

export function isPatternActive(status: string | undefined): boolean {
  return normalizeStatus(status) === 'active';
}

export function isPatternPlanned(status: string | undefined): boolean {
  return normalizeStatus(status) === 'planned';
}

export function isPatternCandidate(status: string | undefined): boolean {
  return normalizeStatus(status) === 'candidate';
}
