/**
 * Canonical quarter format per ADR-001 Rule 7.
 *
 * Format: `YYYY-QN` (e.g., `2026-Q1`). The ISO-year-first ordering means
 * lexicographic sort matches chronological order. The previous `QN-YYYY`
 * format does not — that's the rationale for the canonical choice.
 */
export const QUARTER_PATTERN = /^\d{4}-Q[1-4]$/;
