import type { AcceptedStatusValue } from './status-values.js';

export const MATURITY_VALUES = ['idea', 'plan', 'design', 'executable'] as const;

export type MaturityLevel = (typeof MATURITY_VALUES)[number];

export const DEFAULT_MATURITY_BY_STATUS: Readonly<Record<AcceptedStatusValue, MaturityLevel>> = {
  candidate: 'idea',
  roadmap: 'plan',
  active: 'design',
  completed: 'executable',
  deferred: 'plan',
};

export function inferMaturity(
  status: AcceptedStatusValue,
  explicitMaturity?: string,
): MaturityLevel {
  if (
    explicitMaturity !== undefined &&
    (MATURITY_VALUES as readonly string[]).includes(explicitMaturity)
  ) {
    return explicitMaturity as MaturityLevel;
  }
  return DEFAULT_MATURITY_BY_STATUS[status];
}

const VALID_COMBINATIONS: Readonly<Record<string, readonly MaturityLevel[]>> = {
  candidate: ['idea', 'plan'],
  roadmap: ['plan', 'design'],
  active: ['design', 'executable'],
  completed: ['executable'],
  deferred: ['plan', 'design'],
};

export function getValidMaturitiesForStatus(status: string): readonly MaturityLevel[] | undefined {
  return VALID_COMBINATIONS[status];
}

export function describeValidMaturities(status: string): string {
  const valid = getValidMaturitiesForStatus(status);
  return valid === undefined ? 'No maturity guidance available' : valid.join(', ');
}

export function isValidMaturityCombination(status: string, maturity: MaturityLevel): boolean {
  const valid = getValidMaturitiesForStatus(status);
  if (valid === undefined) return true;
  return valid.includes(maturity);
}
