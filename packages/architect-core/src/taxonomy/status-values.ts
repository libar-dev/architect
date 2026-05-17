export const PROCESS_STATUS_VALUES = ['roadmap', 'active', 'completed', 'deferred'] as const;

export const ACCEPTED_STATUS_VALUES = ['candidate', ...PROCESS_STATUS_VALUES] as const;

export type AcceptedStatusValue = (typeof ACCEPTED_STATUS_VALUES)[number];

export type ProcessStatusValue = (typeof PROCESS_STATUS_VALUES)[number];

export const DEFAULT_STATUS: ProcessStatusValue = 'roadmap';

export const VALID_PROCESS_STATUS_SET: ReadonlySet<string> = new Set<string>(PROCESS_STATUS_VALUES);

export const VALID_ACCEPTED_STATUS_SET: ReadonlySet<string> = new Set<string>(
  ACCEPTED_STATUS_VALUES,
);
