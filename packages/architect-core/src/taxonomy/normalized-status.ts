export const NORMALIZED_STATUS_VALUES = ['completed', 'active', 'planned', 'candidate'] as const;

export type NormalizedStatus = (typeof NORMALIZED_STATUS_VALUES)[number];

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
