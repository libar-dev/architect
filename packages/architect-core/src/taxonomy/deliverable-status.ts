export const DELIVERABLE_STATUS_VALUES = [
  'complete',
  'in-progress',
  'pending',
  'deferred',
  'superseded',
  'n/a',
] as const;

export type DeliverableStatus = (typeof DELIVERABLE_STATUS_VALUES)[number];

export const DEFAULT_DELIVERABLE_STATUS: DeliverableStatus = 'pending';

export const VALID_DELIVERABLE_STATUS_SET: ReadonlySet<string> = new Set<string>(
  DELIVERABLE_STATUS_VALUES,
);

export function isDeliverableStatusComplete(status: DeliverableStatus): boolean {
  return status === 'complete';
}

export function isDeliverableStatusInProgress(status: DeliverableStatus): boolean {
  return status === 'in-progress';
}

export function isDeliverableStatusPending(status: DeliverableStatus): boolean {
  return status === 'pending';
}

export function isDeliverableStatusTerminal(status: DeliverableStatus): boolean {
  return status === 'complete' || status === 'n/a' || status === 'superseded';
}

export function getDeliverableStatusEmoji(status: DeliverableStatus): string {
  switch (status) {
    case 'complete':
      return '✅';
    case 'in-progress':
      return '🚧';
    case 'pending':
      return '📋';
    case 'deferred':
      return '⏸️';
    case 'superseded':
      return '🔄';
    case 'n/a':
      return '➖';
  }
}
