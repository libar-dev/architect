export const SEVERITY_TYPES = ['error', 'warning', 'info'] as const;

export type SeverityType = (typeof SEVERITY_TYPES)[number];
