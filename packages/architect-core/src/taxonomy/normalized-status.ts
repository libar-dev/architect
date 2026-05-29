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
